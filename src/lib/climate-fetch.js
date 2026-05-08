import { supabase } from './supabase.js'

/**
 * Fetch climate data for all districts using the Edge Function
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function fetchClimateData() {
  try {
    console.log('🌤️ Fetching climate data...')
    
    const { data, error } = await supabase.functions.invoke('fetch-climate', {
      body: {}
    })

    if (error) {
      console.error('❌ Edge Function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch climate data'
      }
    }

    if (data.success) {
      console.log('✅ Climate data fetched successfully:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ Climate fetch failed:', data.error)
      return {
        success: false,
        error: data.error || 'Unknown error occurred'
      }
    }

  } catch (error) {
    console.error('💥 Network error:', error)
    return {
      success: false,
      error: 'Network error: ' + error.message
    }
  }
}

/**
 * Fetch climate data and return a promise that resolves with the result
 * Useful for manual triggering or scheduled updates
 * @returns {Promise<boolean>} Success status
 */
export async function updateClimateData() {
  const result = await fetchClimateData()
  
  if (result.success) {
    console.log('🎉 Climate data updated successfully')
    return true
  } else {
    console.error('💥 Failed to update climate data:', result.error)
    return false
  }
}

/**
 * Set up automatic climate data fetching at regular intervals
 * @param {number} intervalMinutes - How often to fetch data (default: 60 minutes)
 * @returns {number} Interval ID that can be used with clearInterval()
 */
export function setupAutoClimateUpdates(intervalMinutes = 60) {
  console.log(`⏰ Setting up automatic climate updates every ${intervalMinutes} minutes`)
  
  // Fetch immediately
  updateClimateData()
  
  // Set up recurring updates
  const intervalId = setInterval(() => {
    console.log('🔄 Automatic climate data update triggered')
    updateClimateData()
  }, intervalMinutes * 60 * 1000)
  
  return intervalId
}

/**
 * Get the latest climate data from the database
 * @returns {Promise<Array>} Array of climate snapshots
 */
export async function getLatestClimateData() {
  try {
    const { data, error } = await supabase
      .from('climate_snapshots')
      .select(`
        *,
        districts (
          name,
          region,
          lat,
          lng
        )
      `)
      .order('recorded_at', { ascending: false })
      .limit(50) // Get latest 50 records

    if (error) {
      console.error('❌ Error fetching climate data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching climate data:', error)
    return []
  }
}

/**
 * Get current weather conditions for all districts (latest snapshot per district)
 * @returns {Promise<Array>} Array of current weather conditions
 */
export async function getCurrentWeatherConditions() {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_climate_data')

    if (error) {
      console.error('❌ Error fetching current weather:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching current weather:', error)
    return []
  }
}

/**
 * Get climate history for a specific district
 * @param {string} districtId - District UUID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Array>} Array of climate snapshots
 */
export async function getDistrictClimateHistory(districtId, days = 7) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('climate_snapshots')
      .select(`
        *,
        districts (
          name,
          region
        )
      `)
      .eq('district_id', districtId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('❌ Error fetching district climate history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching district climate history:', error)
    return []
  }
}

/**
 * Get districts with high flood risk (score >= 70)
 * @returns {Promise<Array>} Array of high-risk districts
 */
export async function getHighRiskDistricts() {
  try {
    const { data, error } = await supabase
      .from('current_weather')
      .select('*')
      .gte('flood_risk_score', 70)
      .order('flood_risk_score', { ascending: false })

    if (error) {
      console.error('❌ Error fetching high-risk districts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching high-risk districts:', error)
    return []
  }
}