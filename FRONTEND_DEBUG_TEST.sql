-- ============================================================================
-- FRONTEND DEBUG TEST - Check what data is available for the frontend
-- ============================================================================

-- Step 1: Check current user authentication
SELECT '🔐 AUTHENTICATION CHECK' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', '❌ NOT LOGGED IN') as current_user,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin,
    CASE 
        WHEN auth.jwt() ->> 'email' IS NULL THEN '❌ NOT AUTHENTICATED'
        WHEN NOT public.is_admin() THEN '❌ NOT ADMIN'
        ELSE '✅ ADMIN AUTHENTICATED'
    END as auth_status;

-- Step 2: Check what facilities exist
SELECT '📍 FACILITIES DATA CHECK' as step;
SELECT 
    COUNT(*) as total_facilities,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as facilities_with_coords,
    COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) as missing_coords,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO FACILITIES - Database is empty'
        WHEN COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) = 0 THEN '❌ NO COORDINATES - Facilities exist but no lat/lng'
        ELSE '✅ FACILITIES WITH COORDINATES EXIST'
    END as status
FROM public.facilities;

-- Step 3: Check what districts exist
SELECT '🏛️ DISTRICTS DATA CHECK' as step;
SELECT 
    COUNT(*) as total_districts,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO DISTRICTS'
        ELSE '✅ DISTRICTS EXIST'
    END as status
FROM public.districts;

-- Step 4: Show sample facilities that should appear on map
SELECT '🗺️ SAMPLE FACILITIES FOR MAP' as step;
SELECT 
    f.id,
    f.name,
    f.type,
    f.status,
    f.lat,
    f.lng,
    f.risk_score,
    d.name as district_name,
    CASE 
        WHEN f.lat IS NULL OR f.lng IS NULL THEN '❌ NO COORDINATES'
        ELSE '✅ HAS COORDINATES'
    END as map_ready
FROM public.facilities f
LEFT JOIN public.districts d ON f.district_id = d.id
ORDER BY f.created_at DESC
LIMIT 10;

-- Step 5: Test RLS policies - what can admin see?
SELECT '🔒 RLS POLICY TEST' as step;
SELECT * FROM public.rls_policy_test;

-- Step 6: Check if basic data exists at all
SELECT '📊 RAW DATA COUNT' as step;
SELECT 
    'facilities' as table_name,
    COUNT(*) as row_count
FROM public.facilities
UNION ALL
SELECT 
    'districts' as table_name,
    COUNT(*) as row_count
FROM public.districts
UNION ALL
SELECT 
    'reports' as table_name,
    COUNT(*) as row_count
FROM public.reports
UNION ALL
SELECT 
    'alerts' as table_name,
    COUNT(*) as row_count
FROM public.alerts;

-- ============================================================================
-- DIAGNOSIS SUMMARY
-- ============================================================================

SELECT '🎯 DIAGNOSIS SUMMARY' as step;

WITH data_check AS (
    SELECT 
        COUNT(*) as facility_count,
        COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as coord_count,
        (SELECT COUNT(*) FROM public.districts) as district_count
    FROM public.facilities
)
SELECT 
    CASE 
        WHEN NOT public.is_admin() THEN '❌ USER NOT ADMIN - Check authentication'
        WHEN (SELECT facility_count FROM data_check) = 0 THEN '❌ NO FACILITIES - Run facility seeding migration'
        WHEN (SELECT coord_count FROM data_check) = 0 THEN '❌ NO COORDINATES - Facilities missing lat/lng'
        WHEN (SELECT district_count FROM data_check) = 0 THEN '❌ NO DISTRICTS - Run district migration'
        ELSE '✅ DATA READY - Frontend should show facilities'
    END as diagnosis,
    CASE 
        WHEN NOT public.is_admin() THEN 'Login as admin@sanissentinel.com'
        WHEN (SELECT facility_count FROM data_check) = 0 THEN 'Run: COMPLETE_ADMIN_FIX.sql'
        WHEN (SELECT coord_count FROM data_check) = 0 THEN 'Update facilities with coordinates'
        WHEN (SELECT district_count FROM data_check) = 0 THEN 'Create districts first'
        ELSE 'Check browser console for JavaScript errors'
    END as recommended_action;

-- ============================================================================
-- QUICK FIX: CREATE MINIMAL TEST DATA IF MISSING
-- ============================================================================

-- Create Tamale district if missing
INSERT INTO public.districts (name, region, population, area_km2, lat, lng) VALUES
    ('Tamale', 'Northern Region', 371351, 750.0, 9.4034, -0.8424)
ON CONFLICT (name) DO NOTHING;

-- Create test facilities if none exist
INSERT INTO public.facilities (name, type, district_id, lat, lng, status, risk_score, created_at)
SELECT 'Test Facility 1', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4034, -0.8424, 'good', 25, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.facilities LIMIT 1)
UNION ALL
SELECT 'Test Facility 2', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4089, -0.8456, 'damaged', 70, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.facilities LIMIT 1)
UNION ALL
SELECT 'Test Facility 3', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.3876, -0.8234, 'overflow', 85, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.facilities LIMIT 1);

-- Verify test data was created
SELECT '✅ TEST DATA CREATED' as step;
SELECT 
    'After Quick Fix' as status,
    COUNT(*) as facility_count,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as with_coordinates
FROM public.facilities;

-- Show the test facilities
SELECT 
    f.name,
    f.lat,
    f.lng,
    f.risk_score,
    f.status,
    d.name as district
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL
LIMIT 5;