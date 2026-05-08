-- Create districts table
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_districts_name ON public.districts(name);
CREATE INDEX IF NOT EXISTS idx_districts_region ON public.districts(region);
CREATE INDEX IF NOT EXISTS idx_districts_location ON public.districts(lat, lng);

-- Enable Row Level Security (RLS)
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to districts" ON public.districts
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.districts
    FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_districts_updated_at
    BEFORE UPDATE ON public.districts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data for Northern Region districts (Ghana)
INSERT INTO public.districts (name, region, lat, lng) VALUES
    ('Tamale', 'Northern', 9.4034, -0.8424),
    ('Yendi', 'Northern', 9.4427, -0.0093),
    ('Damongo', 'Northern', 9.0840, -1.8212),
    ('Bimbilla', 'Northern', 9.6667, -0.4167),
    ('Salaga', 'Northern', 8.5500, -0.5167),
    ('Kpandai', 'Northern', 8.4667, -0.0167),
    ('Saboba', 'Northern', 9.6167, 0.3833),
    ('Chereponi', 'Northern', 10.0500, 0.0500),
    ('Gushiegu', 'Northern', 9.9667, -0.2500),
    ('Karaga', 'Northern', 9.9833, -0.6833),
    ('Savelugu', 'Northern', 9.6333, -0.8333),
    ('Tolon', 'Northern', 9.4167, -1.0000),
    ('Kumbungu', 'Northern', 9.5833, -0.8500),
    ('Nanton', 'Northern', 9.4000, -1.0833),
    ('Zabzugu', 'Northern', 9.7000, -0.1500),
    ('Tatale', 'Northern', 9.5000, 0.2500),
    ('Wulensi', 'Northern', 8.9167, -0.1833),
    ('Mion', 'Northern', 9.5500, -0.7000)
ON CONFLICT (name) DO NOTHING;