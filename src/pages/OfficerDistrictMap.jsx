import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '../components/Layout/AppLayout'
import { FacilityPopup } from '../components'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

const createRiskMarker = (riskScore, status) => {
  const getRiskColor = (score) => {
    if (score >= 85) return '#7C2D12'
    if (score >= 60) return '#EF4444'
    if (score >= 30) return '#F59E0B'
    return '#10B981'
  }

  const icons = {
    good: '✓',
    damaged: '⚠',
    overflow: '!',
    dry: '○',
    blocked: '×',
    out_of_service: '◯'
  }

  const color = getRiskColor(riskScore || 0)
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px; height: 32px; border-radius: 50%;
        border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; position: relative;">
        ${icons[status] || '?'}
      </div>
    `,
    className: 'risk-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const OfficerDistrictMap = () => {
  const { user, officerDistrictScopeLoading } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [district, setDistrict] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const districtId = user?.district_id || null

  const fetchDistrictFacilities = async () => {
    if (officerDistrictScopeLoading) {
      setLoading(true)
      setError(null)
      return
    }

    if (!districtId) {
      setError('No district assigned to this officer account.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [districtRes, facilitiesRes] = await Promise.all([
        supabase.from('districts').select('id, name, region, lat, lng').eq('id', districtId).single(),
        supabase
          .from('facilities')
          .select(`
            *,
            district:districts(id, name, region)
          `)
          .eq('district_id', districtId)
          .order('name')
      ])

      if (districtRes.error) throw new Error(districtRes.error.message)
      if (facilitiesRes.error) throw new Error(facilitiesRes.error.message)

      setDistrict(districtRes.data)
      setFacilities(facilitiesRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDistrictFacilities()
  }, [districtId, officerDistrictScopeLoading])

  if (user?.role !== 'district_officer') {
    return null
  }

  const mapCenter = district?.lat && district?.lng ? [district.lat, district.lng] : [9.4034, -0.8424]

  if (officerDistrictScopeLoading) {
    return (
      <AppLayout title="District GIS Map" subtitle="Loading your district…">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
          Resolving district from your profile…
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="District GIS Map"
      subtitle={district ? `${district.name} District facilities only` : 'Facilities in your district'}
      actions={(
        <button
          onClick={fetchDistrictFacilities}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      )}
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">Loading district map...</div>
      ) : (
        <div className="h-[calc(100vh-320px)] min-h-[520px] bg-white rounded-xl border border-gray-200 overflow-hidden">
          <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} className="z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {facilities
              .filter((f) => f.lat != null && f.lng != null)
              .map((facility) => (
                <Marker
                  key={facility.id}
                  position={[facility.lat, facility.lng]}
                  icon={createRiskMarker(facility.risk_score, facility.status)}
                >
                  <Popup>
                    <FacilityPopup facility={facility} />
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}
    </AppLayout>
  )
}

export default OfficerDistrictMap
