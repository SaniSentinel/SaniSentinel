import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/Layout/AppLayout'

const AdminDebug = () => {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const [debugData, setDebugData] = useState({
    facilities: [],
    reports: [],
    alerts: [],
    districts: [],
    loading: true,
    errors: []
  })

  const runDiagnostics = async () => {
    const errors = []
    const results = {}

    try {
      // Test 1: Check authentication
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        errors.push(`Auth Error: ${authError.message}`)
      }
      results.auth = authData

      // Test 2: Check facilities
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('*, district:districts(*)')
      
      if (facilitiesError) {
        errors.push(`Facilities Error: ${facilitiesError.message}`)
      }
      results.facilities = facilities || []

      // Test 3: Check reports
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*, facility:facilities(name)')
        .limit(10)
      
      if (reportsError) {
        errors.push(`Reports Error: ${reportsError.message}`)
      }
      results.reports = reports || []

      // Test 4: Check alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*, facility:facilities(name)')
        .limit(10)
      
      if (alertsError) {
        errors.push(`Alerts Error: ${alertsError.message}`)
      }
      results.alerts = alerts || []

      // Test 5: Check districts
      const { data: districts, error: districtsError } = await supabase
        .from('districts')
        .select('*')
      
      if (districtsError) {
        errors.push(`Districts Error: ${districtsError.message}`)
      }
      results.districts = districts || []

      setDebugData({
        ...results,
        loading: false,
        errors
      })

    } catch (error) {
      console.error('Debug error:', error)
      setDebugData(prev => ({
        ...prev,
        loading: false,
        errors: [...prev.errors, `General Error: ${error.message}`]
      }))
    }
  }

  useEffect(() => {
    if (!authLoading) {
      runDiagnostics()
    }
  }, [authLoading])

  const facilitiesWithCoords = debugData.facilities.filter(f => f.lat && f.lng)

  return (
    <AppLayout title="Admin Debug" subtitle="Diagnostic information for troubleshooting">
      <div className="space-y-6">
        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Authentication Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Is Admin:</span>
                <span className={isAdmin ? 'text-green-600' : 'text-red-600'}>
                  {isAdmin ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{user?.email || 'Not logged in'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Role:</span>
                <span>{user?.role || 'No role'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">District ID:</span>
                <span>{user?.district_id || 'No district'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{user?.name || 'No name'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Permissions:</span>
                <span>{user?.permissions?.join(', ') || 'No permissions'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Counts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Data Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{debugData.districts.length}</div>
              <div className="text-sm text-blue-700">Districts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{debugData.facilities.length}</div>
              <div className="text-sm text-green-700">Facilities</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{debugData.reports.length}</div>
              <div className="text-sm text-yellow-700">Reports</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{debugData.alerts.length}</div>
              <div className="text-sm text-red-700">Alerts</div>
            </div>
          </div>
        </div>

        {/* Map Data Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🗺️ Map Data Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Facilities with Coordinates:</span>
              <span className={facilitiesWithCoords.length > 0 ? 'text-green-600' : 'text-red-600'}>
                {facilitiesWithCoords.length} / {debugData.facilities.length}
                {facilitiesWithCoords.length > 0 ? ' ✅' : ' ❌'}
              </span>
            </div>
            
            {facilitiesWithCoords.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Sample Facilities for Map:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {facilitiesWithCoords.slice(0, 5).map(facility => (
                    <div key={facility.id} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{facility.name}</div>
                      <div className="text-gray-600">
                        {facility.district?.name} • {facility.lat}, {facility.lng} • Risk: {facility.risk_score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {debugData.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Errors Found</h2>
            <div className="space-y-2">
              {debugData.errors.map((error, index) => (
                <div key={index} className="text-red-700 bg-red-100 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data (Collapsible) */}
        <details className="bg-white rounded-lg shadow">
          <summary className="p-6 cursor-pointer font-semibold">🔍 Raw Debug Data (Click to expand)</summary>
          <div className="px-6 pb-6">
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify({
                user,
                facilities: debugData.facilities,
                reports: debugData.reports,
                alerts: debugData.alerts,
                districts: debugData.districts
              }, null, 2)}
            </pre>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={runDiagnostics}
            disabled={debugData.loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {debugData.loading ? 'Running...' : 'Refresh Diagnostics'}
          </button>
          
          <a
            href="/facility-map"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-block text-center"
          >
            Go to Facility Map
          </a>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">💡 Recommendations</h2>
          <div className="space-y-2 text-blue-700">
            {!isAuthenticated && (
              <div>• You are not authenticated. Please log in at <a href="/login" className="underline">/login</a></div>
            )}
            {!isAdmin && isAuthenticated && (
              <div>• You are not an admin. Contact system administrator to update your role.</div>
            )}
            {debugData.facilities.length === 0 && (
              <div>• No facilities found. Run the facility seeding migration in Supabase.</div>
            )}
            {facilitiesWithCoords.length === 0 && debugData.facilities.length > 0 && (
              <div>• Facilities exist but have no coordinates. Update facilities with lat/lng values.</div>
            )}
            {debugData.errors.length > 0 && (
              <div>• Database errors detected. Check Supabase connection and RLS policies.</div>
            )}
            {isAdmin && facilitiesWithCoords.length > 0 && debugData.errors.length === 0 && (
              <div className="text-green-700">• ✅ Everything looks good! The map should be working.</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default AdminDebug