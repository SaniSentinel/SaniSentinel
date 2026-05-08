-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('maintenance_due', 'high_risk', 'critical_status', 'overflow_detected', 'system_failure', 'climate_warning')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_facility_id ON public.alerts(facility_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to alerts" ON public.alerts
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow system to insert alerts (for automated alert generation)
CREATE POLICY "Allow system insert for alerts" ON public.alerts
    FOR INSERT WITH CHECK (true);

-- Create function to automatically generate alerts based on facility risk score
CREATE OR REPLACE FUNCTION generate_risk_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate critical alert for risk score >= 85
    IF NEW.risk_score >= 85 AND (OLD.risk_score IS NULL OR OLD.risk_score < 85) THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        VALUES (
            NEW.id,
            'critical_status',
            'critical',
            'Facility "' || NEW.name || '" has reached critical risk level (score: ' || NEW.risk_score || '). Immediate attention required.'
        );
    END IF;
    
    -- Generate high risk alert for risk score >= 60 and < 85
    IF NEW.risk_score >= 60 AND NEW.risk_score < 85 AND (OLD.risk_score IS NULL OR OLD.risk_score < 60) THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        VALUES (
            NEW.id,
            'high_risk',
            'high',
            'Facility "' || NEW.name || '" is at high risk (score: ' || NEW.risk_score || '). Maintenance recommended.'
        );
    END IF;
    
    -- Generate maintenance due alert for facilities not serviced in 90+ days
    IF NEW.last_serviced IS NOT NULL AND NEW.last_serviced <= CURRENT_DATE - INTERVAL '90 days' 
       AND (OLD.last_serviced IS NULL OR OLD.last_serviced > CURRENT_DATE - INTERVAL '90 days') THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        VALUES (
            NEW.id,
            'maintenance_due',
            'medium',
            'Facility "' || NEW.name || '" has not been serviced for over 90 days. Maintenance is due.'
        );
    END IF;
    
    -- Generate overflow alert
    IF NEW.status = 'overflow' AND (OLD.status IS NULL OR OLD.status != 'overflow') THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        VALUES (
            NEW.id,
            'overflow_detected',
            'high',
            'Overflow detected at facility "' || NEW.name || '". Immediate cleanup required.'
        );
    END IF;
    
    -- Generate system failure alert
    IF NEW.status = 'out_of_service' AND (OLD.status IS NULL OR OLD.status != 'out_of_service') THEN
        INSERT INTO public.alerts (facility_id, alert_type, severity, message)
        VALUES (
            NEW.id,
            'system_failure',
            'critical',
            'System failure at facility "' || NEW.name || '". Facility is out of service.'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate alerts when facility data changes
CREATE TRIGGER generate_facility_alerts
    AFTER INSERT OR UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION generate_risk_alert();

-- Create function to auto-resolve alerts when facility status improves
CREATE OR REPLACE FUNCTION auto_resolve_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-resolve overflow alerts when status changes from overflow
    IF OLD.status = 'overflow' AND NEW.status != 'overflow' THEN
        UPDATE public.alerts 
        SET resolved = TRUE 
        WHERE facility_id = NEW.id 
          AND alert_type = 'overflow_detected' 
          AND resolved = FALSE;
    END IF;
    
    -- Auto-resolve system failure alerts when status changes from out_of_service
    IF OLD.status = 'out_of_service' AND NEW.status != 'out_of_service' THEN
        UPDATE public.alerts 
        SET resolved = TRUE 
        WHERE facility_id = NEW.id 
          AND alert_type = 'system_failure' 
          AND resolved = FALSE;
    END IF;
    
    -- Auto-resolve high risk alerts when risk score drops below 60
    IF OLD.risk_score >= 60 AND NEW.risk_score < 60 THEN
        UPDATE public.alerts 
        SET resolved = TRUE 
        WHERE facility_id = NEW.id 
          AND alert_type IN ('high_risk', 'critical_status') 
          AND resolved = FALSE;
    END IF;
    
    -- Auto-resolve maintenance alerts when facility is serviced
    IF OLD.last_serviced != NEW.last_serviced AND NEW.last_serviced >= CURRENT_DATE - INTERVAL '30 days' THEN
        UPDATE public.alerts 
        SET resolved = TRUE 
        WHERE facility_id = NEW.id 
          AND alert_type = 'maintenance_due' 
          AND resolved = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-resolve alerts when facility status improves
CREATE TRIGGER auto_resolve_facility_alerts
    AFTER UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION auto_resolve_alerts();

-- Enable Realtime for alerts table (for live dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Insert sample alerts data based on existing facilities
INSERT INTO public.alerts (facility_id, alert_type, severity, message, resolved, created_at) VALUES
    -- Critical alerts for overflow facilities
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Market Toilet Complex'), 'overflow_detected', 'high', 'Overflow detected at facility "Yendi Market Toilet Complex". Immediate cleanup required.', FALSE, '2024-02-14 14:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon School Block'), 'overflow_detected', 'high', 'Overflow detected at facility "Tolon School Block". Immediate cleanup required.', FALSE, '2024-02-10 13:30:00+00'),
    
    -- High risk alerts for damaged facilities
    ((SELECT id FROM public.facilities WHERE name = 'Tamale School Block Latrine'), 'high_risk', 'high', 'Facility "Tamale School Block Latrine" is at high risk (score: 65). Maintenance recommended.', FALSE, '2024-02-13 09:00:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Salaga Market Toilet'), 'high_risk', 'high', 'Facility "Salaga Market Toilet" is at high risk (score: 65). Maintenance recommended.', TRUE, '2024-02-13 09:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Karaga Community Toilet'), 'high_risk', 'high', 'Facility "Karaga Community Toilet" is at high risk (score: 65). Maintenance recommended.', FALSE, '2024-02-11 12:15:00+00'),
    
    -- Maintenance due alerts
    ((SELECT id FROM public.facilities WHERE name = 'Gushiegu School Latrine'), 'maintenance_due', 'medium', 'Facility "Gushiegu School Latrine" has not been serviced for over 90 days. Maintenance is due.', FALSE, '2024-02-11 15:35:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Community Latrine'), 'maintenance_due', 'medium', 'Facility "Yendi Community Latrine" has not been serviced for over 90 days. Maintenance is due.', FALSE, '2024-02-12 11:25:00+00'),
    
    -- Blocked facility alerts
    ((SELECT id FROM public.facilities WHERE name = 'Chereponi Community Latrine'), 'high_risk', 'high', 'Facility "Chereponi Community Latrine" is at high risk (score: 70). Maintenance recommended.', FALSE, '2024-02-12 07:50:00+00'),
    
    -- Resolved alerts (showing system working)
    ((SELECT id FROM public.facilities WHERE name = 'Bimbilla School Latrine Block'), 'high_risk', 'high', 'Facility "Bimbilla School Latrine Block" was at high risk due to water shortage.', TRUE, '2024-02-13 16:50:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Salaga Market Toilet'), 'high_risk', 'high', 'Facility "Salaga Market Toilet" had damaged door lock.', TRUE, '2024-02-16 10:35:00+00'),
    
    -- Climate warning alerts (sample for rainy season)
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet'), 'climate_warning', 'medium', 'Heavy rainfall predicted in Tamale area. Monitor facility for potential flooding.', TRUE, '2024-02-10 06:00:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Damongo Health Center Toilet'), 'climate_warning', 'medium', 'Flood risk elevated in Damongo district. Ensure drainage systems are clear.', FALSE, '2024-02-12 06:00:00+00');