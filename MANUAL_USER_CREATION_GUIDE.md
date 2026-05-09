# Manual Test User Creation Guide

Since we're hitting email rate limits with the automated script, here's how to create the test users manually through the Supabase dashboard.

## 🎯 Test User Accounts to Create

### 1. **Admin Account**
- **Email**: `admin@sanissentinel.com`
- **Password**: `SaniSentinel2024!`
- **Role**: System Administrator
- **Permissions**: Full system access

### 2. **District Officer Account**
- **Email**: `officer@tamale.gov`
- **Password**: `Tamale2024!`
- **Role**: District Health Officer
- **District**: Tamale

## 🚀 Step-by-Step Creation Process

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your SaniSentinel project

### Step 2: Navigate to Authentication
1. In the left sidebar, click **"Authentication"**
2. Click on the **"Users"** tab
3. Click **"Add user"** button (top right)

### Step 3: Create Admin User
1. **Email**: `admin@sanissentinel.com`
2. **Password**: `SaniSentinel2024!`
3. **Auto Confirm User**: ✅ Check this box (to skip email confirmation)
4. Click **"Create user"**

### Step 4: Create District Officer User
1. Click **"Add user"** again
2. **Email**: `officer@tamale.gov`
3. **Password**: `Tamale2024!`
4. **Auto Confirm User**: ✅ Check this box
5. Click **"Create user"**

### Step 5: Add User Metadata (Optional)
For each user, you can add metadata:
1. Click on the user email in the users list
2. Scroll down to **"User Metadata"**
3. Click **"Edit"** and add:

**For Admin User:**
```json
{
  "role": "system_admin",
  "name": "System Administrator",
  "department": "IT Administration",
  "permissions": ["all"]
}
```

**For District Officer:**
```json
{
  "role": "district_officer",
  "name": "Tamale District Officer",
  "department": "Health Department",
  "district": "Tamale",
  "permissions": ["read", "write", "manage_facilities"]
}
```

## 🔧 Alternative: SQL Method

If you prefer to use SQL, you can run this in the Supabase SQL Editor:

```sql
-- First, run the workers table update migration
-- (This adds email field and new roles)

-- Add email field to workers table if not exists
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Update worker roles to include new ones
ALTER TABLE public.workers 
DROP CONSTRAINT IF EXISTS workers_role_check;

ALTER TABLE public.workers 
ADD CONSTRAINT workers_role_check 
CHECK (role IN (
    'field_worker', 
    'supervisor', 
    'maintenance_tech', 
    'health_officer', 
    'district_coordinator',
    'system_admin',
    'district_officer'
));

-- Insert worker profiles for test users
INSERT INTO public.workers (name, phone, email, district_id, role, active) VALUES
(
    'System Administrator',
    '+233241000001',
    'admin@sanissentinel.com',
    (SELECT id FROM public.districts WHERE name = 'Tamale'),
    'system_admin',
    TRUE
),
(
    'Tamale District Officer',
    '+233241000002', 
    'officer@tamale.gov',
    (SELECT id FROM public.districts WHERE name = 'Tamale'),
    'district_officer',
    TRUE
);
```

## 🧪 Testing the Accounts

### Step 1: Create a Login Page (if not exists)
If you don't have a login page yet, create a simple one:

```jsx
// src/pages/Login.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      console.log('Login successful:', data)
      // Redirect to dashboard
      window.location.href = '/dashboard'
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to SaniSentinel
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Test Accounts Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Test Accounts:</h3>
          <div className="text-xs text-blue-600 space-y-1">
            <div>Admin: admin@sanissentinel.com / SaniSentinel2024!</div>
            <div>Officer: officer@tamale.gov / Tamale2024!</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
```

### Step 2: Add Login Route
Add the login route to your App.jsx:

```jsx
import Login from './pages/Login'

// Add this route
<Route path="/login" element={<Login />} />
```

### Step 3: Test the Accounts
1. Navigate to `http://localhost:5174/login`
2. Try logging in with:
   - **Admin**: `admin@sanissentinel.com` / `SaniSentinel2024!`
   - **Officer**: `officer@tamale.gov` / `Tamale2024!`

## 🔐 Security Notes

- These are development/test accounts with strong passwords
- In production, ensure proper password policies
- Consider implementing role-based access control
- Admin account should have restricted access in production

## 🚨 Troubleshooting

### If Login Fails:
1. Check Supabase Auth settings
2. Verify email confirmation is disabled for test accounts
3. Check browser console for errors
4. Verify users exist in Supabase dashboard

### If Users Don't Appear:
1. Check the Authentication > Users tab in Supabase
2. Verify auto-confirm was enabled
3. Check email confirmation settings

## ✅ Success Checklist

- [ ] Admin user created: `admin@sanissentinel.com`
- [ ] District officer created: `officer@tamale.gov`
- [ ] Both users auto-confirmed
- [ ] Worker profiles created (optional)
- [ ] Login page accessible
- [ ] Both accounts can log in successfully
- [ ] Users redirect to dashboard after login

---

**Ready to test!** 🎉 Your test accounts are now set up and ready for development and testing.