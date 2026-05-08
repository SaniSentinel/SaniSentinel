# Climate Automation Cron Setup Instructions

## Overview
This guide will help you set up automated climate data fetching, risk assessment, and SMS alerts using PostgreSQL's pg_cron extension.

## Prerequisites
- Access to your Supabase dashboard
- Service role key from your Supabase project

## Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the **service_role** key (not the anon key)

## Step 2: Update the Migration File

The migration file `database/migrations/011_setup_climate_cron_schedule.sql` contains placeholder service role keys that need to be replaced.

**Find and replace ALL instances of:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4Nzg0OCwiZXhwIjoyMDkzNzYzODQ4fQ.C4JT8W8ygPGLKqJQQJQZ8Z9X8Z9X8Z9X8Z9X8Z9X8Z9
```

**With your actual service role key from Step 1.**

## Step 3: Execute the Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire content from `database/migrations/011_setup_climate_cron_schedule.sql` (after updating the service role key)
5. Execute the SQL

## Step 4: Verify the Setup

After running the migration, execute these queries to verify everything is working:

### Check Cron Jobs Status
```sql
SELECT * FROM climate_automation_status;
```

### View All Cron Jobs
```sql
SELECT * FROM get_cron_jobs();
```

### Test Manual Trigger
```sql
SELECT trigger_climate_fetch();
```

### Check Execution History
```sql
SELECT * FROM cron_job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Scheduled Jobs Created

1. **fetch-climate-6h**: Runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
   - Fetches weather data from Open-Meteo API
   - Saves climate snapshots to database
   - Calculates flood risk scores

2. **risk-assessment-after-climate**: Runs 30 minutes after climate fetch
   - Analyzes climate data and facility reports
   - Updates facility risk scores
   - Triggers alerts for critical conditions

3. **sms-critical-alerts-2h**: Runs every 2 hours
   - Sends SMS alerts for critical facility conditions
   - Uses Africa's Talking API
   - Manages alert frequency to avoid spam

## Monitoring and Management

### Management Functions
- `get_cron_jobs()` - View all climate-related cron jobs
- `trigger_climate_fetch()` - Manually trigger climate data fetch
- `trigger_risk_assessment()` - Manually trigger risk assessment

### Monitoring Views
- `cron_job_run_details` - Detailed execution history
- `climate_automation_status` - Summary of all automated processes

## Troubleshooting

### If Cron Jobs Don't Run
1. Check if pg_cron extension is enabled
2. Verify service role key is correct
3. Check Supabase logs for errors
4. Ensure Edge Functions are deployed and working

### If Edge Functions Fail
1. Check function logs in Supabase dashboard
2. Verify environment variables are set
3. Test functions manually first
4. Check API rate limits (Open-Meteo, Africa's Talking)

### Common Issues
- **Service role key expired**: Update with new key from dashboard
- **Function timeout**: Edge functions have 60-second timeout
- **API rate limits**: Open-Meteo allows 10,000 requests/day
- **SMS costs**: Monitor Africa's Talking usage to avoid unexpected charges

## Next Steps

After setup is complete:
1. Monitor the first few automated runs
2. Check climate data is being fetched correctly
3. Verify risk assessments are updating
4. Test SMS alerts (use test mode first)
5. Set up additional monitoring/alerting as needed

## Support

If you encounter issues:
1. Check Supabase function logs
2. Review cron job execution history
3. Test individual components manually
4. Verify all environment variables are set correctly