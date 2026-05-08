import React from 'react'
import { Link } from 'react-router-dom'
import Dashboard from './Dashboard'

const DashboardDemo = () => {
  return (
    <div>
      {/* Demo Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Demo</h1>
              <p className="text-blue-100">
                Real-time facility management dashboard with live statistics and alerts
              </p>
            </div>
            <Link 
              to="/"
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Component */}
      <Dashboard />
    </div>
  )
}

export default DashboardDemo