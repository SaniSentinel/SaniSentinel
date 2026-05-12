-- ============================================================================
-- DIAGNOSE GIS MAP ISSUE - Why facilities aren't showing on map
-- Run this to check facility data and coordinates
-- ============================================================================

-- Step 1: Check current user authentication
SELECT 'STEP 1: Authentication Check' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'Anonymous') as current_user,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin,
    CASE 
        WHEN public.is_admin() THEN '✅ Admin - Should see ALL facilities'
        ELSE '⚠️ Not admin - Limited access'
    END as access_level;

-- Step 2: Check total facilities in database
SELECT 'STEP 2: Total Facilities Count' as step;
SELECT 
    COUNT(*) as total_facilities,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO FACILITIES - Need to create facilities'
        WHEN COUNT(*) < 5 THEN '⚠️ FEW FACILITIES - May need more test data'
        ELSE '✅ GOOD - Has facilities'
    END as status
FROM public.facilities;

-- Step 3: Check facilities with coordinates
SELECT 'STEP 3: Facilities with Coordinates' as step;
SELECT 
    COUNT(*) as facilities_with_coords,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as valid_coords,
    COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) as missing_coords,
    CASE 
        WHEN COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) = 0 THEN '❌ NO COORDINATES - Facilities missing lat/lng'
        WHEN COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) > 0 THEN '⚠️ SOME MISSING - Some facilities need coordinates'
        ELSE '✅ ALL GOOD - All facilities have coordinates'
    END as coordinate_status
FROM public.facilities;

-- Step 4: Check facilities by district
SELECT 'STEP 4: Facilities by District' as step;
SELECT 
    d.name as district_name,
    d.region,
    COUNT(f.id) as facility_count,
    COUNT(f.id) FILTER (WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL) as facilities_with_coords,
    CASE 
        WHEN COUNT(f.id) = 0 THEN '❌ NO FACILITIES'
        WHEN COUNT(f.id) FILTER (WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL) = 0 THEN '❌ NO COORDINATES'
        ELSE '✅ HAS MAPPED FACILITIES'
    END as map_status
FROM public.districts d
LEFT JOIN public.facilities f ON d.id = f.district_id
GROUP BY d.id, d.name, d.region
ORDER BY facility_count DESC;

-- Step 5: Sample facility data with coordinates
SELECT 'STEP 5: Sample Facility Data' as step;
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
        WHEN f.lat IS NULL OR f.lng IS NULL THEN '❌ MISSING COORDINATES'
        WHEN f.lat = 0 OR f.lng = 0 THEN '⚠️ INVALID COORDINATES (0,0)'
        ELSE '✅ HAS COORDINATES'
    END as coordinate_status
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
ORDER BY f.created_at DESC
LIMIT 10;

-- Step 6: Check coordinate ranges (should be in Ghana)
SELECT 'STEP 6: Coordinate Range Check' as step;
SELECT 
    MIN(lat) as min_latitude,
    MAX(lat) as max_latitude,
    MIN(lng) as min_longitude,
    MAX(lng) as max_longitude,
    COUNT(*) as facilities_checked,
    CASE 
        WHEN MIN(lat) BETWEEN 4 AND 12 AND MAX(lat) BETWEEN 4 AND 12 
         AND MIN(lng) BETWEEN -4 AND 2 AND MAX(lng) BETWEEN -4 AND 2 
        THEN '✅ COORDINATES IN GHANA RANGE'
        WHEN MIN(lat) IS NULL THEN '❌ NO COORDINATES'
        ELSE '⚠️ COORDINATES MAY BE OUTSIDE GHANA'
    END as location_status
FROM public.facilities
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Step 7: Check what current user can see (RLS test)
SELECT 'STEP 7: RLS Policy Test for Facilities' as step;
SELECT 
    COUNT(*) as visible_facilities,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin,
    CASE 
        WHEN public.is_admin() AND COUNT(*) = (SELECT COUNT(*) FROM public.facilities) THEN '✅ ADMIN SEES ALL FACILITIES'
        WHEN public.is_admin() AND COUNT(*) < (SELECT COUNT(*) FROM public.facilities) THEN '❌ ADMIN NOT SEEING ALL - RLS ISSUE'
        WHEN NOT public.is_admin() THEN '⚠️ NON-ADMIN - LIMITED VIEW EXPECTED'
        ELSE '✅ ACCESS WORKING CORRECTLY'
    END as rls_status
