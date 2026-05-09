-- ============================================================================
-- UPDATE RLS POLICIES FOR ROLE AND DISTRICT-BASED ACCESS CONTROL (SIMPLE)
-- This migration implements comprehensive Row Level Security policies that scope
-- data access based on user role and district_id from auth.users metadata
-- ============================================================================

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        auth.jwt() ->> 'user_metadata' ->> 'role',
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
        'anonymous'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user district_id from JWT
CREATE OR REPLACE FUNCTION public.get_user_district_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() ->> 'user_metadata' ->> 'district_id')::UUID,
        ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'district_id')::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is system admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = 'system_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is district officer or admin
CREATE OR REPLACE FUNCTION public.is_officer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('district_officer', 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access district data
CREATE OR REPLACE FUNCTION public.can_access_district(target_district_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- System admin can access all districts
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Other users can only access their own district
    RETURN public.get_user_district_id() = target_district_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DISTRICTS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "districts_select_policy" ON public.districts;
DROP POLICY IF EXISTS "districts_insert_policy" ON public.districts;
DROP POLICY IF EXISTS "districts_update_policy" ON public.districts;
DROP POLICY IF EXISTS "districts_delete_policy" ON public.districts;

-- SELECT: System admin sees all, others see only their district, anonymous see all (for public dashboard)
CREATE POLICY "districts_select_policy" ON public.districts
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all districts (public dashboard)
        public.is_admin() OR       -- System admin can see all districts
        public.can_access_district(id)  -- Users can see their own district
    );

-- INSERT: Only system admin can create new districts
CREATE POLICY "districts_insert_policy" ON public.districts
    FOR INSERT WITH CHECK (
        public.is_admin()
    );

-- UPDATE: Only system admin can update districts
CREATE POLICY "districts_update_policy" ON public.districts
    FOR UPDATE USING (
        public.is_admin()
    );

-- DELETE: Only system admin can delete districts
CREATE POLICY "districts_delete_policy" ON public.districts
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- FACILITIES TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "facilities_select_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_insert_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_update_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_delete_policy" ON public.facilities;

-- SELECT: System admin sees all, others see only facilities in their district, anonymous see all
CREATE POLICY "facilities_select_policy" ON public.facilities
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all facilities (public dashboard)
        public.is_admin() OR       -- System admin can see all facilities
        public.can_access_district(district_id)  -- Users can see facilities in their district
    );

-- INSERT: District officers and admins can add facilities in their district
CREATE POLICY "facilities_insert_policy" ON public.facilities
    FOR INSERT WITH CHECK (
        public.is_admin() OR  -- System admin can add facilities anywhere
        (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can add in their district
    );

-- UPDATE: District officers and admins can update facilities in their district
CREATE POLICY "facilities_update_policy" ON public.facilities
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any facility
        (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can update in their district
    );

-- DELETE: Only system admin can delete facilities
CREATE POLICY "facilities_delete_policy" ON public.facilities
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- REPORTS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_authenticated_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_anonymous_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON public.reports;

-- SELECT: Users can see reports for facilities in their district
CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all reports (public dashboard)
        public.is_admin() OR       -- System admin can see all reports
        facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        )
    );

-- INSERT (Authenticated): Users can create reports for facilities in their district
CREATE POLICY "reports_insert_authenticated_policy" ON public.reports
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            public.is_admin() OR  -- System admin can create reports anywhere
            facility_id IN (
                SELECT id FROM public.facilities 
                WHERE public.can_access_district(district_id)
            )
        )
    );

-- INSERT (Anonymous): Allow anonymous reports (SMS submissions) - no district restriction
CREATE POLICY "reports_insert_anonymous_policy" ON public.reports
    FOR INSERT WITH CHECK (
        auth.role() = 'anon'
    );

-- UPDATE: District officers and admins can update reports in their district
CREATE POLICY "reports_update_policy" ON public.reports
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any report
        (public.is_officer_or_admin() AND facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        ))
    );

