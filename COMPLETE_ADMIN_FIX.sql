-- ============================================================================
-- COMPLETE ADMIN DASHBOARD FIX
-- This script diagnoses and fixes all admin dashboard visibility issues
-- ============================================================================

-- Step 1: Check current authentication status
SELECT '🔍 STEP 1: Authentication Diagnosis' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', '❌ NOT LOGGED IN') as current_user,
    COALESCE(auth.jwt() ->> 'user_metadata', '❌ NO METADATA') as user_metadata,
    public.get_user_role() as user_role,
    public.get_user_district_id() as user_district_id,
    public.is_admin() as is_admin,
    CASE 
        WHEN auth.jwt() ->> 'email' IS NULL THEN '❌ NOT AUTHENTICATED - Go to /login'
        WHEN public.get_user_role() != 'system_admin' THEN '❌ WRONG ROLE - Should be system_admin'
        WHEN NOT public.is_admin() THEN '❌ NOT ADMIN - Check user metadata'
        ELSE '✅ ADMIN AUTHENTICATED CORRECTLY'
    END as auth_status;

-- Step 2: Check if data exists in database
SELECT '📊 STEP 2: Database Content Check' as step;
SELECT 
    'facilities' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as with_coordinates,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO DATA - Run facility seeding migration'
        WHEN COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) = 0 THEN '❌ NO COORDINATES'
        ELSE '✅ HAS DATA WITH COORDINATES'
    END as status
FROM public.facilities
UNION ALL
SELECT 
    'reports' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) as with_coordinates,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO REPORTS'
        ELSE '✅ HAS REPORTS'
    END as status
FROM public.reports
UNION ALL
SELECT 
    'alerts' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) as with_coordinates,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO ALERTS'
        ELSE '✅ HAS ALERTS'
    END as status
FROM public.alerts;

-- Step 3: Test RLS policies for admin
SELECT '🔒 STEP 3: RLS Policy Test for Admin' as step;
SELECT * FROM public.rls_policy_test;

-- Step 4: Check if Tamale district exists
SELECT '🏛️ STEP 4: District Check' as step;
SELECT 
    id,
    name,
    region,
    CASE 
        WHEN name = 'Tamale' THEN '✅ TAMALE DISTRICT EXISTS'
        ELSE '✅ OTHER DISTRICT'
    END as status
FROM public.districts 
ORDER BY name;

-- ============================================================================
-- FIX 1: ENSURE ADMIN USER HAS CORRECT METADATA
-- ============================================================================

-- Update admin user metadata if needed
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'system_admin',
    'name', 'System Administrator',
    'district_id', (SELECT id FROM public.districts WHERE name = 'Tamale' LIMIT 1),
    'department', 'IT Administration',
    'permissions', '["all"]'::jsonb,
    'title', 'System Administrator'
)
WHERE email = 'admin@sanissentinel.com'
  AND (
    raw_user_meta_data ->> 'role' != 'system_admin' OR
    raw_user_meta_data ->> 'role' IS NULL
  );

-- ============================================================================
-- FIX 2: CREATE DISTRICTS IF MISSING
-- ============================================================================

-- Insert Tamale and surrounding districts if they don't exist
INSERT INTO public.districts (name, region, population, area_km2) VALUES
    ('Tamale', 'Northern Region', 371351, 750.0),
    ('Savelugu', 'Northern Region', 129210, 1390.0),
    ('Tolon', 'Northern Region', 71840, 2846.0),
    ('Kumbungu', 'Northern Region', 144749, 1883.0),
    ('Nanton', 'Northern Region', 79074, 2070.0)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIX 3: CREATE SAMPLE FACILITIES WITH COORDINATES
-- ============================================================================

