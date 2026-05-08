-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('routine_cleaning', 'emptying', 'repair', 'inspection', 'emergency_response', 'preventive_maintenance')),
    description TEXT,
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_facility_id ON public.maintenance_tasks(facility_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned_to ON public.maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON public.maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_priority ON public.maintenance_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_task_type ON public.maintenance_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_date ON public.maintenance_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_created_at ON public.maintenance_tasks(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to maintenance_tasks" ON public.maintenance_tasks
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.maintenance_tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_maintenance_tasks_updated_at
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create maintenance tasks based on alerts
CREATE OR REPLACE FUNCTION create_maintenance_task_from_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Create urgent maintenance task for critical alerts
    IF NEW.alert_type = 'critical_status' AND NEW.severity = 'critical' THEN
        INSERT INTO public.maintenance_tasks (facility_id, status, priority, task_type, description, due_date)
        VALUES (
            NEW.facility_id,
            'pending',
            'urgent',
            'emergency_response',
            'Critical facility status requires immediate attention: ' || NEW.message,
            CURRENT_DATE + INTERVAL '1 day'
        );
    END IF;
    
    -- Create high priority task for overflow alerts
    IF NEW.alert_type = 'overflow_detected' THEN
        INSERT INTO public.maintenance_tasks (facility_id, status, priority, task_type, description, due_date)
        VALUES (
            NEW.facility_id,
            'pending',
            'high',
            'emptying',
            'Facility overflow detected: ' || NEW.message,
            CURRENT_DATE + INTERVAL '2 days'
        );
    END IF;
    
    -- Create medium priority task for maintenance due alerts
    IF NEW.alert_type = 'maintenance_due' THEN
        INSERT INTO public.maintenance_tasks (facility_id, status, priority, task_type, description, due_date)
        VALUES (
            NEW.facility_id,
            'pending',
            'medium',
            'routine_cleaning',
            'Scheduled maintenance overdue: ' || NEW.message,
            CURRENT_DATE + INTERVAL '7 days'
        );
    END IF;
    
    -- Create high priority repair task for system failures
    IF NEW.alert_type = 'system_failure' THEN
        INSERT INTO public.maintenance_tasks (facility_id, status, priority, task_type, description, due_date)
        VALUES (
            NEW.facility_id,
            'pending',
            'high',
            'repair',
            'System failure requires repair: ' || NEW.message,
            CURRENT_DATE + INTERVAL '3 days'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create maintenance tasks from alerts
CREATE TRIGGER create_task_from_alert
    AFTER INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION create_maintenance_task_from_alert();

-- Create function to auto-assign tasks to workers based on district and role
CREATE OR REPLACE FUNCTION auto_assign_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    worker_id UUID;
    facility_district_id UUID;
BEGIN
    -- Only auto-assign if no worker is already assigned
    IF NEW.assigned_to IS NULL AND NEW.status = 'pending' THEN
        -- Get the district of the facility
        SELECT district_id INTO facility_district_id 
        FROM public.facilities 
        WHERE id = NEW.facility_id;
        
        -- Try to find an appropriate worker based on task type
        CASE NEW.task_type
            WHEN 'repair' THEN
                -- Assign to maintenance tech in the same district
                SELECT id INTO worker_id 
                FROM public.workers 
                WHERE district_id = facility_district_id 
                  AND role = 'maintenance_tech' 
                  AND active = TRUE 
                ORDER BY RANDOM() 
                LIMIT 1;
                
            WHEN 'emptying' THEN
                -- Assign to field worker or maintenance tech
                SELECT id INTO worker_id 
                FROM public.workers 
                WHERE district_id = facility_district_id 
                  AND role IN ('field_worker', 'maintenance_tech') 
                  AND active = TRUE 
                ORDER BY RANDOM() 
                LIMIT 1;
                
            WHEN 'inspection' THEN
                -- Assign to health officer or supervisor
                SELECT id INTO worker_id 
                FROM public.workers 
                WHERE district_id = facility_district_id 
                  AND role IN ('health_officer', 'supervisor') 
                  AND active = TRUE 
                ORDER BY RANDOM() 
                LIMIT 1;
                
            ELSE
                -- Default: assign to any field worker in the district
                SELECT id INTO worker_id 
                FROM public.workers 
                WHERE district_id = facility_district_id 
                  AND role = 'field_worker' 
                  AND active = TRUE 
                ORDER BY RANDOM() 
                LIMIT 1;
        END CASE;
        
        -- Update the task with assigned worker if found
        IF worker_id IS NOT NULL THEN
            NEW.assigned_to := worker_id;
            NEW.status := 'assigned';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign tasks
CREATE TRIGGER auto_assign_task
    BEFORE INSERT ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_maintenance_task();

-- Create function to update facility last_serviced when task is completed
CREATE OR REPLACE FUNCTION update_facility_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update facility last_serviced date when maintenance task is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.facilities 
        SET last_serviced = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = NEW.facility_id;
        
        -- Set completed_at timestamp
        NEW.completed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update facility when task is completed
CREATE TRIGGER update_facility_on_completion
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_facility_on_task_completion();

-- Enable Realtime for maintenance_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tasks;

-- Insert sample maintenance tasks data
INSERT INTO public.maintenance_tasks (facility_id, assigned_to, status, priority, task_type, description, due_date, created_at) VALUES
    -- Urgent tasks for critical facilities
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Market Toilet Complex'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234570'), 
     'assigned', 'urgent', 'emptying', 
     'Emergency emptying required due to overflow condition', 
     '2024-02-16', '2024-02-14 15:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Tolon School Block'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234591'), 
     'in_progress', 'urgent', 'repair', 
     'Septic tank overflow needs immediate repair', 
     '2024-02-17', '2024-02-10 14:00:00+00'),
    
    -- High priority repair tasks
    ((SELECT id FROM public.facilities WHERE name = 'Tamale School Block Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234569'), 
     'assigned', 'high', 'repair', 
     'Structural damage repair needed', 
     '2024-02-18', '2024-02-13 10:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Salaga Market Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234577'), 
     'completed', 'high', 'repair', 
     'Door lock replacement completed', 
     '2024-02-15', '2024-02-13 11:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Karaga Community Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234587'), 
     'assigned', 'high', 'repair', 
     'Roof leak repair and floor maintenance', 
     '2024-02-19', '2024-02-11 13:00:00+00'),
    
    -- Medium priority routine maintenance
    ((SELECT id FROM public.facilities WHERE name = 'Gushiegu School Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234585'), 
     'pending', 'medium', 'routine_cleaning', 
     'Scheduled cleaning and restocking supplies', 
     '2024-02-20', '2024-02-11 16:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Community Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234570'), 
     'assigned', 'medium', 'emptying', 
     'Pit emptying and drain clearing', 
     '2024-02-21', '2024-02-12 12:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Chereponi Community Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234583'), 
     'assigned', 'medium', 'emptying', 
     'Full pit requires emptying service', 
     '2024-02-22', '2024-02-12 08:00:00+00'),
    
    -- Completed tasks (showing system working)
    ((SELECT id FROM public.facilities WHERE name = 'Bimbilla School Latrine Block'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234579'), 
     'completed', 'high', 'repair', 
     'Water supply restoration completed', 
     '2024-02-16', '2024-02-13 17:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234567'), 
     'completed', 'low', 'routine_cleaning', 
     'Weekly cleaning and maintenance check', 
     '2024-02-15', '2024-02-14 09:00:00+00'),
    
    -- Upcoming routine inspections
    ((SELECT id FROM public.facilities WHERE name = 'Damongo Health Center Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234573'), 
     'assigned', 'low', 'inspection', 
     'Monthly health and safety inspection', 
     '2024-02-25', '2024-02-15 08:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Hospital Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234589'), 
     'pending', 'low', 'inspection', 
     'Quarterly facility assessment', 
     '2024-02-28', '2024-02-15 10:00:00+00'),
    
    -- Preventive maintenance tasks
    ((SELECT id FROM public.facilities WHERE name = 'Saboba School Toilet Block'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234581'), 
     'assigned', 'medium', 'preventive_maintenance', 
     'Preventive maintenance to avoid future issues', 
     '2024-02-24', '2024-02-15 11:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu Health Post Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234593'), 
     'pending', 'medium', 'preventive_maintenance', 
     'Scheduled preventive maintenance check', 
     '2024-02-26', '2024-02-15 12:00:00+00');

-- Update completed_at for completed tasks
UPDATE public.maintenance_tasks 
SET completed_at = created_at + INTERVAL '2 days'
WHERE status = 'completed';