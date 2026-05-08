# Quick Setup Guide - Climate Automation

## 🚀 Step-by-Step Setup (5 minutes)

### Step 1: Get Your Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (the long one, not anon)

### Step 2: Prepare the SQL
1. Open `database/migrations/011_setup_climate_cron_schedule_simple.sql`
2. **Find and replace ALL instances** of `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
3. Save the file

### Step 3: Run in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the **entire content** from the simple migration file
5. Click **Run**

### Step 4: Verify Setup
Run this query to check if everything is working:

```sql
SELECT * FROM climate_automation_status;
```

You should see 3 processes listed with their schedules.

### Step 5: Test Manual Trigger
Test the climate fetch manually:

```sql
SELECT trigger_climate_fetch();
```

This should return a JSON response indicating success.

## 🔍 Troubleshooting

### If you get "could not find valid entry" error:
- This is normal on first run - the error happens when trying to remove non-existent jobs
- The simple version handles this gracefully
- Just continue with the setup

### If cron jobs don't appear:
1. Check if pg_cron extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Verify your service role key is correct
3. Check Supabase logs for any errors

### If functions fail:
1. Make sure your Edge Functions are deployed
2. Check function logs in Supabase Dashboard
3. Verify environment variables are set

## 📊 What Gets Created

### Cron Jobs:
- `fetch-climate-6h`: Runs every 6 hours
- `risk-assessment-after-climate`: Runs 30 min after climate fetch  
- `sms-critical-alerts-2h`: Runs every 2 hours

### Management Functions:
- `get_cron_jobs()`: View all scheduled jobs
- `trigger_climate_fetch()`: Manual climate data fetch
- `trigger_risk_assessment()`: Manual risk assessment

### Monitoring Views:
- `climate_automation_status`: Summary of all processes
- `cron_job_run_details`: Detailed execution history

## ✅ Success Indicators

After setup, you should see:
1. ✅ 3 cron jobs scheduled
2. ✅ Management functions created
3. ✅ Monitoring views available
4. ✅ Manual trigger works
5. ✅ No errors in execution

The system will now automatically fetch climate data every 6 hours and send alerts as needed!