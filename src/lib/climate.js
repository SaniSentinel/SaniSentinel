import { supabase } from './supabase'

// Climate API functions
export const climate = {
  // Get all climate snapshots with district information
  getAll: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get latest climate data for all districts
  getLatest: async () => {
    try {
      const { data, error } = await supabase.rpc('get_latest_climate_data')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate data by district
  getByDistrict: async (districtId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('district_id', districtId)
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get latest climate data for a specific district
  getLatestByDistrict: async (districtId) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('district_id', districtId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate data within date range
  getByDateRange: async (startDate, endDate, districtId = null, limit = 200) => {
    try {
      let query = supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: false })
        .limit(limit)

      if (districtId) {
        query = query.eq('district_id', districtId)
      }

      const { data, error } = await query
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get high flood risk areas (flood_risk_score >= 70)
  getHighFloodRisk: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .gte('flood_risk_score', 70)
        .order('flood_risk_score', { ascending: false })
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get areas with heavy rainfall (>30mm)
  getHeavyRainfall: async (threshold = 30, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .gte('rainfall_mm', threshold)
        .order('rainfall_mm', { ascending: false })
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate data by weather condition
  getByWeatherCondition: async (condition, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('weather_condition', condition)
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get recent climate data (last 24 hours by default)
  getRecent: async (hoursBack = 24, limit = 100) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack)
      
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .gte('recorded_at', cutoffTime.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate snapshot by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Create new climate snapshot
  create: async (climateData) => {
    const { 
      district_id, 
      flood_risk_score, 
      rainfall_mm, 
      temperature_celsius, 
      humidity_percent, 
      wind_speed_kmh, 
      weather_condition 
    } = climateData
    
    // Validate required fields
    if (!district_id || flood_risk_score === undefined || rainfall_mm === undefined) {
      return { 
        data: null, 
        error: 'Missing required fields: district_id, flood_risk_score, rainfall_mm' 
      }
    }

    // Validate flood risk score
    if (flood_risk_score < 0 || flood_risk_score > 100) {
      return { 
        data: null, 
        error: 'Flood risk score must be between 0 and 100' 
      }
    }

    // Validate rainfall
    if (rainfall_mm < 0) {
      return { 
        data: null, 
        error: 'Rainfall must be non-negative' 
      }
    }

    // Validate humidity if provided
    if (humidity_percent !== undefined && (humidity_percent < 0 || humidity_percent > 100)) {
      return { 
        data: null, 
        error: 'Humidity must be between 0 and 100' 
      }
    }

    // Validate weather condition if provided
    if (weather_condition) {
      const validConditions = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'windy']
      if (!validConditions.includes(weather_condition)) {
        return { 
          data: null, 
          error: `Invalid weather condition. Must be one of: ${validConditions.join(', ')}` 
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .insert([{
          district_id,
          flood_risk_score,
          rainfall_mm,
          temperature_celsius: temperature_celsius || null,
          humidity_percent: humidity_percent || null,
          wind_speed_kmh: wind_speed_kmh || null,
          weather_condition: weather_condition || null
        }])
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Bulk create climate snapshots (for batch data import)
  createBulk: async (climateDataArray) => {
    try {
      // Validate each record
      for (const record of climateDataArray) {
        if (!record.district_id || record.flood_risk_score === undefined || record.rainfall_mm === undefined) {
          return { 
            data: null, 
            error: 'Each record must have district_id, flood_risk_score, and rainfall_mm' 
          }
        }
      }

      const { data, error } = await supabase
        .from('climate_snapshots')
        .insert(climateDataArray)
        .select(`
          *,
          district:districts(id, name, region)
        `)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Update climate snapshot
  update: async (id, updates) => {
    try {
      // Validate flood risk score if provided
      if (updates.flood_risk_score !== undefined && (updates.flood_risk_score < 0 || updates.flood_risk_score > 100)) {
        return { 
          data: null, 
          error: 'Flood risk score must be between 0 and 100' 
        }
      }

      // Validate rainfall if provided
      if (updates.rainfall_mm !== undefined && updates.rainfall_mm < 0) {
        return { 
          data: null, 
          error: 'Rainfall must be non-negative' 
        }
      }

      // Validate humidity if provided
      if (updates.humidity_percent !== undefined && (updates.humidity_percent < 0 || updates.humidity_percent > 100)) {
        return { 
          data: null, 
          error: 'Humidity must be between 0 and 100' 
        }
      }

      // Validate weather condition if provided
      if (updates.weather_condition) {
        const validConditions = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'windy']
        if (!validConditions.includes(updates.weather_condition)) {
          return { 
            data: null, 
            error: `Invalid weather condition. Must be one of: ${validConditions.join(', ')}` 
          }
        }
      }

      const { data, error } = await supabase
        .from('climate_snapshots')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Delete climate snapshot
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('climate_snapshots')
        .delete()
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate statistics
  getStats: async (daysBack = 30) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('climate_snapshots')
        .select('flood_risk_score, rainfall_mm, temperature_celsius, humidity_percent, weather_condition, recorded_at')
        .gte('recorded_at', cutoffDate.toISOString())
      
      if (error) throw error

      const stats = {
        total: data.length,
        averageFloodRisk: 0,
        totalRainfall: 0,
        averageTemperature: 0,
        averageHumidity: 0,
        highRiskDays: 0,
        byWeatherCondition: {},
        byRiskLevel: {
          low: 0,      // 0-39
          medium: 0,   // 40-59
          high: 0,     // 60-79
          critical: 0  // 80-100
        }
      }

      let tempSum = 0, tempCount = 0
      let humiditySum = 0, humidityCount = 0
      let floodRiskSum = 0

      data.forEach(snapshot => {
        // Flood risk stats
        floodRiskSum += snapshot.flood_risk_score
        if (snapshot.flood_risk_score >= 70) stats.highRiskDays++
        
        // Risk level categorization
        if (snapshot.flood_risk_score <= 39) stats.byRiskLevel.low++
        else if (snapshot.flood_risk_score <= 59) stats.byRiskLevel.medium++
        else if (snapshot.flood_risk_score <= 79) stats.byRiskLevel.high++
        else stats.byRiskLevel.critical++
        
        // Rainfall stats
        stats.totalRainfall += parseFloat(snapshot.rainfall_mm || 0)
        
        // Temperature stats
        if (snapshot.temperature_celsius) {
          tempSum += parseFloat(snapshot.temperature_celsius)
          tempCount++
        }
        
        // Humidity stats
        if (snapshot.humidity_percent) {
          humiditySum += snapshot.humidity_percent
          humidityCount++
        }
        
        // Weather condition stats
        if (snapshot.weather_condition) {
          stats.byWeatherCondition[snapshot.weather_condition] = 
            (stats.byWeatherCondition[snapshot.weather_condition] || 0) + 1
        }
      })

      stats.averageFloodRisk = data.length > 0 ? Math.round(floodRiskSum / data.length) : 0
      stats.averageTemperature = tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : 0
      stats.averageHumidity = humidityCount > 0 ? Math.round(humiditySum / humidityCount) : 0

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get climate trends (daily averages over time period)
  getTrends: async (daysBack = 30, districtId = null) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      let query = supabase
        .from('climate_snapshots')
        .select('flood_risk_score, rainfall_mm, temperature_celsius, recorded_at, district_id')
        .gte('recorded_at', cutoffDate.toISOString())
        .order('recorded_at', { ascending: true })

      if (districtId) {
        query = query.eq('district_id', districtId)
      }

      const { data, error } = await query
      
      if (error) throw error

      // Group by date and calculate daily averages
      const dailyData = {}
      
      data.forEach(snapshot => {
        const date = snapshot.recorded_at.split('T')[0]
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            floodRiskSum: 0,
            rainfallSum: 0,
            tempSum: 0,
            tempCount: 0,
            count: 0
          }
        }
        
        dailyData[date].floodRiskSum += snapshot.flood_risk_score
        dailyData[date].rainfallSum += parseFloat(snapshot.rainfall_mm || 0)
        if (snapshot.temperature_celsius) {
          dailyData[date].tempSum += parseFloat(snapshot.temperature_celsius)
          dailyData[date].tempCount++
        }
        dailyData[date].count++
      })

      // Convert to array with averages
      const trends = Object.values(dailyData).map(day => ({
        date: day.date,
        averageFloodRisk: Math.round(day.floodRiskSum / day.count),
        totalRainfall: Math.round(day.rainfallSum * 10) / 10,
        averageTemperature: day.tempCount > 0 ? Math.round((day.tempSum / day.tempCount) * 10) / 10 : null,
        dataPoints: day.count
      }))

      return { data: trends, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get current weather summary
  getCurrentWeather: async () => {
    try {
      const { data, error } = await supabase
        .from('current_weather')
        .select('*')
        .order('district_name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Calculate flood risk score using the database function
  calculateFloodRisk: async (rainfall24h, rainfall7d, currentRainfall, season = 'wet') => {
    try {
      const { data, error } = await supabase.rpc('calculate_flood_risk', {
        rainfall_24h: rainfall24h,
        rainfall_7d: rainfall7d,
        current_rainfall: currentRainfall,
        season: season
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Subscribe to real-time climate updates
  subscribeToClimate: (callback) => {
    const subscription = supabase
      .channel('climate_snapshots_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'climate_snapshots' 
        }, 
        callback
      )
      .subscribe()

    return subscription
  },

  // Unsubscribe from real-time updates
  unsubscribe: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}

// Export individual functions for convenience
export const {
  getAll: getAllClimateData,
  getLatest: getLatestClimateData,
  getByDistrict: getClimateByDistrict,
  getLatestByDistrict: getLatestClimateByDistrict,
  getByDateRange: getClimateByDateRange,
  getHighFloodRisk: getHighFloodRiskAreas,
  getHeavyRainfall: getHeavyRainfallAreas,
  getByWeatherCondition: getClimateByWeatherCondition,
  getRecent: getRecentClimateData,
  getById: getClimateById,
  create: createClimateSnapshot,
  createBulk: createBulkClimateSnapshots,
  update: updateClimateSnapshot,
  delete: deleteClimateSnapshot,
  getStats: getClimateStats,
  getTrends: getClimateTrends,
  getCurrentWeather,
  calculateFloodRisk,
  subscribeToClimate: subscribeToClimateUpdates,
  unsubscribe: unsubscribeFromClimateUpdates
} = climate