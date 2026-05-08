import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { facilities } from '../lib/facilities'
import { districts } from '../lib/districts'
import { supabase } from '../lib/supabase'
import { FacilityPopup } from '../components'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons based on risk level and status
const createCustomIcon = (riskScore, status) => {
  let color = '#10B981' // green (good)
  let iconSymbol = '🚽'

  // Determine color based on risk score
  if (riskScore >= 85) {
    color = '#DC2626' // red (critical)
  } else if (riskScore >= 60) {
    color = '#F59E0B' // amber (high risk)
  } else if (riskScore >= 30) {
    color = '#EAB308' // yellow (at risk)
  }

  // Determine icon based on status
  switch (status) {
    case 'overflow':
      iconSymbol = '🌊'
      break
    case 'blocked':
      iconSymbol = '🚫'
      break
    case 'damaged':
      iconSymbol = '⚠️'
      break
    case 'dry':
      iconSymbol = '🏜️'
      break
    case 'out_of_service':
      iconSymbol = '❌'
      break
    default:
      iconSymbol = '🚽'
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        ${iconSymbol}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

// Component to handle map updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom)
    }
  }, [map, center, zoom])
  
  return null
}

// Risk level badge component
const RiskBadge = ({ riskScore }) => {
  let bgColor = 'bg-green-100 text-green-800'
  let label = 'Good'

  if (riskScore >= 85) {
    bgColor = 'bg-red-100 text-red-800'
    label = 'Critical'
  } else if (riskScore >= 60) {
    bgColor = 'bg-orange-100 text-orange-800'
    label = 'High Risk'
  } else if (riskScore >= 30) {
    bgColor = 'bg-yellow-100 text-yellow-800'
    label = 'At Risk'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {label} ({riskScore})
    </span>
  )
}

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    good: { bg: 'bg-green-100 text-green-800', label: 'Good' },
    damaged: { bg: 'bg-yellow-100 text-yellow-800', label: 'Damaged' },
    overflow: { bg: 'bg-blue-100 text-blue-800', label: 'Overflow' },
    dry: { bg: 'bg-gray-100 text-gray-800', label: 'Dry' },
    blocked: { bg: 'bg-orange-100 text-orange-800', label: 'Blocked' },
    out_of_service: { bg: 'bg-red-100 text-red-800', label: 'Out of Service' }
  }

  const config = statusConfig[status] || statusConfig.good

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      {config.label}
    </span>
  )
}

// Facility type icon
const getFacilityTypeIcon = (type) => {
  const icons = {
    toilet: '🚽',
    latrine: '🏚️',
    septic_tank: '🏭',
    treatment_plant: '🏭',
    waste_collection_point: '🗑️'
  }
  return icons[type] || '🚽'
}

