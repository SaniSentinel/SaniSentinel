import React, { useState, useEffect } from 'react'
import { reports } from '../lib/reports'

// Risk level configuration
const RISK_LEVELS = {
  GOOD: { min: 0, max: 29, color: '#10B981', label: 'Good', bgColor: 'bg-green-500', textColor: 'text-green-700' },
  AMBER: { min: 30, max: 59, color: '#F59E0B', label: 'At Risk', bgColor: 'bg-yellow-500', textColor: 'text-yellow-700' },
  RED: { min: 60, max: 84, color: '#EF4444', label: 'High Risk', bgColor: 'bg-red-500', textColor: 'text-red-700' },
  CRITICAL: { min: 85, max: 100, color: '#7C2D12', label: 'Critical', bgColor: 'bg-red-900', textColor: 'text-red-900' }
}

// Get risk level from score
const getRiskLevel = (score) => {
  if (score >= 85) return RISK_LEVELS.CRITICAL
  if (score >= 60) return RISK_LEVELS.RED
  if (score >= 30) return RISK_LEVELS.AMBER
  return RISK_LEVELS.GOOD
}

// Facility type icons and labels
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

const getFacilityTypeLabel = (type) => {
  const labels = {
    toilet: 'Toilet',
    latrine: 'Latrine',
    septic_tank: 'Septic Tank',
    treatment_plant: 'Treatment Plant',
    waste_collection_point: 'Waste Collection Point'
  }
  return labels[type] || type.replace('_', ' ')
}

// Status configuration
const getStatusConfig = (status) => {
  const configs = {
    good: { label: 'Good', color: 'text-green-600', bgColor: 'bg-green-100', icon: '✅' },
    damaged: { label: 'Damaged', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '⚠️' },
    overflow: { label: 'Overflow', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🚨' },
    dry: { label: 'Dry', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🏜️' },
    blocked: { label: 'Blocked', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🚫' },
    out_of_service: { label: 'Out of Service', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '❌' }
  }
  return configs[status] || configs.good
}

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
  return `${Math.ceil(diffDays / 365)} years ago`
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const FacilityPopup = ({ facility }) => {
  const [latestReport, setLatestReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [reportError, setReportError] = useState(null)

  // Fetch latest report for this facility
  useEffect(() => {
    const fetchLatestReport = async () => {
      if (!facility?.id) return
      
      try {
        setLoadingReport(true)
        setReportError(null)
        
        const result = await reports.getByFacility(facility.id, 1)
        if (result.error) {
          throw new Error(result.error)
        }
        
        setLatestReport(result.data?.[0] || null)
      } catch (error) {
        console.error('Error fetching latest report:', error)
        setReportError(error.message)
      } finally {
        setLoadingReport(false)
      }
    }

    fetchLatestReport()
  }, [facility?.id])

  if (!facility) {
    return (
      <div className="p-3 min-w-64">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">❓</div>
          <div>No facility data available</div>
        </div>
      </div>
    )
  }

  const riskLevel = getRiskLevel(facility.risk_score || 0)
  const statusConfig = getStatusConfig(facility.status)
  const facilityIcon = getFacilityIcon(facility.type)
  const facilityTypeLabel = getFacilityTypeLabel(facility.type)

  return (
    <div className="p-4 min-w-80 max-w-96">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
            <span className="text-xl">{facilityIcon}</span>
            {facility.name}
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            {facility.district?.name}, {facility.district?.region}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${riskLevel.bgColor} ml-3`}>
          {riskLevel.label}
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="space-y-3 mb-4">
        {/* Type */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Type:</span>
          <span className="text-sm font-medium">{facilityTypeLabel}</span>
        </div>

        {/* District */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">District:</span>
          <span className="text-sm font-medium">{facility.district?.name || 'Unknown'}</span>
        </div>

        {/* Risk Score */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Risk Score:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{facility.risk_score || 0}/100</span>
            <div className={`w-2 h-2 rounded-full ${riskLevel.bgColor}`}></div>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Status:</span>
          <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor} flex items-center gap-1`}>
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </div>
        </div>

        {/* Last Serviced */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last Serviced:</span>
          <span className="text-sm font-medium">
            {facility.last_serviced ? formatDate(facility.last_serviced) : 'Never'}
          </span>
        </div>
      </div>

      {/* Latest Report Section */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Latest Report</h4>
          {loadingReport && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {reportError ? (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Failed to load report: {reportError}
          </div>
        ) : latestReport ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusConfig(latestReport.condition).color} ${getStatusConfig(latestReport.condition).bgColor} flex items-center gap-1`}>
                <span>{getStatusConfig(latestReport.condition).icon}</span>
                {getStatusConfig(latestReport.condition).label}
              </div>
              <span className="text-xs text-gray-500">
                {formatDateTime(latestReport.created_at)}
              </span>
            </div>
            
            {latestReport.notes && (
              <div className="text-xs text-gray-700 mb-2">
                "{latestReport.notes}"
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Reported by: {latestReport.reported_by}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded text-center">
            No reports available
          </div>
        )}
      </div>

      {/* Coordinates (for reference) */}
      <div className="border-t pt-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Coordinates:</span>
          <span className="text-xs text-gray-500 font-mono">
            {facility.lat?.toFixed(4)}, {facility.lng?.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FacilityPopup