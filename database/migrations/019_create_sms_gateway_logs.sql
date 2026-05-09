-- ============================================================================
-- SMS GATEWAY LOGS
-- Full inbound/outbound SMS history across all districts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sms_gateway_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'sent', 'failed')),
    phone_from TEXT,
    phone_to TEXT,
    message TEXT NOT NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    provider_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_gateway_logs_created_at ON public.sms_gateway_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_gateway_logs_direction ON public.sms_gateway_logs(direction);
CREATE INDEX IF NOT EXISTS idx_sms_gateway_logs_district_id ON public.sms_gateway_logs(district_id);
CREATE INDEX IF NOT EXISTS idx_sms_gateway_logs_facility_id ON public.sms_gateway_logs(facility_id);

ALTER TABLE public.sms_gateway_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sms_gateway_logs_admin_read" ON public.sms_gateway_logs;
CREATE POLICY "sms_gateway_logs_admin_read"
ON public.sms_gateway_logs
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "sms_gateway_logs_service_insert" ON public.sms_gateway_logs;
CREATE POLICY "sms_gateway_logs_service_insert"
ON public.sms_gateway_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
