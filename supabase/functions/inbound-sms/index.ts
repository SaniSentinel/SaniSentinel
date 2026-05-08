import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IncomingSMS {
  id?: string
  text: string
  from: string
  to?: string
  date?: string
  linkId?: string
  networkCode?: string
}

interface ParsedSMSReport {
  facility_id: string
  block_number: string
  condition: string
  phone_number: string
  raw_message: string
  is_valid: boolean
  error?: string
}

interface FacilityLookup {
  id: string
  name: string
  type: string
  district_id: string
  districts: {
    name: string
    region: string
  }
}

// Valid condition values from the database schema
const VALID_CONDITIONS = ['good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service']

// Condition aliases for user-friendly input
const CONDITION_ALIASES: Record<string, string> = {
  // Good conditions
  'ok': 'good',
  'fine': 'good',
  'working': 'good',
  'clean': 'good',
  'operational': 'good',
  
  // Damaged conditions
  'broken': 'damaged',
  'cracked': 'damaged',
  'leaking': 'damaged',
  'faulty': 'damaged',
  
  // Overflow conditions
  'overflowing': 'overflow',
  'full': 'overflow',
  'spilling': 'overflow',
  
  // Dry conditions
  'empty': 'dry',
  'no_water': 'dry',
  'nowater': 'dry',
  
  // Blocked conditions
  'clogged': 'blocked',
  'stuck': 'blocked',
  'jammed': 'blocked',
  
  // Out of service
  'broken_down': 'out_of_service',
  'not_working': 'out_of_service',
  'notworking': 'out_of_service',
  'unusable': 'out_of_service'
}

// Parse SMS message in format: F{id}#{block}#{CONDITION}
function parseSMSMessage(message: string, phoneNumber: string): ParsedSMSReport {
  const result: ParsedSMSReport = {
    facility_id: '',
    block_number: '',
    condition: '',
    phone_number: phoneNumber,
    raw_message: message.trim(),
    is_valid: false
  }

  try {
    // Clean and normalize the message
    const cleanMessage = message.trim().toUpperCase()
    
    // Check if message starts with F (facility indicator)
    if (!cleanMessage.startsWith('F')) {
      result.error = 'Message must start with F (e.g., F123#A#good)'
      return result
    }

    // Split by # delimiter
    const parts = cleanMessage.split('#')
    
    if (parts.length !== 3) {
      result.error = 'Message must have exactly 3 parts separated by # (e.g., F123#A#good)'
      return result
    }

    // Extract facility ID (remove F prefix)
    const facilityPart = parts[0]
    if (facilityPart.length < 2) {
      result.error = 'Facility ID is required after F (e.g., F123)'
      return result
    }
    
    const facilityId = facilityPart.substring(1) // Remove 'F' prefix
    
    // Validate facility ID is numeric or UUID-like
    if (!/^[0-9a-fA-F-]+$/.test(facilityId)) {
      result.error = 'Facility ID must contain only numbers, letters, and hyphens'
      return result
    }

    // Extract block number
    const blockNumber = parts[1].trim()
    if (!blockNumber) {
      result.error = 'Block number is required (e.g., A, B, 1, 2)'
      return result
    }

    // Extract and normalize condition
    const conditionInput = parts[2].trim().toLowerCase()
    if (!conditionInput) {
      result.error = 'Condition is required (good, damaged, overflow, dry, blocked, out_of_service)'
      return result
    }

    // Check if condition is valid or has an alias
    let normalizedCondition = conditionInput
    if (CONDITION_ALIASES[conditionInput]) {
      normalizedCondition = CONDITION_ALIASES[conditionInput]
    }

    if (!VALID_CONDITIONS.includes(normalizedCondition)) {
      result.error = `Invalid condition '${conditionInput}'. Valid options: ${VALID_CONDITIONS.join(', ')}`
      return result
    }

    // Populate result
    result.facility_id = facilityId
    result.block_number = blockNumber
    result.condition = normalizedCondition
    result.is_valid = true

    return result

  } catch (error) {
    result.error = `Failed to parse message: ${error.message}`
    return result
  }
}

