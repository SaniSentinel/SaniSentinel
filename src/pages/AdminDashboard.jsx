import React from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { supabase } from '../lib/supabase'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { stats, activity, facilityDistribution, loading, error, refresh, lastUpdated } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    includeActivity: true,
    includeMetrics: false
  })

  if (user?.role !== 'admin' && user?.role !== 'system_admin') {
    return null
  }

  const openTasks = (activity.maintenance.pending || 0) + (activity.maintenance.inProgress || 0)
  const [riskConfig, setRiskConfig] = React.useState({
    climate_weight: 0.3,
    condition_weight: 1,
    maintenance_weight: 1,
    reports_weight: 1,
    location_weight: 1,
    critical_threshold: 80,
    high_threshold: 60,
    medium_threshold: 40,
    low_threshold: 20
  })
  const [savingConfig, setSavingConfig] = React.useState(false)
  const [riskConfigMessage, setRiskConfigMessage] = React.useState('')
  const districtComparison = Object.entries(facilityDistribution || {}).map(([districtName, districtStats]) => {
    const weightedRisk =
      ((districtStats.atRisk || 0) * 45) +
      ((districtStats.highRisk || 0) * 72) +
      ((districtStats.critical || 0) * 92)
    const averageRisk = districtStats.total > 0 ? Math.round(weightedRisk / districtStats.total) : 0

    return {
      districtName,
      region: districtStats.region || 'Unknown',
      total: districtStats.total || 0,
      critical: districtStats.critical || 0,
      averageRisk
    }
  }).sort((a, b) => b.averageRisk - a.averageRisk)

  const cards = [
    {
      title: 'All Districts',
      value: stats.districts.total,
      icon: '🗺️',
      accent: 'text-blue-700'
    },
    {
      title: 'Total Facilities',
      value: stats.facilities.total,
      icon: '🏢',
      accent: 'text-green-700'
    },
    {
      title: 'Critical Count',
      value: stats.facilities.critical,
      icon: '🚨',
      accent: 'text-red-700'
    },
    {
      title: 'Open Tasks',
      value: openTasks,
      icon: '🔧',
      accent: 'text-amber-700'
    }
  ]

  React.useEffect(() => {
    const loadRiskConfig = async () => {
      const { data, error: cfgError } = await supabase
        .rpc('get_active_risk_scoring_config')
        .single()

      if (!cfgError && data) {
        setRiskConfig({
          climate_weight: Number(data.climate_weight ?? 0.3),
          condition_weight: Number(data.condition_weight ?? 1),
          maintenance_weight: Number(data.maintenance_weight ?? 1),
          reports_weight: Number(data.reports_weight ?? 1),
          location_weight: Number(data.location_weight ?? 1),
          critical_threshold: Number(data.critical_threshold ?? 80),
          high_threshold: Number(data.high_threshold ?? 60),
          medium_threshold: Number(data.medium_threshold ?? 40),
          low_threshold: Number(data.low_threshold ?? 20)
        })
      }
    }

    loadRiskConfig()
  }, [])

  const saveRiskConfig = async () => {
    try {
      setSavingConfig(true)
      setRiskConfigMessage('')
      const { error: upsertError } = await supabase.rpc('upsert_risk_scoring_config', {
        p_climate_weight: riskConfig.climate_weight,
        p_condition_weight: riskConfig.condition_weight,
        p_maintenance_weight: riskConfig.maintenance_weight,
        p_reports_weight: riskConfig.reports_weight,
        p_location_weight: riskConfig.location_weight,
        p_critical_threshold: riskConfig.critical_threshold,
        p_high_threshold: riskConfig.high_threshold,
        p_medium_threshold: riskConfig.medium_threshold,
        p_low_threshold: riskConfig.low_threshold
      })

      if (upsertError) throw upsertError
      setRiskConfigMessage('Risk scoring config saved.')
    } catch (cfgError) {
      setRiskConfigMessage(`Failed to save config: ${cfgError.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <AppLayout
      title="Admin Dashboard"
      subtitle={lastUpdated ? `National overview • Updated ${lastUpdated.toLocaleString()}` : 'National overview'}
      actions={(
        <button
          onClick={refresh}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      )}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <span className="text-xl" aria-hidden="true">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.accent}`}>
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">National GIS View</h2>
            <p className="text-sm text-gray-600 mt-1">
              Open the full map with all districts and all facility markers.
            </p>
          </div>
          <Link
            to="/admin/gis-map"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open GIS Map
          </Link>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cross-District Comparison</h2>
          <span className="text-sm text-gray-500">Risk score and critical counts by district</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading district comparison...</p>
        ) : (
          <div className="space-y-3">
            {(districtComparison.length === 0) && (
              <p className="text-sm text-gray-500">No district data available.</p>
            )}

            {districtComparison.map((district) => {
              const maxRisk = 100
              const barWidth = Math.max(4, Math.min(100, Math.round((district.averageRisk / maxRisk) * 100)))

              return (
                <div key={district.districtName} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{district.districtName}</p>
                      <p className="text-xs text-gray-500">{district.region} Region • {district.total} facilities</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{district.averageRisk}/100 risk</p>
                      <p className="text-xs text-red-600">{district.critical} critical</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Risk Scoring Config</h2>
          <button
            onClick={saveRiskConfig}
            disabled={savingConfig}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
          >
            {savingConfig ? 'Saving...' : 'Save Config'}
          </button>
        </div>

        {riskConfigMessage && (
          <p className="text-sm text-gray-600 mb-4">{riskConfigMessage}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">
            Climate Weight
            <input
              type="number"
              min="0"
              max="3"
              step="0.05"
              value={riskConfig.climate_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, climate_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Condition Weight
            <input
              type="number"
              min="0"
              max="3"
              step="0.05"
              value={riskConfig.condition_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, condition_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Maintenance Weight
            <input
              type="number"
              min="0"
              max="3"
              step="0.05"
              value={riskConfig.maintenance_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, maintenance_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Reports Weight
            <input
              type="number"
              min="0"
              max="3"
              step="0.05"
              value={riskConfig.reports_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, reports_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Location Weight
            <input
              type="number"
              min="0"
              max="3"
              step="0.05"
              value={riskConfig.location_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, location_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Critical Threshold
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={riskConfig.critical_threshold}
              onChange={(e) => setRiskConfig({ ...riskConfig, critical_threshold: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
        </div>
      </div>
    </AppLayout>
  )
}

export default AdminDashboard