-- DELETE: Only system admin can delete reports
CREATE POLICY "reports_delete_policy" ON public.reports
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- ALERTS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "alerts_select_policy" ON public.alerts;
DROP POLICY IF EXISTS "alerts_insert_authenticated_policy" ON public.alerts;
DROP POLICY IF EXISTS "alerts_insert_system_policy" ON public.alerts;
DROP POLICY IF EXISTS "alerts_update_policy" ON public.alerts;
DROP POLICY IF EXISTS "alerts_delete_policy" ON public.alerts;

-- SELECT: Users can see alerts for facilities in their district
CREATE POLICY "alerts_select_policy" ON public.alerts
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all alerts (public dashboard)
        public.is_admin() OR       -- System admin can see all alerts
        facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        )
    );

-- INSERT (Authenticated): District officers and admins can create alerts in their district
CREATE POLICY "alerts_insert_authenticated_policy" ON public.alerts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            public.is_admin() OR  -- System admin can create alerts anywhere
            (public.is_officer_or_admin() AND facility_id IN (
                SELECT id FROM public.facilities 
                WHERE public.can_access_district(district_id)
            ))
        )
    );

-- INSERT (System): Allow system/service role to create alerts (automated systems)
CREATE POLICY "alerts_insert_system_policy" ON public.alerts
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

-- UPDATE: District officers and admins can update alerts in their district
CREATE POLICY "alerts_update_policy" ON public.alerts
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any alert
        (public.is_officer_or_admin() AND facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        ))
    );

-- DELETE: Only system admin can delete alerts
CREATE POLICY "alerts_delete_policy" ON public.alerts
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- WORKERS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "workers_select_policy" ON public.workers;
DROP POLICY IF EXISTS "workers_insert_policy" ON public.workers;
DROP POLICY IF EXISTS "workers_update_policy" ON public.workers;
DROP POLICY IF EXISTS "workers_delete_policy" ON public.workers;

-- SELECT: Users can see workers in their district
CREATE POLICY "workers_select_policy" ON public.workers
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all workers (public dashboard)
        public.is_admin() OR       -- System admin can see all workers
        public.can_access_district(district_id)  -- Users can see workers in their district
    );

-- INSERT: Only district officers and admins can add workers to their district
CREATE POLICY "workers_insert_policy" ON public.workers
    FOR INSERT WITH CHECK (
        public.is_admin() OR  -- System admin can add workers anywhere
        (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can add in their district
    );

-- UPDATE: District officers and admins can update workers in their district
CREATE POLICY "workers_update_policy" ON public.workers
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any worker
        (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can update in their district
    );

-- DELETE: Only system admin can delete workers
CREATE POLICY "workers_delete_policy" ON public.workers
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- MAINTENANCE_TASKS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "maintenance_tasks_select_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_insert_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_update_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_delete_policy" ON public.maintenance_tasks;

-- SELECT: Users can see maintenance tasks for facilities in their district
CREATE POLICY "maintenance_tasks_select_policy" ON public.maintenance_tasks
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all tasks (public dashboard)
        public.is_admin() OR       -- System admin can see all tasks
        facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        )
    );

-- INSERT: District officers and admins can create tasks for facilities in their district
CREATE POLICY "maintenance_tasks_insert_policy" ON public.maintenance_tasks
    FOR INSERT WITH CHECK (
        public.is_admin() OR  -- System admin can create tasks anywhere
        (public.is_officer_or_admin() AND facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        ))
    );

-- UPDATE: District officers and admins can update tasks in their district
CREATE POLICY "maintenance_tasks_update_policy" ON public.maintenance_tasks
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any task
        (public.is_officer_or_admin() AND facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        ))
    );

-- DELETE: Only district officers and admins can delete tasks in their district
CREATE POLICY "maintenance_tasks_delete_policy" ON public.maintenance_tasks
    FOR DELETE USING (
        public.is_admin() OR  -- System admin can delete any task
        (public.is_officer_or_admin() AND facility_id IN (
            SELECT id FROM public.facilities 
            WHERE public.can_access_district(district_id)
        ))
    );

-- ============================================================================
-- CLIMATE_SNAPSHOTS TABLE - ROLE AND DISTRICT SCOPED POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "climate_snapshots_select_policy" ON public.climate_snapshots;
DROP POLICY IF EXISTS "climate_snapshots_insert_authenticated_policy" ON public.climate_snapshots;
DROP POLICY IF EXISTS "climate_snapshots_insert_system_policy" ON public.climate_snapshots;
DROP POLICY IF EXISTS "climate_snapshots_update_policy" ON public.climate_snapshots;
DROP POLICY IF EXISTS "climate_snapshots_delete_policy" ON public.climate_snapshots;

-- SELECT: Users can see climate data for their district
CREATE POLICY "climate_snapshots_select_policy" ON public.climate_snapshots
    FOR SELECT USING (
        auth.role() = 'anon' OR  -- Anonymous users can view all climate data (public dashboard)
        public.is_admin() OR       -- System admin can see all climate data
        public.can_access_district(district_id)  -- Users can see climate data for their district
    );

-- INSERT (Authenticated): District officers and admins can add climate data for their district
CREATE POLICY "climate_snapshots_insert_authenticated_policy" ON public.climate_snapshots
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            public.is_admin() OR  -- System admin can add climate data anywhere
            (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can add in their district
        )
    );

-- INSERT (System): Allow system/service role to insert climate data (automated systems)
CREATE POLICY "climate_snapshots_insert_system_policy" ON public.climate_snapshots
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

-- UPDATE: Only district officers and admins can update climate data in their district
CREATE POLICY "climate_snapshots_update_policy" ON public.climate_snapshots
    FOR UPDATE USING (
        public.is_admin() OR  -- System admin can update any climate data
        (public.is_officer_or_admin() AND public.can_access_district(district_id))  -- Officers can update in their district
    );

-- DELETE: Only system admin can delete climate data
CREATE POLICY "climate_snapshots_delete_policy" ON public.climate_snapshots
    FOR DELETE USING (
        public.is_admin()
    );

-- ============================================================================
-- GRANT PERMISSIONS ON HELPER FUNCTIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_district_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_officer_or_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_district(UUID) TO authenticated, anon;

-- ============================================================================
-- POLICY TESTING VIEW
-- ============================================================================

-- Create a view to test policy effectiveness
CREATE OR REPLACE VIEW public.rls_policy_test AS
SELECT 
    'districts' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.districts
UNION ALL
SELECT 
    'facilities' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.facilities
UNION ALL
SELECT 
    'reports' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.reports
UNION ALL
SELECT 
    'alerts' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.alerts
UNION ALL
SELECT 
    'workers' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.workers
UNION ALL
SELECT 
    'maintenance_tasks' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.maintenance_tasks
UNION ALL
SELECT 
    'climate_snapshots' as table_name,
    COUNT(*) as visible_rows,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin
FROM public.climate_snapshots;

-- Grant access to the test view
GRANT SELECT ON public.rls_policy_test TO authenticated, anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policies Updated Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'HELPER FUNCTIONS CREATED:';
    RAISE NOTICE '- public.get_user_role()';
    RAISE NOTICE '- public.get_user_district_id()';
    RAISE NOTICE '- public.is_admin()';
    RAISE NOTICE '- public.is_officer_or_admin()';
    RAISE NOTICE '- public.can_access_district()';
    RAISE NOTICE '';
    RAISE NOTICE 'POLICIES UPDATED FOR ALL TABLES:';
    RAISE NOTICE '- Districts: Role and district-based access';
    RAISE NOTICE '- Facilities: Role and district-based access';
    RAISE NOTICE '- Reports: Role and district-based access + anonymous SMS';
    RAISE NOTICE '- Alerts: Role and district-based access + system automation';
    RAISE NOTICE '- Workers: Role and district-based access';
    RAISE NOTICE '- Maintenance Tasks: Role and district-based access';
    RAISE NOTICE '- Climate Snapshots: Role and district-based access + system automation';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST THE POLICIES:';
    RAISE NOTICE 'SELECT * FROM public.rls_policy_test;';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY FEATURES:';
    RAISE NOTICE '- System Admin: Full access to all districts';
    RAISE NOTICE '- District Officer: Access only to assigned district';
    RAISE NOTICE '- Anonymous: Read access for public dashboard';
    RAISE NOTICE '- Service Role: Can create alerts and climate data';
END $$;