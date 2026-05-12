import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isAdminRole(role: string | undefined): boolean {
  return role === 'system_admin' || role === 'admin'
}

const DISTRICT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isDistrictUuid(s: string | null | undefined): boolean {
  return typeof s === 'string' && DISTRICT_UUID_RE.test(s.trim())
}

/** JWT must store districts.id (UUID). Accept legacy payloads that put the district name in district_id. */
async function resolveDistrictUuid(
  admin: ReturnType<typeof createClient>,
  district_id: string | null,
  district_name: string | null,
): Promise<string | null> {
  if (district_id && isDistrictUuid(district_id)) return district_id.trim()

  const tryName =
    (district_name && district_name.trim()) ||
    (district_id && !isDistrictUuid(district_id) ? district_id.trim() : '')

  if (!tryName) return null

  const { data, error } = await admin.from('districts').select('id').eq('name', tryName).maybeSingle()

  if (error || !data?.id) return null
  return data.id as string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json(401, { ok: false, error: 'Missing authorization' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { ok: false, error: 'Server misconfigured' })
  }

  const verifier = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user: caller },
    error: callerErr,
  } = await verifier.auth.getUser()

  if (callerErr || !caller) {
    return json(401, { ok: false, error: 'Invalid session' })
  }

  const callerRole = caller.user_metadata?.role as string | undefined
  if (!isAdminRole(callerRole)) {
    return json(403, { ok: false, error: 'Only system administrators can create district officers' })
  }

  let payload: {
    email?: string
    password?: string
    name?: string
    district_id?: string | null
    district_name?: string | null
    district_region?: string | null
  }

  try {
    payload = await req.json()
  } catch {
    return json(200, { ok: false, error: 'Invalid JSON body' })
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (!email || !password || !name) {
    return json(200, { ok: false, error: 'email, password, and name are required' })
  }
  if (password.length < 6) {
    return json(200, { ok: false, error: 'Password must be at least 6 characters' })
  }

  const districtIdRaw =
    typeof payload.district_id === 'string' && payload.district_id.trim() !== ''
      ? payload.district_id.trim()
      : null
  const districtName = typeof payload.district_name === 'string' ? payload.district_name : null
  let districtRegion =
    typeof payload.district_region === 'string' ? payload.district_region : 'Northern'

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const districtUuid = await resolveDistrictUuid(admin, districtIdRaw, districtName)

  if (!districtUuid) {
    return json(200, {
      ok: false,
      error:
        'Could not resolve public.districts.id. Send a UUID district_id or a district_name that exists in the districts table.',
    })
  }

  const { data: districtRow } = await admin
    .from('districts')
    .select('name, region')
    .eq('id', districtUuid)
    .maybeSingle()

  const resolvedName = (districtRow?.name as string | undefined) ?? districtName
  if (districtRow?.region) districtRegion = districtRow.region as string

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'district_officer',
      name,
      district_id: districtUuid,
      district_name: resolvedName,
      district_region: districtRegion,
      department: 'Health Department',
      permissions: ['read', 'write', 'manage_facilities'],
      title: 'District Health Officer',
      created_by_admin: true,
      registration_date: new Date().toISOString(),
    },
  })

  if (createErr) {
    return json(200, { ok: false, error: createErr.message })
  }

  return json(200, {
    ok: true,
    user: {
      id: created.user?.id,
      email: created.user?.email ?? email,
    },
  })
})