FROM public.facilities;

-- Step 8: Check recent reports and alerts (for facility status)
SELECT 'STEP 8: Recent Activity Check' as step;
SELECT 
    'reports' as data_type,
    COUNT(*) as count,
    MAX(created_at) as latest_entry
FROM public.reports
UNION ALL
SELECT 
    'alerts' as data_type,
    COUNT(*) as count,
    MAX(created_at) as latest_entry
FROM public.alerts
UNION ALL
SELECT 
    'maintenance_tasks' as data_type,
    COUNT(*) as count,
    MAX(created_at) as latest_entry
FROM public.maintenance_tasks;

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================

SELECT 'DIAGNOSTIC SUMMARY' as section;

WITH facility_stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as with_coords,
        COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL) as missing_coords
    FROM public.facilities
)
SELECT 
    'Facility Map Issue Diagnosis' as diagnosis,
    CASE 
        WHEN (SELECT total FROM facility_stats) = 0 THEN 
            '❌ NO FACILITIES EXIST - Run facility seeding migration'
        WHEN (SELECT with_coords FROM facility_stats) = 0 THEN 
            '❌ NO COORDINATES - Facilities exist but have no lat/lng values'
        WHEN (SELECT missing_coords FROM facility_stats) > 0 THEN 
            '⚠️ PARTIAL COORDINATES - Some facilities missing lat/lng'
        WHEN NOT public.is_admin() THEN 
            '⚠️ ACCESS RESTRICTED - User may not see all facilities due to RLS'
        ELSE 
            '✅ DATA LOOKS GOOD - Check frontend map component'
    END as likely_issue,
    CASE 
        WHEN (SELECT total FROM facility_stats) = 0 THEN 
            'Run: database/migrations/010_seed_tamale_facilities.sql'
        WHEN (SELECT with_coords FROM facility_stats) = 0 THEN 
            'Add lat/lng coordinates to facilities table'
        WHEN (SELECT missing_coords FROM facility_stats) > 0 THEN 
            'Update facilities with missing coordinates'
        ELSE 
            'Check browser console for JavaScript errors'
    END as suggested_fix;

-- ============================================================================
-- QUICK FIXES
-- ============================================================================

SELECT 'QUICK FIXES' as section;

-- Show SQL to add coordinates to facilities if missing
SELECT 
    'Add Coordinates to Tamale Facilities' as fix_title,
    'UPDATE public.facilities SET lat = 9.4034 + (random() * 0.1 - 0.05), lng = -0.8424 + (random() * 0.1 - 0.05) WHERE lat IS NULL OR lng IS NULL;' as sql_command
WHERE EXISTS (SELECT 1 FROM public.facilities WHERE lat IS NULL OR lng IS NULL);

-- Show SQL to create test facilities if none exist
SELECT 
    'Create Test Facilities' as fix_title,
    'Run the facility seeding migration: database/migrations/010_seed_tamale_facilities.sql' as instruction
WHERE NOT EXISTS (SELECT 1 FROM public.facilities);

-- ============================================================================
-- FRONTEND DEBUGGING TIPS
-- ============================================================================

SELECT 'FRONTEND DEBUGGING TIPS' as section;

SELECT 
    'Check Browser Console' as tip,
    'Look for JavaScript errors when loading the map page' as description
UNION ALL
SELECT 
    'Check Network Tab' as tip,
    'Verify the Supabase query is returning facility data' as description
UNION ALL
SELECT 
    'Check Map Center' as tip,
    'Map is centered on Tamale (9.4034, -0.8424) - facilities should be nearby' as description
UNION ALL
SELECT 
    'Check Leaflet Markers' as tip,
    'Verify markers are being created with valid coordinates' as description;