import { supabase } from './supabase.js'

/**
 * Test inbound SMS processing with a sample message
 * @param {string} smsText - SMS message to test
 * @param {string} phoneNumber - Phone number of sender
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function testInboundSMS(smsText, phoneNumber) {
  try {
    console.log(`📱 Testing inbound SMS: "${smsText}" from ${phoneNumber}`)
    
    const { data, error } = await supabase.functions.invoke('inbound-sms', {
      body: {
        text: smsText,
        from: phoneNumber
      }
    })

    if (error) {
      console.error('❌ Inbound SMS error:', error)
      return {
        success: false,
        error: error.message || 'Failed to process inbound SMS'
      }
    }

    if (data.success) {
      console.log('✅ SMS processed successfully:', data.message)
      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ SMS processing failed:', data.error)
      return {
        success: false,
        error: data.error || 'SMS processing failed'
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
 * Get recent SMS reports from the database
 * @param {number} limit - Number of reports to fetch (default: 20)
 * @returns {Promise<Array>} Array of recent reports
 */
export async function getRecentSMSReports(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        facility_id,
        reported_by,
        condition,
        notes,
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
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching SMS reports:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching SMS reports:', error)
    return []
  }
}

/**
 * Get SMS reports by phone number
 * @param {string} phoneNumber - Phone number to filter by
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Array>} Array of reports from the phone number
 */
export async function getReportsByPhoneNumber(phoneNumber, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        facility_id,
        reported_by,
        condition,
        notes,
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
      .eq('reported_by', phoneNumber)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching reports by phone:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Error fetching reports by phone:', error)
    return []
  }
}

/**
 * Get SMS reporting statistics
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Promise<Object>} SMS reporting statistics
 */
export async function getSMSReportingStats(days = 7) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('reports')
      .select('reported_by, condition, created_at, notes')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('❌ Error fetching SMS stats:', error)
      return {
        total_reports: 0,
        unique_reporters: 0,
        condition_breakdown: {},
        sms_reports: 0,
        reports_per_day: 0
      }
    }

    const reports = data || []
    
    // Count SMS reports (those with "SMS Report" in notes)
    const smsReports = reports.filter(report => 
      report.notes && report.notes.includes('SMS Report')
    )

    // Get unique reporters
    const uniqueReporters = new Set(reports.map(r => r.reported_by)).size

    // Condition breakdown
    const conditionBreakdown = reports.reduce((acc, report) => {
      acc[report.condition] = (acc[report.condition] || 0) + 1
      return acc
    }, {})

    return {
      total_reports: reports.length,
      unique_reporters: uniqueReporters,
      condition_breakdown: conditionBreakdown,
      sms_reports: smsReports.length,
      reports_per_day: Math.round(reports.length / days * 10) / 10
    }
  } catch (error) {
    console.error('💥 Error calculating SMS stats:', error)
    return {
      total_reports: 0,
      unique_reporters: 0,
      condition_breakdown: {},
      sms_reports: 0,
      reports_per_day: 0
    }
  }
}

/**
 * Validate SMS message format
 * @param {string} smsText - SMS message to validate
 * @returns {Object} Validation result with details
 */
export function validateSMSFormat(smsText) {
  const result = {
    is_valid: false,
    facility_id: '',
    block_number: '',
    condition: '',
    error: '',
    suggestions: []
  }

  try {
    const cleanMessage = smsText.trim().toUpperCase()
    
    // Check if message starts with F
    if (!cleanMessage.startsWith('F')) {
      result.error = 'Message must start with F'
      result.suggestions.push('Start your message with F followed by facility ID')
      return result
    }

    // Split by # delimiter
    const parts = cleanMessage.split('#')
    
    if (parts.length !== 3) {
      result.error = 'Message must have exactly 3 parts separated by #'
      result.suggestions.push('Format: F{facility_id}#{block}#{condition}')
      result.suggestions.push('Example: F123#A#good')
      return result
    }

    // Extract facility ID
    const facilityPart = parts[0]
    if (facilityPart.length < 2) {
      result.error = 'Facility ID is required after F'
      result.suggestions.push('Add facility ID after F (e.g., F123)')
      return result
    }
    
    const facilityId = facilityPart.substring(1)
    
    // Validate facility ID
    if (!/^[0-9a-fA-F-]+$/.test(facilityId)) {
      result.error = 'Facility ID must contain only numbers, letters, and hyphens'
      result.suggestions.push('Use only numbers and letters for facility ID')
      return result
    }

    // Extract block number
    const blockNumber = parts[1].trim()
    if (!blockNumber) {
      result.error = 'Block number is required'
      result.suggestions.push('Add block/section identifier (e.g., A, B, 1, 2)')
      return result
    }

    // Extract condition
    const condition = parts[2].trim().toLowerCase()
    if (!condition) {
      result.error = 'Condition is required'
      result.suggestions.push('Add condition: good, damaged, overflow, dry, blocked, out_of_service')
      return result
    }

    // Valid conditions and aliases
    const validConditions = ['good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service']
    const conditionAliases = {
      'ok': 'good', 'fine': 'good', 'working': 'good', 'clean': 'good',
      'broken': 'damaged', 'cracked': 'damaged', 'leaking': 'damaged',
      'overflowing': 'overflow', 'full': 'overflow', 'spilling': 'overflow',
      'empty': 'dry', 'no_water': 'dry', 'nowater': 'dry',
      'clogged': 'blocked', 'stuck': 'blocked', 'jammed': 'blocked',
      'broken_down': 'out_of_service', 'not_working': 'out_of_service'
    }

    let normalizedCondition = condition
    if (conditionAliases[condition]) {
      normalizedCondition = conditionAliases[condition]
    }

    if (!validConditions.includes(normalizedCondition)) {
      result.error = `Invalid condition '${condition}'`
      result.suggestions.push('Valid conditions: ' + validConditions.join(', '))
      result.suggestions.push('Or use aliases like: ok, broken, clogged, empty, etc.')
      return result
    }

    // Success
    result.is_valid = true
    result.facility_id = facilityId
    result.block_number = blockNumber
    result.condition = normalizedCondition

    return result

  } catch (error) {
    result.error = `Failed to parse message: ${error.message}`
    return result
  }
}

