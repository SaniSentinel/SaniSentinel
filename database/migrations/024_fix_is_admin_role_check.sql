-- ============================================================================
-- FIX is_admin() TO ACCEPT BOTH 'admin' AND 'system_admin' ROLES
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- Update is_admin() to recognise both 'admin' and 'system_admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('system_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify it works
SELECT public.is_admin() AS admin_check;
