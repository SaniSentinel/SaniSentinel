import React from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { FacilityPopup } from '../components'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const MapViewTest = () => {
  // Test data for Tamale area
  const testFacilities = [
    {
      id: 1,
      name: 'Tamale Central Market Toilet',
      lat: 9.4034,
      lng: -0.8424,
      status: 'good',
      risk_score: 25,
      type: 'toilet'
    },
    {
      id: 2,
      name: 'Tamale Hospital Facility',
      lat: 9.4050,
      lng: -0.8400,
      status: 'overflow',
      risk_score: 85,
      type: 'septic_tank'
    }
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">Map Test</h1>
              <p className="text-sm text-gray-600">Testing map functionality</p>
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

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">Test Mode</h3>
            <p className="text-sm text-gray-600">
              This is a test version of the map with sample data to verify the layout works correctly.
            </p>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Test Facilities</h3>
            <div className="space-y-2">
              {testFacilities.map(facility => (
                <div key={facility.id} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium text-sm">{facility.name}</div>
                  <div className="text-xs text-gray-500">
                    Status: {facility.status} | Risk: {facility.risk_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[9.4034, -0.8424]} // Tamale coordinates
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {testFacilities.map(facility => (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
              >
                <Popup>
                  <FacilityPopup facility={facility} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Test Info */}
          <div className="absolute top-4 right-4 z-10 bg-yellow-100 border border-yellow-300 rounded-lg p-3 max-w-xs">
            <div className="text-yellow-800 text-sm">
              <strong>Test Mode</strong><br />
              This map uses sample data to test the layout. 
              If you can see this map with markers, the basic functionality works.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapViewTest