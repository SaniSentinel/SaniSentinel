-- Create workers table
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('field_worker', 'supervisor', 'maintenance_tech', 'health_officer', 'district_coordinator')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workers_name ON public.workers(name);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON public.workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_district_id ON public.workers(district_id);
CREATE INDEX IF NOT EXISTS idx_workers_role ON public.workers(role);
CREATE INDEX IF NOT EXISTS idx_workers_active ON public.workers(active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to workers" ON public.workers
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.workers
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_workers_updated_at
    BEFORE UPDATE ON public.workers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample workers data for Northern Region districts
INSERT INTO public.workers (name, phone, district_id, role, active) VALUES
    -- Tamale workers
    ('Alhassan Mohammed', '+233241234567', (SELECT id FROM public.districts WHERE name = 'Tamale'), 'field_worker', TRUE),
    ('Fatima Abdul-Rahman', '+233241234568', (SELECT id FROM public.districts WHERE name = 'Tamale'), 'supervisor', TRUE),
    ('Ibrahim Yakubu', '+233241234569', (SELECT id FROM public.districts WHERE name = 'Tamale'), 'maintenance_tech', TRUE),
    
    -- Yendi workers
    ('Amina Sulemana', '+233241234570', (SELECT id FROM public.districts WHERE name = 'Yendi'), 'field_worker', TRUE),
    ('Haruna Iddrisu', '+233241234571', (SELECT id FROM public.districts WHERE name = 'Yendi'), 'health_officer', TRUE),
    
    -- Damongo workers
    ('Zainab Mahama', '+233241234572', (SELECT id FROM public.districts WHERE name = 'Damongo'), 'field_worker', TRUE),
    ('Musah Alidu', '+233241234573', (SELECT id FROM public.districts WHERE name = 'Damongo'), 'maintenance_tech', TRUE),
    
    -- Bimbilla workers
    ('Salamatu Issah', '+233241234574', (SELECT id FROM public.districts WHERE name = 'Bimbilla'), 'field_worker', TRUE),
    ('Abdul-Razak Fuseini', '+233241234575', (SELECT id FROM public.districts WHERE name = 'Bimbilla'), 'supervisor', TRUE),
    
    -- Salaga workers
    ('Mariam Dawuda', '+233241234576', (SELECT id FROM public.districts WHERE name = 'Salaga'), 'field_worker', TRUE),
    ('Yakubu Salifu', '+233241234577', (SELECT id FROM public.districts WHERE name = 'Salaga'), 'health_officer', TRUE),
    
    -- Kpandai workers
    ('Aisha Mumuni', '+233241234578', (SELECT id FROM public.districts WHERE name = 'Kpandai'), 'field_worker', TRUE),
    ('Mohammed Baba', '+233241234579', (SELECT id FROM public.districts WHERE name = 'Kpandai'), 'maintenance_tech', TRUE),
    
    -- Saboba workers
    ('Rukaya Alhassan', '+233241234580', (SELECT id FROM public.districts WHERE name = 'Saboba'), 'field_worker', TRUE),
    ('Sulemana Yakubu', '+233241234581', (SELECT id FROM public.districts WHERE name = 'Saboba'), 'supervisor', TRUE),
    
    -- Chereponi workers
    ('Hafsat Ibrahim', '+233241234582', (SELECT id FROM public.districts WHERE name = 'Chereponi'), 'field_worker', TRUE),
    ('Alhassan Dawuda', '+233241234583', (SELECT id FROM public.districts WHERE name = 'Chereponi'), 'health_officer', TRUE),
    
    -- Gushiegu workers
    ('Zara Mohammed', '+233241234584', (SELECT id FROM public.districts WHERE name = 'Gushiegu'), 'field_worker', TRUE),
    ('Ibrahim Salifu', '+233241234585', (SELECT id FROM public.districts WHERE name = 'Gushiegu'), 'maintenance_tech', TRUE),
    
    -- Karaga workers
    ('Amina Yakubu', '+233241234586', (SELECT id FROM public.districts WHERE name = 'Karaga'), 'field_worker', TRUE),
    ('Haruna Mohammed', '+233241234587', (SELECT id FROM public.districts WHERE name = 'Karaga'), 'supervisor', TRUE),
    
    -- Savelugu workers
    ('Fatima Iddrisu', '+233241234588', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 'field_worker', TRUE),
    ('Musah Dawuda', '+233241234589', (SELECT id FROM public.districts WHERE name = 'Savelugu'), 'health_officer', TRUE),
    
    -- Tolon workers
    ('Salamatu Yakubu', '+233241234590', (SELECT id FROM public.districts WHERE name = 'Tolon'), 'field_worker', TRUE),
    ('Abdul-Rahman Salifu', '+233241234591', (SELECT id FROM public.districts WHERE name = 'Tolon'), 'maintenance_tech', TRUE),
    
    -- Kumbungu workers
    ('Mariam Alhassan', '+233241234592', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 'field_worker', TRUE),
    ('Yakubu Ibrahim', '+233241234593', (SELECT id FROM public.districts WHERE name = 'Kumbungu'), 'supervisor', TRUE),
    
    -- District coordinators (covering multiple districts)
    ('Dr. Amina Zakaria', '+233241234594', (SELECT id FROM public.districts WHERE name = 'Tamale'), 'district_coordinator', TRUE),
    ('Eng. Mohammed Alhassan', '+233241234595', (SELECT id FROM public.districts WHERE name = 'Yendi'), 'district_coordinator', TRUE),
    ('Mrs. Fatima Sulemana', '+233241234596', (SELECT id FROM public.districts WHERE name = 'Damongo'), 'district_coordinator', TRUE);

-- Create function to get worker by phone number (for SMS processing)
CREATE OR REPLACE FUNCTION get_worker_by_phone(phone_number VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    district_id UUID,
    district_name VARCHAR,
    district_region VARCHAR,
    role VARCHAR,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.phone,
        w.district_id,
        d.name AS district_name,
        d.region AS district_region,
        w.role,
        w.active
    FROM public.workers w
    JOIN public.districts d ON w.district_id = d.id
    WHERE w.phone = phone_number AND w.active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get workers in a district
CREATE OR REPLACE FUNCTION get_workers_in_district(district_name VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    role VARCHAR,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.phone,
        w.role,
        w.active
    FROM public.workers w
    JOIN public.districts d ON w.district_id = d.id
    WHERE d.name = district_name AND w.active = TRUE
    ORDER BY w.role, w.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get workers by role
CREATE OR REPLACE FUNCTION get_workers_by_role(worker_role VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    district_name VARCHAR,
    district_region VARCHAR,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.phone,
        d.name AS district_name,
        d.region AS district_region,
        w.active
    FROM public.workers w
    JOIN public.districts d ON w.district_id = d.id
    WHERE w.role = worker_role AND w.active = TRUE
    ORDER BY d.name, w.name;
END;
$$ LANGUAGE plpgsql;