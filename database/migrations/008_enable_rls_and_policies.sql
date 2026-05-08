-- Enable Row Level Security (RLS) and create basic policies for all tables
-- This migration ensures consistent security across the entire SaniSentinel database

-- =============================================================================
-- DISTRICTS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to districts" ON public.districts;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.districts;

-- Create comprehensive policies for districts
CREATE POLICY "districts_select_policy" ON public.districts
    FOR SELECT USING (true);

CREATE POLICY "districts_insert_policy" ON public.districts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "districts_update_policy" ON public.districts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "districts_delete_policy" ON public.districts
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- FACILITIES TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.facilities;

-- Create comprehensive policies for facilities
CREATE POLICY "facilities_select_policy" ON public.facilities
    FOR SELECT USING (true);

CREATE POLICY "facilities_insert_policy" ON public.facilities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "facilities_update_policy" ON public.facilities
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "facilities_delete_policy" ON public.facilities
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- REPORTS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to reports" ON public.reports;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.reports;
DROP POLICY IF EXISTS "Allow anonymous insert for reports" ON public.reports;

-- Create comprehensive policies for reports
CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (true);

CREATE POLICY "reports_insert_authenticated_policy" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reports_insert_anonymous_policy" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'anon');

CREATE POLICY "reports_update_policy" ON public.reports
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "reports_delete_policy" ON public.reports
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- ALERTS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to alerts" ON public.alerts;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.alerts;
DROP POLICY IF EXISTS "Allow system insert for alerts" ON public.alerts;

-- Create comprehensive policies for alerts
CREATE POLICY "alerts_select_policy" ON public.alerts
    FOR SELECT USING (true);

CREATE POLICY "alerts_insert_authenticated_policy" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "alerts_insert_system_policy" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "alerts_update_policy" ON public.alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "alerts_delete_policy" ON public.alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- WORKERS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to workers" ON public.workers;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.workers;

-- Create comprehensive policies for workers
CREATE POLICY "workers_select_policy" ON public.workers
    FOR SELECT USING (true);

CREATE POLICY "workers_insert_policy" ON public.workers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "workers_update_policy" ON public.workers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "workers_delete_policy" ON public.workers
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MAINTENANCE_TASKS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to maintenance_tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.maintenance_tasks;

-- Create comprehensive policies for maintenance_tasks
CREATE POLICY "maintenance_tasks_select_policy" ON public.maintenance_tasks
    FOR SELECT USING (true);

CREATE POLICY "maintenance_tasks_insert_policy" ON public.maintenance_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "maintenance_tasks_update_policy" ON public.maintenance_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "maintenance_tasks_delete_policy" ON public.maintenance_tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- CLIMATE_SNAPSHOTS TABLE RLS
-- =============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.climate_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to climate_snapshots" ON public.climate_snapshots;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.climate_snapshots;
DROP POLICY IF EXISTS "Allow system insert for climate_snapshots" ON public.climate_snapshots;

-- Create comprehensive policies for climate_snapshots
CREATE POLICY "climate_snapshots_select_policy" ON public.climate_snapshots
    FOR SELECT USING (true);

CREATE POLICY "climate_snapshots_insert_authenticated_policy" ON public.climate_snapshots
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "climate_snapshots_insert_system_policy" ON public.climate_snapshots
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "climate_snapshots_update_policy" ON public.climate_snapshots
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "climate_snapshots_delete_policy" ON public.climate_snapshots
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- ADVANCED RLS POLICIES (Optional - for enhanced security)
-- =============================================================================

-- Worker-specific policies (workers can only see/edit their own tasks)
-- Uncomment these if you want worker-level isolation

/*
-- Workers can only see their own assigned tasks
CREATE POLICY "maintenance_tasks_worker_select_policy" ON public.maintenance_tasks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        assigned_to IN (
            SELECT id FROM public.workers 
            WHERE phone = auth.jwt() ->> 'phone'
        )
    );

-- Workers can only update their own assigned tasks
CREATE POLICY "maintenance_tasks_worker_update_policy" ON public.maintenance_tasks
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        assigned_to IN (
            SELECT id FROM public.workers 
            WHERE phone = auth.jwt() ->> 'phone'
        )
    );
*/

-- District-based policies (users can only see data from their district)
-- Uncomment these if you want district-level isolation

/*
-- Users can only see facilities in their district
CREATE POLICY "facilities_district_policy" ON public.facilities
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        district_id IN (
            SELECT district_id FROM public.workers 
            WHERE phone = auth.jwt() ->> 'phone'
        )
    );

-- Users can only see reports for facilities in their district
CREATE POLICY "reports_district_policy" ON public.reports
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        facility_id IN (
            SELECT f.id FROM public.facilities f
            JOIN public.workers w ON f.district_id = w.district_id
            WHERE w.phone = auth.jwt() ->> 'phone'
        )
    );
*/