-- Create sample facilities if none exist
INSERT INTO public.facilities (name, type, district_id, lat, lng, status, risk_score, created_at) VALUES
    -- Tamale facilities
    ('Tamale Central Market Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4034, -0.8424, 'good', 25, NOW()),
    ('Tamale Teaching Hospital Septic', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4089, -0.8456, 'good', 20, NOW()),
    ('Tamale Technical University Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.3876, -0.8234, 'damaged', 70, NOW()),
    ('Tamale Sports Stadium Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4156, -0.8567, 'good', 35, NOW()),
    ('Tamale Transport Terminal', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4201, -0.8389, 'overflow', 85, NOW()),
    
    -- Savelugu facilities
    ('Savelugu District Hospital', 'toilet', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6333, -0.8333, 'good', 30, NOW()),
    ('Savelugu Market Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6298, -0.8367, 'blocked', 75, NOW()),
    
    -- Tolon facilities
    ('Tolon District Assembly', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4167, -1.0000, 'good', 40, NOW()),
    ('Tolon School Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4234, -0.9876, 'overflow', 90, NOW()),
    
    -- Kumbungu facilities
    ('Kumbungu Hospital Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5833, -0.8500, 'good', 15, NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIX 4: CREATE SAMPLE REPORTS AND ALERTS
-- ============================================================================

-- Create sample reports if none exist
INSERT INTO public.reports (facility_id, reported_by, condition, notes, created_at) VALUES
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet' LIMIT 1), '+233241234567', 'good', 'Regular cleaning completed', NOW() - INTERVAL '1 day'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Transport Terminal' LIMIT 1), '+233241234568', 'overflow', 'Septic tank overflowing, needs attention', NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Market Latrine' LIMIT 1), '+233241234569', 'blocked', 'Drainage blocked after rain', NOW() - INTERVAL '6 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon School Latrine' LIMIT 1), '+233241234570', 'overflow', 'School latrine overflowing', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- Create sample alerts if none exist
INSERT INTO public.alerts (facility_id, alert_type, severity, message, resolved, created_at) VALUES
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Transport Terminal' LIMIT 1), 'overflow_detected', 'critical', 'Critical overflow at transport terminal', FALSE, NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon School Latrine' LIMIT 1), 'overflow_detected', 'high', 'School latrine overflow affecting students', FALSE, NOW() - INTERVAL '4 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Market Latrine' LIMIT 1), 'high_risk', 'high', 'Market latrine blocked and high risk', FALSE, NOW() - INTERVAL '6 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Technical University Latrine' LIMIT 1), 'high_risk', 'medium', 'University latrine needs maintenance', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION: CHECK ALL FIXES WORKED
-- ============================================================================

SELECT '✅ VERIFICATION: Post-Fix Status' as step;

-- Check authentication again
SELECT 
    'Authentication' as check_type,
    COALESCE(auth.jwt() ->> 'email', 'NOT LOGGED IN') as current_user,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin,
    CASE 
        WHEN public.is_admin() THEN '✅ ADMIN ACCESS CONFIRMED'
        ELSE '❌ STILL NOT ADMIN'
    END as status;

-- Check data counts
SELECT 
    'Data Counts' as check_type,
    CONCAT(
        'Facilities: ', (SELECT COUNT(*) FROM public.facilities), ', ',
        'With Coords: ', (SELECT COUNT(*) FROM public.facilities WHERE lat IS NOT NULL AND lng IS NOT NULL), ', ',
        'Reports: ', (SELECT COUNT(*) FROM public.reports), ', ',
        'Alerts: ', (SELECT COUNT(*) FROM public.alerts)
    ) as counts,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.facilities WHERE lat IS NOT NULL AND lng IS NOT NULL) > 0 THEN '✅ DATA READY FOR MAP'
        ELSE '❌ STILL NO COORDINATE DATA'
    END as status;

-- Check RLS access
SELECT 
    'RLS Access' as check_type,
    CONCAT('Admin sees ', COUNT(*), ' facilities') as admin_access,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ADMIN CAN SEE FACILITIES'
        ELSE '❌ RLS STILL BLOCKING ADMIN'
    END as status
FROM public.facilities;

-- ============================================================================
-- SAMPLE DATA FOR MAP TESTING
-- ============================================================================

SELECT '🗺️ SAMPLE DATA: Ready for Map Display' as step;

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
LIMIT 10;

-- ============================================================================
-- FRONTEND DEBUGGING INSTRUCTIONS
-- ============================================================================

SELECT '🔧 FRONTEND DEBUGGING STEPS' as step;

SELECT 
    'Next Steps' as category,
    'Action Required' as action
UNION ALL
SELECT 
    '1. Refresh Browser',
    'Go to /facility-map and hard refresh (Ctrl+F5)'
UNION ALL
SELECT 
    '2. Check Browser Console',
    'Look for JavaScript errors in developer tools'
UNION ALL
SELECT 
    '3. Check Network Tab',
    'Verify Supabase query returns facility data'
UNION ALL
SELECT 
    '4. Test Authentication',
    'Verify you are logged in as admin@sanissentinel.com'
UNION ALL
SELECT 
    '5. Test Manual Query',
    'Run: supabase.from("facilities").select("*") in browser console'
UNION ALL
SELECT 
    '6. Check Map Center',
    'Map should center on Tamale: [9.4034, -0.8424]';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
    facility_count INTEGER;
    coord_count INTEGER;
    report_count INTEGER;
    alert_count INTEGER;
    user_role TEXT;
    is_admin_user BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO facility_count FROM public.facilities;
    SELECT COUNT(*) INTO coord_count FROM public.facilities WHERE lat IS NOT NULL AND lng IS NOT NULL;
    SELECT COUNT(*) INTO report_count FROM public.reports;
    SELECT COUNT(*) INTO alert_count FROM public.alerts;
    SELECT public.get_user_role() INTO user_role;
    SELECT public.is_admin() INTO is_admin_user;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ADMIN DASHBOARD FIX COMPLETED!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DATA SUMMARY:';
    RAISE NOTICE '- Total facilities: %', facility_count;
    RAISE NOTICE '- Facilities with coordinates: %', coord_count;
    RAISE NOTICE '- Total reports: %', report_count;
    RAISE NOTICE '- Total alerts: %', alert_count;
    RAISE NOTICE '';
    RAISE NOTICE '👤 USER STATUS:';
    RAISE NOTICE '- Current user role: %', COALESCE(user_role, 'NOT AUTHENTICATED');
    RAISE NOTICE '- Is admin: %', CASE WHEN is_admin_user THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '';
    RAISE NOTICE '🗺️ MAP DETAILS:';
    RAISE NOTICE '- Map center: Tamale (9.4034, -0.8424)';
    RAISE NOTICE '- Zoom level: 9 (covers Tamale region)';
    RAISE NOTICE '- Markers: Risk-based colored markers with scores';
    RAISE NOTICE '';
    RAISE NOTICE '✅ NEXT STEPS:';
    RAISE NOTICE '1. Go to: http://localhost:5174/facility-map';
    RAISE NOTICE '2. Ensure you are logged in as admin@sanissentinel.com';
    RAISE NOTICE '3. You should see colored markers on the map';
    RAISE NOTICE '4. If map is still empty, check browser console for errors';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 TROUBLESHOOTING:';
    RAISE NOTICE '- If no markers: Check browser developer tools';
    RAISE NOTICE '- If authentication issues: Re-login at /login';
    RAISE NOTICE '- If data issues: Run this script again';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;