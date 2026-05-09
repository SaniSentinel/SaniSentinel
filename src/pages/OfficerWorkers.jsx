import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { workers } from '../lib/workers'
import { maintenance } from '../lib/maintenance'
const ROLE_LABELS = {
  field_worker: 'Field worker',
  supervisor: 'Supervisor',
  maintenance_tech: 'Maintenance tech',
  health_officer: 'Health officer',
  district_coordinator: 'District coordinator',
  system_admin: 'System admin',
  district_officer: 'District officer'
}

const OfficerWorkers = () => {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [openByWorker, setOpenByWorker] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [wRes, tRes] = await Promise.all([workers.getAll(), maintenance.getAll(500)])

      if (wRes.error) throw new Error(wRes.error)
      if (tRes.error) throw new Error(tRes.error)

      const workerRows = wRes.data || []
      const tasks = tRes.data || []
      const openStates = ['pending', 'assigned', 'in_progress']
      const counts = {}

      workerRows.forEach((w) => {
        counts[w.id] = 0
      })
      tasks.forEach((task) => {
        if (task.assigned_to && openStates.includes(task.status)) {
          counts[task.assigned_to] = (counts[task.assigned_to] || 0) + 1
        }
      })

      setList(workerRows)
      setOpenByWorker(counts)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sorted = useMemo(
    () => [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [list]
  )

  const openEdit = (w) => {
    setEditing(w)
    setForm({
      name: w.name || '',
      phone: w.phone || '',
      email: w.email || ''
    })
    setFormError('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditing(null)
    setFormError('')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing) return

    const name = form.name.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()

    if (!name) {
      setFormError('Name is required')
      return
    }
    if (phone && !phone.match(/^\+233\d{9}$/)) {
      setFormError('Phone must be Ghana format +233XXXXXXXXX')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email or leave blank')
      return
    }

    try {
      setSavingId(editing.id)
      setFormError('')
      const updateRes = await workers.update(editing.id, {
        name,
        phone,
        email: email || null
      })
      if (updateRes.error) throw new Error(updateRes.error)
      closeEdit()
      await load()
    } catch (err) {
      setFormError(err.message || 'Could not save')
    } finally {
      setSavingId(null)
    }
  }

  if (user?.role !== 'district_officer') return null

  const actions = (
    <button
      type="button"
      onClick={load}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
    >
      Refresh
    </button>
  )

  return (
    <AppLayout
      title="My workers"
      subtitle="Workers in your district — update contact info and monitor open assignments"
      actions={actions}
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button type="button" onClick={load} className="mt-3 text-green-700 text-sm underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Open tasks</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {ROLE_LABELS[w.role] || w.role}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{w.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{w.email || '—'}</td>
                    <td className="px-4 py-3">
                      {w.active ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-semibold">
                        {openByWorker[w.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        className="text-green-700 hover:text-green-900 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && (
            <p className="text-center py-12 text-gray-500">No workers listed for your district.</p>
          )}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Worker contact details</h3>
            <p className="text-sm text-gray-500 mb-4">{editing?.name}</p>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (+233)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+233XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingId !== null}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {savingId ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default OfficerWorkers
