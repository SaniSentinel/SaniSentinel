import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks'

const DashboardDebug = () => {
  const [debugInfo, setDebugInfo] = useState({})
  
  const dashboardData = useDashboard({
    autoRefresh: false, // Disable auto-refresh for debugging
    refreshInterval: 0,
    includeActivity: true,
    includeMetrics: true
  })

  const { 
    stats, 
    activity, 
    metrics, 
    loading, 
    error, 
    lastUpdated,
    derivedStats,
    refresh 
  } = dashboardData

  // Update debug info whenever data changes
  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toISOString(),
      loading,
      error,
      lastUpdated: lastUpdated?.toISOString(),
      stats: JSON.stringify(stats, null, 2),
      activity: JSON.stringify(activity, null, 2),
      metrics: JSON.stringify(metrics, null, 2),
      derivedStats: JSON.stringify(derivedStats, null, 2)
    })
  }, [stats, activity, metrics, loading, error, lastUpdated, derivedStats])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Debug</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link to="/dashboard-debug" className="text-blue-600 border-b-2 border-blue-600 pb-1">Debug</Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Loading Status</h3>
            <div className={`text-2xl font-bold ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
              {loading ? 'Loading...' : 'Loaded'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Error Status</h3>
            <div className={`text-2xl font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'Error' : 'OK'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Facilities</h3>
            <div className="text-2xl font-bold text-blue-600">
              {stats.facilities.total}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Districts</h3>
            <div className="text-2xl font-bold text-green-600">
              {stats.districts.total}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
            <pre className="text-red-800 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Raw Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stats Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats Data</h3>
            <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {debugInfo.stats}
            </pre>
          </div>

          {/* Activity Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Data</h3>
            <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {debugInfo.activity}
            </pre>
          </div>

          {/* Metrics Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics Data</h3>
            <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {debugInfo.metrics}
            </pre>
          </div>

          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Last Updated:</strong> {debugInfo.lastUpdated || 'Never'}</div>
              <div><strong>Hook Available:</strong> {useDashboard ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardDebug