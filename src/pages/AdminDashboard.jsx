import React from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { stats, activity, loading, error, refresh, lastUpdated } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    includeActivity: true,
    includeMetrics: false
  })

  if (user?.role !== 'admin' && user?.role !== 'system_admin') {
    return null
  }

  const openTasks = (activity.maintenance.pending || 0) + (activity.maintenance.inProgress || 0)

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
    </AppLayout>
  )
}

export default AdminDashboard
