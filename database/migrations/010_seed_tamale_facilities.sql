-- Seed database with 10-15 sample facilities across Tamale and surrounding districts
-- This provides realistic test data for development and demonstration

-- =============================================================================
-- SEED FACILITIES DATA
-- =============================================================================

-- Insert comprehensive facilities data for Tamale and surrounding districts
INSERT INTO public.facilities (name, type, district_id, lat, lng, last_serviced, status, risk_score) VALUES
    -- TAMALE DISTRICT FACILITIES (Main urban center)
    ('Tamale Central Market Public Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4034, -0.8424, '2024-02-10', 'good', 25),
    ('Tamale Teaching Hospital Septic System', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4089, -0.8456, '2024-02-05', 'good', 20),
    ('Tamale Technical University Latrine Block', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.3876, -0.8234, '2023-12-15', 'damaged', 70),
    ('Tamale Sports Stadium Toilet Complex', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4156, -0.8567, '2024-01-20', 'good', 35),
    ('Tamale Intercity Transport Terminal', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4201, -0.8389, '2024-02-12', 'overflow', 85),
    
    -- SAVELUGU DISTRICT FACILITIES (North of Tamale)
    ('Savelugu District Hospital Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6333, -0.8333, '2024-02-08', 'good', 30),
    ('Savelugu Market Latrine Complex', 'latrine', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6298, -0.8367, '2024-01-25', 'blocked', 75),
    ('Savelugu Senior High School Block', 'latrine', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6401, -0.8289, '2023-11-30', 'dry', 60),
    
    -- TOLON DISTRICT FACILITIES (West of Tamale)
    ('Tolon District Assembly Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4167, -1.0000, '2024-02-01', 'good', 40),
    ('Tolon Community Day School Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4234, -0.9876, '2023-12-28', 'overflow', 90),
    ('Tolon Health Center Septic Tank', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4089, -1.0123, '2024-01-15', 'good', 45),
    
    -- KUMBUNGU DISTRICT FACILITIES (South of Tamale)
    ('Kumbungu District Hospital Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5833, -0.8500, '2024-02-14', 'good', 15),
    ('Kumbungu Market Waste Collection Point', 'waste_collection_point', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5789, -0.8534, '2024-02-10', 'good', 25),
    ('Kumbungu Technical Institute Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5901, -0.8467, '2024-01-08', 'damaged', 65),
    
    -- NANTON DISTRICT FACILITIES (Southwest of Tamale)
    ('Nanton District Assembly Complex', 'toilet', (SELECT id FROM public.districts WHERE name = 'Nanton'), 9.4000, -1.0833, '2024-01-30', 'good', 35);

-- =============================================================================
-- SEED REPORTS DATA
-- =============================================================================

-- Insert realistic reports for the seeded facilities
INSERT INTO public.reports (facility_id, reported_by, condition, notes, created_at) VALUES
    -- Recent reports (last 3 days)
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Public Toilet'), '+233241234567', 'good', 'Regular cleaning completed, all systems functioning well', '2024-02-16 08:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Intercity Transport Terminal'), '+233241234568', 'overflow', 'Septic tank overflowing, immediate attention needed', '2024-02-16 14:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon Community Day School Latrine'), '+233241234590', 'overflow', 'Pit latrine overflowing after heavy rains', '2024-02-15 16:45:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Market Latrine Complex'), '+233241234588', 'blocked', 'Drainage system blocked, water not flowing', '2024-02-15 11:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Technical University Latrine Block'), '+233241234567', 'damaged', 'Roof damaged from recent storm, needs repair', '2024-02-14 09:15:00+00'),
    
    -- Older reports for trend analysis
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu District Hospital Toilet'), '+233241234588', 'good', 'Weekly maintenance check completed', '2024-02-10 14:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu District Hospital Toilet'), '+233241234592', 'good', 'Hospital staff report all systems operational', '2024-02-09 10:15:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Sports Stadium Toilet Complex'), '+233241234567', 'good', 'Pre-event cleaning and inspection completed', '2024-02-08 16:45:00+00'),
    
    -- Follow-up improvement reports
    ((SELECT id FROM public.facilities WHERE name = 'Tolon District Assembly Toilet'), '+233241234590', 'good', 'Maintenance completed, facility fully operational', '2024-02-12 08:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu Market Waste Collection Point'), '+233241234592', 'good', 'Collection completed, area cleaned', '2024-02-11 07:30:00+00');

-- =============================================================================
-- SEED ALERTS DATA
-- =============================================================================

-- Insert alerts based on facility conditions
INSERT INTO public.alerts (facility_id, alert_type, severity, message, resolved, created_at) VALUES
    -- Active critical alerts
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Intercity Transport Terminal'), 'overflow_detected', 'critical', 'Critical overflow at Tamale Intercity Transport Terminal. Immediate cleanup and repair required.', FALSE, '2024-02-16 14:25:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon Community Day School Latrine'), 'overflow_detected', 'high', 'School latrine overflowing in Tolon. Students health at risk, urgent action needed.', FALSE, '2024-02-15 16:50:00+00'),
    
    -- Active high priority alerts
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Market Latrine Complex'), 'high_risk', 'high', 'Savelugu Market latrine blocked and at high risk. Market operations may be affected.', FALSE, '2024-02-15 11:25:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Technical University Latrine Block'), 'high_risk', 'high', 'University latrine damaged from storm. Student facilities compromised.', FALSE, '2024-02-14 09:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu Technical Institute Latrine'), 'high_risk', 'medium', 'Technical institute latrine showing signs of damage. Preventive maintenance recommended.', FALSE, '2024-02-13 15:30:00+00'),
    
    -- Resolved alerts (showing system effectiveness)
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Senior High School Block'), 'maintenance_due', 'medium', 'School latrine was overdue for maintenance.', TRUE, '2024-02-10 12:00:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon Health Center Septic Tank'), 'high_risk', 'medium', 'Health center septic tank was showing early warning signs.', TRUE, '2024-02-08 14:15:00+00'),
    
    -- Climate-related alerts
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Public Toilet'), 'climate_warning', 'medium', 'Heavy rainfall predicted in Tamale area. Monitor drainage systems.', TRUE, '2024-02-12 06:00:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Nanton District Assembly Complex'), 'climate_warning', 'low', 'Seasonal weather monitoring for Nanton district facilities.', FALSE, '2024-02-14 06:00:00+00');

-- =============================================================================
-- SEED MAINTENANCE TASKS DATA
-- =============================================================================

-- Insert maintenance tasks for the facilities
INSERT INTO public.maintenance_tasks (facility_id, assigned_to, status, priority, task_type, description, due_date, created_at) VALUES
    -- Urgent tasks for critical facilities
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Intercity Transport Terminal'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234569'), 
     'assigned', 'urgent', 'emptying', 
     'Emergency septic tank emptying and overflow cleanup at transport terminal', 
     '2024-02-17', '2024-02-16 14:30:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Tolon Community Day School Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234591'), 
     'in_progress', 'urgent', 'emptying', 
     'School latrine pit emptying and drainage repair', 
     '2024-02-18', '2024-02-15 17:00:00+00'),
    
    -- High priority repair tasks
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Technical University Latrine Block'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234569'), 
     'assigned', 'high', 'repair', 
     'Storm damage repair - roof and structural fixes needed', 
     '2024-02-20', '2024-02-14 09:30:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Market Latrine Complex'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234589'), 
     'assigned', 'high', 'repair', 
     'Drainage system unblocking and pipe repair', 
     '2024-02-19', '2024-02-15 11:30:00+00'),
    
    -- Medium priority routine maintenance
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu Technical Institute Latrine'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234593'), 
     'pending', 'medium', 'preventive_maintenance', 
     'Preventive maintenance to address early damage signs', 
     '2024-02-22', '2024-02-13 15:45:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Senior High School Block'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234589'), 
     'assigned', 'medium', 'routine_cleaning', 
     'Overdue routine cleaning and supply restocking', 
     '2024-02-21', '2024-02-10 12:15:00+00'),
    
    -- Completed tasks (showing system working)
    ((SELECT id FROM public.facilities WHERE name = 'Tolon District Assembly Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234591'), 
     'completed', 'medium', 'routine_cleaning', 
     'Regular maintenance and cleaning completed', 
     '2024-02-12', '2024-02-08 10:00:00+00'),
    
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu District Hospital Toilet'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234593'), 
     'completed', 'low', 'inspection', 
     'Monthly health and safety inspection', 
     '2024-02-14', '2024-02-09 08:00:00+00'),
    
    -- Upcoming inspections
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Teaching Hospital Septic System'), 
     (SELECT id FROM public.workers WHERE phone = '+233241234569'), 
     'assigned', 'low', 'inspection', 
     'Quarterly hospital septic system inspection', 
     '2024-02-25', '2024-02-15 09:00:00+00');

-- =============================================================================
-- SEED CLIMATE DATA FOR TAMALE REGION
-- =============================================================================

-- Insert recent climate data for Tamale and surrounding districts
INSERT INTO public.climate_snapshots (district_id, flood_risk_score, rainfall_mm, temperature_celsius, humidity_percent, wind_speed_kmh, weather_condition, recorded_at) VALUES
    -- Current weather conditions (today)
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 55, 25.4, 28.2, 78, 16.8, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu'), 48, 18.7, 29.1, 72, 14.2, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Tolon'), 62, 32.1, 27.5, 82, 19.5, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Kumbungu'), 45, 15.3, 29.8, 70, 13.9, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Nanton'), 58, 28.9, 28.7, 75, 17.3, 'rainy', '2024-02-16 06:00:00+00'),
    
    -- Yesterday's weather (for trend analysis)
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 72, 45.8, 26.1, 85, 22.4, 'stormy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu'), 65, 38.2, 27.3, 80, 20.1, 'rainy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Tolon'), 78, 52.6, 25.8, 88, 25.7, 'stormy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Kumbungu'), 52, 22.4, 28.9, 73, 16.8, 'rainy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Nanton'), 68, 41.3, 26.7, 83, 21.9, 'stormy', '2024-02-15 06:00:00+00'),
    
    -- Week ago (dry conditions for comparison)
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 25, 2.1, 34.5, 58, 9.8, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu'), 20, 0.5, 35.2, 52, 8.3, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Tolon'), 30, 3.7, 33.8, 62, 11.4, 'cloudy', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Kumbungu'), 18, 0.0, 36.1, 48, 7.2, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Nanton'), 28, 1.8, 34.9, 55, 10.6, 'clear', '2024-02-09 06:00:00+00');

