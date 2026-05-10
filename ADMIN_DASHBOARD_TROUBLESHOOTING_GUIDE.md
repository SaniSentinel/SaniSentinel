# Admin Dashboard Troubleshooting Guide

## 🚨 Issue: Admin Dashboard Not Showing Data

If you're logged in as admin but not seeing reports or data from district officers, here's how to troubleshoot:

## 🔍 Step-by-Step Diagnosis

### **Step 1: Check Authentication Status**
Run this in Supabase SQL Editor:
```sql
-- Copy and paste content from: CHECK_USER_AUTHENTICATION.sql
```

**Expected Results for Admin:**
- ✅ Authentication Status: `admin@sanissentinel.com`
- ✅ User Role: `system_admin`
- ✅ Admin Status: `true`
- ✅ Should see ALL rows in ALL tables

### **Step 2: Check if Data Exists**
Run this in Supabase SQL Editor:
```sql
-- Copy and paste content from: TROUBLESHOOT_ADMIN_DASHBOARD.sql
```

**Look for:**
- Total row counts for each table
- Whether Tamale district exists
- Whether facilities exist in Tamale
- Whether reports/alerts exist

### **Step 3: Create Test Data (if needed)**
If tables are empty, run:
```sql
-- Copy and paste content from: CREATE_TEST_DATA.sql
```

This will create:
- Sample reports for existing facilities
- Test alerts with various severities
- Maintenance tasks
- Climate data snapshots

## 🔧 Common Issues & Solutions

### **Issue 1: User Not Properly Authenticated**
**Symptoms:** Shows "NOT LOGGED IN" or "ANONYMOUS USER"
**Solution:**
1. Go to http://localhost:5174/login
2. Use admin credentials: `admin@sanissentinel.com` / `SaniSentinel2024!`
3. Verify login is successful

### **Issue 2: User Has No Role or Wrong Role**
**Symptoms:** Shows "NO ROLE" or role is not "system_admin"
**Solution:** Run this SQL in Supabase:
```sql
-- Get Tamale district ID first
SELECT id FROM public.districts WHERE name = 'Tamale';

-- Update admin user metadata (replace DISTRICT_ID with actual ID)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'system_admin',
    'name', 'System Administrator',
    'district_id', 'DISTRICT_ID_HERE',
    'department', 'IT Administration',
    'permissions', '["all"]'::jsonb,
    'title', 'System Administrator'
)
WHERE email = 'admin@sanissentinel.com';
```

### **Issue 3: No Data in Database**
**Symptoms:** All tables show 0 rows
**Solution:**
1. Check if basic migrations were run (districts, facilities)
2. Run `CREATE_TEST_DATA.sql` to add sample data
3. Verify data was created

### **Issue 4: RLS Policies Too Restrictive**
**Symptoms:** Admin sees 0 rows but should see all data
**Solution:** Check RLS policy test:
```sql
SELECT * FROM public.rls_policy_test;
```
Admin should see ALL data. If not, RLS policies may need adjustment.

### **Issue 5: Email Not Confirmed**
**Symptoms:** User exists but login fails
**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Click "..." → "Confirm Email"

## 🧪 Testing Your Fix

After applying fixes, test with:

```sql
-- 1. Check authentication
SELECT 
    auth.jwt() ->> 'email' as current_user,
    public.get_user_role() as role,
    public.is_admin() as is_admin;

-- 2. Check data visibility
SELECT * FROM public.rls_policy_test;

-- 3. Check sample data
SELECT COUNT(*) as report_count FROM public.reports;
SELECT COUNT(*) as alert_count FROM public.alerts;
SELECT COUNT(*) as facility_count FROM public.facilities;
```

**Expected Results for Admin:**
- Current user: `admin@sanissentinel.com`
- Role: `system_admin`
- Is admin: `true`
- Should see ALL rows in ALL tables

## 🎯 Frontend Dashboard Queries

If authentication and data are correct but dashboard still empty, check your frontend queries. Admin should be able to query:

```javascript
// These should work for admin users
const { data: reports } = await supabase.from('reports').select('*')
const { data: alerts } = await supabase.from('alerts').select('*')
const { data: facilities } = await supabase.from('facilities').select('*')
```

## 📊 Expected Admin Dashboard Data

Once fixed, admin dashboard should show:
- **All Districts**: Can see data from all districts, not just one
- **All Reports**: From all district officers and workers
- **All Alerts**: Across all facilities and districts
- **All Facilities**: Complete facility list
- **All Workers**: Staff from all districts
- **All Maintenance Tasks**: Tasks across all districts

## 🔗 Quick Links

- **Login**: http://localhost:5174/login
- **Dashboard**: http://localhost:5174/dashboard
- **Auth Demo**: http://localhost:5174/demo/auth
- **Route Test**: http://localhost:5174/test/routes

## ✅ Success Checklist

- [ ] User is authenticated as `admin@sanissentinel.com`
- [ ] User role is `system_admin`
- [ ] `public.is_admin()` returns `true`
- [ ] RLS policy test shows data in all tables
- [ ] Sample data exists (reports, alerts, facilities)
- [ ] Dashboard displays data from all districts
- [ ] Can see reports from district officers

If all items are checked, your admin dashboard should be working correctly!