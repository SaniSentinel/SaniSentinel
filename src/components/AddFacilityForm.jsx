import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { facilities } from '../lib/facilities'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icon for new facility
const newFacilityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6) })
    }
  })
  return null
}

const AddFacilityForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'toilet',
    district_id: '',
    lat: '',
    lng: '',
    last_serviced: '',
    status: 'good'
  })
  
  const [districts, setDistricts] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [mapCenter, setMapCenter] = useState([9.4034, -0.8424]) // Tamale, Ghana

  // Facility types
  const facilityTypes = [
    { value: 'toilet', label: 'Public Toilet' },
    { value: 'latrine', label: 'Latrine Block' },
    { value: 'septic_tank', label: 'Septic Tank' },
    { value: 'treatment_plant', label: 'Treatment Plant' },
    { value: 'waste_collection_point', label: 'Waste Collection Point' }
  ]

  // Status options
  const statusOptions = [
    { value: 'good', label: 'Good Condition' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'overflow', label: 'Overflow' },
    { value: 'dry', label: 'Dry/No Water' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'out_of_service', label: 'Out of Service' }
  ]

  // Load districts on component mount
  useEffect(() => {
    loadDistricts()
  }, [])

  const loadDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('id, name, region, lat, lng')
        .order('name')

      if (error) throw error
      setDistricts(data || [])
    } catch (err) {
      console.error('Error loading districts:', err)
      setError('Failed to load districts')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // If district is selected, center map on that district
    if (name === 'district_id' && value) {
      const selectedDistrict = districts.find(d => d.id === value)
      if (selectedDistrict) {
        setMapCenter([parseFloat(selectedDistrict.lat), parseFloat(selectedDistrict.lng)])
      }
    }
  }

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setFormData(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng
    }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Facility name is required')
      }
      if (!formData.district_id) {
        throw new Error('Please select a district')
      }
      if (!formData.lat || !formData.lng) {
        throw new Error('Please click on the map to select a location')
      }

      // Prepare data for submission
      const facilityData = {
        name: formData.name.trim(),
        type: formData.type,
        district_id: formData.district_id,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        status: formData.status,
        last_serviced: formData.last_serviced || null,
        risk_score: 0 // Default risk score for new facilities
      }

      // Create facility
      const result = await facilities.create(facilityData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Success
      if (onSuccess) {
        onSuccess(result.data)
      }
      
      // Reset form
      setFormData({
        name: '',
        type: 'toilet',
        district_id: '',
        lat: '',
        lng: '',
        last_serviced: '',
        status: 'good'
      })
      setSelectedLocation(null)

      // Close form if callback provided
      if (onClose) {
        onClose()
      }

    } catch (err) {
      console.error('Error creating facility:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onClose) {
      onClose()
    }
  }

  const clearLocation = () => {
    setSelectedLocation(null)
    setFormData(prev => ({
      ...prev,
      lat: '',
      lng: ''
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Facility</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Fill in the facility details and click on the map to select its location.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Information</h3>
            
            {/* Facility Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Facility Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Tamale Central Market Toilet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Facility Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Facility Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {facilityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label htmlFor="district_id" className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                id="district_id"
                name="district_id"
                value={formData.district_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a district</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name} ({district.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Current Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Last Serviced */}
            <div>
              <label htmlFor="last_serviced" className="block text-sm font-medium text-gray-700 mb-1">
                Last Serviced Date
              </label>
              <input
                type="date"
                id="last_serviced"
                name="last_serviced"
                value={formData.last_serviced}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Coordinates *
              </label>
              {selectedLocation ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                    </p>
                    <p className="text-xs text-green-600">Click on map to change location</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    📍 Click on the map to select facility location
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Location</h3>
            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {selectedLocation && (
                  <Marker
                    position={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]}
                    icon={newFacilityIcon}
                  />
                )}
              </MapContainer>
            </div>
            <p className="text-sm text-gray-600">
              💡 Tip: Select a district first to center the map on that area, then click to choose the exact location.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedLocation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Facility</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddFacilityForm