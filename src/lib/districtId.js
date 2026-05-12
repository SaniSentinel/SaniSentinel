import { supabase } from './supabase'

/** Loose UUID v4 check for Postgres uuid columns */
export const DISTRICT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isDistrictUuid(value) {
  return typeof value === 'string' && DISTRICT_UUID_RE.test(value.trim())
}

function normalizeDistrictLabel(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : ''
}

/**
 * Match a district name to an id using RPC list (SECURITY DEFINER), case-insensitive.
 */
function pickDistrictFromRows(rows, tryName) {
  const needle = normalizeDistrictLabel(tryName)
  if (!needle || !Array.isArray(rows)) return null
  const hit = rows.find((r) => normalizeDistrictLabel(r.name) === needle)
  return hit?.id ?? null
}

/**
 * Resolve districts.id from metadata or plain name. Tries RPC first (bypasses RLS),
 * then table read, then northern-region RPC list.
 */
export async function resolveDistrictUuidFromMetadata({
  district_id: rawId,
  district_name: rawName
}) {
  if (isDistrictUuid(rawId)) return rawId.trim()

  const tryName =
    (typeof rawName === 'string' && rawName.trim()) ||
    (typeof rawId === 'string' && rawId.trim() && !isDistrictUuid(rawId) ? rawId.trim() : '')

  if (!tryName) return null

  const { data: rpcUuid, error: rpcErr } = await supabase.rpc('resolve_district_id_by_name', {
    p_name: tryName
  })

  if (!rpcErr && rpcUuid) return rpcUuid

  const { data: eqRow, error: eqErr } = await supabase
    .from('districts')
    .select('id')
    .eq('name', tryName)
    .maybeSingle()

  if (!eqErr && eqRow?.id) return eqRow.id

  const { data: northRows, error: northErr } = await supabase.rpc('get_northern_region_districts')
  if (!northErr && northRows?.length) {
    const fromNorth = pickDistrictFromRows(northRows, tryName)
    if (fromNorth) return fromNorth
  }

  const { data: ilikeRow, error: ilikeErr } = await supabase
    .from('districts')
    .select('id')
    .ilike('name', tryName)
    .maybeSingle()

  if (!ilikeErr && ilikeRow?.id) return ilikeRow.id

  return null
}