/**
 * Generate SMS format examples
 * @returns {Array} Array of example SMS messages
 */
export function getSMSFormatExamples() {
  return [
    {
      message: 'F123#A#good',
      description: 'Facility 123, Block A, Good condition'
    },
    {
      message: 'F456#B#overflow',
      description: 'Facility 456, Block B, Overflow detected'
    },
    {
      message: 'F789#1#damaged',
      description: 'Facility 789, Block 1, Damaged'
    },
    {
      message: 'F101#MAIN#blocked',
      description: 'Facility 101, Main block, Blocked'
    },
    {
      message: 'F202#C#dry',
      description: 'Facility 202, Block C, No water (dry)'
    },
    {
      message: 'F303#2#out_of_service',
      description: 'Facility 303, Block 2, Out of service'
    }
  ]
}

/**
 * Get condition aliases for user reference
 * @returns {Object} Mapping of aliases to standard conditions
 */
export function getConditionAliases() {
  return {
    'Good conditions': ['good', 'ok', 'fine', 'working', 'clean', 'operational'],
    'Damaged conditions': ['damaged', 'broken', 'cracked', 'leaking', 'faulty'],
    'Overflow conditions': ['overflow', 'overflowing', 'full', 'spilling'],
    'Dry conditions': ['dry', 'empty', 'no_water', 'nowater'],
    'Blocked conditions': ['blocked', 'clogged', 'stuck', 'jammed'],
    'Out of service': ['out_of_service', 'broken_down', 'not_working', 'notworking', 'unusable']
  }
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneForDisplay(phone) {
  if (!phone) return 'Unknown'
  
  // Format +233241234567 as +233 24 123 4567
  if (phone.startsWith('+233') && phone.length === 13) {
    return `+233 ${phone.substring(4, 6)} ${phone.substring(6, 9)} ${phone.substring(9)}`
  }
  
  return phone
}

/**
 * Extract facility info from SMS report notes
 * @param {string} notes - Report notes containing SMS info
 * @returns {Object} Extracted SMS information
 */
export function extractSMSInfo(notes) {
  const info = {
    is_sms_report: false,
    block: '',
    raw_message: '',
    phone: ''
  }

  if (!notes || !notes.includes('SMS Report')) {
    return info
  }

  info.is_sms_report = true

  // Extract block/section
  const blockMatch = notes.match(/Block\/Section: ([^|]+)/)
  if (blockMatch) {
    info.block = blockMatch[1].trim()
  }

  // Extract raw message
  const messageMatch = notes.match(/Raw message: "([^"]+)"/)
  if (messageMatch) {
    info.raw_message = messageMatch[1].trim()
  }

  // Extract phone from first part
  const phoneMatch = notes.match(/SMS Report from ([^|]+)/)
  if (phoneMatch) {
    info.phone = phoneMatch[1].trim()
  }

  return info
}

/**
 * Get facilities with their simple IDs for SMS reference
 * @returns {Promise<Array>} Array of facilities with ID mapping
 */
export async function getFacilitiesForSMS() {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        id,
        name,
        type,
        districts (
          name,
          region
        )
      `)
      .order('name')

    if (error) {
      console.error('❌ Error fetching facilities for SMS:', error)
      return []
    }

    // Add simple numeric IDs for SMS reference
    return (data || []).map((facility, index) => ({
      ...facility,
      sms_id: index + 1, // Simple numeric ID for SMS
      sms_example: `F${index + 1}#A#good`
    }))
  } catch (error) {
    console.error('💥 Error fetching facilities for SMS:', error)
    return []
  }
}