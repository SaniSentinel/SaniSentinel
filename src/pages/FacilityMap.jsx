import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Risk level configuration
const RISK_LEVELS = {
  GOOD: { min: 0, max: 29, color: '#10B981', label: 'Good', bgColor: 'bg-green-500' },
  AMBER: { min: 30, max: 59, color: '#F59E0B', label: 'At Risk', bgColor: 'bg-yellow-500' },
  RED: { min: 60, max: 84, color: '#EF4444', label: 'High Risk', bgColor: 'bg-red-500' },
  CRITICAL: { min: 85, max: 100, color: '#7C2D12', label: 'Critical', bgColor: 'bg-red-900' }
}

// Get risk level from score
const getRiskLevel = (score) => {
  if (score >= 85) return RISK_LEVELS.CRITICAL
  if (score >= 60) return RISK_LEVELS.RED
  if (score >= 30) return RISK_LEVELS.AMBER
  return RISK_LEVELS.GOOD
}

// Create custom marker icon based on risk score
const createRiskMarker = (riskScore) => {
  const riskLevel = getRiskLevel(riskScore)
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${riskLevel.color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">
        ${riskScore}
      </div>
    `,
    className: 'risk-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

// Facility type icons
const getFacilityIcon = (type) => {
  const icons = {
    toilet: '🚽',
    latrine: '🏚️',
    septic_tank: '🏭',
    treatment_plant: '🏭',
    waste_collection_point: '🗑️'
  }
  return icons[type] || '🚽'
}

const FacilityMap = () => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    good: 0,
    amber: 0,
    red: 0,
    critical: 0
  })

  // Fetch facilities from Supabase
  const fetchFacilities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching facilities from Supabase...')
      
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .order('name')
      
      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
      
      console.log('✅ Facilities fetched successfully:', data?.length || 0)
      console.log('📊 Sample facility:', data?.[0])
      
      setFacilities(data || [])
      
      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        good: 0,
        amber: 0,
        red: 0,
        critical: 0
      }
      
      data?.forEach(facility => {
        const risk = facility.risk_score || 0
        if (risk >= 85) newStats.critical++
        else if (risk >= 60) newStats.red++
        else if (risk >= 30) newStats.amber++
        else newStats.good++
      })
      
      setStats(newStats)
      console.log('📈 Risk distribution:', newStats)
      
    } catch (err) {
      console.error('❌ Error fetching facilities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load facilities on component mount
  useEffect(() => {
    fetchFacilities()
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
            </div>
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link to="/facility-map" className="text-blue-600 border-b-2 border-blue-600 pb-1">Facility Map</Link>
            </nav>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Facilities</h2>
            <p className="text-gray-600">Fetching data from Supabase...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
            </div>
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link to="/facility-map" className="text-blue-600 border-b-2 border-blue-600 pb-1">Facility Map</Link>
            </nav>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Facilities</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchFacilities}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
              <p className="text-sm text-gray-600">{stats.total} facilities loaded</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link to="/facility-map" className="text-blue-600 border-b-2 border-blue-600 pb-1">Facility Map</Link>
            </nav>
            
            {/* Risk Stats */}
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-900">{stats.critical}</div>
                <div className="text-xs text-gray-500">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">{stats.red}</div>
                <div className="text-xs text-gray-500">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-500">{stats.amber}</div>
                <div className="text-xs text-gray-500">At Risk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-500">{stats.good}</div>
                <div className="text-xs text-gray-500">Good</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r flex flex-col">
          {/* Legend */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">Risk Level Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-900 rounded-full border-2 border-white shadow"></div>
                <span className="text-sm">Critical (85-100)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-sm">High Risk (60-84)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-sm">At Risk (30-59)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-sm">Good (0-29)</span>
              </div>
            </div>
          </div>

          {/* Facility List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Facilities ({facilities.length})</h3>
              <div className="space-y-2">
                {facilities.map(facility => {
                  const riskLevel = getRiskLevel(facility.risk_score || 0)
                  return (
                    <div key={facility.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {getFacilityIcon(facility.type)} {facility.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {facility.district?.name} • {facility.type.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${riskLevel.bgColor}`}></div>
                          <span className="text-xs font-medium">{facility.risk_score || 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[9.4034, -0.8424]} // Tamale, Northern Ghana
            zoom={9}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {facilities.map(facility => (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={createRiskMarker(facility.risk_score || 0)}
              >
                <Popup>
                  <div className="p-3 min-w-64">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {getFacilityIcon(facility.type)} {facility.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getRiskLevel(facility.risk_score || 0).bgColor}`}>
                        {getRiskLevel(facility.risk_score || 0).label}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Score:</span>
                        <span className="font-medium">{facility.risk_score || 0}/100</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="capitalize">{facility.status}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="capitalize">{facility.type.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">District:</span>
                        <span>{facility.district?.name}</span>
                      </div>
                      
                      {facility.last_serviced && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Serviced:</span>
                          <span>{new Date(facility.last_serviced).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-mono text-xs">
                          {facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Refresh Button */}
          <button
            onClick={fetchFacilities}
            className="absolute top-4 right-4 z-10 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
            title="Refresh Data"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Data Status Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-white shadow-lg rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Data Status</div>
              <div className="text-gray-600">✅ {facilities.length} facilities loaded</div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacilityMap