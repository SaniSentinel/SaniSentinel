-- ============================================================================
-- MIGRATION 033: Allow district officers to delete workers in their district
-- The previous policy (015) restricted DELETE on workers to system_admin only.
-- Officers need to be able to remove workers they added to their district.
-- ============================================================================

-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "workers_delete_policy" ON public.workers;

-- New policy: system admin can delete any worker;
-- district officers can delete workers that belong to their own district
CREATE POLICY "workers_delete_policy" ON public.workers
    FOR DELETE USING (
        public.is_admin()
        OR (
            public.is_officer_or_admin()
            AND public.can_access_district(district_id)
        )
    );

-- ============================================================================
-- RPC FUNCTION: officer_delete_worker
-- Allows a district officer to hard-delete a worker from their own district.
-- Uses SECURITY DEFINER so it runs with elevated privileges, but validates
-- that the calling user is an officer and the worker belongs to their district.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.officer_delete_worker(worker_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_district_id UUID;
    v_worker_district UUID;
    v_worker_name TEXT;
BEGIN
    -- Get calling user's role and district
    v_role := public.get_user_role();
    v_district_id := public.get_user_district_id();

    -- Only district officers and admins may call this
    IF v_role NOT IN ('district_officer', 'system_admin', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Permission denied: only district officers and admins can delete workers.'
        );
    END IF;

    -- Look up the worker
    SELECT district_id, name INTO v_worker_district, v_worker_name
    FROM public.workers
    WHERE id = worker_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Worker not found.');
    END IF;

    -- Admins can delete any worker; officers only their own district
    IF v_role NOT IN ('system_admin', 'admin') AND v_worker_district != v_district_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Permission denied: worker belongs to a different district.'
        );
    END IF;

    -- Perform the delete
    DELETE FROM public.workers WHERE id = worker_id;

    RETURN jsonb_build_object('success', true, 'deleted_worker', v_worker_name);
END;
$$;

-- Grant execute to authenticated users (the function itself enforces role checks)
GRANT EXECUTE ON FUNCTION public.officer_delete_worker(UUID) TO authenticated;

-- Confirm
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 033 applied:';
    RAISE NOTICE '   - workers_delete_policy updated to allow district officers';
    RAISE NOTICE '   - officer_delete_worker() RPC function created';
END $$;
