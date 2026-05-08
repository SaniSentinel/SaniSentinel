import React from 'react'
import { Link } from 'react-router-dom'
import { FacilityPopup } from '../components'

// Sample facility data for demonstration
const sampleFacilities = [
  {
    id: '1',
    name: 'Tamale Central Market Toilet',
    type: 'toilet',
    status: 'good',
    risk_score: 25,
    lat: 9.4034,
    lng: -0.8424,
    last_serviced: '2024-02-15',
    district: {
      id: '1',
      name: 'Tamale',
      region: 'Northern Region'
    }
  },
  {
    id: '2',
    name: 'Yendi Market Toilet Complex',
    type: 'toilet',
    status: 'overflow',
    risk_score: 85,
    lat: 9.4427,
    lng: -0.0093,
    last_serviced: '2023-12-10',
    district: {
      id: '2',
      name: 'Yendi',
      region: 'Northern Region'
    }
  },
  {
    id: '3',
    name: 'Damongo Treatment Plant',
    type: 'treatment_plant',
    status: 'damaged',
    risk_score: 65,
    lat: 9.0840,
    lng: -1.8212,
    last_serviced: '2024-01-05',
    district: {
      id: '3',
      name: 'Damongo',
      region: 'Savannah Region'
    }
  },
  {
    id: '4',
    name: 'Bimbilla School Latrine Block',
    type: 'latrine',
    status: 'dry',
    risk_score: 55,
    lat: 9.6667,
    lng: -0.4167,
    last_serviced: null,
    district: {
      id: '4',
      name: 'Bimbilla',
      region: 'Northern Region'
    }
  }
]

const FacilityPopupDemo = () => {
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
            <h1 className="text-2xl font-bold text-gray-900">Facility Popup Demo</h1>
          </div>
          <nav className="flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <Link to="/facility-map" className="text-gray-500 hover:text-gray-900">Facility Map</Link>
            <Link to="/facility-popup-demo" className="text-blue-600 border-b-2 border-blue-600 pb-1">Popup Demo</Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Facility Popup Component Demo</h2>
          <p className="text-gray-600 mb-6">
            This page demonstrates the new FacilityPopup component with all requested information:
            name, type, district, last serviced, risk score, and latest report.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Features Included:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>✅ Facility name with type icon</li>
              <li>✅ Facility type (toilet, latrine, septic tank, etc.)</li>
              <li>✅ District and region information</li>
              <li>✅ Last serviced date with relative time formatting</li>
              <li>✅ Risk score with color-coded indicators</li>
              <li>✅ Latest report with condition, notes, and reporter info</li>
              <li>✅ Status badges with appropriate colors and icons</li>
              <li>✅ Responsive design and consistent styling</li>
            </ul>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {sampleFacilities.map((facility, index) => (
            <div key={facility.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <h3 className="font-semibold text-gray-900">
                  Sample Facility #{index + 1}
                </h3>
                <p className="text-sm text-gray-600">
                  Risk Score: {facility.risk_score} | Status: {facility.status}
                </p>
              </div>
              <div className="p-0">
                <FacilityPopup facility={facility} />
              </div>
            </div>
          ))}
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Instructions</h3>
          <div className="prose text-gray-600">
            <p className="mb-4">
              The FacilityPopup component is now integrated into all map views:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>FacilityMap.jsx</strong> - Main facility map with comprehensive popup</li>
              <li><strong>MapView.jsx</strong> - Interactive map view with enhanced popup</li>
              <li><strong>MapViewTest.jsx</strong> - Test map view with new popup</li>
            </ul>
            <p className="mb-4">
              The component automatically fetches the latest report for each facility and displays:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Real-time facility status and condition</li>
              <li>Risk assessment with color-coded indicators</li>
              <li>Service history and maintenance information</li>
              <li>Latest community reports with timestamps</li>
              <li>Geographic coordinates for reference</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacilityPopupDemo