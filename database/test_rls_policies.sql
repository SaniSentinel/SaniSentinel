-- ============================================================================
-- RLS POLICY TESTING SCRIPT
-- Run this script to test role-based and district-scoped RLS policies
-- ============================================================================

-- Test helper functions
SELECT 'Testing Helper Functions' as test_section;

-- Test user role function
SELECT 
    'public.get_user_role()' as function_name,
    public.get_user_role() as result,
    CASE 
        WHEN public.get_user_role() IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- Test user district function
SELECT 
    'public.get_user_district_id()' as function_name,
    public.get_user_district_id() as result,
    CASE 
        WHEN public.get_user_district_id() IS NOT NULL THEN 'PASS'
        ELSE 'INFO - No district assigned'
    END as status;

-- Test admin check function
SELECT 
    'public.is_admin()' as function_name,
    public.is_admin() as result,
    CASE 
        WHEN public.is_admin() IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- Test officer check function
SELECT 
    'public.is_officer_or_admin()' as function_name,
    public.is_officer_or_admin() as result,
    CASE 
        WHEN public.is_officer_or_admin() IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- ============================================================================
-- DATA VISIBILITY TESTS
-- ============================================================================

SELECT 'Testing Data Visibility by Role' as test_section;

-- Test RLS policy effectiveness
SELECT * FROM public.rls_policy_test;

-- ============================================================================
-- DETAILED TABLE ACCESS TESTS
-- ============================================================================

SELECT 'Testing Individual Table Access' as test_section;

-- Test districts access
SELECT 
    'districts' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' districts' as description
FROM public.districts;

-- Test facilities access
SELECT 
    'facilities' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' facilities' as description
FROM public.facilities;

-- Test reports access
SELECT 
    'reports' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' reports' as description
FROM public.reports;

-- Test alerts access
SELECT 
    'alerts' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' alerts' as description
FROM public.alerts;

-- Test workers access
SELECT 
    'workers' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' workers' as description
FROM public.workers;

-- Test maintenance tasks access
SELECT 
    'maintenance_tasks' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' maintenance tasks' as description
FROM public.maintenance_tasks;

-- Test climate snapshots access
SELECT 
    'climate_snapshots' as table_name,
    COUNT(*) as visible_rows,
    'Current user can see ' || COUNT(*) || ' climate snapshots' as description
FROM public.climate_snapshots;

-- ============================================================================
-- DISTRICT-SPECIFIC ACCESS TESTS
-- ============================================================================

SELECT 'Testing District-Specific Access' as test_section;

-- Show facilities by district (to verify district scoping)
SELECT 
    d.name as district_name,
    COUNT(f.id) as facility_count,
    CASE 
        WHEN public.can_access_district(d.id) THEN 'ACCESSIBLE'
        ELSE 'RESTRICTED'
    END as access_status
FROM public.districts d
LEFT JOIN public.facilities f ON d.id = f.district_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- Show reports by district (to verify district scoping)
SELECT 
    d.name as district_name,
    COUNT(r.id) as report_count,
    CASE 
        WHEN public.can_access_district(d.id) THEN 'ACCESSIBLE'
        ELSE 'RESTRICTED'
    END as access_status
FROM public.districts d
LEFT JOIN public.facilities f ON d.id = f.district_id
LEFT JOIN public.reports r ON f.id = r.facility_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- ============================================================================
-- PERMISSION TESTS (INSERT/UPDATE/DELETE)
-- ============================================================================

SELECT 'Testing Write Permissions' as test_section;

-- Note: These are test queries to check policy logic, not actual data modifications

-- Test if current user can theoretically insert into districts
SELECT 
    'districts_insert' as permission_test,
    CASE 
        WHEN public.is_admin() THEN 'ALLOWED - System admin can insert districts'
        ELSE 'DENIED - Only system admin can insert districts'
    END as result;

-- Test if current user can theoretically insert facilities
SELECT 
    'facilities_insert' as permission_test,
    CASE 
        WHEN public.is_admin() THEN 'ALLOWED - System admin can insert facilities anywhere'
        WHEN public.is_officer_or_admin() AND public.get_user_district_id() IS NOT NULL THEN 'ALLOWED - Officer can insert facilities in their district'
        ELSE 'DENIED - Insufficient permissions'
    END as result;

-- Test if current user can theoretically update reports
SELECT 
    'reports_update' as permission_test,
    CASE 
        WHEN public.is_admin() THEN 'ALLOWED - System admin can update any report'
        WHEN public.is_officer_or_admin() AND public.get_user_district_id() IS NOT NULL THEN 'ALLOWED - Officer can update reports in their district'
        ELSE 'DENIED - Insufficient permissions'
    END as result;

-- Test if current user can theoretically delete workers
SELECT 
    'workers_delete' as permission_test,
    CASE 
        WHEN public.is_admin() THEN 'ALLOWED - System admin can delete workers'
        ELSE 'DENIED - Only system admin can delete workers'
    END as result;

-- ============================================================================
-- CURRENT USER CONTEXT
-- ============================================================================

SELECT 'Current User Context' as test_section;

-- Show current user information
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'Anonymous') as user_email,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin,
    public.is_officer_or_admin() as is_officer_or_admin,
    auth.role() as auth_role;

-- Show district information for current user
SELECT 
    d.name as user_district_name,
    d.region as user_district_region,
    d.id as user_district_id
FROM public.districts d
WHERE d.id = public.get_user_district_id();

-- ============================================================================
-- POLICY EFFECTIVENESS SUMMARY
-- ============================================================================

SELECT 'Policy Effectiveness Summary' as test_section;

-- Create a summary of what the current user can access
WITH access_summary AS (
    SELECT 
        'districts' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.districts) as total_rows
    FROM public.districts
    
    UNION ALL
    
    SELECT 
        'facilities' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.facilities) as total_rows
    FROM public.facilities
    
    UNION ALL
    
    SELECT 
        'reports' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.reports) as total_rows
    FROM public.reports
    
    UNION ALL
    
    SELECT 
        'alerts' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.alerts) as total_rows
    FROM public.alerts
    
    UNION ALL
    
    SELECT 
        'workers' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.workers) as total_rows
    FROM public.workers
    
    UNION ALL
    
    SELECT 
        'maintenance_tasks' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.maintenance_tasks) as total_rows
    FROM public.maintenance_tasks
    
    UNION ALL
    
    SELECT 
        'climate_snapshots' as table_name,
        COUNT(*) as accessible_rows,
        (SELECT COUNT(*) FROM public.climate_snapshots) as total_rows
    FROM public.climate_snapshots
)
SELECT 
    table_name,
    accessible_rows,
    total_rows,
    ROUND((accessible_rows::DECIMAL / NULLIF(total_rows, 0)) * 100, 2) as access_percentage,
    CASE 
        WHEN accessible_rows = total_rows THEN 'FULL ACCESS'
        WHEN accessible_rows > 0 THEN 'PARTIAL ACCESS'
        ELSE 'NO ACCESS'
    END as access_level
FROM access_summary
ORDER BY table_name;

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

SELECT 'Testing Recommendations' as test_section;

SELECT 
    'To fully test RLS policies:' as recommendation,
    '1. Run this script as different user types (admin, officer, worker, anonymous)' as step_1,
    '2. Compare accessible_rows vs total_rows for each role' as step_2,
    '3. Verify district scoping works correctly' as step_3,
    '4. Test actual INSERT/UPDATE/DELETE operations' as step_4,
    '5. Check that anonymous users can still access public dashboard data' as step_5;