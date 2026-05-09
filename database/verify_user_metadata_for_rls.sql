-- ============================================================================
-- VERIFY USER METADATA FOR RLS POLICIES
-- This script checks if users have the required metadata for RLS policies to work
-- ============================================================================

-- Check if test users exist and have proper metadata
SELECT 
    'User Metadata Verification' as section,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'district_id' as district_id,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->'permissions' as permissions,
    email_confirmed_at IS NOT NULL as email_confirmed,
    CASE 
        WHEN raw_user_meta_data->>'role' IS NULL THEN 'MISSING ROLE'
        WHEN raw_user_meta_data->>'district_id' IS NULL AND raw_user_meta_data->>'role' != 'system_admin' THEN 'MISSING DISTRICT_ID'
        WHEN email_confirmed_at IS NULL THEN 'EMAIL NOT CONFIRMED'
        ELSE 'METADATA OK'
    END as metadata_status
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Check if Tamale district exists (required for test users)
SELECT 
    'District Verification' as section,
    id as district_id,
    name as district_name,
    region,
    CASE 
        WHEN id IS NOT NULL THEN 'DISTRICT EXISTS'
        ELSE 'DISTRICT MISSING'
    END as district_status
FROM public.districts 
WHERE name = 'Tamale';

-- Verify district_id matches between users and districts
SELECT 
    'District ID Matching' as section,
    u.email,
    u.raw_user_meta_data->>'district_id' as user_district_id,
    d.id as actual_district_id,
    d.name as district_name,
    CASE 
        WHEN u.raw_user_meta_data->>'district_id' = d.id::text THEN 'MATCH'
        WHEN u.raw_user_meta_data->>'district_id' IS NULL THEN 'NO DISTRICT ASSIGNED'
        ELSE 'MISMATCH'
    END as match_status
FROM auth.users u
LEFT JOIN public.districts d ON d.id = (u.raw_user_meta_data->>'district_id')::UUID
WHERE u.email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY u.email;

-- Test RLS helper functions with current metadata
SELECT 
    'RLS Function Testing' as section,
    'public.get_user_role()' as function_name,
    public.get_user_role() as result,
    CASE 
        WHEN public.get_user_role() IN ('system_admin', 'district_officer', 'worker') THEN 'VALID ROLE'
        WHEN public.get_user_role() = 'anonymous' THEN 'ANONYMOUS USER'
        ELSE 'INVALID ROLE'
    END as status;

SELECT 
    'RLS Function Testing' as section,
    'public.get_user_district_id()' as function_name,
    public.get_user_district_id() as result,
    CASE 
        WHEN public.get_user_district_id() IS NOT NULL THEN 'HAS DISTRICT'
        WHEN public.get_user_role() = 'system_admin' THEN 'ADMIN - NO DISTRICT REQUIRED'
        ELSE 'MISSING DISTRICT'
    END as status;

-- Show what data current user can see (test RLS policies)
SELECT 
    'Data Visibility Test' as section,
    'districts' as table_name,
    COUNT(*) as visible_rows
FROM public.districts
UNION ALL
SELECT 
    'Data Visibility Test' as section,
    'facilities' as table_name,
    COUNT(*) as visible_rows
FROM public.facilities
UNION ALL
SELECT 
    'Data Visibility Test' as section,
    'reports' as table_name,
    COUNT(*) as visible_rows
FROM public.reports
UNION ALL
SELECT 
    'Data Visibility Test' as section,
    'workers' as table_name,
    COUNT(*) as visible_rows
FROM public.workers;

-- ============================================================================
-- METADATA SETUP INSTRUCTIONS
-- ============================================================================

-- If metadata is missing, run these commands:

-- 1. Get Tamale district ID first:
-- SELECT id FROM public.districts WHERE name = 'Tamale';

-- 2. Update admin user metadata:
/*
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'system_admin',
    'name', 'System Administrator',
    'district_id', 'REPLACE_WITH_TAMALE_DISTRICT_ID',
    'department', 'IT Administration',
    'permissions', '["all"]'::jsonb,
    'title', 'System Administrator'
)
WHERE email = 'admin@sanissentinel.com';
*/

-- 3. Update officer user metadata:
/*
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'district_officer',
    'name', 'Tamale District Officer',
    'district_id', 'REPLACE_WITH_TAMALE_DISTRICT_ID',
    'department', 'Health Department',
    'permissions', '["read", "write", "manage_facilities"]'::jsonb,
    'title', 'District Health Officer'
)
WHERE email = 'officer@tamale.gov';
*/

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

SELECT 
    'Troubleshooting Guide' as section,
    'Issue: Users show MISSING ROLE' as issue,
    'Solution: Run UPDATE commands above to add role metadata' as solution
UNION ALL
SELECT 
    'Troubleshooting Guide' as section,
    'Issue: Users show MISSING DISTRICT_ID' as issue,
    'Solution: Ensure district_id is set in user metadata (not required for system_admin)' as solution
UNION ALL
SELECT 
    'Troubleshooting Guide' as section,
    'Issue: District ID MISMATCH' as issue,
    'Solution: Verify district exists and UUID matches exactly' as solution
UNION ALL
SELECT 
    'Troubleshooting Guide' as section,
    'Issue: RLS policies not working' as issue,
    'Solution: Ensure user metadata is properly formatted and migration 015 is applied' as solution
UNION ALL
SELECT 
    'Troubleshooting Guide' as section,
    'Issue: Cannot see any data' as issue,
    'Solution: Check if user has valid role and district assignment' as solution;