-- ============================================================================
-- VERIFY USER SETUP AND METADATA
-- Run this in Supabase SQL Editor to check user accounts and metadata
-- ============================================================================

-- Step 1: Check if test users exist
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    updated_at
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Step 2: Check user metadata
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'district_id' as district_id,
    raw_user_meta_data->>'department' as department,
    raw_user_meta_data->'permissions' as permissions,
    raw_user_meta_data->>'title' as title
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Step 3: Check if Tamale district exists
SELECT 
    id,
    name,
    region,
    created_at
FROM public.districts 
WHERE name = 'Tamale';

-- Step 4: Verify district linkage
SELECT 
    u.email,
    u.raw_user_meta_data->>'name' as user_name,
    u.raw_user_meta_data->>'role' as user_role,
    d.name as district_name,
    d.region as district_region,
    d.id as district_id
FROM auth.users u
LEFT JOIN public.districts d ON d.id = (u.raw_user_meta_data->>'district_id')::UUID
WHERE u.email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY u.email;

-- Step 5: Check if users can authenticate (this will show if accounts are active)
SELECT 
    email,
    email_confirmed_at IS NOT NULL as can_login,
    banned_until IS NULL as not_banned,
    deleted_at IS NULL as not_deleted,
    CASE 
        WHEN email_confirmed_at IS NOT NULL AND banned_until IS NULL AND deleted_at IS NULL 
        THEN 'READY' 
        ELSE 'NOT_READY' 
    END as status
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;

-- Step 6: Show complete user information for debugging
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    user_metadata,
    banned_until,
    deleted_at
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;