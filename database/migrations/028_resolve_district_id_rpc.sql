-- ============================================================================
-- Resolve districts.id by name with SECURITY DEFINER so it works even when
-- direct SELECT on public.districts is limited by RLS for some JWT shapes.
-- Also widen get_northern_region_districts() to include legacy region strings.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_district_id_by_name(p_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id
  FROM public.districts d
  WHERE p_name IS NOT NULL
    AND TRIM(d.name) ILIKE TRIM(p_name)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_district_id_by_name(TEXT) TO authenticated;

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
    WHERE COALESCE(TRIM(d.region), '') IN ('Northern', 'Northern Region')
    ORDER BY d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
