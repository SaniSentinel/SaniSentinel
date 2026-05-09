-- ============================================================================
-- FIX JWT HELPER FUNCTIONS USED BY RLS POLICIES
-- Fixes invalid JSON extraction patterns that cause:
-- "operator does not exist: text ->> unknown"
-- ============================================================================

-- Extract user role from JWT safely across token shapes.
-- Supports:
-- 1) { "role": "admin" }
-- 2) { "user_metadata": { "role": "admin" } }
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_data JSONB;
    jwt_role TEXT;
BEGIN
    jwt_data := auth.jwt();

    jwt_role := COALESCE(
        jwt_data ->> 'role',
        jwt_data -> 'user_metadata' ->> 'role',
        'anonymous'
    );

    RETURN jwt_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Extract district_id safely from multiple JWT shapes.
CREATE OR REPLACE FUNCTION public.get_user_district_id()
RETURNS UUID AS $$
DECLARE
    jwt_data JSONB;
    district_text TEXT;
BEGIN
    jwt_data := auth.jwt();

    district_text := COALESCE(
        jwt_data ->> 'district_id',
        jwt_data -> 'user_metadata' ->> 'district_id'
    );

    IF district_text IS NULL OR district_text = '' THEN
        RETURN NULL;
    END IF;

    BEGIN
        RETURN district_text::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Treat both "system_admin" and "admin" as admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('system_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep officer/admin helper aligned with accepted admin role names.
CREATE OR REPLACE FUNCTION public.is_officer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('district_officer', 'system_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure execution rights remain in place for RLS checks.
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_district_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_officer_or_admin() TO authenticated, anon;
