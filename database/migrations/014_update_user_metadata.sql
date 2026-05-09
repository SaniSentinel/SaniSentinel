-- Update user metadata to include role and district_id for test users
-- This migration adds role and district information to auth.users metadata

-- First, let's get the Tamale district ID for reference
DO $$
DECLARE
    tamale_district_id UUID;
BEGIN
    -- Get Tamale district ID
    SELECT id INTO tamale_district_id 
    FROM public.districts 
    WHERE name = 'Tamale' 
    LIMIT 1;
    
    IF tamale_district_id IS NOT NULL THEN
        RAISE NOTICE 'Found Tamale district ID: %', tamale_district_id;
        
        -- Update admin user metadata
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"system_admin"'::jsonb
        )
        WHERE email = 'admin@sanissentinel.com';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{district_id}',
            to_jsonb(tamale_district_id::text)
        )
        WHERE email = 'admin@sanissentinel.com';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{name}',
            '"System Administrator"'::jsonb
        )
        WHERE email = 'admin@sanissentinel.com';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{department}',
            '"IT Administration"'::jsonb
        )
        WHERE email = 'admin@sanissentinel.com';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{permissions}',
            '["all"]'::jsonb
        )
        WHERE email = 'admin@sanissentinel.com';
        
        -- Update district officer metadata
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"district_officer"'::jsonb
        )
        WHERE email = 'officer@tamale.gov';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{district_id}',
            to_jsonb(tamale_district_id::text)
        )
        WHERE email = 'officer@tamale.gov';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{name}',
            '"Tamale District Officer"'::jsonb
        )
        WHERE email = 'officer@tamale.gov';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{department}',
            '"Health Department"'::jsonb
        )
        WHERE email = 'officer@tamale.gov';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{permissions}',
            '["read", "write", "manage_facilities"]'::jsonb
        )
        WHERE email = 'officer@tamale.gov';
        
        RAISE NOTICE 'User metadata updated successfully for both test users';
    ELSE
        RAISE NOTICE 'Tamale district not found. Please ensure districts are created first.';
    END IF;
END $$;

-- Create a function to get user profile with metadata
CREATE OR REPLACE FUNCTION get_user_profile(user_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    name TEXT,
    district_id UUID,
    district_name TEXT,
    department TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        (u.raw_user_meta_data->>'role')::TEXT as role,
        (u.raw_user_meta_data->>'name')::TEXT as name,
        (u.raw_user_meta_data->>'district_id')::UUID as district_id,
        d.name as district_name,
        (u.raw_user_meta_data->>'department')::TEXT as department,
        (u.raw_user_meta_data->'permissions')::JSONB as permissions,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.districts d ON d.id = (u.raw_user_meta_data->>'district_id')::UUID
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_email TEXT, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    user_role TEXT;
BEGIN
    -- Get user permissions and role
    SELECT 
        (raw_user_meta_data->'permissions')::JSONB,
        (raw_user_meta_data->>'role')::TEXT
    INTO user_permissions, user_role
    FROM auth.users 
    WHERE email = user_email;
    
    -- System admin has all permissions
    IF user_role = 'system_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has 'all' permission
    IF user_permissions ? 'all' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has the specific permission
    IF user_permissions ? required_permission THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies that use user metadata
-- Update facilities RLS policy to use user district
DROP POLICY IF EXISTS "Users can manage facilities in their district" ON public.facilities;
CREATE POLICY "Users can manage facilities in their district" ON public.facilities
    FOR ALL USING (
        -- System admins can access all facilities
        (auth.jwt() ->> 'role') = 'system_admin' OR
        -- District officers can access facilities in their district
        (
            (auth.jwt() ->> 'role') = 'district_officer' AND
            district_id = (auth.jwt() ->> 'district_id')::UUID
        ) OR
        -- Allow read access for authenticated users
        (auth.role() = 'authenticated' AND current_setting('request.method', true) = 'GET')
    );

-- Update workers RLS policy to use user metadata
DROP POLICY IF EXISTS "Users can manage workers in their district" ON public.workers;
CREATE POLICY "Users can manage workers in their district" ON public.workers
    FOR ALL USING (
        -- System admins can access all workers
        (auth.jwt() ->> 'role') = 'system_admin' OR
        -- District officers can access workers in their district
        (
            (auth.jwt() ->> 'role') = 'district_officer' AND
            district_id = (auth.jwt() ->> 'district_id')::UUID
        ) OR
        -- Workers can access their own profile
        email = auth.email() OR
        -- Allow read access for authenticated users
        (auth.role() = 'authenticated' AND current_setting('request.method', true) = 'GET')
    );

-- Create a view for user profiles (accessible to authenticated users)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    u.email,
    (u.raw_user_meta_data->>'role')::TEXT as role,
    (u.raw_user_meta_data->>'name')::TEXT as name,
    (u.raw_user_meta_data->>'district_id')::UUID as district_id,
    d.name as district_name,
    d.region as district_region,
    (u.raw_user_meta_data->>'department')::TEXT as department,
    (u.raw_user_meta_data->'permissions')::JSONB as permissions,
    u.created_at,
    u.updated_at
FROM auth.users u
LEFT JOIN public.districts d ON d.id = (u.raw_user_meta_data->>'district_id')::UUID
WHERE u.email_confirmed_at IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ User metadata migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated metadata for:';
    RAISE NOTICE '- admin@sanissentinel.com (system_admin)';
    RAISE NOTICE '- officer@tamale.gov (district_officer)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '- get_user_profile(email) - Get complete user profile';
    RAISE NOTICE '- check_user_permission(email, permission) - Check user permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Created view:';
    RAISE NOTICE '- user_profiles - View user profiles with district info';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated RLS policies for role-based access control';
END $$;