# Troubleshoot Login Issues

## Problem: "Invalid credentials" error when trying to log in

This error occurs when:
1. The user accounts don't exist in Supabase
2. The passwords are incorrect
3. The users exist but aren't confirmed
4. There's a configuration issue

## Solution Steps:

### Step 1: Check if users exist
Visit the User Management page: http://localhost:5174/admin/users

Click "Create Test Users" to create the accounts automatically.

### Step 2: Manual user creation (if Step 1 fails)
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Users
3. Click "Add User"
4. Create these users:

**Admin User:**
- Email: `admin@sanissentinel.com`
- Password: `SaniSentinel2024!`
- ✅ Check "Email Confirm" (important!)

**Officer User:**
- Email: `officer@tamale.gov`
- Password: `Tamale2024!`
- ✅ Check "Email Confirm" (important!)

### Step 3: Verify user creation
Run this SQL in Supabase SQL Editor:

```sql
SELECT 
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov')
ORDER BY email;
```

### Step 4: Test login
1. Visit: http://localhost:5174/login-direct
2. Try logging in with the credentials
3. Check browser console for detailed error messages

### Step 5: Add user metadata (optional but recommended)
After users are created and working, run the SQL from `CHECK_AND_CREATE_USERS.sql` to add role and permission metadata.

## Common Issues:

### Issue 1: "User already registered"
- The user exists but may not be confirmed
- Check the "Email Confirm" box when creating manually

### Issue 2: "Invalid login credentials"
- User doesn't exist
- Password is wrong
- User exists but isn't confirmed

### Issue 3: "Email not confirmed"
- User was created but email wasn't confirmed
- Manually confirm in Supabase Dashboard or check "Email Confirm" during creation

## Quick Test:
Visit http://localhost:5174/admin/users and use the automated tools to create and test users.