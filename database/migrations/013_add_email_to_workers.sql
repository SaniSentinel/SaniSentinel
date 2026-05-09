-- Add email field to workers table for user account integration
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Create index for email field
CREATE INDEX IF NOT EXISTS idx_workers_email ON public.workers(email);

-- Update RLS policies to include email-based access
DROP POLICY IF EXISTS "Workers can view their own profile" ON public.workers;
CREATE POLICY "Workers can view their own profile" ON public.workers
    FOR SELECT USING (
        auth.email() = email OR 
        auth.role() = 'authenticated'
    );

-- Add new worker roles for test users
ALTER TABLE public.workers 
DROP CONSTRAINT IF EXISTS workers_role_check;

ALTER TABLE public.workers 
ADD CONSTRAINT workers_role_check 
CHECK (role IN (
    'field_worker', 
    'supervisor', 
    'maintenance_tech', 
    'health_officer', 
    'district_coordinator',
    'system_admin',
    'district_officer'
));

-- Create function to get worker profile by email
CREATE OR REPLACE FUNCTION get_worker_by_email(user_email VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
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
        w.email,
        w.district_id,
        d.name AS district_name,
        d.region AS district_region,
        w.role,
        w.active
    FROM public.workers w
    JOIN public.districts d ON w.district_id = d.id
    WHERE w.email = user_email AND w.active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Workers table updated successfully!';
    RAISE NOTICE 'Added email field and new roles: system_admin, district_officer';
    RAISE NOTICE 'Ready for test user creation.';
END $$;