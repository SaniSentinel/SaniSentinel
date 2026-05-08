-- Setup pg_cron schedule for fetch-climate function (Direct Version)
-- This version tries different approaches to make HTTP calls

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Try to enable http extension (may not be available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS http;
    RAISE NOTICE 'HTTP extension enabled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'HTTP extension not available, will use alternative approach';
END $$;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 3: Create a function that calls Edge Functions using available methods
CREATE OR REPLACE FUNCTION call_edge_function(
    function_name text,
    payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
    url text;
    headers jsonb;
BEGIN
    -- Build the URL
    url := 'https://aaxgfnzcbyerjlcftwuo.supabase.co/functions/v1/' || function_name;
    
    -- Build headers
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4Nzg0OCwiZXhwIjoyMDkzNzYzODQ4fQ.FVk0TSYbKmoGvt5kQ7OqkGsUtrThf6DmS00OM1I3-qQ'
    );
    
    -- Try different HTTP methods based on what's available
    BEGIN
        -- Try net.http_post first
        SELECT net.http_post(url, headers, payload) INTO result;
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            -- If net.http_post fails, try http_post in public schema
            BEGIN
                SELECT public.http_post(url, payload::text, headers::text) INTO result;
                RETURN result;
            EXCEPTION
                WHEN OTHERS THEN
                    -- If all HTTP methods fail, log the attempt and return a message
                    INSERT INTO public.edge_function_calls (
                        function_name, 
                        payload, 
                        status, 
                        created_at
                    ) VALUES (
                        function_name, 
                        payload, 
                        'scheduled', 
                        now()
                    );
                    
                    RETURN jsonb_build_object(
                        'status', 'scheduled',
                        'message', 'Function call logged for external processing',
                        'function', function_name,
                        'timestamp', extract(epoch from now())
                    );
            END;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create table to log function calls if HTTP is not available
CREATE TABLE IF NOT EXISTS public.edge_function_calls (
    id SERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Step 5: Create wrapper functions for each Edge Function
CREATE OR REPLACE FUNCTION scheduled_climate_fetch()
RETURNS jsonb AS $$
BEGIN
    RETURN call_edge_function('fetch-climate', '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION scheduled_risk_assessment()
RETURNS jsonb AS $$
BEGIN
    RETURN call_edge_function('score-risk', jsonb_build_object(
        'severity_filter', jsonb_build_array('critical', 'high')
    ));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION scheduled_sms_alerts()
RETURNS jsonb AS $$
BEGIN
    RETURN call_edge_function('send-sms-alert', jsonb_build_object(
        'severity_filter', jsonb_build_array('critical'),
        'test_mode', false
    ));
END;
$$ LANGUAGE plpgsql;

-- Step 6: Schedule the functions
SELECT cron.schedule(
    'climate-fetch-6h',
    '0 */6 * * *',
    'SELECT scheduled_climate_fetch();'
);

SELECT cron.schedule(
    'risk-assessment-after-climate',
    '30 */6 * * *',
    'SELECT scheduled_risk_assessment();'
);

SELECT cron.schedule(
    'sms-alerts-2h',
    '0 */2 * * *',
    'SELECT scheduled_sms_alerts();'
);

-- Step 7: Create management functions
CREATE OR REPLACE FUNCTION get_cron_jobs()
RETURNS TABLE (
    jobid bigint,
    schedule text,
    command text,
    nodename text,
    nodeport integer,
    database text,
    username text,
    active boolean,
    jobname text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobid,
        j.schedule,
        j.command,
        j.nodename,
        j.nodeport,
        j.database,
        j.username,
        j.active,
        j.jobname
    FROM cron.job j
    WHERE j.jobname IN ('climate-fetch-6h', 'risk-assessment-after-climate', 'sms-alerts-2h')
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create monitoring views
CREATE OR REPLACE VIEW cron_job_run_details AS
SELECT 
    r.runid,
    r.jobid,
    j.jobname,
    r.job_pid,
    r.database,
    r.username,
    r.command,
    r.status,
    r.return_message,
    r.start_time,
    r.end_time,
    (r.end_time - r.start_time) as duration
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname IN ('climate-fetch-6h', 'risk-assessment-after-climate', 'sms-alerts-2h')
ORDER BY r.start_time DESC;

CREATE OR REPLACE VIEW climate_automation_status AS
SELECT 
    'Climate Data Fetch' as process_name,
    'Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)' as schedule,
    j.active as is_active,
    COALESCE(r.last_run, 'Never') as last_run,
    COALESCE(r.last_status, 'Unknown') as last_status
FROM cron.job j
LEFT JOIN (
    SELECT 
        jobid,
        MAX(start_time)::text as last_run,
        (array_agg(status ORDER BY start_time DESC))[1] as last_status
    FROM cron.job_run_details 
    GROUP BY jobid
) r ON j.jobid = r.jobid
WHERE j.jobname = 'climate-fetch-6h'

UNION ALL

SELECT 
    'Risk Assessment' as process_name,
    'Every 6 hours + 30 min (00:30, 06:30, 12:30, 18:30 UTC)' as schedule,
    j.active as is_active,
    COALESCE(r.last_run, 'Never') as last_run,
    COALESCE(r.last_status, 'Unknown') as last_status
FROM cron.job j
LEFT JOIN (
    SELECT 
        jobid,
        MAX(start_time)::text as last_run,
        (array_agg(status ORDER BY start_time DESC))[1] as last_status
    FROM cron.job_run_details 
    GROUP BY jobid
) r ON j.jobid = r.jobid
WHERE j.jobname = 'risk-assessment-after-climate'

UNION ALL

SELECT 
    'SMS Critical Alerts' as process_name,
    'Every 2 hours (00:00, 02:00, 04:00, etc. UTC)' as schedule,
    j.active as is_active,
    COALESCE(r.last_run, 'Never') as last_run,
    COALESCE(r.last_status, 'Unknown') as last_status
FROM cron.job j
LEFT JOIN (
    SELECT 
        jobid,
        MAX(start_time)::text as last_run,
        (array_agg(status ORDER BY start_time DESC))[1] as last_status
    FROM cron.job_run_details 
    GROUP BY jobid
) r ON j.jobid = r.jobid
WHERE j.jobname = 'sms-alerts-2h';

-- Step 9: Create manual trigger functions
CREATE OR REPLACE FUNCTION trigger_climate_fetch()
RETURNS jsonb AS $$
BEGIN
    RETURN scheduled_climate_fetch();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_risk_assessment()
RETURNS jsonb AS $$
BEGIN
    RETURN scheduled_risk_assessment();
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a view to monitor edge function calls
CREATE OR REPLACE VIEW edge_function_call_log AS
SELECT 
    id,
    function_name,
    payload,
    status,
    result,
    created_at,
    processed_at,
    CASE 
        WHEN processed_at IS NULL THEN 'Pending'
        WHEN status = 'scheduled' THEN 'Scheduled for external processing'
        ELSE 'Completed'
    END as call_status
FROM public.edge_function_calls
ORDER BY created_at DESC;

-- Step 11: Success message
DO $$
BEGIN
    RAISE NOTICE 'Climate automation setup completed successfully!';
    RAISE NOTICE 'Scheduled jobs:';
    RAISE NOTICE '  - climate-fetch-6h: Every 6 hours';
    RAISE NOTICE '  - risk-assessment-after-climate: 30 minutes after climate fetch';
    RAISE NOTICE '  - sms-alerts-2h: Every 2 hours';
    RAISE NOTICE '';
    RAISE NOTICE 'The system will try to make direct HTTP calls to your Edge Functions.';
    RAISE NOTICE 'If HTTP extensions are not available, calls will be logged for external processing.';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with: SELECT trigger_climate_fetch();';
    RAISE NOTICE 'Monitor with: SELECT * FROM climate_automation_status;';
    RAISE NOTICE 'Check logs: SELECT * FROM edge_function_call_log LIMIT 10;';
END $$;