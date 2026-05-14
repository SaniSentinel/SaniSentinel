import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { alerts } from '../lib/alerts'
import { supabase } from '../lib/supabase'

const ALERT_TYPES = {
  maintenance_due: { label: 'Maintenance Due', icon: '🔧' },
  high_risk: { label: 'High Risk', icon: '⚠️' },
  critical_status: { label: 'Critical Status', icon: '🚨' },
  overflow_detected: { label: 'Overflow Detected', icon: '💧' },
  system_failure: { label: 'System Failure', icon: '❌' },
  climate_warning: { label: 'Climate Warning', icon: '🌧️' },
  worker_task_update: { label: 'Worker Task Update', icon: '🧰' }
}

const SEVERITY_DOT = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600'
}

const OfficerAlerts = () => {
  const { user } = useAuth()
  const [allAlerts, setAllAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fatalFetchError, setFatalFetchError] = useState(false)
  const [filter, setFilter] = useState('active')
  const [newAlertIds, setNewAlertIds] = useState(() => new Set())

  const loadAlerts = useCallback(async () => {
    if (fatalFetchError) return
    try {
      setLoading(true)
      setError(null)
      const result = await alerts.getAll(200)
      if (result.error) throw new Error(result.error)
      setAllAlerts(result.data || [])
    } catch (err) {
      console.error(err)
      setError(err.message)
      const message = String(err?.message || '')
      if (message.includes('operator does not exist: text ->> unknown') || message.includes('404')) {
        setFatalFetchError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [fatalFetchError])

  useEffect(() => {
    if (fatalFetchError) return
    const subscription = supabase
      .channel('officer_alerts_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const result = await alerts.getById(payload.new.id)
            if (result.data) {
              setAllAlerts((prev) => [result.data, ...prev.filter((a) => a.id !== result.data.id)])
              setNewAlertIds((prev) => new Set(prev).add(result.data.id))
              setTimeout(() => {
                setNewAlertIds((prev) => {
                  const next = new Set(prev)
                  next.delete(result.data.id)
                  return next
                })
              }, 3000)
            }
          } else if (payload.eventType === 'UPDATE') {
            setAllAlerts((prev) =>
              prev.map((a) => (a.id === payload.new.id ? { ...a, ...payload.new } : a))
            )
          } else if (payload.eventType === 'DELETE') {
            setAllAlerts((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [fatalFetchError])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const filtered = useMemo(() => {
    let list = [...allAlerts]
    switch (filter) {
      case 'active':
        list = list.filter((a) => !a.resolved)
        break
      case 'critical':
        list = list.filter((a) => a.severity === 'critical' && !a.resolved)
        break
      case 'high':
        list = list.filter((a) => a.severity === 'high' && !a.resolved)
        break
      case 'resolved':
        list = list.filter((a) => a.resolved)
        break
      default:
        break
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [allAlerts, filter])

  const counts = useMemo(
    () => ({
      active: allAlerts.filter((a) => !a.resolved).length,
      critical: allAlerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
      high: allAlerts.filter((a) => a.severity === 'high' && !a.resolved).length,
      resolved: allAlerts.filter((a) => a.resolved).length,
      all: allAlerts.length
    }),
    [allAlerts]
  )

  const handleResolve = async (id) => {
    const result = await alerts.resolve(id)
    if (!result.error) {
      setAllAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)))
    }
  }

  const handleReopen = async (id) => {
    const result = await alerts.reopen(id)
    if (!result.error) {
      setAllAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: false } : a)))
    }
  }

  const actions = (
    <button
      type="button"
      onClick={loadAlerts}
      className="w-full sm:w-auto shrink-0 bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
    >
      Refresh
    </button>
  )

  if (user?.role !== 'district_officer') {
    return null
  }

  return (
    <AppLayout
      title="My alerts"
      subtitle="Live feed scoped to your district (Supabase realtime + row-level security)"
      actions={actions}
    >
      <div
        className="-mx-1 mb-5 flex gap-2 overflow-x-auto pb-1 px-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Alert filters"
      >
        {[
          { key: 'active', label: 'Active', n: counts.active },
          { key: 'critical', label: 'Critical', n: counts.critical },
          { key: 'high', label: 'High', n: counts.high },
          { key: 'resolved', label: 'Resolved', n: counts.resolved },
          { key: 'all', label: 'All', n: counts.all }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 snap-start px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-80">({tab.n})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Could not load alerts</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={loadAlerts}
            className="mt-4 text-sm text-green-700 underline"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          No alerts in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => {
            const meta = ALERT_TYPES[alert.alert_type] || ALERT_TYPES.high_risk
            const dot = SEVERITY_DOT[alert.severity] || 'bg-gray-400'
            const isNew = newAlertIds.has(alert.id)
            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm min-w-0 ${
                  isNew ? 'ring-2 ring-green-400 ring-offset-0 sm:ring-offset-2' : 'border-gray-200'
                } ${alert.resolved ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col gap-4 min-w-0">
                  <div className="flex gap-3 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-semibold text-gray-900 break-words">{meta.label}</h3>
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} title={alert.severity} />
                        <span className="text-xs uppercase text-gray-500 shrink-0">{alert.severity}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 break-words">
                        {alert.facility?.name || 'Facility'}
                        {alert.facility?.district?.name && (
                          <span className="text-gray-400"> · {alert.facility.district.name}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 mt-2 break-words">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                    {alert.resolved ? (
                      <button
                        type="button"
                        onClick={() => handleReopen(alert.id)}
                        className="flex-1 sm:flex-none min-h-[2.5rem] px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolve(alert.id)}
                        className="flex-1 sm:flex-none min-h-[2.5rem] px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default OfficerAlerts
