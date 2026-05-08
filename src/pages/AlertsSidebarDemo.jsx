import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertsSidebar } from '../components'
import { useAlerts } from '../hooks'

const AlertsSidebarDemo = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { summary, loading } = useAlerts({ includeSummary: true })

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
            <h1 className="text-2xl font-bold text-gray-900">Real-time Alerts Demo</h1>
          </div>
          <nav className="flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <Link to="/facility-map" className="text-gray-500 hover:text-gray-900">Facility Map</Link>
            <Link to="/alerts-demo" className="text-blue-600 border-b-2 border-blue-600 pb-1">Alerts Demo</Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-time Alerts Sidebar</h2>
          <p className="text-gray-600 mb-6">
            This page demonstrates the real-time alerts sidebar that uses Supabase Realtime to listen for changes 
            on the 'alerts' table. The sidebar shows live updates when new alerts are created or existing ones are resolved.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Features Included:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>✅ Real-time updates using Supabase Realtime</li>
              <li>✅ Filter alerts by status (All, Active, Critical, High, Resolved)</li>
              <li>✅ Visual indicators for alert types and severity levels</li>
              <li>✅ One-click resolve/reopen functionality</li>
              <li>✅ Live counters and statistics</li>
              <li>✅ Collapsible sidebar with notification badge</li>
              <li>✅ Automatic refresh and error handling</li>
              <li>✅ Responsive design and smooth animations</li>
            </ul>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : summary.total}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {loading ? '...' : summary.critical}
                </p>
              </div>
              <div className="text-2xl">🚨</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : summary.high}
                </p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? '...' : summary.medium}
                </p>
              </div>
              <div className="text-2xl">🔧</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Priority</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : summary.low}
                </p>
              </div>
              <div className="text-2xl">ℹ️</div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alert Types */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Alert Types</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-xl">🔧</span>
                <div>
                  <div className="font-medium text-gray-900">Maintenance Due</div>
                  <div className="text-sm text-gray-600">Facilities requiring scheduled maintenance</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-medium text-gray-900">High Risk</div>
                  <div className="text-sm text-gray-600">Facilities with elevated risk scores</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <span className="text-xl">🚨</span>
                <div>
                  <div className="font-medium text-gray-900">Critical Status</div>
                  <div className="text-sm text-gray-600">Facilities requiring immediate attention</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-xl">💧</span>
                <div>
                  <div className="font-medium text-gray-900">Overflow Detected</div>
                  <div className="text-sm text-gray-600">Facilities experiencing overflow conditions</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <span className="text-xl">❌</span>
                <div>
                  <div className="font-medium text-gray-900">System Failure</div>
                  <div className="text-sm text-gray-600">Facilities that are out of service</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <span className="text-xl">🌧️</span>
                <div>
                  <div className="font-medium text-gray-900">Climate Warning</div>
                  <div className="text-sm text-gray-600">Weather-related alerts and warnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Features */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Features</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Live Updates</div>
                  <div className="text-sm text-gray-600">
                    New alerts appear instantly when created in the database
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Status Changes</div>
                  <div className="text-sm text-gray-600">
                    Alert resolution and reopening updates in real-time
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Visual Feedback</div>
                  <div className="text-sm text-gray-600">
                    New alerts are highlighted with animations and badges
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Smart Filtering</div>
                  <div className="text-sm text-gray-600">
                    Filter by status, severity, or type with live counters
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Error Recovery</div>
                  <div className="text-sm text-gray-600">
                    Automatic reconnection and graceful error handling
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sidebar Controls</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click the alert icon to toggle the sidebar</li>
                <li>• Use filter tabs to view different alert categories</li>
                <li>• Click "Resolve" to mark alerts as completed</li>
                <li>• Click "Reopen" to reactivate resolved alerts</li>
                <li>• Use the refresh button to manually reload data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Add to any page by importing AlertsSidebar</li>
                <li>• Use useAlerts hook for alert data management</li>
                <li>• Customize appearance with className prop</li>
                <li>• Control visibility with isOpen and onToggle props</li>
                <li>• Automatic Supabase Realtime subscription</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Sidebar */}
      <AlertsSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}

export default AlertsSidebarDemo