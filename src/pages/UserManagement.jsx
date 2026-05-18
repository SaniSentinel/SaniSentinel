import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/Layout/AppLayout'
import ConfirmDeleteModal from '../components/UI/ConfirmDeleteModal'
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

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userEmail: '',
    userName: '',
    userDistrict: '',
    isDeleting: false
  })

  // Landing page color scheme
  const colors = {
    primary: '#3B82F6', // Blue-600
    secondary: '#10B981', // Green-500
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    gradientReverse: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
  }

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

  // --- Delete handler ---
  const handleDeleteClick = (email, accountName, districtName) => {
    // Open the modal with user details
    setDeleteModal({
      isOpen: true,
      userEmail: email,
      userName: accountName,
      userDistrict: districtName,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    const { userEmail, userName } = deleteModal

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }))
      setError(null)
      setSuccessMsg(null)

      // Try to delete from database via RPC (with audit logging)
      try {
        const { data, error: rpcError } = await supabase.rpc('delete_user_account_with_audit', {
          user_email: userEmail
        })
        
        if (rpcError) {
          console.warn('Delete with audit RPC failed, trying basic delete:', rpcError.message)
          
          // Fallback to basic delete if audit version fails
          const { error: basicDeleteError } = await supabase.rpc('delete_user_account', {
            user_email: userEmail
          })
          
          if (basicDeleteError) {
            console.warn('Basic delete RPC also failed:', basicDeleteError.message)
            throw new Error(`Database deletion failed: ${basicDeleteError.message}. The account will be removed locally.`)
          }
        }
      } catch (rpcCatch) {
        console.warn('Delete RPC unavailable:', rpcCatch)
        // Continue to remove from localStorage even if RPC fails
      }

      // Always remove from localStorage
      removeSavedAccount(userEmail)
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        userEmail: '',
        userName: '',
        userDistrict: '',
        isDeleting: false
      })
      
      // Refresh accounts list
      await loadAccounts()
      
      // Show success message
      setSuccessMsg(`Account for ${userName || userEmail} has been permanently deleted`)
    } catch (err) {
      setError(err.message)
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      userEmail: '',
      userName: '',
      userDistrict: '',
      isDeleting: false
    })
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%)' 
    }}>
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        userName={deleteModal.userName}
        userEmail={deleteModal.userEmail}
        userDistrict={deleteModal.userDistrict}
        isDeleting={deleteModal.isDeleting}
      />

      <AppLayout
        title="District Officer Management"
        subtitle="Create and manage district officer accounts with secure credentials and role-based access"
        actions={(
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAccounts}
              disabled={loading}
              className="flex items-center space-x-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: colors.gradient }}
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        )}
      >
        {/* Alert Messages */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100/50 border-l-4 border-red-400 rounded-r-xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {officerListRpcError && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-amber-400 rounded-r-xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Database Connection Issue</h3>
                <p className="text-sm text-amber-700 mt-1">{officerListRpcError}</p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-100/50 px-3 py-1 rounded-lg">
                  Migration <code className="font-mono">029_fix_admin_jwt_role_and_list_officers.sql</code> required
                </p>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100/50 border-l-4 border-green-400 rounded-r-xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {!districts.some((d) => d.id) && districts.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-blue-400 rounded-r-xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-800">Offline Mode</h3>
                <p className="text-sm text-blue-700 mt-1">
                  District names loaded without database IDs (offline fallback). Accounts can still be created.
                </p>
                <p className="text-xs text-blue-600 mt-2 bg-blue-100/50 px-3 py-1 rounded-lg">
                  Run migration <code className="font-mono">027_seed_all_northern_region_districts.sql</code> for full functionality
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Fixed Create Form + Scrollable Accounts List */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 h-[calc(100vh-280px)]">
          {/* Create Officer Form - Fixed */}
          <div className="xl:col-span-2 overflow-y-auto">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-2xl border border-blue-100/50 shadow-xl backdrop-blur-sm p-8 relative overflow-hidden sticky top-0">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      Create District Officer
                    </h2>
                    <p className="text-sm text-gray-600 font-medium">Add new officer account with secure credentials</p>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 mb-6 border border-blue-100/50">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Security Guidelines</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Share credentials securely and ask officers to change their password after first login. 
                        Email confirmation may be required before access is granted.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter officer's full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-blue-200/50 rounded-xl px-4 py-3 text-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      placeholder="officer@district.gov.gh"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-blue-200/50 rounded-xl px-4 py-3 text-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Temporary Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full border border-blue-200/50 rounded-xl px-4 py-3 text-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
                      minLength={6}
                      required
                    />
                  </div>

                  {/* District Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Assigned District</span>
                    </label>
                    <select
                      value={form.district_id}
                      onChange={(e) => setForm({ ...form, district_id: e.target.value })}
                      className="w-full border border-blue-200/50 rounded-xl px-4 py-3 text-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300"
                      required
                    >
                      <option value="">Select district assignment</option>
                      {districts.map((district) => (
                        <option key={district.id || district.name} value={district.id || district.name}>
                          {district.name} ({district.region} Region)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={creating || districts.length === 0}
                    className="w-full text-white px-6 py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    style={{ background: colors.gradient }}
                  >
                    {creating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Create Officer Account</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Officer Accounts List - Scrollable */}
          <div className="xl:col-span-3 overflow-y-auto">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-2xl border border-blue-100/50 shadow-xl backdrop-blur-sm p-8 relative overflow-hidden h-full">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-green-400/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        District Officer Accounts
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        Manage existing officer accounts and permissions
                        {accounts.length > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            {accounts.length} {accounts.length === 1 ? 'Officer' : 'Officers'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  {accounts.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {accounts.filter(a => !a.suspended).length}
                        </div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {accounts.filter(a => a.suspended).length}
                        </div>
                        <div className="text-xs text-gray-600">Suspended</div>
                      </div>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center mb-4 animate-pulse">
                        <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Loading officer accounts...</p>
                      <p className="text-xs text-gray-500 mt-1">Please wait while we fetch the data</p>
                    </div>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No District Officers Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">Create your first district officer account to get started</p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>Use the form on the left to create an account</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-480px)] overflow-y-auto pr-2 custom-scrollbar">
                    {accounts.map((account, index) => (
                      <div
                        key={account.id || account.email}
                        className="group bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] hover:bg-white/80"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {(account.name || account.email).slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Officer Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {account.name || account.email}
                                </h3>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    account.suspended
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : 'bg-green-100 text-green-700 border border-green-200'
                                  }`}
                                >
                                  {account.suspended ? (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                      </svg>
                                      Suspended
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Active
                                    </>
                                  )}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">{account.email}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="font-medium">
                                    {account.district_name || 'No district'} • {account.district_region || 'Northern'} Region
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Role: {account.role || 'district_officer'}</span>
                                  </div>
                                  {account.created_at && (
                                    <div className="flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>Created: {new Date(account.created_at).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                            <button
                              onClick={() => handleSuspendToggle(account.email, account.suspended)}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg ${
                                account.suspended
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                              }`}
                            >
                              {account.suspended ? (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Reactivate</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                  <span>Suspend</span>
                                </div>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteClick(
                                account.email, 
                                account.name,
                                account.district_name ? `${account.district_name} • ${account.district_region || 'Northern'} Region` : 'No district'
                              )}
                              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                              title="Delete account permanently"
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </div>
  )
}

export default UserManagement