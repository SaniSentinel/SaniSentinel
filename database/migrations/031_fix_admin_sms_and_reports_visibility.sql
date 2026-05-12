-- Ensure admin roles are recognized consistently for RLS checks
-- and SMS gateway logs remain visible to admins.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_data JSONB;
    meta_role TEXT;
    top_role TEXT;
BEGIN
    jwt_data := auth.jwt();
    IF jwt_data IS NULL THEN
        RETURN 'anonymous';
    END IF;

    meta_role := NULLIF(trim(COALESCE(
        jwt_data -> 'user_metadata' ->> 'role',
        jwt_data -> 'app_metadata' ->> 'role',
        ''
    )), '');

    IF meta_role IS NOT NULL THEN
        RETURN meta_role;
    END IF;

    top_role := jwt_data ->> 'role';
    IF top_role IS NOT NULL AND top_role NOT IN ('authenticated', 'anon', 'anonymous', 'service_role') THEN
        RETURN top_role;
    END IF;

    RETURN COALESCE(NULLIF(trim(top_role), ''), 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('system_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

DROP POLICY IF EXISTS "sms_gateway_logs_admin_read" ON public.sms_gateway_logs;
CREATE POLICY "sms_gateway_logs_admin_read"
ON public.sms_gateway_logs
FOR SELECT
USING (public.is_admin());
