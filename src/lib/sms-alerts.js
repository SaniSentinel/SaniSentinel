import { supabase } from './supabase.js'

/**
 * Send SMS alerts for specific alerts
 * @param {string[]} alertIds - Array of alert IDs to send SMS for
 * @param {boolean} testMode - Whether to run in test mode (default: true)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendSMSForAlerts(alertIds, testMode = true) {
  try {
    console.log(`📱 Sending SMS for ${alertIds.length} alerts (test mode: ${testMode})...`)
    
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: {
        alert_ids: alertIds,
        test_mode: testMode
      }
    })

    if (error) {
      console.error('❌ SMS alert error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send SMS alerts'
      }
    }

    if (data.success) {
      console.log('✅ SMS alerts sent:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ SMS alert failed:', data.error)
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
 * Send SMS alerts for facilities with critical issues
 * @param {string[]} facilityIds - Array of facility IDs to check for alerts
 * @param {string[]} severityFilter - Severity levels to include (default: ['critical', 'high'])
 * @param {boolean} testMode - Whether to run in test mode (default: true)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendSMSForFacilities(facilityIds, severityFilter = ['critical', 'high'], testMode = true) {
  try {
    console.log(`📱 Sending SMS for ${facilityIds.length} facilities (severity: ${severityFilter.join(', ')})...`)
    
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: {
        facility_ids: facilityIds,
        severity_filter: severityFilter,
        test_mode: testMode
      }
    })

    if (error) {
      console.error('❌ SMS alert error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send SMS alerts'
      }
    }

    if (data.success) {
      console.log('✅ SMS alerts sent:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ SMS alert failed:', data.error)
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
 * Send custom SMS message to specific workers
 * @param {string[]} workerPhones - Array of phone numbers to send to
 * @param {string} message - Custom message to send
 * @param {boolean} testMode - Whether to run in test mode (default: true)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendCustomSMS(workerPhones, message, testMode = true) {
  try {
    console.log(`📱 Sending custom SMS to ${workerPhones.length} workers (test mode: ${testMode})...`)
    
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: {
        worker_phones: workerPhones,
        custom_message: message,
        test_mode: testMode
      }
    })

    if (error) {
      console.error('❌ SMS alert error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send custom SMS'
      }
    }

    if (data.success) {
      console.log('✅ Custom SMS sent:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ Custom SMS failed:', data.error)
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
 * Send SMS alerts for recent critical alerts
 * @param {boolean} testMode - Whether to run in test mode (default: true)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendSMSForRecentCriticalAlerts(testMode = true) {
  try {
    console.log(`📱 Sending SMS for recent critical alerts (test mode: ${testMode})...`)
    
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: {
        severity_filter: ['critical'],
        test_mode: testMode
      }
    })

    if (error) {
      console.error('❌ SMS alert error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send SMS alerts'
      }
    }

    if (data.success) {
      console.log('✅ SMS alerts sent:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ SMS alert failed:', data.error)
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
 * Get workers in a specific district
 * @param {string} districtName - Name of the district
 * @returns {Promise<Array>} Array of workers
 */
export async function getWorkersInDistrict(districtName) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        id,
        name,
        phone,
        role,
        active,
        districts (
          name,
          region
        )
      `)
      .eq('districts.name', districtName)
      .eq('active', true)
      .order('role')
      .order('name')

    if (error) {
      console.error('❌ Error fetching workers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching workers:', error)
    return []
  }
}

/**
 * Get workers by role
 * @param {string} role - Worker role to filter by
 * @returns {Promise<Array>} Array of workers
 */
export async function getWorkersByRole(role) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        id,
        name,
        phone,
        role,
        active,
        districts (
          name,
          region
        )
      `)
      .eq('role', role)
      .eq('active', true)
      .order('districts.name')
      .order('name')

    if (error) {
      console.error('❌ Error fetching workers by role:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching workers by role:', error)
    return []
  }
}

/**
 * Get unresolved alerts that need SMS notification
 * @param {string[]} severityFilter - Severity levels to include
 * @param {number} hoursBack - How many hours back to look for alerts
 * @returns {Promise<Array>} Array of alerts
 */
