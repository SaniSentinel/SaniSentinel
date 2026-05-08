import { supabase } from './supabase.js'

/**
 * Run risk assessment for all facilities or a specific set
 * @param {string[]} facilityIds - Optional array of facility IDs to assess
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function runRiskAssessment(facilityIds = []) {
  try {
    console.log(`🎯 Running risk assessment for ${facilityIds.length > 0 ? facilityIds.length + ' specific facilities' : 'all facilities'}...`)
    
    const { data, error } = await supabase.functions.invoke('score-risk', {
      body: facilityIds.length > 0 ? { facility_ids: facilityIds } : {}
    })

    if (error) {
      console.error('❌ Risk assessment error:', error)
      return {
        success: false,
        error: error.message || 'Failed to run risk assessment'
      }
    }

    if (data.success) {
      console.log('✅ Risk assessment completed:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ Risk assessment failed:', data.error)
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
 * Get facilities by risk priority level
 * @param {'low'|'medium'|'high'|'critical'} priorityLevel - Priority level to filter by
 * @returns {Promise<Array>} Array of facilities
 */
export async function getFacilitiesByPriority(priorityLevel) {
  try {
    let minRisk, maxRisk
    
    switch (priorityLevel) {
      case 'critical':
        minRisk = 80
        maxRisk = 100
        break
      case 'high':
        minRisk = 60
        maxRisk = 79
        break
      case 'medium':
        minRisk = 40
        maxRisk = 59
        break
      case 'low':
        minRisk = 0
        maxRisk = 39
        break
      default:
        throw new Error('Invalid priority level')
    }

    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        districts (
          name,
          region
        )
      `)
      .gte('risk_score', minRisk)
      .lte('risk_score', maxRisk)
      .order('risk_score', { ascending: false })

    if (error) {
      console.error('❌ Error fetching facilities by priority:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching facilities by priority:', error)
    return []
  }
}

/**
 * Get high-risk facilities that need immediate attention
 * @returns {Promise<Array>} Array of high-risk facilities
 */
export async function getHighRiskFacilities() {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        districts (
          name,
          region
        )
      `)
      .gte('risk_score', 60)
      .order('risk_score', { ascending: false })

    if (error) {
      console.error('❌ Error fetching high-risk facilities:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching high-risk facilities:', error)
    return []
  }
}

/**
 * Get risk distribution summary
 * @returns {Promise<Object>} Risk distribution statistics
 */
export async function getRiskDistribution() {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('risk_score')

    if (error) {
      console.error('❌ Error fetching risk distribution:', error)
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        average: 0
      }
    }

    const facilities = data || []
    const total = facilities.length
    
    if (total === 0) {
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        average: 0
      }
    }

    const distribution = facilities.reduce((acc, facility) => {
      const score = facility.risk_score || 0
      
      if (score >= 80) acc.critical++
      else if (score >= 60) acc.high++
      else if (score >= 40) acc.medium++
      else acc.low++
      
      acc.totalScore += score
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0, totalScore: 0 })

    return {
      total,
      critical: distribution.critical,
      high: distribution.high,
      medium: distribution.medium,
      low: distribution.low,
      average: Math.round(distribution.totalScore / total)
    }
  } catch (error) {
    console.error('💥 Error calculating risk distribution:', error)
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      average: 0
    }
  }
}

/**
 * Get facilities that haven't been assessed recently
 * @param {number} hours - Hours since last update (default: 24)
 * @returns {Promise<Array>} Array of facilities needing assessment
 */
export async function getFacilitiesNeedingAssessment(hours = 24) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        districts (
          name,
          region
        )
      `)
      .or(`updated_at.lt.${cutoffDate.toISOString()},updated_at.is.null`)
      .order('updated_at', { ascending: true, nullsFirst: true })

    if (error) {
      console.error('❌ Error fetching facilities needing assessment:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching facilities needing assessment:', error)
    return []
  }
}

/**
 * Get risk trends for a specific facility
 * @param {string} facilityId - Facility UUID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Array>} Array of risk score history
 */
export async function getFacilityRiskTrend(facilityId, days = 30) {
  try {
    // This would require a risk_history table to track changes over time
    // For now, we'll return the current risk score
    const { data, error } = await supabase
      .from('facilities')
      .select('risk_score, updated_at, name')
      .eq('id', facilityId)
      .single()

    if (error) {
      console.error('❌ Error fetching facility risk trend:', error)
      return []
    }

    // Return current data point
    return [{
      date: data.updated_at,
      risk_score: data.risk_score,
      facility_name: data.name
    }]
  } catch (error) {
    console.error('💥 Error fetching facility risk trend:', error)
    return []
  }
}

/**
 * Set up automatic risk assessment at regular intervals
 * @param {number} intervalHours - How often to run assessment (default: 6 hours)
 * @returns {number} Interval ID that can be used with clearInterval()
 */
export function setupAutoRiskAssessment(intervalHours = 6) {
  console.log(`⏰ Setting up automatic risk assessment every ${intervalHours} hours`)
  
  // Run immediately
  runRiskAssessment()
  
  // Set up recurring assessments
  const intervalId = setInterval(() => {
    console.log('🔄 Automatic risk assessment triggered')
    runRiskAssessment()
  }, intervalHours * 60 * 60 * 1000)
  
  return intervalId
}

/**
 * Get priority level from risk score
 * @param {number} riskScore - Risk score (0-100)
 * @returns {'low'|'medium'|'high'|'critical'} Priority level
 */
export function getPriorityLevel(riskScore) {
  if (riskScore >= 80) return 'critical'
  if (riskScore >= 60) return 'high'
  if (riskScore >= 40) return 'medium'
  return 'low'
}

/**
 * Get priority level color for UI display
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} CSS classes for styling
 */
export function getPriorityColor(riskScore) {
  if (riskScore >= 80) return 'text-red-600 bg-red-100 border-red-200'
  if (riskScore >= 60) return 'text-orange-600 bg-orange-100 border-orange-200'
  if (riskScore >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
  return 'text-green-600 bg-green-100 border-green-200'
}

/**
 * Get priority level icon
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Emoji icon
 */
export function getPriorityIcon(riskScore) {
  if (riskScore >= 80) return '🚨'
  if (riskScore >= 60) return '⚠️'
  if (riskScore >= 40) return '⚡'
  return '✅'
}

/**
 * Format risk score for display
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Formatted risk score with priority level
 */
export function formatRiskScore(riskScore) {
  const priority = getPriorityLevel(riskScore)
  const icon = getPriorityIcon(riskScore)
  return `${icon} ${riskScore}/100 (${priority.toUpperCase()})`
}