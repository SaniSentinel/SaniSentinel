-- ============================================================================
-- QUICK ADMIN DIAGNOSIS - Check why admin can't see facility data
-- ============================================================================

-- Step 1: Check current authentication
SELECT 'STEP 1: Authentication Check' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'NOT LOGGED IN') as current_user,
    COALESCE(auth.jwt() ->> 'user_metadata', 'NO METADATA') as user_metadata,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin;

-- Step 2: Check if facilities exist
SELECT 'STEP 2: Facility Count Check' as step;
SELECT 
    COUNT(*) as total_facilities,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as facilities_with_coords,
    COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) as missing_coords
FROM public.facilities;

-- Step 3: Check what admin can see via RLS
SELECT 'STEP 3: RLS Policy Test' as step;
SELECT * FROM public.rls_policy_test;

-- Step 4: Sample facilities data
SELECT 'STEP 4: Sample Facilities' as step;
SELECT 
    f.id,
    f.name,
    f.type,
    f.status,
    f.lat,
    f.lng,
    f.risk_score,
    d.name as district_name
FROM public.facilities f
LEFT JOIN public.districts d ON f.district_id = d.id
LIMIT 5;

-- Step 5: Check if Tamale district exists
SELECT 'STEP 5: District Check' as step;
SELECT id, name, region FROM public.districts WHERE name ILIKE '%tamale%';