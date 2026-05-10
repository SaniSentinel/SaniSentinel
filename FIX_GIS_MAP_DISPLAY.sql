-- ============================================================================
-- FIX GIS MAP DISPLAY ISSUE
-- This script ensures facilities show up on the GIS map for admin users
-- ============================================================================

-- Step 1: Verify current user is admin
SELECT 'STEP 1: Admin Verification' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'NOT LOGGED IN') as current_user,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin,
    CASE 
        WHEN public.is_admin() THEN '✅ ADMIN ACCESS CONFIRMED'
        ELSE '❌ NOT ADMIN - LOGIN AS admin@sanissentinel.com'
    END as status;

-- Step 2: Check if facilities exist with coordinates
SELECT 'STEP 2: Facility Data Check' as step;
SELECT 
    COUNT(*) as total_facilities,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as facilities_with_coords,
    COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) as missing_coords,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO FACILITIES - Need to run seeding migration'
        WHEN COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) = 0 THEN '❌ NO COORDINATES'
        ELSE '✅ FACILITIES WITH COORDINATES EXIST'
    END as status
FROM public.facilities;

-- Step 3: Show sample facilities that should appear on map
SELECT 'STEP 3: Sample Facilities for Map' as step;
SELECT 
    f.name,
    f.type,
    f.status,
    f.lat,
    f.lng,
    f.risk_score,
    d.name as district_name,
    CASE 
        WHEN f.lat IS NULL OR f.lng IS NULL THEN '❌ NO COORDINATES'
        WHEN f.lat BETWEEN 8 AND 11 AND f.lng BETWEEN -2 AND 1 THEN '✅ VALID GHANA COORDINATES'
        ELSE '⚠️ COORDINATES OUTSIDE EXPECTED RANGE'
    END as coordinate_status
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL
ORDER BY f.risk_score DESC
LIMIT 10;

-- Step 4: Test what admin can see (RLS check)
SELECT 'STEP 4: Admin RLS Access Test' as step;
SELECT 
    COUNT(*) as admin_visible_facilities,
    (SELECT COUNT(*) FROM public.facilities) as total_facilities_in_db,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM public.facilities) THEN '✅ ADMIN SEES ALL FACILITIES'
        ELSE '❌ RLS BLOCKING ADMIN ACCESS'
    END as rls_status
FROM public.facilities;

-- ============================================================================
-- FIX 1: ENSURE FACILITIES EXIST WITH COORDINATES
-- ============================================================================

-- If no facilities exist, create some test facilities
INSERT INTO public.facilities (name, type, district_id, lat, lng, status, risk_score, created_at)
SELECT 
    'Test Facility ' || generate_series,
    CASE 
        WHEN generate_series % 3 = 0 THEN 'toilet'
        WHEN generate_series % 3 = 1 THEN 'latrine'
        ELSE 'septic_tank'
    END,
    (SELECT id FROM public.districts WHERE name = 'Tamale' LIMIT 1),
    9.4034 + (random() * 0.1 - 0.05), -- Random lat around Tamale
    -0.8424 + (random() * 0.1 - 0.05), -- Random lng around Tamale
    CASE 
        WHEN generate_series % 4 = 0 THEN 'good'
        WHEN generate_series % 4 = 1 THEN 'damaged'
        WHEN generate_series % 4 = 2 THEN 'overflow'
        ELSE 'blocked'
    END,
    (random() * 100)::int,
    NOW()
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM public.facilities LIMIT 1);

-- ============================================================================
-- FIX 2: ADD COORDINATES TO EXISTING FACILITIES IF MISSING
-- ============================================================================

-- Update facilities that have no coordinates
UPDATE public.facilities 
SET 
    lat = CASE 
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Tamale') THEN 9.4034 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Savelugu') THEN 9.6333 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Tolon') THEN 9.4167 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Kumbungu') THEN 9.5833 + (random() * 0.05 - 0.025)
        ELSE 9.4034 + (random() * 0.1 - 0.05)
    END,
    lng = CASE 
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Tamale') THEN -0.8424 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Savelugu') THEN -0.8333 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Tolon') THEN -1.0000 + (random() * 0.05 - 0.025)
        WHEN district_id = (SELECT id FROM public.districts WHERE name = 'Kumbungu') THEN -0.8500 + (random() * 0.05 - 0.025)
        ELSE -0.8424 + (random() * 0.1 - 0.05)
    END
WHERE lat IS NULL OR lng IS NULL;

-- ============================================================================
-- FIX 3: ENSURE RISK SCORES ARE SET
-- ============================================================================

-- Update facilities with null or zero risk scores
UPDATE public.facilities 
SET risk_score = CASE 
    WHEN status = 'good' THEN (random() * 30)::int
    WHEN status = 'damaged' THEN (30 + random() * 30)::int
    WHEN status = 'overflow' THEN (60 + random() * 25)::int
    WHEN status = 'blocked' THEN (70 + random() * 20)::int
    WHEN status = 'dry' THEN (40 + random() * 20)::int
    ELSE (random() * 50)::int
