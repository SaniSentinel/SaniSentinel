-- ============================================================================
-- IMPROVED USER REGISTRATION AND MANAGEMENT
-- This migration improves user registration and adds proper admin relationships
-- ============================================================================

-- Create a function to register district officers under admin supervision
CREATE OR REPLACE FUNCTION public.register_district_officer(
    officer_email TEXT,
    officer_name TEXT,
    officer_district_id UUID,
    admin_email TEXT DEFAULT 'officer@tamale.gov'
)
RETURNS JSON AS $$
DECLARE
    district_info RECORD;
    admin_user_id UUID;
    result JSON;
BEGIN
    -- Check if the calling user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can register district officers';
    END IF;

    -- Validate district exists and is in Northern Region
    SELECT id, name, region INTO district_info
    FROM public.districts 
    WHERE id = officer_district_id AND region = 'Northern Region';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid district ID or district not in Northern Region';
    END IF;

    -- Get the admin user ID (officer@tamale.gov)
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admin user % not found', admin_email;
    END IF;

    -- Create the result JSON with registration details
    result := json_build_object(
        'success', true,
        'message', 'District officer registration prepared',
        'officer_email', officer_email,
        'officer_name', officer_name,
        'district_id', officer_district_id,
        'district_name', district_info.name,
        'district_region', district_info.region,
        'supervised_by', admin_email,
        'admin_user_id', admin_user_id,
        'metadata', json_build_object(
            'role', 'district_officer',
            'name', officer_name,
            'district_id', officer_district_id,
            'district_name', district_info.name,
            'district_region', district_info.region,
            'department', 'Health Department',
            'permissions', json_build_array('read', 'write', 'manage_facilities'),
            'title', 'District Health Officer',
            'supervised_by', admin_email,
            'admin_user_id', admin_user_id,
            'created_by_admin', true,
            'registration_date', NOW()
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update user metadata after Supabase auth registration
CREATE OR REPLACE FUNCTION public.update_district_officer_metadata(
    user_id UUID,
    officer_metadata JSON
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can update officer metadata';
    END IF;

    -- Update the user metadata in auth.users
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || officer_metadata::jsonb
    WHERE id = user_id;

    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get district officer registration template
CREATE OR REPLACE FUNCTION public.get_officer_registration_template(district_id UUID)
RETURNS JSON AS $$
DECLARE
    district_info RECORD;
BEGIN
    -- Get district information
    SELECT id, name, region INTO district_info
    FROM public.districts 
    WHERE id = district_id AND region = 'Northern Region';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid district ID or district not in Northern Region';
    END IF;

    RETURN json_build_object(
        'role', 'district_officer',
        'district_id', district_info.id,
        'district_name', district_info.name,
        'district_region', district_info.region,
        'department', 'Health Department',
        'permissions', json_build_array('read', 'write', 'manage_facilities'),
        'title', 'District Health Officer',
        'supervised_by', 'officer@tamale.gov',
        'created_by_admin', true,
        'registration_date', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improve the existing list_district_officer_accounts function
CREATE OR REPLACE FUNCTION public.list_district_officer_accounts()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    name TEXT,
    district_id UUID,
    district_name TEXT,
    district_region TEXT,
    supervised_by TEXT,
    suspended BOOLEAN,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
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
        COALESCE((u.raw_user_meta_data->>'name')::TEXT, u.email::TEXT) AS name,
        NULLIF((u.raw_user_meta_data->>'district_id')::TEXT, '')::UUID AS district_id,
        COALESCE(d.name::TEXT, 'Unknown District') AS district_name,
        COALESCE(d.region::TEXT, 'Unknown Region') AS district_region,
        COALESCE((u.raw_user_meta_data->>'supervised_by')::TEXT, 'officer@tamale.gov') AS supervised_by,
        COALESCE((u.raw_user_meta_data->>'suspended')::BOOLEAN, FALSE) AS suspended,
        u.created_at,
        u.last_sign_in_at
    FROM auth.users u
    LEFT JOIN public.districts d
        ON d.id = NULLIF((u.raw_user_meta_data->>'district_id')::TEXT, '')::UUID
    WHERE COALESCE((u.raw_user_meta_data->>'role')::TEXT, '') = 'district_officer'
    ORDER BY d.name NULLS LAST, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.register_district_officer(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_district_officer_metadata(UUID, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_officer_registration_template(UUID) TO authenticated;

-- Demo auth user officer@tamale.gov should remain a district_officer for Tamale (see CHECK_AND_CREATE_USERS.sql).
-- Do not promote this account to system_admin here — that hides it from list_district_officer_accounts().
-- If this block already ran in your database, apply migration 025_restore_tamale_district_officer_demo_account.sql.
DO $$
DECLARE
    tamale_district_id UUID;
    tamale_region TEXT;
    officer_exists BOOLEAN;
BEGIN
    SELECT id, region INTO tamale_district_id, tamale_region
    FROM public.districts
    WHERE name = 'Tamale'
    ORDER BY CASE WHEN region ILIKE 'Northern%' THEN 0 ELSE 1 END
    LIMIT 1;

    SELECT EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email::TEXT) = 'officer@tamale.gov') INTO officer_exists;

    IF officer_exists AND tamale_district_id IS NOT NULL THEN
        UPDATE auth.users
        SET raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'role', 'district_officer',
                'name', 'Tamale District Officer',
                'district_id', tamale_district_id::text,
                'district_name', 'Tamale',
                'district_region', tamale_region,
                'department', 'Health Department',
                'permissions', '["read", "write", "manage_facilities"]'::jsonb,
                'title', 'District Health Officer',
                'created_by_admin', TRUE
            ),
            updated_at = NOW()
        WHERE LOWER(email::TEXT) = 'officer@tamale.gov';

        RAISE NOTICE 'Updated demo user officer@tamale.gov as Tamale district_officer';
    ELSE
        RAISE NOTICE 'officer@tamale.gov not found or Tamale district missing — skip demo officer metadata';
    END IF;
END;
$$;

-- Verification queries
SELECT 'User Registration Functions Created' as status;

SELECT 
    'Admin User Status' as check_type,
    email,
    (raw_user_meta_data->>'role') as role,
    (raw_user_meta_data->>'name') as name,
    (raw_user_meta_data->>'district_name') as district
FROM auth.users 
WHERE email = 'officer@tamale.gov';