-- =============================================================================
-- REALTIME SUBSCRIPTIONS SECURITY
-- =============================================================================

-- Enable realtime for all tables (only if not already enabled)
-- Use DO block to handle existing publications gracefully

DO $$
BEGIN
    -- Add districts to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'districts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.districts;
    END IF;

    -- Add facilities to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'facilities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.facilities;
    END IF;

    -- Add reports to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
    END IF;

    -- Add alerts to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
    END IF;

    -- Add workers to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'workers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
    END IF;

    -- Add maintenance_tasks to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'maintenance_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tasks;
    END IF;

    -- Add climate_snapshots to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'climate_snapshots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.climate_snapshots;
    END IF;
END $$;

-- =============================================================================
-- FUNCTION SECURITY
-- =============================================================================

-- Grant execute permissions on custom functions to authenticated users (if functions exist)
DO $$
BEGIN
    -- Grant permissions only if functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_districts_within_radius') THEN
        GRANT EXECUTE ON FUNCTION public.get_districts_within_radius TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_facilities_within_radius') THEN
        GRANT EXECUTE ON FUNCTION public.get_facilities_within_radius TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_worker_by_phone') THEN
        GRANT EXECUTE ON FUNCTION public.get_worker_by_phone TO authenticated;
        GRANT EXECUTE ON FUNCTION public.get_worker_by_phone TO anon;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_workers_in_district') THEN
        GRANT EXECUTE ON FUNCTION public.get_workers_in_district TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_workers_by_role') THEN
        GRANT EXECUTE ON FUNCTION public.get_workers_by_role TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_latest_climate_data') THEN
        GRANT EXECUTE ON FUNCTION public.get_latest_climate_data TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_flood_risk') THEN
        GRANT EXECUTE ON FUNCTION public.calculate_flood_risk TO authenticated;
    END IF;

    -- Grant execute permissions to service role for system functions (if they exist)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_facility_status_from_report') THEN
        GRANT EXECUTE ON FUNCTION public.update_facility_status_from_report TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_risk_alert') THEN
        GRANT EXECUTE ON FUNCTION public.generate_risk_alert TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_resolve_alerts') THEN
        GRANT EXECUTE ON FUNCTION public.auto_resolve_alerts TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_maintenance_task_from_alert') THEN
        GRANT EXECUTE ON FUNCTION public.create_maintenance_task_from_alert TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_assign_maintenance_task') THEN
        GRANT EXECUTE ON FUNCTION public.auto_assign_maintenance_task TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_facility_on_task_completion') THEN
        GRANT EXECUTE ON FUNCTION public.update_facility_on_task_completion TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_climate_alerts') THEN
        GRANT EXECUTE ON FUNCTION public.generate_climate_alerts TO service_role;
    END IF;
END $$;

-- =============================================================================
-- VIEW SECURITY
-- =============================================================================

-- Grant select permissions on views (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'current_weather') THEN
        GRANT SELECT ON public.current_weather TO authenticated;
        GRANT SELECT ON public.current_weather TO anon;
    END IF;
END $$;

-- =============================================================================
-- SUMMARY OF RLS POLICIES
-- =============================================================================

/*
POLICY SUMMARY:

1. SELECT (READ) ACCESS:
   - All tables: Public read access (anyone can view data)
   - This supports the public dashboard and SMS webhook functionality

2. INSERT ACCESS:
   - Most tables: Authenticated users only
   - Reports: Both authenticated users AND anonymous users (for SMS submissions)
   - Alerts & Climate: Both authenticated users AND service role (for system automation)

3. UPDATE ACCESS:
   - All tables: Authenticated users only
   - Ensures only logged-in users can modify data

4. DELETE ACCESS:
   - All tables: Authenticated users only
   - Prevents accidental data loss from anonymous users

5. SYSTEM ACCESS:
   - Service role can insert alerts and climate data (for automated systems)
   - Service role can execute trigger functions
   - Anonymous users can execute SMS-related functions

6. REALTIME:
   - All tables enabled for real-time subscriptions
   - Supports live dashboard updates

SECURITY LEVELS:
- Level 1 (Current): Basic authentication-based policies
- Level 2 (Optional): Worker-specific isolation (commented out)
- Level 3 (Optional): District-based isolation (commented out)

To enable higher security levels, uncomment the relevant policy sections above.
*/