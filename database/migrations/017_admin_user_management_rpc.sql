-- ============================================================================
-- ADMIN USER MANAGEMENT HELPERS
-- - List district officer accounts from auth.users metadata
-- - Suspend/reactivate accounts using metadata flag
-- ============================================================================

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
        COALESCE((u.raw_user_meta_data->>'role')::TEXT, 'unknown') AS role,
        COALESCE((u.raw_user_meta_data->>'name')::TEXT, '') AS name,
        NULLIF((u.raw_user_meta_data->>'district_id')::TEXT, '')::UUID AS district_id,
        d.name::TEXT AS district_name,
        d.region::TEXT AS district_region,
        COALESCE((u.raw_user_meta_data->>'suspended')::BOOLEAN, FALSE) AS suspended,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.districts d
        ON d.id = NULLIF((u.raw_user_meta_data->>'district_id')::TEXT, '')::UUID
    WHERE COALESCE((u.raw_user_meta_data->>'role')::TEXT, '') = 'district_officer'
    ORDER BY d.name NULLS LAST, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_user_suspended(user_email TEXT, suspended_state BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can suspend/reactivate accounts';
    END IF;

    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{suspended}',
        to_jsonb(suspended_state)
    )
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.list_district_officer_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_suspended(TEXT, BOOLEAN) TO authenticated;
