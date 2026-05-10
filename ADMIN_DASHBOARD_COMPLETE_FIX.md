# Admin Dashboard Complete Fix Guide

## 🚨 Issue Summary
You're logged in as System Administrator but cannot see facilities on the GIS Map or data from district officers.

## 🔧 Complete Solution

### Step 1: Run the Complete Fix Script
Copy and paste the entire content of `COMPLETE_ADMIN_FIX.sql` into your Supabase SQL Editor and run it.

This script will:
- ✅ Check your authentication status
- ✅ Verify admin user metadata is correct
- ✅ Create districts if missing (Tamale, Savelugu, Tolon, etc.)
- ✅ Create sample facilities with coordinates
- ✅ Create sample reports and alerts
- ✅ Test RLS policies
- ✅ Provide debugging information

### Step 2: Verify Your Login Credentials
Make sure you're using the correct admin credentials:
- **Email**: `admin@sanissentinel.com`
- **Password**: `SaniSentinel2024!`

### Step 3: Check Browser Console
1. Go to `/facility-map` in your browser
2. Open Developer Tools (F12)
3. Check the Console tab for any JavaScript errors
4. Check the Network tab to see if Supabase queries are working

### Step 4: Test Manual Query
In your browser console, run:
```javascript
// Test if you can fetch facilities
supabase.from('facilities').select('*').then(console.log)

// Test authentication
supabase.auth.getUser().then(console.log)
```

## 🎯 Expected Results After Fix

### Database Data
- **Facilities**: 10+ facilities with coordinates around Tamale
- **Reports**: Sample reports from district officers
- **Alerts**: Active alerts for critical facilities
- **Districts**: Tamale, Savelugu, Tolon, Kumbungu, Nanton

### Map Display
- **Center**: Tamale (9.4034, -0.8424)
- **Markers**: Colored risk-based markers
- **Colors**: 
  - 🟢 Green (Good: 0-29)
  - 🟡 Yellow (At Risk: 30-59)
  - 🟠 Orange (High Risk: 60-84)
  - 🔴 Red (Critical: 85-100)

### Admin Access
- Can see ALL facilities across ALL districts
- Can see ALL reports from district officers
- Can see ALL alerts and maintenance tasks

## 🔍 Troubleshooting Steps

### If Map is Still Empty:

1. **Check Authentication**:
   ```sql
   SELECT 
       auth.jwt() ->> 'email' as current_user,
       public.get_user_role() as role,
       public.is_admin() as is_admin;
   ```

2. **Check Facility Data**:
   ```sql
   SELECT COUNT(*) as total, 
          COUNT(*) FILTER (WHERE lat IS NOT NULL) as with_coords
   FROM public.facilities;
   ```

3. **Check RLS Access**:
   ```sql
   SELECT * FROM public.rls_policy_test;
   ```

### If Authentication Issues:
1. Log out completely
2. Clear browser cache
3. Log back in with admin credentials
4. Check that user metadata is set correctly

### If Data Issues:
1. Run the facility seeding migration: `database/migrations/010_seed_tamale_facilities.sql`
2. Ensure coordinates are not NULL
3. Check that districts exist

## 🚀 Quick Test Commands

Run these in Supabase SQL Editor to verify everything is working:

```sql
-- 1. Check admin authentication
SELECT 
    auth.jwt() ->> 'email' as user,
    public.is_admin() as is_admin;

-- 2. Check facility count with coordinates
SELECT 
    COUNT(*) as total_facilities,
    COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NOT NULL) as with_coordinates
FROM public.facilities;

-- 3. Check sample facilities for map
SELECT name, lat, lng, risk_score, status 
FROM public.facilities 
WHERE lat IS NOT NULL 
LIMIT 5;

-- 4. Test RLS policies
SELECT table_name, visible_rows, is_admin 
FROM public.rls_policy_test;
```

## ✅ Success Indicators

You'll know it's working when:
- ✅ SQL queries show you as authenticated admin
- ✅ Facility count > 0 with coordinates
- ✅ RLS test shows admin can see all data
- ✅ Map displays colored markers around Tamale
- ✅ Clicking markers shows facility popups
- ✅ Dashboard shows reports and alerts from district officers

## 📞 If Still Not Working

If the issue persists after running the fix script:

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are successful
3. **Test Different Browser**: Rule out browser-specific issues
4. **Check Supabase Logs**: Look for database errors
5. **Verify Environment**: Ensure `.env` file has correct Supabase credentials

The fix script addresses all common causes of this issue. Most likely, you just need to run it and refresh your browser!