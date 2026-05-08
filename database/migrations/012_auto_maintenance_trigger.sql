-- Auto-create maintenance task when facility goes critical
-- This trigger monitors facility status changes and creates maintenance tasks automatically

-- Step 1: Add missing columns to maintenance_tasks table
ALTER TABLE maintenance_tasks 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by_trigger BOOLEAN DEFAULT false;

-- Update priority enum to include 'critical'
ALTER TABLE maintenance_tasks 
DROP CONSTRAINT IF EXISTS maintenance_tasks_priority_check;

ALTER TABLE maintenance_tasks 
ADD CONSTRAINT maintenance_tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical'));

-- Step 2: Create function to auto-create maintenance tasks
CREATE OR REPLACE FUNCTION auto_create_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    task_description TEXT;
    task_priority TEXT;
    task_type TEXT;
    assigned_worker_id UUID;
    district_coordinator_id UUID;
BEGIN
    -- Only trigger when status changes TO critical conditions
    IF (OLD.status IS DISTINCT FROM NEW.status) AND 
       (NEW.status IN ('out_of_service', 'overflow', 'damaged') OR NEW.risk_score >= 80) THEN
        
        -- Generate task details based on status
        CASE NEW.status
            WHEN 'out_of_service' THEN
                task_title := 'URGENT: Restore ' || NEW.name || ' to service';
                task_description := 'Facility is completely out of service and requires immediate repair to restore functionality.';
                task_priority := 'critical';
                task_type := 'emergency_response';
            WHEN 'overflow' THEN
                task_title := 'URGENT: Clean overflow at ' || NEW.name;
                task_description := 'Facility is overflowing and poses health risks. Immediate cleanup and repair required.';
                task_priority := 'critical';
                task_type := 'emptying';
            WHEN 'damaged' THEN
                task_title := 'URGENT: Repair damage at ' || NEW.name;
                task_description := 'Facility has sustained damage and requires immediate repair to prevent further deterioration.';
                task_priority := 'urgent';
                task_type := 'repair';
            ELSE
                task_title := 'URGENT: Address critical issues at ' || NEW.name;
                task_description := 'Facility has reached critical risk level (score: ' || NEW.risk_score || ') and requires immediate attention.';
                task_priority := 'critical';
                task_type := 'emergency_response';
        END CASE;
        
        -- Find district coordinator for assignment
        SELECT id INTO district_coordinator_id
        FROM workers 
        WHERE district_id = NEW.district_id 
          AND role = 'district_coordinator'
          AND active = true
        LIMIT 1;
        
        -- If no coordinator, find supervisor
        IF district_coordinator_id IS NULL THEN
            SELECT id INTO district_coordinator_id
            FROM workers 
            WHERE district_id = NEW.district_id 
              AND role = 'supervisor'
              AND active = true
            LIMIT 1;
        END IF;
        
        -- If still no one, find maintenance tech
        IF district_coordinator_id IS NULL THEN
            SELECT id INTO district_coordinator_id
            FROM workers 
            WHERE district_id = NEW.district_id 
              AND role = 'maintenance_tech'
              AND active = true
            LIMIT 1;
        END IF;
        
        -- Create maintenance task
        INSERT INTO maintenance_tasks (
            facility_id,
            title,
            description,
            task_type,
            priority,
            status,
            assigned_to,
            due_date,
            created_by_trigger,
            notes
        ) VALUES (
            NEW.id,
            task_title,
            task_description,
            task_type,
            task_priority,
            'pending',
            district_coordinator_id,
            CASE 
                WHEN NEW.status = 'out_of_service' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN NEW.status = 'overflow' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN NEW.status = 'damaged' THEN CURRENT_DATE + INTERVAL '3 days'
                ELSE CURRENT_DATE + INTERVAL '2 days'
            END,
            true,
            'Auto-created due to facility status change: ' || COALESCE(OLD.status, 'unknown') || ' → ' || NEW.status || 
            '. Risk score: ' || NEW.risk_score || '. Immediate action required.'
        );
        
        -- Log the auto-creation
        RAISE NOTICE 'Auto-created maintenance task for facility % (%) due to status change: % → %', 
            NEW.name, NEW.id, COALESCE(OLD.status, 'unknown'), NEW.status;
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on facilities table
DROP TRIGGER IF EXISTS trigger_auto_maintenance_task ON facilities;

