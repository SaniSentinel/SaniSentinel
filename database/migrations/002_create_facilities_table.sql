-- Create facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('toilet', 'latrine', 'septic_tank', 'treatment_plant', 'waste_collection_point')),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    last_serviced DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'good' CHECK (status IN ('good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service')),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_facilities_name ON public.facilities(name);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_district_id ON public.facilities(district_id);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON public.facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_risk_score ON public.facilities(risk_score);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.facilities(lat, lng);
CREATE INDEX IF NOT EXISTS idx_facilities_last_serviced ON public.facilities(last_serviced);

-- Enable Row Level Security (RLS)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to facilities" ON public.facilities
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.facilities
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample facilities data for Northern Region districts
INSERT INTO public.facilities (name, type, district_id, lat, lng, last_serviced, status) VALUES
    -- Tamale facilities
    ('Tamale Central Market Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4034, -0.8424, '2024-01-15', 'good'),
    ('Tamale Hospital Septic Tank', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4050, -0.8400, '2024-02-01', 'good'),
    ('Tamale School Block Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tamale'), 9.4020, -0.8450, '2023-12-20', 'damaged'),
    
    -- Yendi facilities
    ('Yendi Market Toilet Complex', 'toilet', (SELECT id FROM public.districts WHERE name = 'Yendi'), 9.4427, -0.0093, '2024-01-10', 'overflow'),
    ('Yendi Community Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Yendi'), 9.4400, -0.0100, '2023-11-30', 'blocked'),
    
    -- Damongo facilities
    ('Damongo Health Center Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Damongo'), 9.0840, -1.8212, '2024-02-05', 'good'),
    ('Damongo Waste Collection Point', 'waste_collection_point', (SELECT id FROM public.districts WHERE name = 'Damongo'), 9.0850, -1.8200, '2024-01-25', 'good'),
    
    -- Bimbilla facilities
    ('Bimbilla School Latrine Block', 'latrine', (SELECT id FROM public.districts WHERE name = 'Bimbilla'), 9.6667, -0.4167, '2023-12-15', 'dry'),
    ('Bimbilla Community Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Bimbilla'), 9.6650, -0.4150, '2024-01-20', 'good'),
    
    -- Salaga facilities
    ('Salaga Market Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Salaga'), 8.5500, -0.5167, '2023-12-10', 'damaged'),
    ('Salaga Treatment Plant', 'treatment_plant', (SELECT id FROM public.districts WHERE name = 'Salaga'), 8.5520, -0.5180, '2024-02-10', 'good'),
    
    -- Kpandai facilities
    ('Kpandai Health Post Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Kpandai'), 8.4667, -0.0167, '2024-01-05', 'good'),
    ('Kpandai Community Septic', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Kpandai'), 8.4680, -0.0150, '2023-11-25', 'overflow'),
    
    -- Saboba facilities
    ('Saboba School Toilet Block', 'toilet', (SELECT id FROM public.districts WHERE name = 'Saboba'), 9.6167, 0.3833, '2024-01-30', 'good'),
    ('Saboba Waste Point', 'waste_collection_point', (SELECT id FROM public.districts WHERE name = 'Saboba'), 9.6150, 0.3850, '2024-02-15', 'good'),
    
    -- Chereponi facilities
    ('Chereponi Community Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Chereponi'), 10.0500, 0.0500, '2023-12-05', 'blocked'),
    ('Chereponi Health Center Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Chereponi'), 10.0520, 0.0480, '2024-01-12', 'good'),
    
    -- Gushiegu facilities
    ('Gushiegu Market Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Gushiegu'), 9.9667, -0.2500, '2024-02-08', 'good'),
    ('Gushiegu School Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Gushiegu'), 9.9650, -0.2520, '2023-11-20', 'dry'),
    
    -- Karaga facilities
    ('Karaga Community Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Karaga'), 9.9833, -0.6833, '2024-01-18', 'damaged'),
    ('Karaga Septic System', 'septic_tank', (SELECT id FROM public.districts WHERE name = 'Karaga'), 9.9850, -0.6850, '2024-02-12', 'good'),
    
    -- Savelugu facilities
    ('Savelugu Hospital Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6333, -0.8333, '2024-02-03', 'good'),
    ('Savelugu Treatment Facility', 'treatment_plant', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 9.6350, -0.8350, '2024-01-28', 'good'),
    
    -- Tolon facilities
    ('Tolon School Block', 'latrine', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4167, -1.0000, '2023-12-28', 'overflow'),
    ('Tolon Community Center Toilet', 'toilet', (SELECT id FROM public.districts WHERE name = 'Tolon'), 9.4180, -0.9980, '2024-01-22', 'good'),
    
    -- Kumbungu facilities
    ('Kumbungu Health Post Latrine', 'latrine', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5833, -0.8500, '2024-02-06', 'good'),
    ('Kumbungu Waste Collection', 'waste_collection_point', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 9.5850, -0.8480, '2024-01-15', 'good')

ON CONFLICT (name) DO NOTHING;

-- Update risk scores based on status and last serviced date
UPDATE public.facilities SET risk_score = 
    CASE 
        WHEN status = 'good' AND last_serviced >= CURRENT_DATE - INTERVAL '30 days' THEN 15
        WHEN status = 'good' AND last_serviced >= CURRENT_DATE - INTERVAL '60 days' THEN 25
        WHEN status = 'good' THEN 35
        WHEN status = 'damaged' THEN 65
        WHEN status = 'dry' THEN 55
        WHEN status = 'blocked' THEN 70
        WHEN status = 'overflow' THEN 85
        WHEN status = 'out_of_service' THEN 95
        ELSE 50
    END;