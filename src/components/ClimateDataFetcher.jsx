import React, { useState, useEffect } from 'react'
import { 
  fetchClimateData, 
  getCurrentWeatherConditions, 
  getHighRiskDistricts,
  setupAutoClimateUpdates 
} from '../lib/climate-fetch'

const ClimateDataFetcher = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [currentWeather, setCurrentWeather] = useState([])
  const [highRiskDistricts, setHighRiskDistricts] = useState([])
  const [error, setError] = useState(null)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)
  const [autoUpdateInterval, setAutoUpdateInterval] = useState(null)

  // Load current weather data on component mount
  useEffect(() => {
    loadCurrentWeather()
  }, [])

  const loadCurrentWeather = async () => {
    try {
      const [weather, highRisk] = await Promise.all([
        getCurrentWeatherConditions(),
        getHighRiskDistricts()
      ])
      
      setCurrentWeather(weather)
      setHighRiskDistricts(highRisk)
    } catch (error) {
      console.error('Error loading weather data:', error)
      setError('Failed to load current weather data')
    }
  }

  const handleFetchClimate = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fetchClimateData()
      
      if (result.success) {
        setLastUpdate(new Date())
        await loadCurrentWeather() // Refresh the display
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to fetch climate data: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutoUpdate = () => {
    if (autoUpdateEnabled) {
      // Disable auto-update
      if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval)
        setAutoUpdateInterval(null)
      }
      setAutoUpdateEnabled(false)
    } else {
      // Enable auto-update (every 60 minutes)
      const intervalId = setupAutoClimateUpdates(60)
      setAutoUpdateInterval(intervalId)
      setAutoUpdateEnabled(true)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const getRiskLevelColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getWeatherIcon = (condition) => {
    const icons = {
      clear: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️',
      foggy: '🌫️',
      windy: '💨'
    }
    return icons[condition] || '🌤️'
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Climate Data Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleFetchClimate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Fetching...
              </>
            ) : (
              <>
                🌤️ Fetch Climate Data
              </>
            )}
          </button>
          
          <button
            onClick={toggleAutoUpdate}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoUpdateEnabled 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {autoUpdateEnabled ? '⏹️ Stop Auto-Update' : '▶️ Start Auto-Update'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Last Update</p>
            <p className="font-semibold">{formatTimestamp(lastUpdate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Auto-Update</p>
            <p className="font-semibold">
              {autoUpdateEnabled ? '✅ Enabled (60 min)' : '❌ Disabled'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Districts Monitored</p>
            <p className="font-semibold">{currentWeather.length}</p>
          </div>
        </div>
      </div>

      {/* High Risk Districts Alert */}
      {highRiskDistricts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            ⚠️ High Flood Risk Districts ({highRiskDistricts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {highRiskDistricts.map((district) => (
              <div key={district.district_id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{district.district_name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskLevelColor(district.flood_risk_score)}`}>
                    {district.flood_risk_score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {getWeatherIcon(district.weather_condition)} {district.weather_condition} • {district.rainfall_mm}mm rain
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Weather Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Weather Conditions</h3>
        
        {currentWeather.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No weather data available. Click "Fetch Climate Data" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentWeather.map((weather) => (
              <div key={weather.district_id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{weather.district_name}</h4>
                  <span className="text-2xl">{getWeatherIcon(weather.weather_condition)}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="font-medium">{weather.temperature_celsius}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Humidity:</span>
                    <span className="font-medium">{weather.humidity_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rainfall:</span>
                    <span className="font-medium">{weather.rainfall_mm}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wind:</span>
                    <span className="font-medium">{weather.wind_speed_kmh} km/h</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Flood Risk</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskLevelColor(weather.flood_risk_score)}`}>
                      {weather.flood_risk_score}/100
                    </span>
                  </div>
                </div>
                
                {weather.recorded_at && (
                  <div className="mt-2 text-xs text-gray-500">
                    Updated: {formatTimestamp(weather.recorded_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClimateDataFetcher