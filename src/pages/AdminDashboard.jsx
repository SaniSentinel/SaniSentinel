import React from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'
import { useDashboard } from '../hooks/useDashboard'

const AdminDashboard = () => {
  const { stats, activity, facilityDistribution, loading, error, refresh, lastUpdated } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    includeActivity: true,
    includeMetrics: false
  })

  const openTasks = (activity.maintenance.pending || 0) + (activity.maintenance.inProgress || 0)
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

  const activitySummary = [
    { label: 'Reports (7d)', value: activity.reports.total, color: 'bg-blue-600' },
    { label: 'Alerts (7d)', value: activity.alerts.total, color: 'bg-amber-500' },
    { label: 'Tasks Completed (7d)', value: activity.maintenance.completed, color: 'bg-green-600' },
    { label: 'Tasks Pending', value: activity.maintenance.pending, color: 'bg-red-600' }
  ]
  const maxActivity = Math.max(...activitySummary.map((item) => item.value), 1)

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

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link
          to="/reports"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-green-300 hover:shadow transition-all"
        >
          <p className="text-sm font-semibold text-gray-900">All district reports</p>
          <p className="text-xs text-gray-500 mt-1">Live sanitation reports across every district.</p>
        </Link>
        <Link
          to="/facility-map"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-green-300 hover:shadow transition-all"
        >
          <p className="text-sm font-semibold text-gray-900">National facility map</p>
          <p className="text-xs text-gray-500 mt-1">GIS view of all facilities (same data officers see for their district).</p>
        </Link>
        <Link
          to="/maintenance"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-green-300 hover:shadow transition-all"
        >
          <p className="text-sm font-semibold text-gray-900">Maintenance (all districts)</p>
          <p className="text-xs text-gray-500 mt-1">Tasks and workload nationwide.</p>
        </Link>
        <Link
          to="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-green-300 hover:shadow transition-all"
        >
          <p className="text-sm font-semibold text-gray-900">District officer accounts</p>
          <p className="text-xs text-gray-500 mt-1">Create credentials and manage officer access.</p>
        </Link>
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
          <h2 className="text-lg font-semibold text-gray-900">Overview of Activities</h2>
          <span className="text-sm text-gray-500">Last 7 days + current pending tasks</span>
        </div>
        <div className="space-y-3">
          {activitySummary.map((item) => {
            const width = Math.max(4, Math.round((item.value / maxActivity) * 100))
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">National Reports & Exports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate monthly national WASH PDF and export CSV/PDF by district/date range.
            </p>
          </div>
          <Link
            to="/admin/reports-exports"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Open Report Generator
          </Link>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SMS Gateway History</h2>
            <p className="text-sm text-gray-600 mt-1">
              View full inbound and outbound SMS logs across all districts.
            </p>
          </div>
          <Link
            to="/admin/sms-logs"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Open SMS Logs
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

    </AppLayout>
  )
}

export default AdminDashboard
