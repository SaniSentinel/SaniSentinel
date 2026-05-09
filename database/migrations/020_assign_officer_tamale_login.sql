-- Assign officer@tamale.gov as a District Officer scoped to Tamale.
-- Requires: Auth user exists (Dashboard → Authentication) and districts row named 'Tamale'.
-- Run in Supabase SQL Editor (service role / postgres).

DO $$
DECLARE
    tamale_district_id UUID;
    officer_rows INTEGER;
BEGIN
    SELECT id INTO tamale_district_id
    FROM public.districts
    WHERE name = 'Tamale'
    LIMIT 1;

    IF tamale_district_id IS NULL THEN
        RAISE EXCEPTION 'Tamale district not found in public.districts. Seed or create districts first.';
    END IF;

    UPDATE auth.users
    SET
        raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'role', 'district_officer',
                'name', COALESCE(NULLIF(trim(raw_user_meta_data->>'name'), ''), 'Tamale District Officer'),
                'district_id', tamale_district_id::text,
                'department', 'Health Department',
                'permissions', '["read", "write", "manage_facilities"]'::jsonb,
                'title', 'District Health Officer',
                'suspended', false
            ),
        updated_at = now()
    WHERE lower(email::text) = 'officer@tamale.gov';

    GET DIAGNOSTICS officer_rows = ROW_COUNT;

    IF officer_rows = 0 THEN
        RAISE NOTICE 'No row updated — create auth user officer@tamale.gov in Dashboard → Authentication, then re-run.';
    ELSE
        RAISE NOTICE 'District officer assigned: officer@tamale.gov → Tamale (district_id=%).', tamale_district_id;
        RAISE NOTICE 'User must sign out and sign in again to refresh JWT claims.';
    END IF;
END $$;
