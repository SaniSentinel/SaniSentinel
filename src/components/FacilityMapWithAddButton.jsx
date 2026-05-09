import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useFacilities } from '../hooks'
import { AddFacilityModal } from '../components'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Status-based marker colors
const getMarkerIcon = (status, riskScore = 0) => {
  let color = 'blue'
  
  if (riskScore >= 85) color = 'black'
  else if (riskScore >= 60) color = 'red'
  else if (riskScore >= 30) color = 'orange'
  else if (status === 'good') color = 'green'
  else if (status === 'damaged') color = 'orange'
  else if (status === 'overflow') color = 'red'
  else if (status === 'dry') color = 'yellow'
  else if (status === 'blocked') color = 'red'
  else if (status === 'out_of_service') color = 'black'

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

const FacilityMapWithAddButton = () => {
  const { data: facilities, loading, error, refresh } = useFacilities()
  const [showAddModal, setShowAddModal] = useState(false)
  const [mapCenter] = useState([9.4034, -0.8424]) // Tamale, Ghana

  const handleFacilityAdded = (newFacility) => {
    console.log('New facility added:', newFacility)
    refresh() // Refresh the facilities list
    
    // Show success notification
    alert(`✅ Facility "${newFacility.name}" added successfully!`)
  }

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 85) return { level: 'Critical', color: 'text-red-600' }
    if (riskScore >= 60) return { level: 'High Risk', color: 'text-orange-600' }
    if (riskScore >= 30) return { level: 'At Risk', color: 'text-yellow-600' }
    return { level: 'Good', color: 'text-green-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading facilities: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header with Add Button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Facility Map</h2>
          <p className="text-sm text-gray-600">
            {facilities.length} facilities • Click markers for details
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Facility</span>
        </button>
      </div>

      {/* Map */}
      <div className="h-96">
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {facilities.map((facility) => (
            <Marker
              key={facility.id}
              position={[parseFloat(facility.lat), parseFloat(facility.lng)]}
              icon={getMarkerIcon(facility.status, facility.risk_score)}
            >
              <Popup>
                <div className="p-2 min-w-64">
                  <h3 className="font-bold text-gray-900 mb-2">{facility.name}</h3>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{formatStatus(facility.type)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">District:</span>
                      <span className="font-medium">{facility.district?.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{formatStatus(facility.status)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className={`font-medium ${getRiskLevel(facility.risk_score).color}`}>
                        {getRiskLevel(facility.risk_score).level}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Score:</span>
                      <span className="font-medium">{facility.risk_score}/100</span>
                    </div>
                    
                    {facility.last_serviced && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Serviced:</span>
                        <span className="font-medium">
                          {new Date(facility.last_serviced).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      📍 {facility.lat}, {facility.lng}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Map Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Good (0-29)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>At Risk (30-59)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>High Risk (60-84)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Critical (85+)</span>
          </div>
        </div>
      </div>

      {/* Add Facility Modal */}
      <AddFacilityModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleFacilityAdded}
      />
    </div>
  )
}

export default FacilityMapWithAddButton