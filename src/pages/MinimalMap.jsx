import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MinimalMap = () => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log('🗺️ MinimalMap component rendered')

  // Simple data fetch test
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Starting data fetch...')
        setLoading(true)
        setError(null)

        // Import Supabase dynamically to see if there are import issues
        const { supabase } = await import('../lib/supabase')
        console.log('✅ Supabase imported successfully')

        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, lat, lng, risk_score, status')
          .limit(10)

        if (error) {
          throw new Error(`Supabase error: ${error.message}`)
        }

        console.log('✅ Data fetched successfully:', data?.length || 0, 'facilities')
        setFacilities(data || [])

      } catch (err) {
        console.error('❌ Error in MinimalMap:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  console.log('🔍 MinimalMap render state:', { loading, error, facilitiesCount: facilities.length })

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Minimal Map Test</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
            <Link to="/minimal-map" className="text-gray-900 font-bold">Minimal Map</Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow border-r p-4">
          <h3 className="font-bold text-lg mb-4">Debug Information</h3>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-100 rounded">
              <div className="font-medium">Component Status</div>
              <div>✅ Component rendered</div>
              <div>✅ useEffect triggered</div>
              <div>✅ State management working</div>
            </div>

            <div className="p-3 bg-blue-50 rounded">
              <div className="font-medium">Data Status</div>
              <div>Loading: {loading ? '🔄 Yes' : '✅ No'}</div>
              <div>Error: {error ? '❌ Yes' : '✅ No'}</div>
              <div>Facilities: {facilities.length}</div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-medium text-red-800">Error Details</div>
                <div className="text-red-600 text-xs mt-1">{error}</div>
              </div>
            )}

            {facilities.length > 0 && (
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium text-green-800">Sample Facilities</div>
                {facilities.slice(0, 3).map(facility => (
                  <div key={facility.id} className="text-xs mt-1">
                    • {facility.name} (Risk: {facility.risk_score || 0})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Loading Data...</h2>
              <p className="text-gray-600">Testing Supabase connection</p>
            </div>
          )}

          {error && (
            <div className="text-center max-w-md">
              <div className="text-red-600 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold mb-2">Data Fetch Failed</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="text-center">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold mb-2">Data Loaded Successfully!</h2>
              <p className="text-gray-600 mb-4">
                Found {facilities.length} facilities from Supabase
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                <h3 className="font-bold mb-3">Next Steps</h3>
                <div className="text-left space-y-2 text-sm">
                  <div>✅ Basic routing works</div>
                  <div>✅ Component rendering works</div>
                  <div>✅ Supabase connection works</div>
                  <div>✅ Data fetching works</div>
                  <div>🔄 Ready to add map functionality</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MinimalMap