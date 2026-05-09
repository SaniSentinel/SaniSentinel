import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '../components/Layout/AppLayout'
import { FacilityPopup, AddFacilityModal } from '../components'
import StatusBadge from '../components/UI/StatusBadge'
import RiskIndicator from '../components/UI/RiskIndicator'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Create custom marker icon based on risk score
const createRiskMarker = (riskScore, status) => {
  const getRiskColor = (score) => {
    if (score >= 85) return '#7C2D12' // Critical - Dark Red
    if (score >= 60) return '#EF4444' // High Risk - Red
    if (score >= 30) return '#F59E0B' // At Risk - Yellow
    return '#10B981' // Good - Green
  }

  const getStatusIcon = (facilityStatus) => {
    const icons = {
      good: '✓',
      damaged: '⚠',
      overflow: '!',
      dry: '○',
      blocked: '×',
      out_of_service: '◯'
    }
    return icons[facilityStatus] || '?'
  }

  const color = getRiskColor(riskScore)
  const icon = getStatusIcon(status)
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: white;
        position: relative;
      ">
        ${icon}
        <div style="
          position: absolute;
          bottom: -8px;
          right: -8px;
          background: white;
          border: 2px solid ${color};
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: ${color};
          font-weight: bold;
        ">
          ${riskScore}
        </div>
      </div>
    `,
    className: 'risk-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const ProfessionalFacilityMap = () => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false)
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    type: 'all',
    district: 'all'
  })
  const [stats, setStats] = useState({
    total: 0,
    good: 0,
    atRisk: 0,
    highRisk: 0,
    critical: 0
  })

  const handleFacilityAdded = (newFacility) => {
    console.log('New facility added:', newFacility)
    fetchFacilities() // Refresh facilities data
    
    // Show success notification
    alert(`✅ Facility "${newFacility.name}" added successfully!`)
  }

  // Fetch facilities from Supabase
  const fetchFacilities = async () => {
    try {
      setLoading(true)
      setError(null)
      
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
      
      setFacilities(data || [])
      
      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        good: 0,
        atRisk: 0,
        highRisk: 0,
        critical: 0
      }
      
      data?.forEach(facility => {
        const risk = facility.risk_score || 0
        if (risk >= 85) newStats.critical++
        else if (risk >= 60) newStats.highRisk++
        else if (risk >= 30) newStats.atRisk++
        else newStats.good++
      })
      
      setStats(newStats)
      
    } catch (err) {
      console.error('Error fetching facilities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter facilities based on current filters
  const filteredFacilities = facilities.filter(facility => {
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
    
    if (filters.status !== 'all' && facility.status !== filters.status) {
      return false
    }
    
    if (filters.type !== 'all' && facility.type !== filters.type) {
      return false
    }
    
    if (filters.district !== 'all' && facility.district?.name !== filters.district) {
      return false
    }
    
    return true
  })

  // Get unique values for filter options
  const getUniqueValues = (field) => {
    const values = new Set()
    facilities.forEach(facility => {
      if (field === 'district') {
        values.add(facility.district?.name)
      } else {
        values.add(facility[field])
      }
    })
    return Array.from(values).filter(Boolean).sort()
  }

  useEffect(() => {
    fetchFacilities()
  }, [])

  const actions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setShowAddFacilityModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Facility</span>
      </button>
      <button
        onClick={fetchFacilities}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  )

  if (loading) {
    return (
      <AppLayout title="Facility Map" subtitle="Loading facility data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Facilities</h2>
            <p className="text-gray-600">Fetching data from database...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Facility Map" subtitle="Error loading data" actions={actions}>
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Facilities</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchFacilities}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title="Facility Map" 
      subtitle={`${filteredFacilities.length} of ${stats.total} facilities shown`}
      actions={actions}
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* Stats Summary */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.good}</div>
                <div className="text-xs text-green-700">Good</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.atRisk}</div>
                <div className="text-xs text-yellow-700">At Risk</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.highRisk}</div>
                <div className="text-xs text-orange-700">High Risk</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-xs text-red-700">Critical</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <select 
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="good">Good (0-29)</option>
                  <option value="medium">At Risk (30-59)</option>
                  <option value="high">High Risk (60-84)</option>
                  <option value="critical">Critical (85-100)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Statuses</option>
                  {getUniqueValues('status').map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Types</option>
                  {getUniqueValues('type').map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <select 
                  value={filters.district}
                  onChange={(e) => setFilters({...filters, district: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Districts</option>
                  {getUniqueValues('district').map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setFilters({
                  riskLevel: 'all',
                  status: 'all',
                  type: 'all',
                  district: 'all'
                })}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">✓</div>
                <span className="text-sm">Good (0-29)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">⚠</div>
                <span className="text-sm">At Risk (30-59)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">!</div>
                <span className="text-sm">High Risk (60-84)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-900 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">×</div>
                <span className="text-sm">Critical (85-100)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

            {filteredFacilities.map(facility => (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={createRiskMarker(facility.risk_score || 0, facility.status)}
              >
                <Popup>
                  <FacilityPopup facility={facility} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Add Facility Modal */}
      <AddFacilityModal 
        isOpen={showAddFacilityModal}
        onClose={() => setShowAddFacilityModal(false)}
        onSuccess={handleFacilityAdded}
      />
    </AppLayout>
  )
}

export default ProfessionalFacilityMap