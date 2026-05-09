import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '../components/Layout/AppLayout'
import { FacilityPopup } from '../components'
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
          ${riskScore || 0}
        </div>
      </div>
    `,
    className: 'risk-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const districtIcon = L.divIcon({
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background-color: #2563EB;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    "></div>
  `,
  className: 'district-center-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

const AdminGISMap = () => {
  const [facilities, setFacilities] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMapData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [facilityResult, districtResult] = await Promise.all([
        supabase
          .from('facilities')
          .select(`
            *,
            district:districts(id, name, region)
          `)
          .order('name'),
        supabase
          .from('districts')
          .select('*')
          .order('name')
      ])

      if (facilityResult.error) throw new Error(`Facilities: ${facilityResult.error.message}`)
      if (districtResult.error) throw new Error(`Districts: ${districtResult.error.message}`)

      setFacilities(facilityResult.data || [])
      setDistricts(districtResult.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMapData()
  }, [])

  const stats = useMemo(() => {
    const critical = facilities.filter((f) => (f.risk_score || 0) >= 85).length
    return {
      districts: districts.length,
      facilities: facilities.length,
      critical
    }
  }, [districts, facilities])

  if (loading) {
    return (
      <AppLayout title="Admin GIS Map" subtitle="Loading all districts and facilities...">
        <div className="flex items-center justify-center h-96 text-gray-600">Loading GIS data...</div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Admin GIS Map" subtitle="Failed to load GIS data">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={fetchMapData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Admin GIS Map"
      subtitle="All districts and all facility markers (no filters)"
      actions={(
        <button
          onClick={fetchMapData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">All Districts</div>
          <div className="text-2xl font-bold text-blue-700">{stats.districts}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Facilities</div>
          <div className="text-2xl font-bold text-green-700">{stats.facilities}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Critical Count</div>
          <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
        </div>
      </div>

      <div className="h-[calc(100vh-320px)] min-h-[520px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MapContainer
          center={[9.4034, -0.8424]}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {districts
            .filter((district) => district.lat != null && district.lng != null)
            .map((district) => (
              <Marker
                key={`district-${district.id}`}
                position={[district.lat, district.lng]}
                icon={districtIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{district.name}</div>
                    <div className="text-gray-600">{district.region} Region</div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {facilities
            .filter((facility) => facility.lat != null && facility.lng != null)
            .map((facility) => (
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
    </AppLayout>
  )
}

export default AdminGISMap
