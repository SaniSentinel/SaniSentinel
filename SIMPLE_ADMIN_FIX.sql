-- ============================================================================
-- SIMPLE ADMIN FIX - Create test data for frontend display
-- ============================================================================

-- Step 1: Check current authentication
SELECT 'AUTHENTICATION CHECK' as step;
SELECT 
    COALESCE(auth.jwt() ->> 'email', 'NOT LOGGED IN') as current_user,
    public.get_user_role() as user_role,
    public.is_admin() as is_admin;

-- Step 2: Create Tamale district if missing
INSERT INTO public.districts (name, region, population, area_km2, lat, lng) VALUES
    ('Tamale', 'Northern Region', 371351, 750.0, 9.4034, -0.8424)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Create test facilities (will only insert if they don't exist)
INSERT INTO public.facilities (name, type, district_id, lat, lng, status, risk_score, created_at) VALUES
    ('Tamale Central Market Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4034, -0.8424, 'good', 25, NOW()),
    ('Tamale Teaching Hospital Septic', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4089, -0.8456, 'good', 20, NOW()),
    ('Tamale Technical University Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.3876, -0.8234, 'damaged', 70, NOW()),
    ('Tamale Sports Stadium Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4156, -0.8567, 'good', 35, NOW()),
    ('Tamale Transport Terminal', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4201, -0.8389, 'overflow', 85, NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 4: Create sample reports
INSERT INTO public.reports (facility_id, reported_by, condition, notes, created_at) VALUES
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet'), '+233241234567', 'good', 'Regular cleaning completed', NOW() - INTERVAL '1 day'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Transport Terminal'), '+233241234568', 'overflow', 'Septic tank overflowing', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Step 5: Create sample alerts
INSERT INTO public.alerts (facility_id, alert_type, severity, message, resolved, created_at) VALUES
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Transport Terminal'), 'overflow_detected', 'critical', 'Critical overflow at transport terminal', FALSE, NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Technical University Latrine'), 'high_risk', 'medium', 'University latrine needs maintenance', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Step 6: Verify data was created
SELECT 'DATA VERIFICATION' as step;
SELECT 
    COUNT(*) as total_facilities,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as facilities_with_coords,
    COUNT(*) FILTER (WHERE risk_score >= 85) as critical_facilities
FROM public.facilities;

-- Step 7: Show sample facilities for map
SELECT 'SAMPLE FACILITIES FOR MAP' as step;
SELECT 
    f.name,
    f.type,
    f.status,
    f.lat,
    f.lng,
    f.risk_score,
    d.name as district_name
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL
ORDER BY f.risk_score DESC
LIMIT 10;

-- Step 8: Test RLS policies
SELECT 'RLS POLICY TEST' as step;
SELECT * FROM public.rls_policy_test;

-- Success message
SELECT 'SUCCESS' as step;
SELECT 
    'Admin dashboard data created successfully!' as message,
    'Go to /admin/gis-map to see the facilities on the map' as next_step;