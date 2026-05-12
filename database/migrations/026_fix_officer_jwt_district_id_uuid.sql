-- ============================================================================
-- Fix district_officer JWT metadata: district_id must be public.districts.id (UUID).
-- Older creates stored the district *name* in district_id → PostgREST 400 on filters.
-- ============================================================================

UPDATE auth.users AS u
SET raw_user_meta_data = jsonb_set(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        '{district_id}',
        to_jsonb(d.id::text)
    ),
    updated_at = NOW()
FROM public.districts AS d
WHERE COALESCE(u.raw_user_meta_data->>'role', '') = 'district_officer'
  AND u.raw_user_meta_data->>'district_id' IS NOT NULL
  AND u.raw_user_meta_data->>'district_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND d.name = (u.raw_user_meta_data->>'district_id');

-- If district_id was wrong but district_name matches a row:
UPDATE auth.users AS u
SET raw_user_meta_data = jsonb_set(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        '{district_id}',
        to_jsonb(d.id::text)
    ),
    updated_at = NOW()
FROM public.districts AS d
WHERE COALESCE(u.raw_user_meta_data->>'role', '') = 'district_officer'
  AND u.raw_user_meta_data->>'district_name' IS NOT NULL
  AND u.raw_user_meta_data->>'district_name' != ''
  AND d.name = (u.raw_user_meta_data->>'district_name')
  AND (
        u.raw_user_meta_data->>'district_id' IS NULL
        OR u.raw_user_meta_data->>'district_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      );
