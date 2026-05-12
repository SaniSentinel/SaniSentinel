-- Add dedicated alert type for worker USSD task status report-backs
-- so officer dashboards can distinguish these notifications.

ALTER TABLE public.alerts
DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE public.alerts
ADD CONSTRAINT alerts_alert_type_check
CHECK (
  alert_type IN (
    'maintenance_due',
    'high_risk',
    'critical_status',
    'overflow_detected',
    'system_failure',
    'climate_warning',
    'worker_task_update'
  )
);