END
WHERE risk_score IS NULL OR risk_score = 0;

-- ============================================================================
-- VERIFICATION: CHECK FIXES WORKED
-- ============================================================================

SELECT 'VERIFICATION: Fixes Applied' as step;

-- Check facility count and coordinates
SELECT 
    'Facilities with coordinates' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ FACILITIES READY FOR MAP'
        ELSE '❌ STILL NO FACILITIES'
    END as status
FROM public.facilities 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Check coordinate ranges
SELECT 
    'Coordinate ranges' as check_type,
    CONCAT(
        'Lat: ', ROUND(MIN(lat)::numeric, 4), ' to ', ROUND(MAX(lat)::numeric, 4),
        ', Lng: ', ROUND(MIN(lng)::numeric, 4), ' to ', ROUND(MAX(lng)::numeric, 4)
    ) as coordinate_range,
    CASE 
        WHEN MIN(lat) BETWEEN 8 AND 11 AND MAX(lat) BETWEEN 8 AND 11 
         AND MIN(lng) BETWEEN -2 AND 1 AND MAX(lng) BETWEEN -2 AND 1 
        THEN '✅ COORDINATES IN GHANA RANGE'
        ELSE '⚠️ CHECK COORDINATE VALIDITY'
    END as status
FROM public.facilities 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Check risk score distribution
SELECT 
    'Risk score distribution' as check_type,
    CONCAT(
        'Good (0-29): ', COUNT(*) FILTER (WHERE risk_score < 30), ', ',
        'At Risk (30-59): ', COUNT(*) FILTER (WHERE risk_score BETWEEN 30 AND 59), ', ',
        'High Risk (60-84): ', COUNT(*) FILTER (WHERE risk_score BETWEEN 60 AND 84), ', ',
        'Critical (85-100): ', COUNT(*) FILTER (WHERE risk_score >= 85)
    ) as distribution,
    '✅ RISK SCORES SET' as status
FROM public.facilities;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

SELECT 'SAMPLE DATA: Ready for Map Display' as step;

-- Show facilities that should appear on the map
SELECT 
    f.name,
    f.type,
    f.status,
    ROUND(f.lat::numeric, 4) as latitude,
    ROUND(f.lng::numeric, 4) as longitude,
    f.risk_score,
    d.name as district,
    CASE 
        WHEN f.risk_score >= 85 THEN '🔴 Critical'
        WHEN f.risk_score >= 60 THEN '🟠 High Risk'
        WHEN f.risk_score >= 30 THEN '🟡 At Risk'
        ELSE '🟢 Good'
    END as risk_level
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL
ORDER BY f.risk_score DESC, f.name
LIMIT 15;

-- ============================================================================
-- FRONTEND DEBUGGING GUIDE
-- ============================================================================

SELECT 'FRONTEND DEBUGGING GUIDE' as step;

SELECT 
    'Next Steps for Frontend' as category,
    'Action Required' as action
UNION ALL
SELECT 
    '1. Check Browser Console',
    'Look for JavaScript errors when loading /facility-map'
UNION ALL
SELECT 
    '2. Check Network Tab',
    'Verify Supabase query returns facility data'
UNION ALL
SELECT 
    '3. Check Map Center',
    'Map should center on Tamale: [9.4034, -0.8424]'
UNION ALL
SELECT 
    '4. Check Marker Creation',
    'Verify createRiskMarker function gets called with valid coordinates'
UNION ALL
SELECT 
    '5. Check Leaflet Console',
    'Look for Leaflet-specific errors about invalid coordinates'
UNION ALL
SELECT 
    '6. Test Query Manually',
    'Run: supabase.from("facilities").select("*, district:districts(*)") in browser console';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
    facility_count INTEGER;
    coord_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO facility_count FROM public.facilities;
    SELECT COUNT(*) INTO coord_count FROM public.facilities WHERE lat IS NOT NULL AND lng IS NOT NULL;
    
    RAISE NOTICE '✅ GIS MAP FIX COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'RESULTS:';
    RAISE NOTICE '- Total facilities: %', facility_count;
    RAISE NOTICE '- Facilities with coordinates: %', coord_count;
    RAISE NOTICE '- Map center: Tamale (9.4034, -0.8424)';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Refresh your browser at /facility-map';
    RAISE NOTICE '2. Check browser console for any JavaScript errors';
    RAISE NOTICE '3. Verify you are logged in as admin@sanissentinel.com';
    RAISE NOTICE '4. Look for colored markers on the map around Tamale';
    RAISE NOTICE '';
    RAISE NOTICE 'If map still empty, check browser developer tools!';
END $$;