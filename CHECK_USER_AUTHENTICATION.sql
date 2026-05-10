-- ============================================================================
-- CHECK USER AUTHENTICATION AND PERMISSIONS
-- Run this to verify your login status and permissions
-- ============================================================================

-- Check current authentication status
SELECT 'AUTHENTICATION STATUS' as section;

SELECT 
    'Current User' as check_type,
    COALESCE(auth.jwt() ->> 'email', 'NOT LOGGED IN') as result,
    CASE 
        WHEN auth.jwt() ->> 'email' IS NOT NULL THEN '✅ AUTHENTICATED'
        ELSE '❌ NOT AUTHENTICATED'
    END as status;

-- Check user role and metadata
SELECT 'USER METADATA' as section;

SELECT 
    'User Role' as check_type,
    COALESCE(public.get_user_role(), 'NO ROLE') as result,
    CASE 
        WHEN public.get_user_role() = 'system_admin' THEN '✅ SYSTEM ADMIN'
        WHEN public.get_user_role() = 'district_officer' THEN '✅ DISTRICT OFFICER'
        WHEN public.get_user_role() = 'worker' THEN '✅ WORKER'
        WHEN public.get_user_role() = 'anonymous' THEN '⚠️ ANONYMOUS USER'
        ELSE '❌ INVALID ROLE'
    END as status
UNION ALL
SELECT 
    'District ID' as check_type,
    COALESCE(public.get_user_district_id()::text, 'NO DISTRICT') as result,
    CASE 
        WHEN public.get_user_district_id() IS NOT NULL THEN '✅ HAS DISTRICT'
        WHEN public.is_admin() THEN '✅ ADMIN - NO DISTRICT NEEDED'
        ELSE '❌ NO DISTRICT ASSIGNED'
    END as status
UNION ALL
SELECT 
    'Admin Status' as check_type,
    public.is_admin()::text as result,
    CASE 
        WHEN public.is_admin() THEN '✅ IS ADMIN'
        ELSE '❌ NOT ADMIN'
    END as status;

-- Check what data the current user can see
SELECT 'DATA VISIBILITY TEST' as section;

SELECT * FROM public.rls_policy_test;

-- Check if test users exist in auth.users
SELECT 'TEST USERS STATUS' as section;

SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    email_confirmed_at IS NOT NULL as confirmed,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED'
        ELSE '❌ NOT CONFIRMED'
    END as email_status
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

SELECT 'TROUBLESHOOTING GUIDE' as section;

SELECT 
    'Issue' as problem,
    'Solution' as fix
UNION ALL
SELECT 
    'Shows NOT LOGGED IN',
    'Go to /login and sign in with admin@sanissentinel.com'
UNION ALL
SELECT 
    'Shows NO ROLE or INVALID ROLE',
    'Run UPDATE_USER_METADATA.sql to add role to user'
UNION ALL
SELECT 
    'Shows 0 visible rows for all tables',
    'Run CREATE_TEST_DATA.sql to add sample data'
UNION ALL
SELECT 
    'User exists but NOT CONFIRMED',
    'Manually confirm email in Supabase Auth dashboard'
UNION ALL
SELECT 
    'Admin shows 0 rows but should see all',
    'Check if RLS policies were applied correctly';

-- ============================================================================
-- QUICK FIXES
-- ============================================================================

SELECT 'QUICK FIXES' as section;

-- Show the exact SQL to fix user metadata
SELECT 
    'Fix Admin User Metadata' as fix_type,
    'UPDATE auth.users SET raw_user_meta_data = jsonb_build_object(''role'', ''system_admin'', ''name'', ''System Administrator'', ''district_id'', (SELECT id FROM public.districts WHERE name = ''Tamale'')::text, ''department'', ''IT Administration'', ''permissions'', ''["all"]''::jsonb, ''title'', ''System Administrator'') WHERE email = ''admin@sanissentinel.com'';' as sql_command;

-- ============================================================================
-- EXPECTED RESULTS FOR ADMIN USER
-- ============================================================================

SELECT 'EXPECTED RESULTS FOR ADMIN' as section;

SELECT 
    'What Admin Should See' as expectation,
    'Result' as expected_result
UNION ALL
SELECT 
    'Authentication Status',
    '✅ AUTHENTICATED with admin@sanissentinel.com'
UNION ALL
SELECT 
    'User Role',
    '✅ SYSTEM ADMIN'
UNION ALL
SELECT 
    'Admin Status',
    '✅ IS ADMIN (true)'
UNION ALL
SELECT 
    'Data Visibility',
    'Should see ALL rows in ALL tables'
UNION ALL
SELECT 
    'District Access',
    '✅ ADMIN - NO DISTRICT NEEDED (can access all districts)';