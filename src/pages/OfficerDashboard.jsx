import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { reports } from '../lib/reports'

function formatMonthInput(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Local calendar month → [start inclusive, end exclusive) as ISO strings */
function monthUtcRange(yearMonthStr) {
  const [ys, ms] = yearMonthStr.split('-')
  const y = Number(ys)
  const m = Number(ms) - 1
  if (Number.isNaN(y) || Number.isNaN(m)) return null
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}

const CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'overflow', label: 'Overflow' },
  { value: 'dry', label: 'Dry' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'out_of_service', label: 'Out of service' }
]

const OfficerDashboard = () => {
  const { user } = useAuth()
  const districtId = user?.district_id || null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [districtName, setDistrictName] = useState('')
  const [stats, setStats] = useState({
    totalFacilities: 0,
    criticalFacilities: 0,
    openTasks: 0
  })

  const [facilities, setFacilities] = useState([])
  const [manualFacilityId, setManualFacilityId] = useState('')
  const [manualCondition, setManualCondition] = useState('good')
  const [manualNotes, setManualNotes] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualFeedback, setManualFeedback] = useState(null)

  const [reportMonth, setReportMonth] = useState(() => formatMonthInput(new Date()))
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlyError, setMonthlyError] = useState(null)
  const [monthly, setMonthly] = useState({
    incidentReports: null,
    avgFacilityRisk: null,
    maintenanceCompletionPct: null,
    maintenanceBreakdown: { total: 0, completed: 0 }
  })

  const loadDistrictSummary = useCallback(async () => {
    if (!districtId) {
      setLoading(false)
      setError('No district assigned to this officer account.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [districtRes, facilitiesRes, tasksRes] = await Promise.all([
        supabase.from('districts').select('name').eq('id', districtId).single(),
        supabase.from('facilities').select('id, risk_score').eq('district_id', districtId),
        supabase
          .from('maintenance_tasks')
          .select('id, status, facility:facilities!inner(district_id)')
          .eq('facility.district_id', districtId)
          .in('status', ['pending', 'assigned', 'in_progress'])
      ])

      if (districtRes.error) throw new Error(districtRes.error.message)
      if (facilitiesRes.error) throw new Error(facilitiesRes.error.message)
      if (tasksRes.error) throw new Error(tasksRes.error.message)

      const facilityRows = facilitiesRes.data || []
      const criticalCount = facilityRows.filter((f) => (f.risk_score || 0) >= 85).length

      setDistrictName(districtRes.data?.name || '')
      setStats({
        totalFacilities: facilityRows.length,
        criticalFacilities: criticalCount,
        openTasks: (tasksRes.data || []).length
      })

      const listRes = await supabase
        .from('facilities')
        .select('id, name')
        .eq('district_id', districtId)
        .order('name')

      if (listRes.error) throw new Error(listRes.error.message)
      setFacilities(listRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [districtId])

  const loadMonthlyMetrics = useCallback(async () => {
    if (!districtId || !reportMonth) return

    const range = monthUtcRange(reportMonth)
    if (!range) return

    setMonthlyLoading(true)
    setMonthlyError(null)

    try {
      const [repRes, taskRes, facRiskRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, condition, created_at, facility:facilities!inner(district_id)')
          .eq('facility.district_id', districtId)
          .gte('created_at', range.start)
          .lt('created_at', range.end),
        supabase
          .from('maintenance_tasks')
          .select('id, status, created_at, facility:facilities!inner(district_id)')
          .eq('facility.district_id', districtId)
          .gte('created_at', range.start)
          .lt('created_at', range.end),
        supabase.from('facilities').select('risk_score').eq('district_id', districtId)
      ])

      if (repRes.error) throw new Error(repRes.error.message)
      if (taskRes.error) throw new Error(taskRes.error.message)
      if (facRiskRes.error) throw new Error(facRiskRes.error.message)

      const reportRows = repRes.data || []
      const incidentReports = reportRows.filter((r) => r.condition && r.condition !== 'good').length

      const riskRows = facRiskRes.data || []
      const numericScores = riskRows.map((f) => Number(f.risk_score) || 0)
      const avgFacilityRisk =
        numericScores.length > 0
          ? Math.round(
              numericScores.reduce((acc, x) => acc + x, 0) / numericScores.length
            )
          : null

      const taskRows = taskRes.data || []
      const completed = taskRows.filter((t) => t.status === 'completed').length
      const total = taskRows.length
      const maintenanceCompletionPct =
        total > 0 ? Math.round((completed / total) * 1000) / 10 : null

      setMonthly({
        incidentReports,
        avgFacilityRisk,
        maintenanceCompletionPct,
        maintenanceBreakdown: { total, completed }
      })
    } catch (e) {
      setMonthlyError(e.message)
      setMonthly({
        incidentReports: null,
        avgFacilityRisk: null,
        maintenanceCompletionPct: null,
        maintenanceBreakdown: { total: 0, completed: 0 }
      })
    } finally {
      setMonthlyLoading(false)
    }
  }, [districtId, reportMonth])

  useEffect(() => {
    loadDistrictSummary()
  }, [loadDistrictSummary])

  useEffect(() => {
    loadMonthlyMetrics()
  }, [loadMonthlyMetrics])

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setManualFeedback(null)

    if (!manualFacilityId) {
      setManualFeedback({ type: 'error', text: 'Select a facility.' })
      return
    }

    const reportedBy =
      user?.email ? `officer:${user.email}` : user?.id ? `officer:${user.id}` : 'officer:unknown'

    setManualSubmitting(true)
    try {
      const result = await reports.create({
        facility_id: manualFacilityId,
        reported_by: reportedBy,
        condition: manualCondition,
        notes: manualNotes.trim() || null
      })

      if (result.error) throw new Error(result.error)

      setManualFeedback({
        type: 'ok',
        text: 'Report submitted. Facility status was updated from this condition.'
      })
      setManualNotes('')
      setManualCondition('good')
      await loadDistrictSummary()
      await loadMonthlyMetrics()
    } catch (err) {
      setManualFeedback({ type: 'error', text: err.message })
    } finally {
      setManualSubmitting(false)
    }
  }

  const cards = useMemo(
    () => [
      { title: 'Facilities in My District', value: stats.totalFacilities, icon: '🏢', color: 'text-blue-700' },
      { title: 'My Critical Count', value: stats.criticalFacilities, icon: '🚨', color: 'text-red-700' },
      { title: 'My Open Tasks', value: stats.openTasks, icon: '🔧', color: 'text-amber-700' }
    ],
    [stats]
  )

  if (user?.role !== 'district_officer') {
    return null
  }

  return (
    <AppLayout
      title="Officer Dashboard"
      subtitle={districtName ? `${districtName} District overview` : 'District overview'}
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{card.title}</p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{loading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Submit facility condition</h2>
          <p className="text-sm text-gray-500 mb-4">
            Log a condition report from the field without SMS. This updates the facility&apos;s
            recorded status.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
              <select
                value={manualFacilityId}
                onChange={(e) => setManualFacilityId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={!districtId || loading}
              >
                <option value="">Select facility…</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={manualCondition}
                onChange={(e) => setManualCondition(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Details, location on site, follow-up needed…"
              />
            </div>

            {manualFeedback && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  manualFeedback.type === 'ok'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {manualFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={manualSubmitting || !districtId}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {manualSubmitting ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">District monthly report</h2>
          <p className="text-sm text-gray-500 mb-4">
            Auto-metrics for your district: problem reports in the month, current average facility
            risk, and maintenance outcomes for tasks created in the month.
          </p>

          <div className="flex flex-wrap items-end gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="button"
              onClick={loadMonthlyMetrics}
              disabled={monthlyLoading}
              className="text-sm text-green-700 font-medium hover:text-green-900 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {monthlyError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {monthlyError}
            </div>
          )}

          {monthlyLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-4">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Incident reports
                </dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {monthly.incidentReports ?? '—'}
                </dd>
                <p className="mt-1 text-xs text-gray-500">
                  Count of reports in this month where condition is not &quot;good&quot; (problem
                  conditions).
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Avg facility risk
                </dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {monthly.avgFacilityRisk != null ? `${monthly.avgFacilityRisk}` : '—'}
                </dd>
                <p className="mt-1 text-xs text-gray-500">
                  Mean risk score across all facilities in your district (current scores).
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Maintenance completion
                </dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {monthly.maintenanceCompletionPct != null
                    ? `${monthly.maintenanceCompletionPct}%`
                    : '—'}
                </dd>
                <p className="mt-1 text-xs text-gray-500">
                  Of maintenance tasks <strong>created</strong> in this month for your district:{' '}
                  {monthly.maintenanceBreakdown.completed} completed of{' '}
                  {monthly.maintenanceBreakdown.total} total.
                  {monthly.maintenanceBreakdown.total === 0 && ' No tasks created in this month.'}
                </p>
              </div>
            </dl>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

export default OfficerDashboard