const MapView = () => {
  const [facilitiesData, setFacilitiesData] = useState([])
  const [districtsData, setDistrictsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    riskLevel: 'all',
    type: 'all',
    district: 'all'
  })
  const [mapCenter, setMapCenter] = useState([9.4034, -0.8424]) // Tamale coordinates
  const [mapZoom, setMapZoom] = useState(9)
  const [stats, setStats] = useState(null)

  // Load initial data
  useEffect(() => {
    console.log('🚀 MapView component mounted, starting data load...')
    loadMapData()
    setupRealtimeSubscriptions()
  }, [])

  // Filter facilities when filters change
  const filteredFacilities = facilitiesData.filter(facility => {
    if (filters.status !== 'all' && facility.status !== filters.status) return false
    if (filters.type !== 'all' && facility.type !== filters.type) return false
    if (filters.district !== 'all' && facility.district_id !== filters.district) return false
    
    if (filters.riskLevel !== 'all') {
      const risk = facility.risk_score || 0
      switch (filters.riskLevel) {
        case 'critical':
          if (risk < 85) return false
          break
        case 'high':
          if (risk < 60 || risk >= 85) return false
          break
        case 'medium':
          if (risk < 30 || risk >= 60) return false
          break
        case 'good':
          if (risk >= 30) return false
          break
      }
    }
    
    return true
  })

  // Debug logging
  console.log('🔍 MapView render state:', {
    loading,
    error,
    facilitiesCount: facilitiesData.length,
    districtsCount: districtsData.length,
    filteredCount: filteredFacilities.length,
    filters,
    stats
  })

  const loadMapData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading map data...')
      console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('🔑 Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

      const [facilitiesResult, districtsResult, statsResult] = await Promise.all([
        facilities.getAll(),
        districts.getAll(),
        facilities.getStats()
      ])

      console.log('🏢 Facilities result:', facilitiesResult)
      console.log('🏘️ Districts result:', districtsResult)
      console.log('📊 Stats result:', statsResult)

      if (facilitiesResult.error) throw new Error(`Facilities error: ${facilitiesResult.error}`)
      if (districtsResult.error) throw new Error(`Districts error: ${districtsResult.error}`)
      if (statsResult.error) throw new Error(`Stats error: ${statsResult.error}`)

      setFacilitiesData(facilitiesResult.data || [])
      setDistrictsData(districtsResult.data || [])
      setStats(statsResult.data)

      console.log('✅ Map data loaded successfully')
      console.log(`📍 Loaded ${facilitiesResult.data?.length || 0} facilities`)
      console.log(`🏘️ Loaded ${districtsResult.data?.length || 0} districts`)

    } catch (err) {
      console.error('❌ Error loading map data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to facilities changes
    const facilitiesSubscription = supabase
      .channel('facilities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'facilities' },
        (payload) => {
          console.log('Facilities change received:', payload)
          loadMapData() // Reload data when changes occur
        }
      )
      .subscribe()

    // Subscribe to reports changes (which might affect facility status)
    const reportsSubscription = supabase
      .channel('reports-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('New report received:', payload)
          loadMapData() // Reload data when new reports come in
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      facilitiesSubscription.unsubscribe()
      reportsSubscription.unsubscribe()
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const focusOnDistrict = (district) => {
    setMapCenter([district.lat, district.lng])
    setMapZoom(12)
    setFilters(prev => ({ ...prev, district: district.id }))
  }

  const resetView = () => {
    setMapCenter([9.4034, -0.8424]) // Tamale
    setMapZoom(9)
    setFilters({
      status: 'all',
      riskLevel: 'all',
      type: 'all',
      district: 'all'
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
                <p className="text-sm text-gray-600">Loading map data...</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation */}
              <nav className="flex space-x-8">
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-gray-900 pb-4 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/map" 
                  className="text-blue-600 border-b-2 border-blue-600 pb-4 transition-colors"
                >
                  Map View
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Map Data</h2>
            <p className="text-gray-600 mb-4">Fetching facilities and districts...</p>
            <div className="text-sm text-gray-500">
              This may take a few moments if the database is starting up.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
                <p className="text-sm text-red-600">Error loading data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation */}
              <nav className="flex space-x-8">
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-gray-900 pb-4 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/map" 
                  className="text-blue-600 border-b-2 border-blue-600 pb-4 transition-colors"
                >
                  Map View
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Map Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <p>This could be due to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Database connection issues</li>
                <li>Missing environment variables</li>
                <li>Network connectivity problems</li>
                <li>Database not yet set up</li>
              </ul>
            </div>
            <div className="space-x-3">
              <button 
                onClick={loadMapData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
              <Link 
                to="/"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors inline-block"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Map</h1>
              <p className="text-sm text-gray-600">
                Showing {filteredFacilities.length} of {facilitiesData.length} facilities
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Navigation */}
            <nav className="flex space-x-8">
              <Link 
                to="/" 
                className="text-gray-500 hover:text-gray-900 pb-4 transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/map" 
                className="text-blue-600 border-b-2 border-blue-600 pb-4 transition-colors"
              >
                Map View
              </Link>
            </nav>
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.byRiskLevel.critical}</div>
                  <div className="text-xs text-gray-500">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.byRiskLevel.high_risk}</div>
                  <div className="text-xs text-gray-500">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.byRiskLevel.at_risk}</div>
                  <div className="text-xs text-gray-500">At Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.byRiskLevel.good}</div>
                  <div className="text-xs text-gray-500">Good</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">Filters</h3>
            
            <div className="space-y-3">
              {/* Risk Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select 
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical (85-100)</option>
                  <option value="high">High Risk (60-84)</option>
                  <option value="medium">At Risk (30-59)</option>
                  <option value="good">Good (0-29)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="overflow">Overflow</option>
                  <option value="dry">Dry</option>
                  <option value="blocked">Blocked</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
                <select 
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="toilet">Toilet</option>
                  <option value="latrine">Latrine</option>
                  <option value="septic_tank">Septic Tank</option>
                  <option value="treatment_plant">Treatment Plant</option>
                  <option value="waste_collection_point">Waste Collection Point</option>
                </select>
              </div>

              {/* District Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select 
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Districts</option>
                  {districtsData.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={resetView}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
              >
                Reset Filters & View
              </button>
            </div>
          </div>

          {/* Districts Quick Access */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Access</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {districtsData.map(district => (
                <button
                  key={district.id}
                  onClick={() => focusOnDistrict(district)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>{district.name}</span>
                  <span className="text-xs text-gray-500">
                    {facilitiesData.filter(f => f.district_id === district.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Critical Risk (85-100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>High Risk (60-84)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span>At Risk (30-59)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Good (0-29)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Show data summary if we have data but map might be failing */}
          {!loading && !error && facilitiesData.length > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg p-4 max-w-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Data Loaded Successfully</h4>
              <div className="text-sm space-y-1">
                <div>📍 {facilitiesData.length} facilities loaded</div>
                <div>🏘️ {districtsData.length} districts loaded</div>
                <div>🔍 {filteredFacilities.length} facilities shown</div>
              </div>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredFacilities.map(facility => (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={createCustomIcon(facility.risk_score || 0, facility.status)}
                eventHandlers={{
                  click: () => setSelectedFacility(facility)
                }}
              >
                <Popup>
                  <FacilityPopup facility={facility} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Refresh Button */}
          <button
            onClick={loadMapData}
            className="absolute top-4 right-4 z-10 bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
            title="Refresh Data"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected Facility Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {getFacilityTypeIcon(selectedFacility.type)} {selectedFacility.name}
              </h2>
              <button 
                onClick={() => setSelectedFacility(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <StatusBadge status={selectedFacility.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <RiskBadge riskScore={selectedFacility.risk_score || 0} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 capitalize">
                  {selectedFacility.type.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <p className="text-sm text-gray-900">{selectedFacility.district?.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900 font-mono">
                  {selectedFacility.lat.toFixed(6)}, {selectedFacility.lng.toFixed(6)}
                </p>
              </div>
              
              {selectedFacility.last_serviced && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Serviced</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedFacility.last_serviced).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedFacility.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button 
                onClick={() => {
                  setMapCenter([selectedFacility.lat, selectedFacility.lng])
                  setMapZoom(15)
                  setSelectedFacility(null)
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Center on Map
              </button>
              <button 
                onClick={() => setSelectedFacility(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView