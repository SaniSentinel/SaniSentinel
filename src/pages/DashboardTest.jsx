import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Simple test stat card component
const TestStatCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon && (
          <div className="text-3xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const DashboardTest = () => {
  const [stats, setStats] = useState({
    facilities: 0,
    critical: 0,
    alerts: 0,
    districts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Simple data loading simulation
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Set test data
        setStats({
          facilities: 25,
          critical: 3,
          alerts: 7,
          districts: 18
        })
        
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Test</h1>
          </div>
          <nav className="flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <Link to="/dashboard-test" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard Test</Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Test</h2>
          <p className="text-gray-600">Testing stat cards display and functionality</p>
        </div>

        {/* Test Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <TestStatCard
            title="Total Facilities"
            value={loading ? '...' : stats.facilities}
            icon="🏢"
            color="blue"
          />
          
          <TestStatCard
            title="Critical Facilities"
            value={loading ? '...' : stats.critical}
            icon="🚨"
            color="red"
          />
          
          <TestStatCard
            title="Alerts Today"
            value={loading ? '...' : stats.alerts}
            icon="⚠️"
            color="yellow"
          />
          
          <TestStatCard
            title="Districts Covered"
            value={loading ? '...' : stats.districts}
            icon="🗺️"
            color="green"
          />
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
            <div><strong>Stats:</strong> {JSON.stringify(stats, null, 2)}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardTest