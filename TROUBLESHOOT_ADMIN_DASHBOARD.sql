-- ============================================================================
-- TROUBLESHOOT ADMIN DASHBOARD - WHY NO DATA IS SHOWING
-- Run this script to diagnose why the admin dashboard isn't showing data
-- ============================================================================

-- Step 1: Check if RLS policies are working
SELECT 'STEP 1: RLS Policy Test' as step;
SELECT * FROM public.rls_policy_test;

-- Step 2: Check current user context
SELECT 'STEP 2: Current User Context' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'Anonymous') as current_user_email,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin,
    auth.role() as auth_role;

-- Step 3: Check if there's any data in the tables
SELECT 'STEP 3: Data Availability Check' as step;

SELECT 'districts' as table_name, COUNT(*) as total_rows FROM public.districts
UNION ALL
SELECT 'facilities' as table_name, COUNT(*) as total_rows FROM public.facilities
UNION ALL
SELECT 'reports' as table_name, COUNT(*) as total_rows FROM public.reports
UNION ALL
SELECT 'alerts' as table_name, COUNT(*) as total_rows FROM public.alerts
UNION ALL
SELECT 'workers' as table_name, COUNT(*) as total_rows FROM public.workers
UNION ALL
SELECT 'maintenance_tasks' as table_name, COUNT(*) as total_rows FROM public.maintenance_tasks
UNION ALL
SELECT 'climate_snapshots' as table_name, COUNT(*) as total_rows FROM public.climate_snapshots;

-- Step 4: Check user metadata in auth.users
SELECT 'STEP 4: User Metadata Check' as step;
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'district_id' as district_id,
    raw_user_meta_data->>'name' as name,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Step 5: Check if Tamale district exists
SELECT 'STEP 5: Tamale District Check' as step;
SELECT 
    id,
    name,
    region,
    created_at
FROM public.districts 
WHERE name = 'Tamale';

-- Step 6: Check facilities in Tamale district
SELECT 'STEP 6: Facilities in Tamale' as step;
SELECT 
    f.id,
    f.name,
    f.type,
    f.status,
    d.name as district_name
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE d.name = 'Tamale'
LIMIT 5;

-- Step 7: Check reports for Tamale facilities
SELECT 'STEP 7: Reports for Tamale Facilities' as step;
SELECT 
    r.id,
    r.report_type,
    r.status,
    r.created_at,
    f.name as facility_name,
    d.name as district_name
FROM public.reports r
JOIN public.facilities f ON r.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name = 'Tamale'
ORDER BY r.created_at DESC
LIMIT 5;

-- Step 8: Check alerts for Tamale facilities
SELECT 'STEP 8: Alerts for Tamale Facilities' as step;
SELECT 
    a.id,
    a.alert_type,
    a.severity,
    a.status,
    a.created_at,
    f.name as facility_name,
    d.name as district_name
FROM public.alerts a
JOIN public.facilities f ON a.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name = 'Tamale'
ORDER BY a.created_at DESC
LIMIT 5;

-- Step 9: Test what admin user can see (if logged in as admin)
SELECT 'STEP 9: Admin Access Test' as step;
SELECT 
    'Admin should see ALL data' as note,
    public.is_admin() as is_current_user_admin,
    CASE 
        WHEN public.is_admin() THEN 'Admin can see all districts'
        WHEN public.get_user_district_id() IS NOT NULL THEN 'User limited to district: ' || public.get_user_district_id()::text
        ELSE 'User has no district access'
    END as access_level;

-- Step 10: Check if RLS is actually enabled on tables
SELECT 'STEP 10: RLS Status Check' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('districts', 'facilities', 'reports', 'alerts', 'workers', 'maintenance_tasks', 'climate_snapshots')
ORDER BY tablename;

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================

SELECT 'DIAGNOSTIC SUMMARY' as section;

-- Summary of potential issues
SELECT 
    'Potential Issues' as category,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.districts) = 0 THEN 'NO DISTRICTS - Run district migration first'
        WHEN (SELECT COUNT(*) FROM public.facilities) = 0 THEN 'NO FACILITIES - Run facility seeding'
        WHEN (SELECT COUNT(*) FROM public.reports) = 0 THEN 'NO REPORTS - Create some test reports'
        WHEN public.get_user_role() = 'anonymous' THEN 'NOT LOGGED IN - User needs to authenticate'
        WHEN public.get_user_role() IS NULL THEN 'NO USER ROLE - User metadata missing'
        WHEN NOT public.is_admin() AND public.get_user_district_id() IS NULL THEN 'NO DISTRICT ASSIGNED - User needs district_id'
        ELSE 'DATA AND PERMISSIONS LOOK OK - Check frontend queries'
    END as diagnosis;

-- ============================================================================
-- QUICK FIXES
-- ============================================================================

SELECT 'QUICK FIXES' as section;

-- If no data exists, here are some quick insert commands:

/*
-- Create test report (run if no reports exist):
INSERT INTO public.reports (facility_id, report_type, status, description, reported_by_phone)
SELECT 
    f.id,
    'maintenance_needed',
    'open',
    'Test report for dashboard',
    '+233241234567'
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE d.name = 'Tamale'
LIMIT 1;

-- Create test alert (run if no alerts exist):
INSERT INTO public.alerts (facility_id, alert_type, severity, status, message)
SELECT 
    f.id,
    'maintenance_overdue',
    'medium',
    'active',
    'Test alert for dashboard'
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE d.name = 'Tamale'
LIMIT 1;
*/