// Find facility by ID (supports both numeric IDs and UUIDs)
async function findFacility(supabase: any, facilityId: string): Promise<FacilityLookup | null> {
  try {
    // First try to find by UUID (exact match)
    let query = supabase
      .from('facilities')
      .select(`
        id,
        name,
        type,
        district_id,
        districts (
          name,
          region
        )
      `)

    // If it looks like a UUID, search by ID
    if (facilityId.includes('-') && facilityId.length > 20) {
      query = query.eq('id', facilityId)
    } else {
      // For numeric IDs, we'll need a custom approach
      // This assumes you have a numeric facility_code field or similar
      // For now, let's try to match by name pattern or use a custom lookup
      
      // Try to find facilities that might match the numeric ID
      // This is a fallback - you might want to add a facility_code field
      const { data: allFacilities, error } = await supabase
        .from('facilities')
        .select(`
          id,
          name,
          type,
          district_id,
          districts (
            name,
            region
          )
        `)
        .limit(100)

      if (error) {
        console.error('Error fetching facilities for numeric lookup:', error)
        return null
      }

      // Try to match by position in list (not ideal, but works for demo)
      const numericId = parseInt(facilityId)
      if (!isNaN(numericId) && numericId > 0 && numericId <= allFacilities.length) {
        return allFacilities[numericId - 1] // Convert to 0-based index
      }

      return null
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Error finding facility:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in findFacility:', error)
    return null
  }
}

// Create notes from parsed SMS data
function generateReportNotes(parsed: ParsedSMSReport, facility: FacilityLookup): string {
  const notes = [
    `SMS Report from ${parsed.phone_number}`,
    `Block/Section: ${parsed.block_number}`,
    `Facility: ${facility.name}`,
    `District: ${facility.districts.name}`,
    `Raw message: "${parsed.raw_message}"`
  ]

  return notes.join(' | ')
}

// Validate phone number format
function validatePhoneNumber(phone: string): string {
  // Remove any whitespace and special characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Ensure it starts with + for international format
  if (!cleaned.startsWith('+')) {
    // Assume Ghana number if no country code
    if (cleaned.startsWith('0')) {
      return '+233' + cleaned.substring(1)
    } else if (cleaned.startsWith('233')) {
      return '+' + cleaned
    } else {
      return '+233' + cleaned
    }
  }
  
  return cleaned
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body - handle both Africa's Talking webhook and manual submissions
    let incomingSMS: IncomingSMS

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Africa's Talking webhook format
      const formData = await req.formData()
      incomingSMS = {
        id: formData.get('id')?.toString(),
        text: formData.get('text')?.toString() || '',
        from: formData.get('from')?.toString() || '',
        to: formData.get('to')?.toString(),
        date: formData.get('date')?.toString(),
        linkId: formData.get('linkId')?.toString(),
        networkCode: formData.get('networkCode')?.toString()
      }
    } else {
      // JSON format for manual testing
      const body = await req.json()
      incomingSMS = {
        text: body.text || body.message || '',
        from: body.from || body.phone || '',
        to: body.to,
        date: body.date,
        id: body.id
      }
    }

    console.log('📱 Received SMS:', {
      from: incomingSMS.from,
      text: incomingSMS.text,
      id: incomingSMS.id
    })

    // Validate required fields
    if (!incomingSMS.text || !incomingSMS.from) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: text and from are required',
          received: incomingSMS
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the SMS message
    const validatedPhone = validatePhoneNumber(incomingSMS.from)
    const parsed = parseSMSMessage(incomingSMS.text, validatedPhone)

    console.log('📋 Parsed SMS:', parsed)

    if (!parsed.is_valid) {
      console.log('❌ Invalid SMS format:', parsed.error)
      
      // TODO: Send help message back to user
      return new Response(
        JSON.stringify({
          success: false,
          error: parsed.error,
          help: 'Send SMS in format: F{facility_id}#{block}#{condition}. Example: F123#A#good',
          valid_conditions: VALID_CONDITIONS,
          parsed: parsed
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the facility
    const facility = await findFacility(supabase, parsed.facility_id)
    
    if (!facility) {
      console.log('❌ Facility not found:', parsed.facility_id)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Facility with ID '${parsed.facility_id}' not found`,
          help: 'Check the facility ID and try again. Contact admin if facility is missing.',
          parsed: parsed
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🏢 Found facility:', facility.name)

    // Generate report notes
    const notes = generateReportNotes(parsed, facility)

    // Insert report into database
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        facility_id: facility.id,
        reported_by: parsed.phone_number,
        condition: parsed.condition,
        notes: notes
      })
      .select(`
        id,
        facility_id,
        reported_by,
        condition,
        notes,
        created_at
      `)
      .single()

    if (insertError) {
      console.error('❌ Error inserting report:', insertError)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save report to database',
          details: insertError.message,
          parsed: parsed,
          facility: facility
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Report saved successfully:', report.id)

    // Success response
    const response = {
      success: true,
      message: `Report received and saved for ${facility.name}`,
      report: {
        id: report.id,
        facility_name: facility.name,
        facility_id: facility.id,
        district: facility.districts.name,
        block: parsed.block_number,
        condition: parsed.condition,
        reported_by: parsed.phone_number,
        created_at: report.created_at
      },
      parsed: parsed,
      sms_id: incomingSMS.id
    }

    console.log('📊 Response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})