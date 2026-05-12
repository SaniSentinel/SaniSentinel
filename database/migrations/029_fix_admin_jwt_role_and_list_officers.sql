-- ============================================================================
-- 1) Fix get_user_role(): Supabase puts auth role ("authenticated") at JWT root.
--    Application role (system_admin, district_officer) lives in user_metadata.
--    Without this, is_admin() is false and list_district_officer_accounts fails.
-- 2) Fix list_district_officer_accounts(): invalid district_id text must not break
--    the whole listing (JOIN ::uuid errors abort the RPC).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_data JSONB;
    meta_role TEXT;
    top_role TEXT;
BEGIN
    jwt_data := auth.jwt();
    IF jwt_data IS NULL THEN
        RETURN 'anonymous';
    END IF;

    meta_role := NULLIF(trim(COALESCE(
        jwt_data -> 'user_metadata' ->> 'role',
        jwt_data -> 'app_metadata' ->> 'role',
        ''
    )), '');

    IF meta_role IS NOT NULL THEN
        RETURN meta_role;
    END IF;

    top_role := jwt_data ->> 'role';
    IF top_role IS NOT NULL AND top_role NOT IN ('authenticated', 'anon', 'anonymous', 'service_role') THEN
        RETURN top_role;
    END IF;

    RETURN COALESCE(NULLIF(trim(top_role), ''), 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.list_district_officer_accounts()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    name TEXT,
    district_id UUID,
    district_name TEXT,
    district_region TEXT,
    suspended BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can list district officer accounts';
    END IF;

    RETURN QUERY
    SELECT
        u.id,
        u.email::TEXT,
        COALESCE(NULLIF(trim(u.raw_user_meta_data->>'role'), ''), 'unknown') AS role,
        COALESCE(NULLIF(trim(u.raw_user_meta_data->>'name'), ''), '') AS name,
        CASE
            WHEN NULLIF(trim(u.raw_user_meta_data->>'district_id'), '') IS NULL THEN NULL::UUID
            WHEN NULLIF(trim(u.raw_user_meta_data->>'district_id'), '') ~*
                '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            THEN (NULLIF(trim(u.raw_user_meta_data->>'district_id'), ''))::UUID
            ELSE NULL::UUID
        END AS district_id,
        COALESCE(
            d.name::TEXT,
            NULLIF(trim(u.raw_user_meta_data->>'district_name'), '')
        ) AS district_name,
        COALESCE(
            d.region::TEXT,
            NULLIF(trim(u.raw_user_meta_data->>'district_region'), '')
        ) AS district_region,
        COALESCE((u.raw_user_meta_data->>'suspended')::BOOLEAN, FALSE) AS suspended,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.districts d ON d.id = (
        CASE
            WHEN NULLIF(trim(u.raw_user_meta_data->>'district_id'), '') IS NULL THEN NULL::UUID
            WHEN NULLIF(trim(u.raw_user_meta_data->>'district_id'), '') ~*
                '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            THEN (NULLIF(trim(u.raw_user_meta_data->>'district_id'), ''))::UUID
            ELSE NULL::UUID
        END
    )
    WHERE lower(trim(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'district_officer'
    ORDER BY district_name NULLS LAST, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
