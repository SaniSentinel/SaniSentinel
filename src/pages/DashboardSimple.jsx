import React from 'react'
import { Link } from 'react-router-dom'

// Simple StatCard component
const SimpleStatCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  }

  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
        {icon && (
          <div className="text-3xl opacity-75">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const DashboardSimple = () => {
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
            <h1 className="text-2xl font-bold text-gray-900">Simple Dashboard</h1>
          </div>
          <nav className="flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <Link to="/dashboard-simple" className="text-blue-600 border-b-2 border-blue-600 pb-1">Simple Dashboard</Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Key metrics and system status</p>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SimpleStatCard
            title="Total Facilities"
            value="25"
            icon="🏢"
            color="blue"
          />
          
          <SimpleStatCard
            title="Critical Facilities"
            value="3"
            icon="🚨"
            color="red"
          />
          
          <SimpleStatCard
            title="Alerts Today"
            value="7"
            icon="⚠️"
            color="yellow"
          />
          
          <SimpleStatCard
            title="Districts Covered"
            value="18"
            icon="🗺️"
            color="green"
          />
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🟢</div>
              <div className="text-sm text-gray-600">Overall Health</div>
              <div className="text-lg font-bold text-gray-900">85% Healthy</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-sm text-gray-600">Critical Issues</div>
              <div className="text-lg font-bold text-gray-900">3 Active</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm text-gray-600">Maintenance</div>
              <div className="text-lg font-bold text-gray-900">92% Complete</div>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Test Dashboard</h4>
          <p className="text-blue-800 text-sm">
            This is a simplified dashboard with static data to test the stat cards display. 
            If you can see the cards above, the styling is working correctly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardSimple