-- ============================================================================
-- ADD COMPREHENSIVE NORTHERN REGION DISTRICTS
-- This migration adds all major districts in the Northern Region of Ghana
-- ============================================================================

-- Insert all Northern Region districts with their approximate coordinates
INSERT INTO public.districts (name, region, lat, lng) VALUES
    -- Major districts in Northern Region
    ('Tamale', 'Northern', 9.4034, -0.8424),
    ('Savelugu', 'Northern', 9.6333, -0.8333),
    ('Tolon', 'Northern', 9.4167, -1.0000),
    ('Kumbungu', 'Northern', 9.5833, -0.8500),
    ('Nanton', 'Northern', 9.4000, -1.0833),
    ('Sagnarigu', 'Northern', 9.4500, -0.8000),
    ('Gushegu', 'Northern', 10.0667, -0.3500),
    ('Karaga', 'Northern', 10.3000, -0.6000),
    ('Saboba', 'Northern', 9.6167, 0.3833),
    ('Chereponi', 'Northern', 10.0500, 0.0500),
    ('Zabzugu', 'Northern', 9.8333, -0.1667),
    ('Tatale-Sanguli', 'Northern', 9.4167, 0.2833),
    ('Yendi', 'Northern', 9.4333, -0.0167),
    ('Mion', 'Northern', 9.5667, -0.2000),
    ('Mamprugu-Moagduri', 'Northern', 10.5000, -0.7500)
ON CONFLICT (name) DO UPDATE SET
    region = EXCLUDED.region,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng;

-- Update existing districts to ensure they have proper region names
UPDATE public.districts SET
    region = 'Northern'
WHERE region IN ('Northern Region', 'Northern');

-- Create a function to get all Northern Region districts for dropdowns
CREATE OR REPLACE FUNCTION public.get_northern_region_districts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    region TEXT,
    lat DECIMAL,
    lng DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name::TEXT,
        d.region::TEXT,
        d.lat,
        d.lng
    FROM public.districts d
    WHERE d.region = 'Northern'
    ORDER BY d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_northern_region_districts() TO authenticated;

-- Verification query
SELECT 
    'Northern Region Districts Added' as status,
    COUNT(*) as district_count
FROM public.districts 
WHERE region = 'Northern';

-- Show all Northern Region districts
SELECT 
    name,
    region,
    lat,
    lng
FROM public.districts 
WHERE region = 'Northern'
ORDER BY name;