export async function getAlertsNeedingSMS(severityFilter = ['critical', 'high'], hoursBack = 24) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack)

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id,
        facility_id,
        alert_type,
        severity,
        message,
        created_at,
        facilities (
          name,
          type,
          districts (
            name,
            region
          )
        )
      `)
      .in('severity', severityFilter)
      .eq('resolved', false)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching alerts needing SMS:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching alerts needing SMS:', error)
    return []
  }
}

/**
 * Get SMS alert statistics
 * @returns {Promise<Object>} SMS statistics
 */
export async function getSMSAlertStats() {
  try {
    // Get alert counts by severity
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('severity, resolved')
      .eq('resolved', false)

    if (alertsError) {
      console.error('❌ Error fetching alert stats:', alertsError)
      return {
        total_unresolved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        active_workers: 0
      }
    }

    // Get active worker count
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id')
      .eq('active', true)

    const alertStats = (alerts || []).reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {})

    return {
      total_unresolved: alerts?.length || 0,
      critical: alertStats.critical || 0,
      high: alertStats.high || 0,
      medium: alertStats.medium || 0,
      low: alertStats.low || 0,
      active_workers: workers?.length || 0
    }
  } catch (error) {
    console.error('💥 Error fetching SMS alert stats:', error)
    return {
      total_unresolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      active_workers: 0
    }
  }
}

/**
 * Format phone number for SMS (ensure it starts with +233 for Ghana)
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  // Remove any spaces, dashes, or other characters
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // If it starts with +233, return as is
  if (cleaned.startsWith('+233')) {
    return cleaned
  }
  
  // If it starts with 233, add +
  if (cleaned.startsWith('233')) {
    return '+' + cleaned
  }
  
  // If it starts with 0, replace with +233
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.substring(1)
  }
  
  // If it's just the local number (9 digits), add +233
  if (cleaned.length === 9) {
    return '+233' + cleaned
  }
  
  // Return as is if we can't determine the format
  return cleaned
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
export function isValidPhoneNumber(phone) {
  const formatted = formatPhoneNumber(phone)
  
  // Ghana phone numbers should be +233 followed by 9 digits
  const ghanaPattern = /^\+233\d{9}$/
  
  return ghanaPattern.test(formatted)
}

/**
 * Get SMS template preview for alert type
 * @param {string} alertType - Type of alert
 * @param {string} facilityName - Name of facility
 * @param {string} districtName - Name of district
 * @returns {string} SMS message preview
 */
export function getSMSTemplate(alertType, facilityName = '[Facility]', districtName = '[District]') {
  const templates = {
    critical_status: `🚨 CRITICAL ALERT: ${facilityName} in ${districtName} requires IMMEDIATE attention. Facility is at critical risk. Please respond urgently.`,
    system_failure: `🚨 SYSTEM FAILURE: ${facilityName} in ${districtName} is OUT OF SERVICE. Immediate repair required.`,
    overflow_detected: `⚠️ OVERFLOW ALERT: ${facilityName} in ${districtName} is overflowing. Cleanup needed immediately.`,
    high_risk: `⚠️ HIGH RISK: ${facilityName} in ${districtName} needs urgent maintenance. Please schedule inspection.`,
    climate_warning: `🌧️ WEATHER ALERT: ${facilityName} in ${districtName} at risk due to weather conditions. Monitor closely.`,
    maintenance_due: `📅 MAINTENANCE DUE: ${facilityName} in ${districtName} requires scheduled maintenance. Please arrange service.`
  }
  
  return templates[alertType] || `⚠️ ALERT: ${facilityName} in ${districtName} requires attention. Alert type: ${alertType}.`
}

/**
 * Calculate estimated SMS cost
 * @param {number} recipientCount - Number of SMS recipients
 * @param {number} costPerSMS - Cost per SMS (default: 0.01 USD for Ghana)
 * @returns {number} Estimated cost in USD
 */
export function calculateSMSCost(recipientCount, costPerSMS = 0.01) {
  return recipientCount * costPerSMS
}