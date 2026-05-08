-- Function to get districts within a specified radius using Haversine formula
CREATE OR REPLACE FUNCTION get_districts_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    region VARCHAR,
    lat DECIMAL,
    lng DECIMAL,
    distance_km DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.region,
        d.lat,
        d.lng,
        ROUND(
            (6371 * acos(
                cos(radians(center_lat)) * 
                cos(radians(d.lat)) * 
                cos(radians(d.lng) - radians(center_lng)) + 
                sin(radians(center_lat)) * 
                sin(radians(d.lat))
            ))::DECIMAL, 2
        ) AS distance_km,
        d.created_at,
        d.updated_at
    FROM public.districts d
    WHERE (
        6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(d.lat)) * 
            cos(radians(d.lng) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(d.lat))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;