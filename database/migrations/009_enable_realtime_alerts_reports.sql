-- Enable Supabase Realtime on 'alerts' and 'reports' tables
-- This ensures live updates for critical system notifications and field reports

-- =============================================================================
-- ENABLE REALTIME FOR ALERTS TABLE
-- =============================================================================

-- Add alerts table to realtime publication (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
        RAISE NOTICE 'Added alerts table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'Alerts table already in supabase_realtime publication';
    END IF;
END $$;

-- =============================================================================
-- ENABLE REALTIME FOR REPORTS TABLE
-- =============================================================================

-- Add reports table to realtime publication (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
        RAISE NOTICE 'Added reports table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'Reports table already in supabase_realtime publication';
    END IF;
END $$;

-- =============================================================================
-- VERIFY REALTIME CONFIGURATION
-- =============================================================================

-- Show current realtime publication status
SELECT 
    'alerts' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'alerts'
        ) THEN 'ENABLED'
        ELSE 'DISABLED'
    END as realtime_status
UNION ALL
SELECT 
    'reports' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'reports'
        ) THEN 'ENABLED'
        ELSE 'DISABLED'
    END as realtime_status
ORDER BY table_name;

-- =============================================================================
-- REALTIME USAGE EXAMPLES
-- =============================================================================

/*
Now you can subscribe to real-time changes in your JavaScript/TypeScript code:

// Subscribe to new alerts
const alertsSubscription = supabase
  .channel('alerts_changes')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'alerts' 
    }, 
    (payload) => {
      console.log('New alert created:', payload.new)
      // Handle new alert (show notification, update UI, etc.)
    }
  )
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'alerts' 
    }, 
    (payload) => {
      console.log('Alert updated:', payload.new)
      // Handle alert resolution, status changes, etc.
    }
  )
  .subscribe()

// Subscribe to new reports
const reportsSubscription = supabase
  .channel('reports_changes')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'reports' 
    }, 
    (payload) => {
      console.log('New report submitted:', payload.new)
      // Handle new field report (update dashboard, trigger alerts, etc.)
    }
  )
  .subscribe()

// Subscribe to both alerts and reports in one channel
const combinedSubscription = supabase
  .channel('critical_updates')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'alerts' 
    }, 
    (payload) => {
      console.log('Alert change:', payload)
    }
  )
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'reports' 
    }, 
    (payload) => {
      console.log('Report change:', payload)
    }
  )
  .subscribe()

// Unsubscribe when component unmounts
// alertsSubscription.unsubscribe()
// reportsSubscription.unsubscribe()
// combinedSubscription.unsubscribe()
*/