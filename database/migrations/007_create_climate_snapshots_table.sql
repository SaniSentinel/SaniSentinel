-- Create climate_snapshots table
CREATE TABLE IF NOT EXISTS public.climate_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    flood_risk_score INTEGER NOT NULL CHECK (flood_risk_score >= 0 AND flood_risk_score <= 100),
    rainfall_mm DECIMAL(6, 2) NOT NULL CHECK (rainfall_mm >= 0),
    temperature_celsius DECIMAL(4, 1),
    humidity_percent INTEGER CHECK (humidity_percent >= 0 AND humidity_percent <= 100),
    wind_speed_kmh DECIMAL(5, 2) CHECK (wind_speed_kmh >= 0),
    weather_condition VARCHAR(50) CHECK (weather_condition IN ('clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'windy')),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_district_id ON public.climate_snapshots(district_id);
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_flood_risk_score ON public.climate_snapshots(flood_risk_score);
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_rainfall_mm ON public.climate_snapshots(rainfall_mm);
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_recorded_at ON public.climate_snapshots(recorded_at);
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_weather_condition ON public.climate_snapshots(weather_condition);

-- Create composite index for time-series queries
CREATE INDEX IF NOT EXISTS idx_climate_snapshots_district_time ON public.climate_snapshots(district_id, recorded_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.climate_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to climate_snapshots" ON public.climate_snapshots
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.climate_snapshots
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow system to insert climate data (for automated data collection)
CREATE POLICY "Allow system insert for climate_snapshots" ON public.climate_snapshots
    FOR INSERT WITH CHECK (true);

-- Create function to generate climate-based alerts
CREATE OR REPLACE FUNCTION generate_climate_alerts()
RETURNS TRIGGER AS $$
DECLARE
    district_name VARCHAR;
    facility_count INTEGER;
BEGIN
    -- Get district name for alert message
    SELECT name INTO district_name 
    FROM public.districts 
    WHERE id = NEW.district_id;
    
    -- Count facilities in the district
    SELECT COUNT(*) INTO facility_count
    FROM public.facilities
    WHERE district_id = NEW.district_id;
    
    -- Generate flood risk alert for high flood risk (score >= 70)
    IF NEW.flood_risk_score >= 70 THEN
        -- Create climate warning alerts for all facilities in the district
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        SELECT 
            f.id,
            'climate_warning',
            CASE 
                WHEN NEW.flood_risk_score >= 85 THEN 'critical'
                WHEN NEW.flood_risk_score >= 70 THEN 'high'
                ELSE 'medium'
            END,
            'High flood risk detected in ' || district_name || ' district (risk score: ' || NEW.flood_risk_score || '). Monitor facilities for potential flooding.'
        FROM public.facilities f
        WHERE f.district_id = NEW.district_id
          AND f.status != 'out_of_service';
    END IF;
    
    -- Generate heavy rainfall alert (>50mm in single reading)
    IF NEW.rainfall_mm > 50 THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        SELECT 
            f.id,
            'climate_warning',
            'high',
            'Heavy rainfall detected in ' || district_name || ' (' || NEW.rainfall_mm || 'mm). Check drainage systems and monitor for overflow.'
        FROM public.facilities f
        WHERE f.district_id = NEW.district_id
          AND f.type IN ('toilet', 'latrine', 'septic_tank')
          AND f.status != 'out_of_service';
    END IF;
    
    -- Generate storm warning for severe weather conditions
    IF NEW.weather_condition = 'stormy' AND NEW.wind_speed_kmh > 40 THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        SELECT 
            f.id,
            'climate_warning',
            'high',
            'Severe storm conditions in ' || district_name || ' (wind: ' || NEW.wind_speed_kmh || 'km/h). Secure facilities and check for damage.'
        FROM public.facilities f
        WHERE f.district_id = NEW.district_id
          AND f.status != 'out_of_service';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate climate alerts
CREATE TRIGGER generate_climate_alerts_trigger
    AFTER INSERT ON public.climate_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION generate_climate_alerts();

-- Create function to calculate flood risk score based on weather data
CREATE OR REPLACE FUNCTION calculate_flood_risk(
    rainfall_24h DECIMAL,
    rainfall_7d DECIMAL,
    current_rainfall DECIMAL,
    season VARCHAR DEFAULT 'wet'
)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
BEGIN
    -- Base risk from current rainfall
    IF current_rainfall > 100 THEN
        risk_score := risk_score + 40;
    ELSIF current_rainfall > 50 THEN
        risk_score := risk_score + 25;
    ELSIF current_rainfall > 20 THEN
        risk_score := risk_score + 15;
    ELSIF current_rainfall > 10 THEN
        risk_score := risk_score + 5;
    END IF;
    
    -- Risk from 24-hour accumulated rainfall
    IF rainfall_24h > 200 THEN
        risk_score := risk_score + 35;
    ELSIF rainfall_24h > 100 THEN
        risk_score := risk_score + 25;
    ELSIF rainfall_24h > 50 THEN
        risk_score := risk_score + 15;
    END IF;
    
    -- Risk from 7-day accumulated rainfall
    IF rainfall_7d > 500 THEN
        risk_score := risk_score + 25;
    ELSIF rainfall_7d > 300 THEN
        risk_score := risk_score + 15;
    ELSIF rainfall_7d > 150 THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Seasonal adjustment
    IF season = 'wet' THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Cap at 100
    IF risk_score > 100 THEN
        risk_score := 100;
    END IF;
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to get latest climate data for all districts
CREATE OR REPLACE FUNCTION get_latest_climate_data()
RETURNS TABLE (
    district_id UUID,
    district_name VARCHAR,
    district_region VARCHAR,
    flood_risk_score INTEGER,
    rainfall_mm DECIMAL,
    temperature_celsius DECIMAL,
    humidity_percent INTEGER,
    wind_speed_kmh DECIMAL,
    weather_condition VARCHAR,
    recorded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (d.id)
        d.id AS district_id,
        d.name AS district_name,
        d.region AS district_region,
        cs.flood_risk_score,
        cs.rainfall_mm,
        cs.temperature_celsius,
        cs.humidity_percent,
        cs.wind_speed_kmh,
        cs.weather_condition,
        cs.recorded_at
    FROM public.districts d
    LEFT JOIN public.climate_snapshots cs ON d.id = cs.district_id
    ORDER BY d.id, cs.recorded_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for climate_snapshots table
ALTER PUBLICATION supabase_realtime ADD TABLE public.climate_snapshots;

-- Insert sample climate data for Northern Region districts
INSERT INTO public.climate_snapshots (district_id, flood_risk_score, rainfall_mm, temperature_celsius, humidity_percent, wind_speed_kmh, weather_condition, recorded_at) VALUES
    -- Recent data (last 24 hours) - Wet season conditions
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 45, 12.5, 28.5, 75, 15.2, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Yendi'), 65, 35.8, 27.2, 82, 18.7, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Damongo'), 75, 45.2, 26.8, 85, 22.1, 'stormy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Bimbilla'), 55, 28.3, 29.1, 78, 16.5, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Salaga'), 40, 8.7, 30.2, 68, 12.8, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Kpandai'), 50, 22.1, 28.9, 73, 14.3, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Saboba'), 60, 31.5, 27.5, 80, 19.2, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Chereponi'), 35, 5.2, 31.8, 65, 11.7, 'clear', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Gushiegu'), 70, 42.8, 26.3, 88, 25.4, 'stormy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Karaga'), 55, 26.9, 28.7, 76, 17.1, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu'), 48, 18.4, 29.3, 72, 13.9, 'cloudy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Tolon'), 52, 24.7, 28.1, 79, 16.8, 'rainy', '2024-02-16 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Kumbungu'), 42, 15.3, 29.8, 70, 14.6, 'cloudy', '2024-02-16 06:00:00+00'),
    
    -- Previous day data for trend analysis
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 38, 8.2, 32.1, 68, 12.5, 'clear', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Yendi'), 72, 52.3, 25.8, 89, 28.3, 'stormy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Damongo'), 85, 78.5, 24.9, 92, 35.7, 'stormy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Bimbilla'), 62, 38.7, 27.4, 84, 21.2, 'rainy', '2024-02-15 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Salaga'), 25, 2.1, 33.5, 58, 9.8, 'clear', '2024-02-15 06:00:00+00'),
    
    -- Week-old data for historical context
    ((SELECT id FROM public.districts WHERE name = 'Tamale'), 20, 0.0, 35.2, 55, 8.3, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Yendi'), 15, 0.0, 36.8, 48, 6.7, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Damongo'), 25, 1.2, 34.1, 62, 11.4, 'cloudy', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Bimbilla'), 18, 0.0, 37.3, 45, 7.9, 'clear', '2024-02-09 06:00:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Salaga'), 12, 0.0, 38.7, 42, 5.2, 'clear', '2024-02-09 06:00:00+00'),
    
    -- Extreme weather event (2 days ago)
    ((SELECT id FROM public.districts WHERE name = 'Gushiegu'), 95, 125.8, 23.2, 95, 45.6, 'stormy', '2024-02-14 14:30:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Karaga'), 88, 98.4, 24.1, 93, 42.1, 'stormy', '2024-02-14 14:30:00+00'),
    ((SELECT id FROM public.districts WHERE name = 'Savelugu'), 82, 87.2, 25.3, 91, 38.9, 'stormy', '2024-02-14 14:30:00+00');

-- Create view for current weather conditions
CREATE OR REPLACE VIEW current_weather AS
SELECT 
    d.id as district_id,
    d.name as district_name,
    d.region,
    cs.flood_risk_score,
    cs.rainfall_mm,
    cs.temperature_celsius,
    cs.humidity_percent,
    cs.wind_speed_kmh,
    cs.weather_condition,
    cs.recorded_at,
    CASE 
        WHEN cs.flood_risk_score >= 80 THEN 'Critical'
        WHEN cs.flood_risk_score >= 60 THEN 'High'
        WHEN cs.flood_risk_score >= 40 THEN 'Medium'
        ELSE 'Low'
    END as risk_level
FROM public.districts d
LEFT JOIN LATERAL (
    SELECT * FROM public.climate_snapshots 
    WHERE district_id = d.id 
    ORDER BY recorded_at DESC 
    LIMIT 1
) cs ON true
ORDER BY d.name;