-- Function to get facilities within a specified radius using Haversine formula
CREATE OR REPLACE FUNCTION get_facilities_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    district_id UUID,
    district_name VARCHAR,
    district_region VARCHAR,
    lat DECIMAL,
    lng DECIMAL,
    last_serviced DATE,
    status VARCHAR,
    risk_score INTEGER,
    distance_km DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type,
        f.district_id,
        d.name AS district_name,
        d.region AS district_region,
        f.lat,
        f.lng,
        f.last_serviced,
        f.status,
        f.risk_score,
        ROUND(
            (6371 * acos(
                cos(radians(center_lat)) * 
                cos(radians(f.lat)) * 
                cos(radians(f.lng) - radians(center_lng)) + 
                sin(radians(center_lat)) * 
                sin(radians(f.lat))
            ))::DECIMAL, 2
        ) AS distance_km,
        f.created_at,
        f.updated_at
    FROM public.facilities f
    JOIN public.districts d ON f.district_id = d.id
    WHERE (
        6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(f.lat)) * 
            cos(radians(f.lng) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(f.lat))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;