import React, { useState } from 'react'
import { AddFacilityModal, AddFacilityForm } from '../components'

const AddFacilityDemo = () => {
  const [showModal, setShowModal] = useState(false)
  const [showInline, setShowInline] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState([])

  const handleFacilityAdded = (newFacility) => {
    console.log('New facility added:', newFacility)
    setRecentlyAdded(prev => [newFacility, ...prev.slice(0, 4)]) // Keep last 5
    
    // Show success message
    alert(`✅ Facility "${newFacility.name}" added successfully!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add Facility Demo
          </h1>
          <p className="text-gray-600">
            Test the Add Facility form in different modes: modal and inline.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Options</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Open Modal Form</span>
            </button>
            
            <button
              onClick={() => setShowInline(!showInline)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>{showInline ? 'Hide' : 'Show'} Inline Form</span>
            </button>
          </div>
        </div>

        {/* Recently Added Facilities */}
        {recentlyAdded.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recently Added Facilities ({recentlyAdded.length})
            </h2>
            <div className="space-y-3">
              {recentlyAdded.map((facility, index) => (
                <div key={facility.id || index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-green-800">{facility.name}</h3>
                    <p className="text-sm text-green-600">
                      {facility.type.replace('_', ' ')} • {facility.district?.name} • 
                      Status: {facility.status} • 
                      Location: {facility.lat}, {facility.lng}
                    </p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Form */}
        {showInline && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inline Form</h2>
            <AddFacilityForm 
              onSuccess={handleFacilityAdded}
              onClose={() => setShowInline(false)}
            />
          </div>
        )}

        {/* Feature Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📝 Form Fields</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Facility name (required)</li>
                <li>• Facility type (dropdown)</li>
                <li>• District selection (dropdown)</li>
                <li>• Current status</li>
                <li>• Last serviced date</li>
                <li>• Location coordinates (map click)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🗺️ Map Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click to select location</li>
                <li>• Auto-center on district selection</li>
                <li>• Visual marker for selected location</li>
                <li>• Coordinate display and validation</li>
                <li>• Clear location option</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">✅ Validation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Required field validation</li>
                <li>• Coordinate range validation</li>
                <li>• Facility type validation</li>
                <li>• Status validation</li>
                <li>• Real-time error feedback</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🔄 Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase database integration</li>
                <li>• District data loading</li>
                <li>• Success/error handling</li>
                <li>• Form reset after submission</li>
                <li>• Callback support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Modal Usage:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
{`import { AddFacilityModal } from '../components'

const [showModal, setShowModal] = useState(false)

const handleSuccess = (newFacility) => {
  console.log('Added:', newFacility)
  // Refresh facility list, show notification, etc.
}

<AddFacilityModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={handleSuccess}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Inline Usage:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
{`import { AddFacilityForm } from '../components'

<AddFacilityForm 
  onSuccess={(facility) => console.log('Added:', facility)}
  onClose={() => setShowForm(false)}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddFacilityModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleFacilityAdded}
      />
    </div>
  )
}

export default AddFacilityDemo