-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    reported_by VARCHAR(255) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_facility_id ON public.reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON public.reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_reports_condition ON public.reports(condition);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to reports" ON public.reports
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.reports
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow anonymous users to insert reports (for SMS submissions)
CREATE POLICY "Allow anonymous insert for reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- Create function to automatically update facility status based on latest report
CREATE OR REPLACE FUNCTION update_facility_status_from_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the facility status to match the latest report condition
    UPDATE public.facilities 
    SET status = NEW.condition,
        updated_at = NOW()
    WHERE id = NEW.facility_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update facility status when a new report is created
CREATE TRIGGER update_facility_status_on_report
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_facility_status_from_report();

-- Enable Realtime for reports table (for live dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

-- Insert sample reports data
INSERT INTO public.reports (facility_id, reported_by, condition, notes, created_at) VALUES
    -- Recent reports from various facilities
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet'), '+233241234567', 'good', 'Facility is clean and functioning well', '2024-02-15 08:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Market Toilet Complex'), '+233241234568', 'overflow', 'Toilet is overflowing needs immediate attention', '2024-02-14 14:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Damongo Health Center Toilet'), '+233241234569', 'good', 'All systems working normally', '2024-02-14 10:15:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Bimbilla School Latrine Block'), '+233241234570', 'dry', 'No water supply hand washing station empty', '2024-02-13 16:45:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Salaga Market Toilet'), '+233241234571', 'damaged', 'Door lock broken needs repair', '2024-02-13 09:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Yendi Community Latrine'), '+233241234568', 'blocked', 'Drain is blocked water not flowing', '2024-02-12 11:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Chereponi Community Latrine'), '+233241234572', 'blocked', 'Pit is full needs emptying', '2024-02-12 07:45:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Gushiegu School Latrine'), '+233241234573', 'dry', 'Water tank is empty pump not working', '2024-02-11 15:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Karaga Community Toilet'), '+233241234574', 'damaged', 'Roof leaking floor wet and slippery', '2024-02-11 12:10:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Tolon School Block'), '+233241234575', 'overflow', 'Septic tank overflowing into area', '2024-02-10 13:25:00+00'),
    
    -- Older reports for trend analysis
    ((SELECT id FROM public.facilities WHERE name = 'Tamale Central Market Toilet'), '+233241234567', 'good', 'Regular maintenance check all good', '2024-01-20 09:00:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Damongo Health Center Toilet'), '+233241234569', 'good', 'Weekly inspection completed', '2024-01-18 14:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Saboba School Toilet Block'), '+233241234576', 'good', 'Facility cleaned and restocked', '2024-01-15 11:45:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Savelugu Hospital Toilet'), '+233241234577', 'good', 'Hospital maintenance team checked OK', '2024-01-12 08:20:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Kumbungu Health Post Latrine'), '+233241234578', 'good', 'Health post staff report functioning well', '2024-01-10 16:15:00+00'),
    
    -- Follow-up reports showing improvements
    ((SELECT id FROM public.facilities WHERE name = 'Salaga Market Toilet'), '+233241234571', 'good', 'Door lock has been repaired facility operational', '2024-02-16 10:30:00+00'),
    ((SELECT id FROM public.facilities WHERE name = 'Bimbilla School Latrine Block'), '+233241234570', 'good', 'Water supply restored hand washing station refilled', '2024-02-16 08:45:00+00');