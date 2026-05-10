import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/Layout/AppLayout'

const UserManagement = () => {
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [districts, setDistricts] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    district_id: ''
  })

  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      const [{ data: accountsData, error: accountsError }, { data: districtData, error: districtError }] = await Promise.all([
        supabase.rpc('list_district_officer_accounts'),
        supabase.from('districts').select('id, name, region').eq('region', 'Northern').order('name')
      ])

      if (accountsError) throw new Error(accountsError.message)
      if (districtError) throw new Error(districtError.message)

      setAccounts(accountsData || [])
      setDistricts(districtData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      setError(null)

      const selectedDistrict = districts.find((d) => d.id === form.district_id)
      
      // Create the user with Supabase Auth with comprehensive metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: 'district_officer',
            name: form.name,
            district_id: form.district_id,
            district_name: selectedDistrict?.name || null,
            district_region: selectedDistrict?.region || 'Northern',
            department: 'Health Department',
            permissions: ['read', 'write', 'manage_facilities'],
            title: 'District Health Officer',
            supervised_by: 'officer@tamale.gov',
            created_by_admin: true,
            registration_date: new Date().toISOString()
          }
        }
      })

      if (signUpError) throw new Error(signUpError.message)

      setForm({ email: '', password: '', name: '', district_id: '' })
      await loadAccounts()
      
      // Show success message with login instructions
      alert(`✅ District officer account created successfully!

👤 Name: ${form.name}
📧 Email: ${form.email}
🏛️ District: ${selectedDistrict?.name} (${selectedDistrict?.region})
👨‍💼 Supervised by: officer@tamale.gov

The user can now log in with their email and password credentials.
They will have access to manage facilities in their assigned district.`)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSuspendToggle = async (email, suspended) => {
    try {
      const { error: rpcError } = await supabase.rpc('set_user_suspended', {
        user_email: email,
        suspended_state: !suspended
      })
      if (rpcError) throw new Error(rpcError.message)
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppLayout
      title="User Management"
      subtitle="District officer accounts (create, suspend, reactivate)"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create District Officer</h2>
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
              <option value="">Select Northern region district</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.region})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">District Officer Accounts</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No district officer accounts found.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{account.name || account.email}</p>
                    <p className="text-xs text-gray-600">{account.email}</p>
                    <p className="text-xs text-gray-500">
                      {account.district_name || 'No district'} • {account.district_region || 'Unknown region'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Supervised by: {account.supervised_by || 'officer@tamale.gov'}
                    </p>
                    {account.last_sign_in_at && (
                      <p className="text-xs text-gray-400">
                        Last login: {new Date(account.last_sign_in_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      account.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
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