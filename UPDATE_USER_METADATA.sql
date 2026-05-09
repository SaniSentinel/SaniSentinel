-- ============================================================================
-- UPDATE USER METADATA FOR TEST ACCOUNTS
-- Run this in Supabase SQL Editor after creating the test users
-- ============================================================================

-- Step 1: Get Tamale district ID (we'll use this for both users)
-- Copy this ID for use in the next steps
SELECT id as tamale_district_id, name 
FROM public.districts 
WHERE name = 'Tamale';

-- Step 2: Update Admin User Metadata
-- Replace 'TAMALE_DISTRICT_ID_HERE' with the actual UUID from Step 1
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'system_admin',
    'name', 'System Administrator',
    'district_id', 'TAMALE_DISTRICT_ID_HERE',
    'department', 'IT Administration',
    'permissions', '["all"]'::jsonb,
    'title', 'System Administrator'
)
WHERE email = 'admin@sanissentinel.com';

-- Step 3: Update District Officer Metadata  
-- Replace 'TAMALE_DISTRICT_ID_HERE' with the actual UUID from Step 1
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'district_officer',
    'name', 'Tamale District Officer', 
    'district_id', 'TAMALE_DISTRICT_ID_HERE',
    'department', 'Health Department',
    'permissions', '["read", "write", "manage_facilities"]'::jsonb,
    'title', 'District Health Officer'
)
WHERE email = 'officer@tamale.gov';

-- Step 4: Verify the updates
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'district_id' as district_id,
    raw_user_meta_data->>'department' as department
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov');

-- ============================================================================
-- AUTOMATED VERSION (Run this instead if you want it automated)
-- ============================================================================

DO $$
DECLARE
    tamale_district_id UUID;
    admin_updated INTEGER;
    officer_updated INTEGER;
BEGIN
    -- Get Tamale district ID
    SELECT id INTO tamale_district_id 
    FROM public.districts 
    WHERE name = 'Tamale' 
    LIMIT 1;
    
    IF tamale_district_id IS NULL THEN
        RAISE EXCEPTION 'Tamale district not found. Please create districts first.';
    END IF;
    
    RAISE NOTICE 'Using Tamale district ID: %', tamale_district_id;
    
    -- Update admin user
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object(
        'role', 'system_admin',
        'name', 'System Administrator',
        'district_id', tamale_district_id::text,
        'department', 'IT Administration',
        'permissions', '["all"]'::jsonb,
        'title', 'System Administrator'
    )
    WHERE email = 'admin@sanissentinel.com';
    
    GET DIAGNOSTICS admin_updated = ROW_COUNT;
    
    -- Update district officer
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object(
        'role', 'district_officer',
        'name', 'Tamale District Officer',
        'district_id', tamale_district_id::text,
        'department', 'Health Department', 
        'permissions', '["read", "write", "manage_facilities"]'::jsonb,
        'title', 'District Health Officer'
    )
    WHERE email = 'officer@tamale.gov';
    
    GET DIAGNOSTICS officer_updated = ROW_COUNT;
    
    -- Report results
    RAISE NOTICE '✅ Metadata update completed:';
    RAISE NOTICE '- Admin user updated: % rows', admin_updated;
    RAISE NOTICE '- Officer user updated: % rows', officer_updated;
    
    IF admin_updated = 0 THEN
        RAISE NOTICE '⚠️  Admin user (admin@sanissentinel.com) not found';
    END IF;
    
    IF officer_updated = 0 THEN
        RAISE NOTICE '⚠️  Officer user (officer@tamale.gov) not found';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if users exist
SELECT 
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Check user metadata
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'district_id' as district_id,
    raw_user_meta_data->>'department' as department,
    raw_user_meta_data->'permissions' as permissions
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Check district information
SELECT 
    u.email,
    u.raw_user_meta_data->>'name' as user_name,
    u.raw_user_meta_data->>'role' as user_role,
    d.name as district_name,
    d.region as district_region
FROM auth.users u
LEFT JOIN public.districts d ON d.id = (u.raw_user_meta_data->>'district_id')::UUID
WHERE u.email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY u.email;