-- ============================================================================
-- Restore officer@tamale.gov as Tamale district_officer (demo / test account)
-- Migration 023's DO block incorrectly promoted this user to system_admin, which
-- excludes them from list_district_officer_accounts() and mislabels the demo login.
-- ============================================================================

DO $$
DECLARE
    tamale_id UUID;
    tamale_name TEXT;
    tamale_region TEXT;
    officer_rows INTEGER;
BEGIN
    SELECT d.id, d.name, d.region
    INTO tamale_id, tamale_name, tamale_region
    FROM public.districts d
    WHERE d.name = 'Tamale'
    ORDER BY CASE WHEN d.region ILIKE 'Northern%' THEN 0 ELSE 1 END, d.region
    LIMIT 1;

    IF tamale_id IS NULL THEN
        RAISE EXCEPTION 'Tamale district not found in public.districts.';
    END IF;

    UPDATE auth.users u
    SET
        raw_user_meta_data =
            COALESCE(u.raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'role', 'district_officer',
                'name', 'Tamale District Officer',
                'district_id', tamale_id::text,
                'district_name', tamale_name,
                'district_region', tamale_region,
                'department', 'Health Department',
                'permissions', '["read", "write", "manage_facilities"]'::jsonb,
                'title', 'District Health Officer',
                'created_by_admin', TRUE
            ),
        updated_at = NOW()
    WHERE LOWER(u.email::TEXT) = 'officer@tamale.gov';

    GET DIAGNOSTICS officer_rows = ROW_COUNT;

    IF officer_rows = 0 THEN
        RAISE NOTICE 'No auth user officer@tamale.gov — create the user in Dashboard → Authentication, then re-run this migration.';
    ELSE
        RAISE NOTICE 'Tamale District Officer restored: officer@tamale.gov → % (%). User must sign out and sign in to refresh JWT.', tamale_name, tamale_region;
    END IF;
END $$;