-- =============================================================================
-- UPDATE FACILITY RISK SCORES BASED ON CONDITIONS
-- =============================================================================

-- Update risk scores to reflect current facility conditions and recent reports
UPDATE public.facilities SET risk_score = 
    CASE 
        WHEN name = 'Tamale Intercity Transport Terminal' THEN 85  -- Critical overflow
        WHEN name = 'Tolon Community Day School Latrine' THEN 90   -- Critical overflow at school
        WHEN name = 'Savelugu Market Latrine Complex' THEN 75      -- Blocked, high risk
        WHEN name = 'Tamale Technical University Latrine Block' THEN 70  -- Storm damaged
        WHEN name = 'Kumbungu Technical Institute Latrine' THEN 65 -- Damaged, needs attention
        WHEN name = 'Savelugu Senior High School Block' THEN 60    -- Dry, medium-high risk
        WHEN name = 'Tolon Health Center Septic Tank' THEN 45      -- Good but needs monitoring
        WHEN name = 'Tolon District Assembly Toilet' THEN 40       -- Good condition
        WHEN name = 'Nanton District Assembly Complex' THEN 35     -- Good condition
        WHEN name = 'Tamale Sports Stadium Toilet Complex' THEN 35 -- Good condition
        WHEN name = 'Savelugu District Hospital Toilet' THEN 30    -- Good condition
        WHEN name = 'Tamale Central Market Public Toilet' THEN 25  -- Good condition
        WHEN name = 'Kumbungu Market Waste Collection Point' THEN 25 -- Good condition
        WHEN name = 'Tamale Teaching Hospital Septic System' THEN 20 -- Excellent condition
        WHEN name = 'Kumbungu District Hospital Toilet' THEN 15    -- Excellent condition
        ELSE risk_score
    END
WHERE district_id IN (
    SELECT id FROM public.districts 
    WHERE name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')
);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show summary of seeded data
SELECT 
    'Facilities' as data_type,
    COUNT(*) as count,
    'Tamale region facilities added' as description
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')

UNION ALL

SELECT 
    'Reports' as data_type,
    COUNT(*) as count,
    'Reports for Tamale region facilities' as description
FROM public.reports r
JOIN public.facilities f ON r.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')

UNION ALL

SELECT 
    'Alerts' as data_type,
    COUNT(*) as count,
    'Alerts for Tamale region facilities' as description
FROM public.alerts a
JOIN public.facilities f ON a.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')

UNION ALL

SELECT 
    'Maintenance Tasks' as data_type,
    COUNT(*) as count,
    'Tasks for Tamale region facilities' as description
FROM public.maintenance_tasks mt
JOIN public.facilities f ON mt.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')

UNION ALL

SELECT 
    'Climate Snapshots' as data_type,
    COUNT(*) as count,
    'Weather data for Tamale region' as description
FROM public.climate_snapshots cs
JOIN public.districts d ON cs.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')

ORDER BY data_type;

-- Show facility status summary
SELECT 
    d.name as district,
    f.status,
    COUNT(*) as facility_count,
    ROUND(AVG(f.risk_score)) as avg_risk_score
FROM public.facilities f
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')
GROUP BY d.name, f.status
ORDER BY d.name, f.status;

-- Show active alerts summary
SELECT 
    d.name as district,
    a.severity,
    COUNT(*) as alert_count
FROM public.alerts a
JOIN public.facilities f ON a.facility_id = f.id
JOIN public.districts d ON f.district_id = d.id
WHERE d.name IN ('Tamale', 'Savelugu', 'Tolon', 'Kumbungu', 'Nanton')
  AND a.resolved = FALSE
GROUP BY d.name, a.severity
ORDER BY d.name, 
    CASE a.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END;