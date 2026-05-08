# SaniSentinel Row Level Security (RLS) Guide

## Overview

This document explains the Row Level Security implementation for the SaniSentinel database. RLS is enabled on all tables with carefully designed policies to balance security with functionality.

## Security Architecture

### 1. **Basic Security Model (Current Implementation)**

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Table           │ SELECT   │ INSERT   │ UPDATE   │ DELETE   │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ districts       │ Public   │ Auth     │ Auth     │ Auth     │
│ facilities      │ Public   │ Auth     │ Auth     │ Auth     │
│ reports         │ Public   │ Auth+Anon│ Auth     │ Auth     │
│ alerts          │ Public   │ Auth+Sys │ Auth     │ Auth     │
│ workers         │ Public   │ Auth     │ Auth     │ Auth     │
│ maintenance     │ Public   │ Auth     │ Auth     │ Auth     │
│ climate         │ Public   │ Auth+Sys │ Auth     │ Auth     │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘

Legend:
- Public: Anyone can access
- Auth: Authenticated users only
- Anon: Anonymous users (for SMS)
- Sys: Service role (for automation)
```

### 2. **User Roles**

| Role | Description | Access Level |
|------|-------------|--------------|
| `anon` | Anonymous users | SMS submissions, public data viewing |
| `authenticated` | Logged-in users | Full CRUD operations |
| `service_role` | System processes | Automated data insertion, trigger execution |

## Table-Specific Policies

### Districts Table
```sql
-- Public read access for location data
CREATE POLICY "districts_select_policy" ON public.districts
    FOR SELECT USING (true);

-- Authenticated users can manage districts
CREATE POLICY "districts_insert_policy" ON public.districts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Facilities Table
```sql
-- Public read access for facility information
CREATE POLICY "facilities_select_policy" ON public.facilities
    FOR SELECT USING (true);

-- Only authenticated users can modify facilities
CREATE POLICY "facilities_update_policy" ON public.facilities
    FOR UPDATE USING (auth.role() = 'authenticated');
```

### Reports Table
```sql
-- Public read access for transparency
CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (true);

-- Both authenticated users and anonymous SMS can create reports
CREATE POLICY "reports_insert_authenticated_policy" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reports_insert_anonymous_policy" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'anon');
```

### Alerts Table
```sql
-- Public read access for community awareness
CREATE POLICY "alerts_select_policy" ON public.alerts
    FOR SELECT USING (true);

-- System can auto-generate alerts
CREATE POLICY "alerts_insert_system_policy" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### Workers Table
```sql
-- Public read access for contact information
CREATE POLICY "workers_select_policy" ON public.workers
    FOR SELECT USING (true);

-- Only authenticated users can manage workers
CREATE POLICY "workers_insert_policy" ON public.workers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Maintenance Tasks Table
```sql
-- Public read access for transparency
CREATE POLICY "maintenance_tasks_select_policy" ON public.maintenance_tasks
    FOR SELECT USING (true);

-- Authenticated users can manage tasks
CREATE POLICY "maintenance_tasks_update_policy" ON public.maintenance_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');
```

### Climate Snapshots Table
```sql
-- Public read access for weather information
CREATE POLICY "climate_snapshots_select_policy" ON public.climate_snapshots
    FOR SELECT USING (true);

-- System can insert automated weather data
CREATE POLICY "climate_snapshots_insert_system_policy" ON public.climate_snapshots
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

## Advanced Security Options

### Level 2: Worker-Specific Isolation

For enhanced security, you can enable worker-specific policies where workers can only see/edit their own assigned tasks:

```sql
-- Workers can only see their own assigned tasks
CREATE POLICY "maintenance_tasks_worker_select_policy" ON public.maintenance_tasks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        assigned_to IN (
            SELECT id FROM public.workers 
            WHERE phone = auth.jwt() ->> 'phone'
        )
    );
```

### Level 3: District-Based Isolation

For maximum security, you can enable district-based policies where users can only access data from their assigned district:

```sql
-- Users can only see facilities in their district
CREATE POLICY "facilities_district_policy" ON public.facilities
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        district_id IN (
            SELECT district_id FROM public.workers 
            WHERE phone = auth.jwt() ->> 'phone'
        )
    );
```

## Function Security

### Public Functions (Available to All)
- `get_districts_within_radius()` - Geographic queries
- `get_latest_climate_data()` - Weather information
- `calculate_flood_risk()` - Risk calculations

### Authenticated Functions
- `get_facilities_within_radius()` - Facility searches
- `get_workers_in_district()` - Worker management
- `get_workers_by_role()` - Role-based queries

### System Functions (Service Role Only)
- `update_facility_status_from_report()` - Auto-updates
- `generate_risk_alert()` - Alert generation
- `create_maintenance_task_from_alert()` - Task automation

### Anonymous Functions (SMS Support)
- `get_worker_by_phone()` - SMS worker identification

## Real-time Security

All tables are enabled for real-time subscriptions with the same RLS policies applied to live updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.facilities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
-- ... etc
```

## Implementation Steps

### 1. Run the RLS Migration
```sql
-- Execute the RLS setup
\i database/migrations/008_enable_rls_and_policies.sql
```

### 2. Verify Policies
```sql
-- Check enabled RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Test Access Levels
```javascript
// Test anonymous access (should work for SMS)
const { data } = await supabase.from('reports').insert({...})

// Test authenticated access (should work for dashboard)
const { data } = await supabase.auth.signIn({...})
const { data } = await supabase.from('facilities').update({...})
```

## Security Best Practices

### 1. **Principle of Least Privilege**
- Users only get minimum required access
- System functions restricted to service role
- Anonymous access limited to SMS functionality

### 2. **Defense in Depth**
- RLS policies at database level
- Application-level validation
- API endpoint authentication

### 3. **Audit Trail**
- All modifications require authentication
- Timestamps on all records
- Real-time monitoring of changes

### 4. **Data Transparency**
- Public read access supports community engagement
- Transparent reporting builds trust
- Open data enables third-party integrations

## Troubleshooting

### Common Issues

1. **"Permission Denied" Errors**
   - Check if user is authenticated
   - Verify correct role assignment
   - Ensure policies are properly created

2. **SMS Submissions Failing**
   - Verify anonymous insert policies
   - Check webhook authentication
   - Test with service role if needed

3. **Real-time Updates Not Working**
   - Confirm realtime is enabled on tables
   - Check RLS policies apply to subscriptions
   - Verify client authentication

### Policy Testing

```sql
-- Test as anonymous user
SET ROLE anon;
SELECT * FROM public.reports LIMIT 1;

-- Test as authenticated user  
SET ROLE authenticated;
UPDATE public.facilities SET status = 'good' WHERE id = '...';

-- Reset to default
RESET ROLE;
```

## Migration Rollback

If you need to disable RLS:

```sql
-- Disable RLS on all tables
ALTER TABLE public.districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_snapshots DISABLE ROW LEVEL SECURITY;
```

## Conclusion

The RLS implementation provides a secure foundation for SaniSentinel while maintaining the flexibility needed for SMS integration and public transparency. The three-tier security model allows you to choose the appropriate level of isolation for your deployment needs.