CREATE TRIGGER trigger_auto_maintenance_task
    AFTER UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_maintenance_task();

-- Step 3: Create function to prevent duplicate tasks
CREATE OR REPLACE FUNCTION prevent_duplicate_maintenance_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already a pending/in_progress task for this facility
    -- created in the last 24 hours
    IF EXISTS (
        SELECT 1 
        FROM maintenance_tasks 
        WHERE facility_id = NEW.facility_id
          AND status IN ('pending', 'in_progress')
          AND created_at > NOW() - INTERVAL '24 hours'
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        -- Update the existing task instead of creating a new one
        UPDATE maintenance_tasks 
        SET 
            title = NEW.title,
            description = NEW.description,
            priority = CASE 
                WHEN NEW.priority = 'critical' THEN 'critical'
                WHEN priority = 'critical' THEN 'critical'
                ELSE NEW.priority
            END,
            due_date = LEAST(due_date, NEW.due_date),
            notes = notes || E'\n\n[' || NOW() || '] Updated: ' || NEW.notes,
            updated_at = NOW()
        WHERE facility_id = NEW.facility_id
          AND status IN ('pending', 'in_progress')
          AND created_at > NOW() - INTERVAL '24 hours'
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        
        -- Prevent the new insert
        RAISE NOTICE 'Prevented duplicate maintenance task for facility %. Updated existing task instead.', NEW.facility_id;
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_maintenance ON maintenance_tasks;

CREATE TRIGGER trigger_prevent_duplicate_maintenance
    BEFORE INSERT ON maintenance_tasks
    FOR EACH ROW
    WHEN (NEW.created_by_trigger = true)
    EXECUTE FUNCTION prevent_duplicate_maintenance_tasks();

-- Step 5: Create function to auto-resolve tasks when facility improves
CREATE OR REPLACE FUNCTION auto_resolve_maintenance_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- If facility status improves to 'good', mark related pending tasks as completed
    IF (OLD.status IS DISTINCT FROM NEW.status) AND 
       (NEW.status = 'good' AND OLD.status IN ('out_of_service', 'overflow', 'damaged')) THEN
        
        UPDATE maintenance_tasks 
        SET 
            status = 'completed',
            completed_at = NOW(),
            notes = COALESCE(notes, '') || E'\n\n[' || NOW() || '] Auto-completed: Facility status improved to "good"'
        WHERE facility_id = NEW.id
          AND status IN ('pending', 'in_progress')
          AND created_by_trigger = true
          AND created_at > NOW() - INTERVAL '7 days';
        
        RAISE NOTICE 'Auto-completed maintenance tasks for facility % (%) due to status improvement', NEW.name, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for auto-resolution
DROP TRIGGER IF EXISTS trigger_auto_resolve_maintenance ON facilities;

CREATE TRIGGER trigger_auto_resolve_maintenance
    AFTER UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION auto_resolve_maintenance_tasks();

-- Step 7: Create view for maintenance task monitoring
CREATE OR REPLACE VIEW maintenance_task_summary AS
SELECT 
    mt.id,
    mt.title,
    mt.description,
    mt.task_type,
    mt.priority,
    mt.status,
    mt.due_date,
    mt.created_at,
    mt.created_by_trigger,
    f.name as facility_name,
    f.type as facility_type,
    f.status as facility_status,
    f.risk_score,
    d.name as district_name,
    d.region,
    w.name as assigned_worker,
    w.role as worker_role,
    w.phone as worker_phone,
    CASE 
        WHEN mt.due_date < CURRENT_DATE AND mt.status IN ('pending', 'assigned', 'in_progress') THEN 'overdue'
        WHEN mt.due_date <= CURRENT_DATE + INTERVAL '1 day' AND mt.status IN ('pending', 'assigned', 'in_progress') THEN 'urgent'
        WHEN mt.status IN ('pending', 'assigned', 'in_progress') THEN 'active'
        ELSE 'inactive'
    END as urgency_status
FROM maintenance_tasks mt
JOIN facilities f ON mt.facility_id = f.id
JOIN districts d ON f.district_id = d.id
LEFT JOIN workers w ON mt.assigned_to = w.id
ORDER BY 
    CASE mt.priority 
        WHEN 'critical' THEN 1 
        WHEN 'urgent' THEN 2
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 4 
        ELSE 5 
    END,
    mt.due_date ASC;

-- Step 8: Create function to get critical maintenance tasks
CREATE OR REPLACE FUNCTION get_critical_maintenance_tasks()
RETURNS TABLE (
    task_id UUID,
    facility_name TEXT,
    district_name TEXT,
    task_type TEXT,
    priority TEXT,
    status TEXT,
    due_date DATE,
    assigned_worker TEXT,
    worker_phone TEXT,
    urgency_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.id,
        f.name,
        d.name,
        mt.task_type,
        mt.priority,
        mt.status,
        mt.due_date,
        w.name,
        w.phone,
        CASE 
            WHEN mt.due_date < CURRENT_DATE THEN 'overdue'
            WHEN mt.due_date <= CURRENT_DATE + INTERVAL '1 day' THEN 'urgent'
            ELSE 'active'
        END
    FROM maintenance_tasks mt
    JOIN facilities f ON mt.facility_id = f.id
    JOIN districts d ON f.district_id = d.id
    LEFT JOIN workers w ON mt.assigned_to = w.id
    WHERE mt.status IN ('pending', 'assigned', 'in_progress')
      AND mt.priority IN ('critical', 'urgent', 'high')
    ORDER BY 
        CASE mt.priority 
            WHEN 'critical' THEN 1 
            WHEN 'urgent' THEN 2
            ELSE 3 
        END,
        mt.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_facility_status_trigger 
ON maintenance_tasks(facility_id, status) 
WHERE status IN ('pending', 'assigned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_date_status 
ON maintenance_tasks(due_date) 
WHERE status IN ('pending', 'assigned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_priority_created 
ON maintenance_tasks(priority, created_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_created_by_trigger 
ON maintenance_tasks(created_by_trigger) 
WHERE created_by_trigger = true;

-- Step 10: Update RLS policies for maintenance tasks (remove existing ones first)
DROP POLICY IF EXISTS "Users can view maintenance tasks in their district" ON maintenance_tasks;
DROP POLICY IF EXISTS "Workers can update assigned maintenance tasks" ON maintenance_tasks;

-- Policy: Users can see tasks in their district
CREATE POLICY "Users can view maintenance tasks in their district" ON maintenance_tasks
    FOR SELECT USING (
        facility_id IN (
            SELECT f.id 
            FROM facilities f 
            JOIN districts d ON f.district_id = d.id 
            WHERE d.id = (auth.jwt() ->> 'district_id')::uuid
        )
    );

-- Policy: Workers can update tasks assigned to them
CREATE POLICY "Workers can update assigned maintenance tasks" ON maintenance_tasks
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        facility_id IN (
            SELECT f.id 
            FROM facilities f 
            JOIN districts d ON f.district_id = d.id 
            WHERE d.id = (auth.jwt() ->> 'district_id')::uuid
        )
    );

-- Step 11: Success message and usage instructions
DO $$
BEGIN
    RAISE NOTICE 'Auto-maintenance trigger setup completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '✅ Auto-create maintenance tasks when facilities become critical';
    RAISE NOTICE '✅ Prevent duplicate tasks within 24 hours';
    RAISE NOTICE '✅ Auto-resolve tasks when facility status improves';
    RAISE NOTICE '✅ Priority-based task assignment';
    RAISE NOTICE '✅ Monitoring views and functions';
    RAISE NOTICE '';
    RAISE NOTICE 'Trigger conditions:';
    RAISE NOTICE '- Status changes to: out_of_service, overflow, damaged';
    RAISE NOTICE '- Risk score reaches 80 or higher';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '- View all tasks: SELECT * FROM maintenance_task_summary;';
    RAISE NOTICE '- Get critical tasks: SELECT * FROM get_critical_maintenance_tasks();';
    RAISE NOTICE '- Monitor facility changes to see auto-task creation';
    RAISE NOTICE '';
    RAISE NOTICE 'The system will now automatically create maintenance tasks';
    RAISE NOTICE 'whenever a facility becomes critical!';
END $$;