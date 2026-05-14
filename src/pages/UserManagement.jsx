import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/Layout/AppLayout'
import { isDistrictUuid, resolveDistrictUuidFromMetadata } from '../lib/districtId'

// Disposable Supabase client used only for creating new user accounts.
// persistSession is false so the admin's own session is never overwritten.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Separate storage key avoids "Multiple GoTrueClient instances" fighting the main app's session.
const createAccountClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: 'sb-sanisentinel-admin-create-account'
  }
})

// ---- localStorage helpers for created accounts ----
const STORAGE_KEY = 'sanisentinel_district_officers'

function getSavedAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAccount(account) {
  const existing = getSavedAccounts()
  // Avoid duplicates by email
  if (existing.some((a) => a.email === account.email)) return
  existing.push(account)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

function removeSavedAccount(email) {
  const existing = getSavedAccounts()
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing.filter((a) => a.email !== email))
  )
}

function updateSavedAccount(email, updates) {
  const existing = getSavedAccounts()
  const updated = existing.map((a) =>
    a.email === email ? { ...a, ...updates } : a
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

// ---- Complete list of Northern Region districts (fallback) ----
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Friendly message when anon signUp is rate-limited (429). */
function formatSignupRateLimitError(err) {
  const msg = err?.message || String(err)
  if (
    msg.includes('429') ||
    msg.includes('Too Many Requests') ||
    err?.status === 429
  ) {
    return (
      'Supabase is temporarily limiting account creation from the browser (429). ' +
      'Deploy the Edge Function admin-create-officer (folder: supabase/functions/admin-create-officer) so admins create users via the service role, ' +
      'wait several minutes, or add the user under Dashboard → Authentication.'
    )
  }
  return msg
}

const NORTHERN_REGION_DISTRICTS = [
  { name: 'Chereponi', region: 'Northern' },
  { name: 'Gushegu', region: 'Northern' },
  { name: 'Karaga', region: 'Northern' },
  { name: 'Kpandai', region: 'Northern' },
  { name: 'Kumbungu', region: 'Northern' },
  { name: 'Mamprugu-Moagduri', region: 'Northern' },
  { name: 'Mion', region: 'Northern' },
  { name: 'Nanton', region: 'Northern' },
  { name: 'Saboba', region: 'Northern' },
  { name: 'Sagnarigu', region: 'Northern' },
  { name: 'Salaga', region: 'Northern' },
  { name: 'Savelugu', region: 'Northern' },
  { name: 'Tamale', region: 'Northern' },
  { name: 'Tatale-Sanguli', region: 'Northern' },
  { name: 'Tolon', region: 'Northern' },
  { name: 'Wulensi', region: 'Northern' },
  { name: 'Yendi', region: 'Northern' },
  { name: 'Zabzugu', region: 'Northern' },
]

const UserManagement = () => {
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [districts, setDistricts] = useState([])
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [officerListRpcError, setOfficerListRpcError] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    district_id: ''
  })

  // --- Load accounts & districts ---
  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      setOfficerListRpcError(null)

      // 1) Try the database RPC first (requires is_admin() + migration 029 JWT role fix)
      let rpcAccounts = []
      try {
        const { data, error: rpcErr } = await supabase.rpc('list_district_officer_accounts')
        if (rpcErr) {
          console.warn('list_district_officer_accounts:', rpcErr.message)
          setOfficerListRpcError(
            rpcErr.message ||
              'Could not load officer accounts from the database. Run migration 029_fix_admin_jwt_role_and_list_officers.sql in Supabase SQL, then Refresh.'
          )
        } else {
          rpcAccounts = Array.isArray(data) ? data : []
        }
      } catch (rpcCatch) {
        console.warn('list_district_officer_accounts failed:', rpcCatch)
        setOfficerListRpcError(
          rpcCatch?.message ||
            'Officer list RPC failed. Apply migration 029 in Supabase SQL (fixes admin JWT role + invalid district_id rows).'
        )
      }

      // 2) Merge with locally-saved accounts (deduplicate by email)
      const local = getSavedAccounts()
      const rpcEmails = new Set(rpcAccounts.map((a) => a.email))
      const merged = [
        ...rpcAccounts,
        ...local.filter((a) => !rpcEmails.has(a.email))
      ]
      const DEMO_TAMALE_OFFICER = 'officer@tamale.gov'
      merged.sort((a, b) => {
        if (a.email === DEMO_TAMALE_OFFICER && b.email !== DEMO_TAMALE_OFFICER) return -1
        if (b.email === DEMO_TAMALE_OFFICER && a.email !== DEMO_TAMALE_OFFICER) return 1
        return (a.email || '').localeCompare(b.email || '')
      })
      setAccounts(merged)

      // 3) Load districts — combine table + SECURITY DEFINER RPC so we get IDs even if RLS hides some rows
      try {
        const [tableRes, northRpcRes] = await Promise.all([
          supabase
            .from('districts')
            .select('id, name, region')
            .order('region', { ascending: true })
            .order('name', { ascending: true }),
          supabase.rpc('get_northern_region_districts')
        ])

        const tableRows = tableRes.data ?? []
        const northRows = northRpcRes.data ?? []

        let districtData = []
        if (tableRows.length >= northRows.length && tableRows.length > 0) {
          districtData = tableRows
        } else if (northRows.length > 0) {
          districtData = northRows
        } else if (tableRows.length > 0) {
          districtData = tableRows
        }

        if (districtData.length > 0) {
          setDistricts(districtData)
        } else {
          setDistricts(NORTHERN_REGION_DISTRICTS)
        }
      } catch {
        try {
          const { data: rpcDistricts } = await supabase.rpc('get_northern_region_districts')
          if (rpcDistricts?.length) setDistricts(rpcDistricts)
          else setDistricts(NORTHERN_REGION_DISTRICTS)
        } catch {
          setDistricts(NORTHERN_REGION_DISTRICTS)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  // --- Create account handler ---
  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      setError(null)
      setSuccessMsg(null)

      const selectedDistrict = districts.find((d) => (d.id || d.name) === form.district_id)

      // Save values before clearing the form
      const createdName = form.name
      const createdDistrictName = selectedDistrict?.name || ''
      const createdDistrictRegion = selectedDistrict?.region || 'Northern'

      let districtUuid =
        selectedDistrict?.id && isDistrictUuid(selectedDistrict.id)
          ? selectedDistrict.id
          : null

      if (!districtUuid && selectedDistrict?.name) {
        districtUuid = await resolveDistrictUuidFromMetadata({
          district_id: null,
          district_name: selectedDistrict.name
        })
      }

      if (!districtUuid) {
        throw new Error(
          'Could not resolve a database district ID for this district name. Run SQL migrations 027 (seed districts) and 028 (resolve_district_id_by_name RPC) in Supabase, then Refresh. ' +
            'If it still fails, confirm Authentication → Users uses role system_admin and that public.districts has a row whose name matches exactly.'
        )
      }

      const metadataPayload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        district_id: districtUuid,
        district_name: selectedDistrict?.name || null,
        district_region: selectedDistrict?.region || 'Northern'
      }

      let authData = null

      // Prefer Edge Function (service role) — avoids anon /signup rate limits (429).
      const { data: fnData, error: fnInvokeError } = await supabase.functions.invoke(
        'admin-create-officer',
        { body: metadataPayload }
      )

      const fnStatus = fnInvokeError?.context?.response?.status ?? fnInvokeError?.status

      if (fnInvokeError && (fnStatus === 401 || fnStatus === 403)) {
        throw new Error(fnInvokeError.message || 'Only administrators can create district officers.')
      }

      if (!fnInvokeError && fnData?.ok === false) {
        throw new Error(fnData.error || 'Could not create account.')
      }

      if (!fnInvokeError && fnData?.ok && fnData.user) {
        authData = { user: { id: fnData.user.id, email: fnData.user.email } }
      }

      if (!authData) {
        let signUpError = null
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await sleep(2000 * attempt)
          const signUpResult = await createAccountClient.auth.signUp({
            email: metadataPayload.email,
            password: metadataPayload.password,
            options: {
              data: {
                role: 'district_officer',
                name: metadataPayload.name,
                district_id: districtUuid,
                district_name: metadataPayload.district_name,
                district_region: metadataPayload.district_region,
                department: 'Health Department',
                permissions: ['read', 'write', 'manage_facilities'],
                title: 'District Health Officer',
                created_by_admin: true,
                registration_date: new Date().toISOString()
              }
            }
          })
          signUpError = signUpResult.error
          if (!signUpError) {
            authData = signUpResult.data
            break
          }
          const transient429 =
            signUpError.message?.includes('429') ||
            signUpError.message?.includes('Too Many Requests') ||
            signUpError.status === 429
          if (!transient429) break
        }

        if (signUpError) {
          throw new Error(formatSignupRateLimitError(signUpError))
        }
      }

      // Persist to localStorage so it always shows up
      saveAccount({
        id: authData?.user?.id || crypto.randomUUID(),
        email: metadataPayload.email,
        name: createdName,
        role: 'district_officer',
        district_id: districtUuid,
        district_name: createdDistrictName,
        district_region: createdDistrictRegion,
        suspended: false,
        created_at: new Date().toISOString()
      })

      setForm({ email: '', password: '', name: '', district_id: '' })
      await loadAccounts()

      setSuccessMsg(
        `Account created for ${createdName} (${metadataPayload.email}) — ${createdDistrictName} District`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // --- Suspend / Reactivate handler ---
  const handleSuspendToggle = async (email, currentlySuspended) => {
    try {
      setError(null)

      // Try the RPC first
      try {
        const { error: rpcError } = await supabase.rpc('set_user_suspended', {
          user_email: email,
          suspended_state: !currentlySuspended
        })
        if (rpcError) console.warn('Suspend RPC failed:', rpcError.message)
      } catch {
        // RPC unavailable
      }

      // Always update localStorage copy
      updateSavedAccount(email, { suspended: !currentlySuspended })
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppLayout
      title="User Management"
      subtitle="Create login credentials for district officers, and manage their accounts"
      actions={(
        <button
          onClick={loadAccounts}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      )}
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {officerListRpcError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">District officer list (database)</p>
          <p className="text-sm text-red-700 mt-1">{officerListRpcError}</p>
          <p className="text-xs text-red-600 mt-2">
            Migration <code className="bg-red-100 px-1 rounded">029_fix_admin_jwt_role_and_list_officers.sql</code> fixes Supabase
            reading your admin role and prevents broken district_id values from hiding all officers.
          </p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      {!districts.some((d) => d.id) && districts.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            District names loaded without database IDs (offline fallback). You can still create accounts — we resolve the UUID by name on submit.
            For best results run migration <code className="text-xs bg-amber-100 px-1 rounded">027_seed_all_northern_region_districts.sql</code> and click Refresh so rows include IDs.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Create Form --- */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create District Officer</h2>
          <p className="text-xs text-gray-500 mb-4">
            Registers a district officer account with email and temporary password. Share credentials securely; ask the officer to
            change their password after first sign-in. If your project requires email confirmation, they must confirm before logging in.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              minLength={6}
              required
            />
            <select
              value={form.district_id}
              onChange={(e) => setForm({ ...form, district_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district.id || district.name} value={district.id || district.name}>
                  {district.name} ({district.region})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating || districts.length === 0}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* --- Accounts List --- */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            District Officer Accounts
            {accounts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({accounts.length})</span>
            )}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-sm text-gray-500">Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-sm text-gray-500">No district officer accounts yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create one using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id || account.email}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {account.name || account.email}
                    </p>
                    <p className="text-xs text-gray-600">{account.email}</p>
                    <p className="text-xs text-gray-500">
                      🏛️ {account.district_name || 'No district'} •{' '}
                      {account.district_region || 'Northern'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Role: {account.role || 'district_officer'}
                    </p>
                    {account.created_at && (
                      <p className="text-xs text-gray-400">
                        Created: {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        account.suspended
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {account.suspended ? 'Suspended' : 'Active'}
                    </span>
                    <button
                      onClick={() => handleSuspendToggle(account.email, account.suspended)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        account.suspended
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {account.suspended ? 'Reactivate' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default UserManagement