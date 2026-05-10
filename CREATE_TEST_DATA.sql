-- ============================================================================
-- CREATE TEST DATA FOR ADMIN DASHBOARD
-- Run this script to create test data if your dashboard is empty
-- ============================================================================

-- First, let's check what data already exists
SELECT 'Current Data Status' as section;

SELECT 
    'districts' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN 'NEEDS DATA' ELSE 'HAS DATA' END as status
FROM public.districts
UNION ALL
SELECT 
    'facilities' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN 'NEEDS DATA' ELSE 'HAS DATA' END as status
FROM public.facilities
UNION ALL
SELECT 
    'reports' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN 'NEEDS DATA' ELSE 'HAS DATA' END as status
FROM public.reports
UNION ALL
SELECT 
    'alerts' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN 'NEEDS DATA' ELSE 'HAS DATA' END as status
FROM public.alerts;

-- ============================================================================
-- CREATE TEST REPORTS (if none exist)
-- ============================================================================

-- Create test reports for existing facilities
INSERT INTO public.reports (facility_id, report_type, status, description, reported_by_phone, created_at)
SELECT 
    f.id,
    CASE 
        WHEN random() < 0.3 THEN 'maintenance_needed'
        WHEN random() < 0.6 THEN 'cleanliness_issue'
        ELSE 'operational_status'
    END,
    CASE 
        WHEN random() < 0.4 THEN 'open'
        WHEN random() < 0.7 THEN 'in_progress'
        ELSE 'resolved'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'Toilet facilities need cleaning and maintenance'
        WHEN random() < 0.6 THEN 'Water supply issues reported by users'
        ELSE 'Regular operational status check'
    END,
    '+233241234' || LPAD((random() * 1000)::int::text, 3, '0'),
    NOW() - (random() * interval '30 days')
FROM public.facilities f
WHERE NOT EXISTS (SELECT 1 FROM public.reports WHERE facility_id = f.id)
LIMIT 20;

-- ============================================================================
-- CREATE TEST ALERTS (if none exist)
-- ============================================================================

-- Create test alerts for existing facilities
INSERT INTO public.alerts (facility_id, alert_type, severity, status, message, created_at)
SELECT 
    f.id,
    CASE 
        WHEN random() < 0.3 THEN 'maintenance_overdue'
        WHEN random() < 0.6 THEN 'high_usage'
        ELSE 'cleanliness_alert'
    END,
    CASE 
        WHEN random() < 0.2 THEN 'high'
        WHEN random() < 0.6 THEN 'medium'
        ELSE 'low'
    END,
    CASE 
        WHEN random() < 0.5 THEN 'active'
        ELSE 'resolved'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'Facility requires immediate maintenance attention'
        WHEN random() < 0.6 THEN 'High usage detected - monitor closely'
        ELSE 'Cleanliness standards need improvement'
    END,
    NOW() - (random() * interval '7 days')
FROM public.facilities f
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE facility_id = f.id)
LIMIT 15;

-- ============================================================================
-- CREATE TEST MAINTENANCE TASKS (if none exist)
-- ============================================================================

-- Create test maintenance tasks
INSERT INTO public.maintenance_tasks (facility_id, task_type, priority, status, description, assigned_to, created_at)
SELECT 
    f.id,
    CASE 
        WHEN random() < 0.3 THEN 'cleaning'
        WHEN random() < 0.6 THEN 'repair'
        ELSE 'inspection'
    END,
    CASE 
        WHEN random() < 0.2 THEN 'high'
        WHEN random() < 0.6 THEN 'medium'
        ELSE 'low'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'pending'
        WHEN random() < 0.6 THEN 'in_progress'
        ELSE 'completed'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'Deep cleaning and sanitization required'
        WHEN random() < 0.6 THEN 'Repair broken fixtures and plumbing'
        ELSE 'Routine inspection and maintenance check'
    END,
    (SELECT id FROM public.workers WHERE district_id = f.district_id ORDER BY random() LIMIT 1),
    NOW() - (random() * interval '14 days')
FROM public.facilities f
WHERE NOT EXISTS (SELECT 1 FROM public.maintenance_tasks WHERE facility_id = f.id)
LIMIT 25;

-- ============================================================================
-- CREATE TEST CLIMATE DATA (if none exist)
-- ============================================================================

-- Create test climate snapshots for districts
INSERT INTO public.climate_snapshots (district_id, temperature, humidity, rainfall, wind_speed, created_at)
SELECT 
    d.id,
    20 + (random() * 15)::numeric(5,2), -- Temperature 20-35°C
    40 + (random() * 40)::numeric(5,2), -- Humidity 40-80%
    (random() * 50)::numeric(5,2),      -- Rainfall 0-50mm
    (random() * 20)::numeric(5,2),      -- Wind speed 0-20 km/h
    NOW() - (random() * interval '7 days')
FROM public.districts d
WHERE NOT EXISTS (SELECT 1 FROM public.climate_snapshots WHERE district_id = d.id)
LIMIT 10;

-- ============================================================================
-- VERIFY TEST DATA CREATION
-- ============================================================================

SELECT 'Test Data Creation Results' as section;

SELECT 
    'districts' as table_name, 
    COUNT(*) as total_count
FROM public.districts
UNION ALL
SELECT 
    'facilities' as table_name, 
    COUNT(*) as total_count
FROM public.facilities
UNION ALL
SELECT 
    'reports' as table_name, 
    COUNT(*) as total_count
FROM public.reports
UNION ALL
SELECT 
    'alerts' as table_name, 
    COUNT(*) as total_count
FROM public.alerts
UNION ALL
SELECT 
    'maintenance_tasks' as table_name, 
    COUNT(*) as total_count
FROM public.maintenance_tasks
UNION ALL
SELECT 
    'climate_snapshots' as table_name, 
    COUNT(*) as total_count
FROM public.climate_snapshots
UNION ALL
SELECT 
    'workers' as table_name, 
    COUNT(*) as total_count
FROM public.workers;

-- ============================================================================
-- SAMPLE DATA PREVIEW
-- ============================================================================

SELECT 'Sample Reports Created' as section;
SELECT 
    r.report_type,
    r.status,
    f.name as facility_name,
    d.name as district_name,
    r.created_at
FROM public.reports r
JOIN public.facilities f ON r.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
ORDER BY r.created_at DESC
LIMIT 5;

SELECT 'Sample Alerts Created' as section;
SELECT 
    a.alert_type,
    a.severity,
    a.status,
    f.name as facility_name,
    d.name as district_name,
    a.created_at
FROM public.alerts a
JOIN public.facilities f ON a.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
ORDER BY a.created_at DESC
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Test Data Creation Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created test data for:';
    RAISE NOTICE '- Reports: Sample maintenance and operational reports';
    RAISE NOTICE '- Alerts: Various severity alerts for facilities';
    RAISE NOTICE '- Maintenance Tasks: Cleaning, repair, and inspection tasks';
    RAISE NOTICE '- Climate Data: Weather snapshots for districts';
    RAISE NOTICE '';
    RAISE NOTICE 'Your admin dashboard should now show data!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Refresh your dashboard';
    RAISE NOTICE '2. Check that you are logged in as admin@sanissentinel.com';
    RAISE NOTICE '3. Verify user metadata is set correctly';
END $$;