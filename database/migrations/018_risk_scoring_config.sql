-- ============================================================================
-- RISK SCORING CONFIGURATION
-- Allows admins to tune scoring weights and thresholds without code changes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.risk_scoring_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    climate_weight NUMERIC(6,4) NOT NULL DEFAULT 0.30,
    condition_weight NUMERIC(6,4) NOT NULL DEFAULT 1.00,
    maintenance_weight NUMERIC(6,4) NOT NULL DEFAULT 1.00,
    reports_weight NUMERIC(6,4) NOT NULL DEFAULT 1.00,
    location_weight NUMERIC(6,4) NOT NULL DEFAULT 1.00,
    critical_threshold INTEGER NOT NULL DEFAULT 80,
    high_threshold INTEGER NOT NULL DEFAULT 60,
    medium_threshold INTEGER NOT NULL DEFAULT 40,
    low_threshold INTEGER NOT NULL DEFAULT 20,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT risk_config_threshold_order CHECK (
        critical_threshold > high_threshold AND
        high_threshold > medium_threshold AND
        medium_threshold > low_threshold
    )
);

ALTER TABLE public.risk_scoring_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_scoring_config_read_all_authenticated" ON public.risk_scoring_config;
CREATE POLICY "risk_scoring_config_read_all_authenticated"
ON public.risk_scoring_config
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "risk_scoring_config_write_admin_only" ON public.risk_scoring_config;
CREATE POLICY "risk_scoring_config_write_admin_only"
ON public.risk_scoring_config
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS handle_risk_scoring_config_updated_at ON public.risk_scoring_config;
CREATE TRIGGER handle_risk_scoring_config_updated_at
    BEFORE UPDATE ON public.risk_scoring_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_active_risk_scoring_config()
RETURNS public.risk_scoring_config AS $$
DECLARE
    cfg public.risk_scoring_config;
BEGIN
    SELECT *
    INTO cfg
    FROM public.risk_scoring_config
    WHERE active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1;

    RETURN cfg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_risk_scoring_config(
    p_climate_weight NUMERIC,
    p_condition_weight NUMERIC,
    p_maintenance_weight NUMERIC,
    p_reports_weight NUMERIC,
    p_location_weight NUMERIC,
    p_critical_threshold INTEGER,
    p_high_threshold INTEGER,
    p_medium_threshold INTEGER,
    p_low_threshold INTEGER
)
RETURNS public.risk_scoring_config AS $$
DECLARE
    updated_cfg public.risk_scoring_config;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can update risk scoring configuration';
    END IF;

    INSERT INTO public.risk_scoring_config (
        climate_weight,
        condition_weight,
        maintenance_weight,
        reports_weight,
        location_weight,
        critical_threshold,
        high_threshold,
        medium_threshold,
        low_threshold,
        active
    )
    VALUES (
        p_climate_weight,
        p_condition_weight,
        p_maintenance_weight,
        p_reports_weight,
        p_location_weight,
        p_critical_threshold,
        p_high_threshold,
        p_medium_threshold,
        p_low_threshold,
        TRUE
    )
    RETURNING * INTO updated_cfg;

    RETURN updated_cfg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_active_risk_scoring_config() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_risk_scoring_config(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

INSERT INTO public.risk_scoring_config (
    climate_weight,
    condition_weight,
    maintenance_weight,
    reports_weight,
    location_weight,
    critical_threshold,
    high_threshold,
    medium_threshold,
    low_threshold,
    active
)
SELECT 0.30, 1.00, 1.00, 1.00, 1.00, 80, 60, 40, 20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.risk_scoring_config);
