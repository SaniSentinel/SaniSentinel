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

const CREATABLE_ROLES = [
  { value: 'field_worker', label: 'Field worker' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'maintenance_tech', label: 'Maintenance tech' },
  { value: 'health_officer', label: 'Health officer' },
  { value: 'district_coordinator', label: 'District coordinator' }
]

const OfficerWorkers = () => {
  const { user, officerDistrictScopeLoading } = useAuth()
  const [list, setList] = useState([])
  const [openByWorker, setOpenByWorker] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [formError, setFormError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'field_worker'
  })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    if (officerDistrictScopeLoading) return
    if (!user?.district_id) {
      setList([])
      setOpenByWorker({})
      setLoading(false)
      setError('No district assigned to your officer account.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [wRes, tRes] = await Promise.all([
        workers.getByDistrict(user.district_id, { activeOnly: false }),
        maintenance.getAll(500)
      ])

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
  }, [user?.district_id, officerDistrictScopeLoading])

  useEffect(() => {
    if (officerDistrictScopeLoading) return
    load()
  }, [load, officerDistrictScopeLoading])

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

  const openAdd = () => {
    setAddForm({ name: '', phone: '', email: '', role: 'field_worker' })
    setAddError('')
    setAddOpen(true)
  }

  const closeAdd = () => {
    setAddOpen(false)
    setAddError('')
  }

  const saveAdd = async (e) => {
    e.preventDefault()
    if (!user?.district_id) {
      setAddError('No district assigned.')
      return
    }

    const name = addForm.name.trim()
    const phone = addForm.phone.trim()
    const email = addForm.email.trim()

    if (!name) {
      setAddError('Name is required')
      return
    }
    if (!phone.match(/^\+233\d{9}$/)) {
      setAddError('Phone must be Ghana format +233XXXXXXXXX')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError('Enter a valid email or leave blank')
      return
    }

    try {
      setAdding(true)
      setAddError('')
      const res = await workers.create({
        name,
        phone,
        email: email || null,
        district_id: user.district_id,
        role: addForm.role
      })
      if (res.error) throw new Error(res.error)
      closeAdd()
      await load()
    } catch (err) {
      setAddError(err.message || 'Could not add worker')
    } finally {
      setAdding(false)
    }
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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <button
        type="button"
        onClick={openAdd}
        disabled={!!officerDistrictScopeLoading || !user?.district_id}
        className="w-full min-h-[2.5rem] sm:min-h-0 sm:w-auto shrink-0 bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add worker
      </button>
      <button
        type="button"
        onClick={load}
        className="w-full min-h-[2.5rem] sm:min-h-0 sm:w-auto shrink-0 bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
      >
        Refresh
      </button>
    </div>
  )

  return (
    <AppLayout
      title="My workers"
      subtitle="Workers in your district — update contact info and monitor open assignments"
      actions={actions}
    >
      {officerDistrictScopeLoading ? (
        <div className="flex justify-center py-20 text-gray-600 text-sm">
          Loading district assignment…
        </div>
      ) : loading ? (
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm min-w-0">
          {sorted.length === 0 ? (
            <p className="text-center py-12 px-4 text-gray-500">No workers listed for your district.</p>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 min-w-[11rem]">
                        Email
                      </th>
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
                        <td className="px-4 py-3 text-gray-600 break-all max-w-[14rem]">
                          {w.email ? (
                            <a href={`mailto:${w.email}`} className="text-green-700 hover:underline">
                              {w.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
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

              <ul className="lg:hidden divide-y divide-gray-100" role="list">
                {sorted.map((w) => (
                  <li key={w.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 break-words">{w.name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{ROLE_LABELS[w.role] || w.role}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100"
                      >
                        Edit
                      </button>
                    </div>
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="text-gray-500 shrink-0 sm:w-24">Phone</dt>
                        <dd className="text-gray-900 break-all min-w-0">{w.phone || '—'}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="text-gray-500 shrink-0 sm:w-24">Email</dt>
                        <dd className="min-w-0 break-all text-gray-800">
                          {w.email ? (
                            <a href={`mailto:${w.email}`} className="text-green-700 hover:underline">
                              {w.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <dt className="text-gray-500 sr-only">Status</dt>
                        <dd>
                          {w.active ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              Inactive
                            </span>
                          )}
                        </dd>
                        <span className="text-gray-400" aria-hidden>
                          ·
                        </span>
                        <span className="text-gray-600">
                          Open tasks:{' '}
                          <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            {openByWorker[w.id] ?? 0}
                          </span>
                        </span>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl shadow-xl max-w-md w-full p-6 sm:rounded-xl max-h-[92dvh] overflow-y-auto mb-[env(safe-area-inset-bottom,0px)] sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Add worker</h3>
            <p className="text-sm text-gray-500 mb-4">New worker in your district</p>
            <form onSubmit={saveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CREATABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (+233)</label>
                <input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+233XXXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="name@example.com"
                />
              </div>
              {addError && <p className="text-sm text-red-600">{addError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? 'Adding…' : 'Add worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl shadow-xl max-w-md w-full p-6 sm:rounded-xl max-h-[92dvh] overflow-y-auto mb-[env(safe-area-inset-bottom,0px)] sm:mb-0">
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
