-- ============================================================================
-- CHECK AND CREATE TEST USERS
-- Run this in Supabase SQL Editor to check and create test users
-- ============================================================================

-- Step 1: Check if users already exist
SELECT 
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Step 2: If users don't exist, you need to create them manually
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- OR use the signup API (but this requires email confirmation)

-- For manual creation in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Enter:
--    Email: admin@sanissentinel.com
--    Password: SaniSentinel2024!
--    Email Confirm: YES (check this box)
-- 4. Click "Add User"
-- 5. Repeat for officer@tamale.gov with password: Tamale2024!

-- Step 3: After creating users, add metadata
-- First get the Tamale district ID
SELECT id as tamale_district_id, name 
FROM public.districts 
WHERE name = 'Tamale';

-- Step 4: Update user metadata (replace TAMALE_DISTRICT_ID with actual ID from Step 3)
-- For admin user:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'system_admin',
    'name', 'System Administrator',
    'district_id', 'REPLACE_WITH_TAMALE_DISTRICT_ID',
    'department', 'IT Administration',
    'permissions', '["all"]'::jsonb,
    'title', 'System Administrator'
)
WHERE email = 'admin@sanissentinel.com';

-- For officer user:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'district_officer',
    'name', 'Tamale District Officer',
    'district_id', 'REPLACE_WITH_TAMALE_DISTRICT_ID',
    'department', 'Health Department',
    'permissions', '["read", "write", "manage_facilities"]'::jsonb,
    'title', 'District Health Officer'
)
WHERE email = 'officer@tamale.gov';

-- Step 5: Verify users were created and updated
SELECT 
    email,
    email_confirmed_at IS NOT NULL as can_login,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;