import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ClimateRiskAnalysis = ({ stats, loading, timeRange }) => {
  const [climateData, setClimateData] = useState(null)
  const [selectedRiskType, setSelectedRiskType] = useState('flood')

  // Simulate climate data (in real app, this would come from weather APIs)
  useEffect(() => {
    const generateClimateData = () => {
      const currentDate = new Date()
      const rainySeasonMonths = [4, 5, 6, 7, 8, 9] // May to October
      const isRainySeason = rainySeasonMonths.includes(currentDate.getMonth())
      
      return {
        currentConditions: {
          temperature: Math.round(25 + Math.random() * 10), // 25-35°C
          humidity: Math.round(60 + Math.random() * 30), // 60-90%
          rainfall: isRainySeason ? Math.round(Math.random() * 50) : Math.round(Math.random() * 5), // mm
          windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
          pressure: Math.round(1010 + Math.random() * 20) // 1010-1030 hPa
        },
        riskFactors: {
          flood: {
            level: isRainySeason ? 'high' : 'medium',
            probability: isRainySeason ? 75 : 25,
            affectedFacilities: Math.round((stats.facilities?.total || 0) * (isRainySeason ? 0.15 : 0.05)),
            description: isRainySeason 
              ? 'Heavy rains expected. High flood risk for low-lying facilities.'
              : 'Dry season. Moderate flood risk from occasional storms.'
          },
          drought: {
            level: isRainySeason ? 'low' : 'high',
            probability: isRainySeason ? 20 : 80,
            affectedFacilities: Math.round((stats.facilities?.total || 0) * (isRainySeason ? 0.05 : 0.25)),
            description: isRainySeason 
              ? 'Adequate water supply during rainy season.'
              : 'Dry conditions may affect water-dependent facilities.'
          },
          extreme_heat: {
            level: 'medium',
            probability: 45,
            affectedFacilities: Math.round((stats.facilities?.total || 0) * 0.1),
            description: 'Moderate heat stress on infrastructure and operations.'
          },
          storm: {
            level: isRainySeason ? 'high' : 'low',
            probability: isRainySeason ? 60 : 15,
            affectedFacilities: Math.round((stats.facilities?.total || 0) * (isRainySeason ? 0.12 : 0.03)),
            description: isRainySeason 
              ? 'Storm season active. Risk of structural damage.'
              : 'Low storm activity expected.'
          }
        },
        forecast: {
          next7Days: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            temperature: Math.round(25 + Math.random() * 10),
            rainfall: isRainySeason ? Math.round(Math.random() * 30) : Math.round(Math.random() * 3),
            riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
          }))
        },
        alerts: [
          {
            id: 1,
            type: 'flood_warning',
            severity: isRainySeason ? 'high' : 'low',
            message: isRainySeason 
              ? 'Flood warning issued for Northern Region. Monitor low-lying facilities.'
              : 'No active flood warnings.',
            validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            type: 'drought_watch',
            severity: isRainySeason ? 'low' : 'medium',
            message: isRainySeason 
              ? 'Water levels adequate during rainy season.'
              : 'Drought watch in effect. Monitor water-dependent facilities.',
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }

    setClimateData(generateClimateData())

    // Update climate data every 5 minutes
    const interval = setInterval(() => {
      setClimateData(generateClimateData())
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [stats.facilities?.total])

  const riskTypes = [
    { value: 'flood', label: 'Flood Risk', icon: '🌊', color: 'blue' },
    { value: 'drought', label: 'Drought Risk', icon: '🏜️', color: 'orange' },
    { value: 'extreme_heat', label: 'Heat Stress', icon: '🌡️', color: 'red' },
    { value: 'storm', label: 'Storm Risk', icon: '⛈️', color: 'purple' }
  ]

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-700'
      case 'medium': return 'text-yellow-700'
      case 'low': return 'text-green-700'
      default: return 'text-gray-700'
    }
  }

  if (loading || !climateData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading climate data...</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedRisk = climateData.riskFactors[selectedRiskType]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Climate Risk Analysis</h3>
          <p className="text-sm text-gray-600">
            Real-time climate monitoring and risk assessment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live Data</span>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Conditions</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {climateData.currentConditions.temperature}°C
            </div>
            <div className="text-xs text-gray-600">Temperature</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {climateData.currentConditions.rainfall}mm
            </div>
            <div className="text-xs text-gray-600">Rainfall (24h)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {climateData.currentConditions.humidity}%
            </div>
            <div className="text-xs text-gray-600">Humidity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {climateData.currentConditions.windSpeed} km/h
            </div>
            <div className="text-xs text-gray-600">Wind Speed</div>
          </div>
        </div>
      </div>

      {/* Risk Type Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {riskTypes.map(risk => (
            <button
              key={risk.value}
              onClick={() => setSelectedRiskType(risk.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRiskType === risk.value
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="mr-1">{risk.icon}</span>
              {risk.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Risk Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">
            {riskTypes.find(r => r.value === selectedRiskType)?.label}
          </h4>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(selectedRisk.level)}`}>
            {selectedRisk.level.toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Probability:</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${selectedRisk.probability}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{selectedRisk.probability}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Affected Facilities:</span>
            <span className="text-sm font-medium text-gray-900">{selectedRisk.affectedFacilities}</span>
          </div>
          
          <p className="text-sm text-gray-700">{selectedRisk.description}</p>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">7-Day Risk Forecast</h4>
        <div className="grid grid-cols-7 gap-1">
          {climateData.forecast.next7Days.map((day, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-600 mb-1">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {day.temperature}°
              </div>
              <div className="text-xs text-blue-600 mb-1">
                {day.rainfall}mm
              </div>
              <div className={`w-3 h-3 rounded-full mx-auto ${
                day.riskLevel === 'high' ? 'bg-red-500' :
                day.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Climate Alerts</h4>
        <div className="space-y-2">
          {climateData.alerts.map(alert => (
            <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Valid until: {alert.validUntil.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Updated every 5 minutes
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/climate-monitoring"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Full Climate Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/risk-management"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Risk Management
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClimateRiskAnalysis