-- ============================================================================
-- ADMIN DELETE USER ACCOUNT
-- - Allows system admins to permanently delete user accounts
-- - Removes user from auth.users table
-- - Includes safety checks and admin-only access
-- ============================================================================

-- Function to delete a user account permanently
CREATE OR REPLACE FUNCTION public.delete_user_account(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    target_user_role TEXT;
BEGIN
    -- Security check: Only admins can delete accounts
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can delete user accounts';
    END IF;

    -- Validate email parameter
    IF user_email IS NULL OR TRIM(user_email) = '' THEN
        RAISE EXCEPTION 'User email cannot be empty';
    END IF;

    -- Find the target user
    SELECT id, COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
    INTO target_user_id, target_user_role
    FROM auth.users
    WHERE email = LOWER(TRIM(user_email))
    LIMIT 1;

    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    -- Safety check: Prevent deleting system admins
    IF target_user_role IN ('system_admin', 'admin') THEN
        RAISE EXCEPTION 'Cannot delete administrator accounts for security reasons. User: %', user_email;
    END IF;

    -- Delete the user from auth.users
    -- Note: This will cascade to related tables if foreign keys are set up
    DELETE FROM auth.users
    WHERE id = target_user_id;

    -- Log the deletion (optional - you can add to a separate audit table if needed)
    RAISE NOTICE 'User account deleted: % (ID: %, Role: %)', user_email, target_user_id, target_user_role;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION public.delete_user_account(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.delete_user_account(TEXT) IS 
'Permanently deletes a user account from the system. Only accessible by system administrators. Cannot delete admin accounts.';

-- ============================================================================
-- OPTIONAL: Create audit log table for tracking deletions
-- ============================================================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_account_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    target_user_email TEXT NOT NULL,
    target_user_id UUID,
    target_user_role TEXT,
    performed_by_user_id UUID,
    performed_by_email TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    details JSONB,
    ip_address TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.user_account_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.user_account_audit_log
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
    ON public.user_account_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Grant permissions on audit log table
GRANT SELECT, INSERT ON public.user_account_audit_log TO authenticated;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_target_email 
    ON public.user_account_audit_log(target_user_email);

CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at 
    ON public.user_account_audit_log(performed_at DESC);

-- ============================================================================
-- ENHANCED DELETE FUNCTION WITH AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account_with_audit(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    target_user_role TEXT;
    target_user_name TEXT;
    target_district_name TEXT;
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Security check: Only admins can delete accounts
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can delete user accounts';
    END IF;

    -- Get current user info
    current_user_id := auth.uid();
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;

    -- Validate email parameter
    IF user_email IS NULL OR TRIM(user_email) = '' THEN
        RAISE EXCEPTION 'User email cannot be empty';
    END IF;

    -- Find the target user with full details
    SELECT 
        u.id,
        COALESCE((u.raw_user_meta_data->>'role')::TEXT, 'unknown'),
        COALESCE((u.raw_user_meta_data->>'name')::TEXT, ''),
        COALESCE((u.raw_user_meta_data->>'district_name')::TEXT, '')
    INTO 
        target_user_id, 
        target_user_role,
        target_user_name,
        target_district_name
    FROM auth.users u
    WHERE u.email = LOWER(TRIM(user_email))
    LIMIT 1;

    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    -- Safety check: Prevent deleting system admins
    IF target_user_role IN ('system_admin', 'admin') THEN
        RAISE EXCEPTION 'Cannot delete administrator accounts for security reasons. User: %', user_email;
    END IF;

    -- Insert audit log before deletion
    INSERT INTO public.user_account_audit_log (
        action,
        target_user_email,
        target_user_id,
        target_user_role,
        performed_by_user_id,
        performed_by_email,
        details
    ) VALUES (
        'DELETE_USER_ACCOUNT',
        user_email,
        target_user_id,
        target_user_role,
        current_user_id,
        current_user_email,
        jsonb_build_object(
            'user_name', target_user_name,
            'district_name', target_district_name,
            'deleted_at', NOW()
        )
    );

    -- Delete the user from auth.users
    DELETE FROM auth.users
    WHERE id = target_user_id;

    -- Log the deletion
    RAISE NOTICE 'User account deleted: % (ID: %, Role: %) by admin: %', 
        user_email, target_user_id, target_user_role, current_user_email;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user_account_with_audit(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account_with_audit(TEXT) IS 
'Permanently deletes a user account with full audit logging. Only accessible by system administrators. Cannot delete admin accounts.';

-- ============================================================================
-- FUNCTION TO VIEW RECENT DELETIONS (AUDIT TRAIL)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recent_account_deletions(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    deleted_at TIMESTAMPTZ,
    target_email TEXT,
    target_name TEXT,
    target_role TEXT,
    district_name TEXT,
    deleted_by_email TEXT
) AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can view deletion audit logs';
    END IF;

    RETURN QUERY
    SELECT
        a.performed_at AS deleted_at,
        a.target_user_email AS target_email,
        COALESCE((a.details->>'user_name')::TEXT, '') AS target_name,
        a.target_user_role AS target_role,
        COALESCE((a.details->>'district_name')::TEXT, '') AS district_name,
        a.performed_by_email AS deleted_by_email
    FROM public.user_account_audit_log a
    WHERE a.action = 'DELETE_USER_ACCOUNT'
        AND a.performed_at >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY a.performed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_recent_account_deletions(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_recent_account_deletions(INTEGER) IS 
'Returns a list of recently deleted user accounts for audit purposes. Only accessible by administrators.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of what was created:
-- 1. delete_user_account(user_email) - Basic delete function
-- 2. user_account_audit_log table - Tracks all account deletions
-- 3. delete_user_account_with_audit(user_email) - Delete with full audit trail
-- 4. get_recent_account_deletions(days_back) - View deletion history

-- Usage examples:
-- 
-- Delete a user account (basic):
-- SELECT public.delete_user_account('officer@example.com');
--
-- Delete a user account with audit logging (recommended):
-- SELECT public.delete_user_account_with_audit('officer@example.com');
--
-- View recent deletions:
-- SELECT * FROM public.get_recent_account_deletions(30);
--
-- View all audit logs:
-- SELECT * FROM public.user_account_audit_log ORDER BY performed_at DESC;
