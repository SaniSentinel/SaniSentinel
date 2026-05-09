import React, { useState } from 'react'
import { useAuth } from '../hooks'

const RouteTestPage = () => {
  const { user, signOut } = useAuth()
  const [testResults, setTestResults] = useState([])

  // All dashboard routes that should be protected
  const dashboardRoutes = [
    { path: '/home', name: 'Professional Home', level: 'Any Authenticated' },
    { path: '/dashboard', name: 'Dashboard', level: 'Any Authenticated' },
    { path: '/professional-dashboard', name: 'Professional Dashboard', level: 'Any Authenticated' },
    { path: '/facility-map', name: 'Facility Map', level: 'Any Authenticated' },
    { path: '/professional-facility-map', name: 'Professional Facility Map', level: 'Any Authenticated' },
    { path: '/reports', name: 'Reports', level: 'Officer/Admin' },
    { path: '/professional-reports', name: 'Professional Reports', level: 'Officer/Admin' },
    { path: '/maintenance', name: 'Maintenance', level: 'Officer/Admin' },
    { path: '/professional-maintenance', name: 'Professional Maintenance', level: 'Officer/Admin' },
    { path: '/workers', name: 'Workers', level: 'Admin Only' },
    { path: '/professional-workers', name: 'Professional Workers', level: 'Admin Only' },
    { path: '/admin/users', name: 'User Management', level: 'Admin Only' }
  ]

  const demoRoutes = [
    { path: '/demo/add-facility', name: 'Add Facility Demo', level: 'Any Authenticated' },
    { path: '/demo/auth', name: 'Auth Demo', level: 'Any Authenticated' },
    { path: '/demo/auth-guard', name: 'AuthGuard Demo', level: 'Any Authenticated' },
    { path: '/test/auth', name: 'Auth Test', level: 'Any Authenticated' }
  ]

  const legacyRoutes = [
    { path: '/legacy-home', name: 'Legacy Home', level: 'Any Authenticated' },
    { path: '/legacy-facility-map', name: 'Legacy Facility Map', level: 'Any Authenticated' },
    { path: '/map', name: 'Map View', level: 'Any Authenticated' }
  ]

  const testRoute = async (route) => {
    try {
      // Open route in new tab to test protection
      const newWindow = window.open(route.path, '_blank')
      
      // Close after a short delay
      setTimeout(() => {
        if (newWindow) {
          newWindow.close()
        }
      }, 2000)

      setTestResults(prev => [...prev, {
        route: route.name,
        path: route.path,
        level: route.level,
        status: 'Tested',
        message: 'Route opened in new tab - check if it redirected to login or showed content based on your permissions',
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        route: route.name,
        path: route.path,
        level: route.level,
        status: 'Error',
        message: error.message,
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  const testAllRoutes = async () => {
    setTestResults([])
    const allRoutes = [...dashboardRoutes, ...demoRoutes, ...legacyRoutes]
    
    for (const route of allRoutes) {
      await testRoute(route)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Route Protection Test</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sign Out & Test
            </button>
          </div>

          {/* Current User Info */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Current User</h2>
            <div className="text-sm text-blue-700">
              <p>Email: {user?.email}</p>
              <p>Role: {user?.role || 'No role assigned'}</p>
              <p>Permissions: {user?.permissions?.join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={testAllRoutes}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Test All Routes
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {/* Route Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Dashboard Routes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Routes</h3>
              <div className="space-y-2">
                {dashboardRoutes.map((route, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{route.name}</div>
                        <div className="text-xs text-gray-600">{route.path}</div>
                        <div className="text-xs text-blue-600">{route.level}</div>
                      </div>
                      <button
                        onClick={() => testRoute(route)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Routes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Routes</h3>
              <div className="space-y-2">
                {demoRoutes.map((route, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{route.name}</div>
                        <div className="text-xs text-gray-600">{route.path}</div>
                        <div className="text-xs text-green-600">{route.level}</div>
                      </div>
                      <button
                        onClick={() => testRoute(route)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legacy Routes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legacy Routes</h3>
              <div className="space-y-2">
                {legacyRoutes.map((route, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{route.name}</div>
                        <div className="text-xs text-gray-600">{route.path}</div>
                        <div className="text-xs text-purple-600">{route.level}</div>
                      </div>
                      <button
                        onClick={() => testRoute(route)}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Test All Routes" or test individual routes.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{result.route}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{result.level}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            result.status === 'Tested' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{result.path}</div>
                        <div className="text-sm text-gray-700 mt-1">{result.message}</div>
                      </div>
                      <span className="text-xs text-gray-400">{result.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>1. <strong>While Logged In:</strong> Routes should show content based on your role permissions</p>
              <p>2. <strong>After Sign Out:</strong> All protected routes should redirect to /login</p>
              <p>3. <strong>Role Testing:</strong> Try accessing admin routes with officer account (should show access denied)</p>
              <p>4. <strong>Manual Testing:</strong> Click individual "Test" buttons to open routes in new tabs</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-center space-x-4">
            <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Go to Dashboard
            </a>
            <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteTestPage