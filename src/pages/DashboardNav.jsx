import React from 'react'
import { Link } from 'react-router-dom'

const DashboardNav = () => {
  const dashboards = [
    {
      name: 'Simple Dashboard',
      path: '/dashboard-simple',
      description: 'Static data with basic stat cards - tests if styling works',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      name: 'Test Dashboard',
      path: '/dashboard-test',
      description: 'Simulated loading with mock data - tests component behavior',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      name: 'Debug Dashboard',
      path: '/dashboard-debug',
      description: 'Shows raw data and debug information - helps identify issues',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    {
      name: 'Full Dashboard',
      path: '/dashboard',
      description: 'Complete dashboard with real data from database',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    }
  ]

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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Testing</h1>
          </div>
          <nav className="flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <Link to="/dashboard-nav" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard Nav</Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Testing Options</h2>
          <p className="text-gray-600">
            Choose a dashboard version to test. Start with the Simple Dashboard to verify basic functionality.
          </p>
        </div>

        {/* Dashboard Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {dashboards.map((dashboard, index) => (
            <Link
              key={index}
              to={dashboard.path}
              className={`block p-6 rounded-lg border-2 hover:shadow-md transition-all ${dashboard.color}`}
            >
              <h3 className="text-xl font-semibold mb-2">{dashboard.name}</h3>
              <p className="text-sm opacity-80">{dashboard.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium">
                <span>Open Dashboard</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Troubleshooting Guide */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting Guide</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Start with Simple Dashboard</h4>
              <p className="text-sm text-gray-600">
                If you can see the stat cards here, the styling and basic components are working.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Try Test Dashboard</h4>
              <p className="text-sm text-gray-600">
                This tests the loading states and component behavior with simulated data.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Check Debug Dashboard</h4>
              <p className="text-sm text-gray-600">
                This shows raw data and error information to identify data loading issues.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Use Full Dashboard</h4>
              <p className="text-sm text-gray-600">
                Once the others work, this should display real data from your database.
              </p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Common Issues</h3>
          <ul className="space-y-2 text-sm text-red-800">
            <li>• <strong>Cards not visible:</strong> Check browser console for CSS/JavaScript errors</li>
            <li>• <strong>Data not loading:</strong> Verify Supabase connection and database setup</li>
            <li>• <strong>Styling issues:</strong> Ensure Tailwind CSS is properly configured</li>
            <li>• <strong>Component errors:</strong> Check React DevTools for component state</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DashboardNav