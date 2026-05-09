import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Alert {
  id: string
  facility_id: string
  alert_type: string
  severity: string
  message: string
  created_at: string
  facilities: {
    name: string
    type: string
    district_id: string
    districts: {
      name: string
      region: string
    }
  }
}

interface Worker {
  id: string
  name: string
  phone: string
  role: string
  district_id: string
  districts: {
    name: string
    region: string
  }
}

interface SMSRequest {
  alert_ids?: string[]
  facility_ids?: string[]
  worker_phones?: string[]
  custom_message?: string
  severity_filter?: string[]
  test_mode?: boolean
}

interface SMSResponse {
  success: boolean
  message_id?: string
  cost?: string
  recipients?: number
  error?: string
}

// Africa's Talking SMS API configuration
const AT_API_KEY = Deno.env.get('AFRICAS_TALKING_API_KEY')
const AT_USERNAME = Deno.env.get('AFRICAS_TALKING_USERNAME') || 'sandbox'
const AT_BASE_URL = 'https://api.africastalking.com/version1/messaging'

// SMS message templates
const SMS_TEMPLATES = {
  critical_status: (facilityName: string, districtName: string) => 
    `🚨 CRITICAL ALERT: ${facilityName} in ${districtName} requires IMMEDIATE attention. Facility is at critical risk. Please respond urgently.`,
  
  system_failure: (facilityName: string, districtName: string) => 
    `🚨 SYSTEM FAILURE: ${facilityName} in ${districtName} is OUT OF SERVICE. Immediate repair required.`,
  
  overflow_detected: (facilityName: string, districtName: string) => 
    `⚠️ OVERFLOW ALERT: ${facilityName} in ${districtName} is overflowing. Cleanup needed immediately.`,
  
  high_risk: (facilityName: string, districtName: string) => 
    `⚠️ HIGH RISK: ${facilityName} in ${districtName} needs urgent maintenance. Please schedule inspection.`,
  
  climate_warning: (facilityName: string, districtName: string) => 
    `🌧️ WEATHER ALERT: ${facilityName} in ${districtName} at risk due to weather conditions. Monitor closely.`,
  
  maintenance_due: (facilityName: string, districtName: string) => 
    `📅 MAINTENANCE DUE: ${facilityName} in ${districtName} requires scheduled maintenance. Please arrange service.`,
  
  custom: (message: string) => message
}

// Get appropriate workers for alert notification
async function getWorkersForAlert(supabase: any, alert: Alert): Promise<Worker[]> {
  const { severity, alert_type } = alert
  const districtId = alert.facilities.district_id
  
  let workerRoles: string[] = []
  
  // Determine which worker roles should be notified based on alert type and severity
  switch (severity) {
    case 'critical':
      workerRoles = ['district_coordinator', 'supervisor', 'maintenance_tech', 'health_officer']
      break
    case 'high':
      workerRoles = ['supervisor', 'maintenance_tech', 'field_worker']
      break
    case 'medium':
      workerRoles = ['field_worker', 'maintenance_tech']
      break
    case 'low':
      workerRoles = ['field_worker']
      break
  }
  
  // For specific alert types, include additional roles
  if (alert_type === 'system_failure' || alert_type === 'critical_status') {
    workerRoles.push('district_coordinator', 'health_officer')
  }
  
  if (alert_type === 'climate_warning') {
    workerRoles.push('district_coordinator')
  }
  
  // Remove duplicates
  workerRoles = [...new Set(workerRoles)]
  
  // Get workers from the same district with appropriate roles
  const { data: workers, error } = await supabase
    .from('workers')
    .select(`
      id,
      name,
      phone,
      role,
      district_id,
      districts (
        name,
        region
      )
    `)
    .eq('district_id', districtId)
    .in('role', workerRoles)
    .eq('active', true)
  
  if (error) {
    console.error('Error fetching workers:', error)
    return []
  }
  
  return workers || []
}

// Send SMS using Africa's Talking API
async function sendSMS(to: string[], message: string, testMode = false): Promise<SMSResponse> {
  if (!AT_API_KEY) {
    return {
      success: false,
      error: 'Africa\'s Talking API key not configured'
    }
  }
  
  if (testMode) {
    console.log(`📱 TEST MODE: Would send SMS to ${to.join(', ')}: ${message}`)
    return {
      success: true,
      message_id: 'test-' + Date.now(),
      recipients: to.length,
      cost: '0.00'
    }
  }
  
  try {
    const formData = new FormData()
    formData.append('username', AT_USERNAME)
    formData.append('to', to.join(','))
    formData.append('message', message)
    
    const response = await fetch(AT_BASE_URL, {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Accept': 'application/json'
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Africa\'s Talking API error:', response.status, errorText)
      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`
      }
    }
    
    const result = await response.json()
    
    if (result.SMSMessageData && result.SMSMessageData.Recipients) {
      const recipients = result.SMSMessageData.Recipients
      const successCount = recipients.filter((r: any) => r.status === 'Success').length
      
      if (successCount > 0) {
        return {
          success: true,
          message_id: result.SMSMessageData.Message,
          recipients: successCount,
          cost: recipients.reduce((sum: number, r: any) => sum + parseFloat(r.cost || '0'), 0).toFixed(4)
        }
      } else {
        return {
          success: false,
          error: 'No messages sent successfully: ' + recipients.map((r: any) => r.status).join(', ')
        }
      }
    } else {
      return {
        success: false,
        error: 'Unexpected API response format'
      }
    }
    
  } catch (error) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: 'Network error: ' + error.message
    }
  }
}

// Create SMS message from alert
function createSMSMessage(alert: Alert, customMessage?: string): string {
  if (customMessage) {
    return SMS_TEMPLATES.custom(customMessage)
  }
  
  const facilityName = alert.facilities.name
  const districtName = alert.facilities.districts.name
  const alertType = alert.alert_type as keyof typeof SMS_TEMPLATES
  
  if (SMS_TEMPLATES[alertType]) {
    return SMS_TEMPLATES[alertType](facilityName, districtName)
  }
  
  // Fallback message
  return `⚠️ ALERT: ${facilityName} in ${districtName} requires attention. Alert type: ${alert.alert_type}. Severity: ${alert.severity}.`
}

// Log SMS activity
async function logSMSActivity(
  supabase: any, 
  alertId: string, 
  recipients: string[], 
  message: string, 
  success: boolean, 
  error?: string,
  context?: { facility_id?: string; district_id?: string; provider_message_id?: string; test_mode?: boolean }
) {
  try {
    const status = success ? 'sent' : 'failed'
    const inserts = recipients.map((recipient) => ({
      direction: 'outbound',
      status,
      phone_to: recipient,
      message,
      facility_id: context?.facility_id || null,
      district_id: context?.district_id || null,
      provider_message_id: context?.provider_message_id || null,
      error_message: error || null,
      metadata: {
        alert_id: alertId,
        test_mode: context?.test_mode || false
      }
    }))

    await supabase.from('sms_gateway_logs').insert(inserts)
    console.log(`📱 SMS Log: Alert ${alertId}, Recipients: ${recipients.length}, Success: ${success}`)
    if (error) {
      console.error(`📱 SMS Error: ${error}`)
    }
  } catch (logError) {
    console.error('Error logging SMS activity:', logError)
  }
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

    // Parse request body
    let requestData: SMSRequest = {}
    try {
      requestData = await req.json()
    } catch {
      // No body or invalid JSON, use defaults
    }

    const {
      alert_ids = [],
      facility_ids = [],
      worker_phones = [],
      custom_message,
      severity_filter = ['critical', 'high'],
      test_mode = false
    } = requestData

    console.log(`📱 Starting SMS alert process...`)
    console.log(`   Alert IDs: ${alert_ids.length}`)
    console.log(`   Facility IDs: ${facility_ids.length}`)
    console.log(`   Worker phones: ${worker_phones.length}`)
    console.log(`   Severity filter: ${severity_filter.join(', ')}`)
    console.log(`   Test mode: ${test_mode}`)

    let alerts: Alert[] = []

    // Get alerts to process
    if (alert_ids.length > 0) {
      // Process specific alerts
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
            district_id,
            districts (
              name,
              region
            )
          )
        `)
        .in('id', alert_ids)
        .eq('resolved', false)

      if (error) {
        console.error('Error fetching specific alerts:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch alerts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      alerts = data || []
    } else if (facility_ids.length > 0) {
      // Get unresolved alerts for specific facilities
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
            district_id,
            districts (
              name,
              region
            )
          )
        `)
        .in('facility_id', facility_ids)
        .in('severity', severity_filter)
        .eq('resolved', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching facility alerts:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch facility alerts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      alerts = data || []
    } else {
      // Get recent unresolved critical and high severity alerts
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
            district_id,
            districts (
              name,
              region
            )
          )
        `)
        .in('severity', severity_filter)
        .eq('resolved', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(50) // Limit to prevent spam

      if (error) {
        console.error('Error fetching recent alerts:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch recent alerts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      alerts = data || []
    }

    if (alerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No alerts found matching criteria',
          alerts_processed: 0,
          sms_sent: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${alerts.length} alerts to process`)

    const smsResults: any[] = []
    let totalSMSSent = 0
    let totalErrors = 0

    // Process each alert
    for (const alert of alerts) {
      console.log(`📱 Processing alert: ${alert.id} (${alert.alert_type}, ${alert.severity})`)
      
      let recipients: string[] = []
      
      if (worker_phones.length > 0) {
        // Use specified phone numbers
        recipients = worker_phones
      } else {
        // Get appropriate workers for this alert
        const workers = await getWorkersForAlert(supabase, alert)
        recipients = workers.map(w => w.phone)
      }
      
      if (recipients.length === 0) {
        console.warn(`⚠️ No recipients found for alert ${alert.id}`)
        smsResults.push({
          alert_id: alert.id,
          facility_name: alert.facilities.name,
          success: false,
          error: 'No recipients found',
          recipients: 0
        })
        totalErrors++
        continue
      }
      
      // Create SMS message
      const smsMessage = createSMSMessage(alert, custom_message)
      
      // Send SMS
      const smsResponse = await sendSMS(recipients, smsMessage, test_mode)
      
      // Log activity
      await logSMSActivity(
        supabase,
        alert.id,
        recipients,
        smsMessage,
        smsResponse.success,
        smsResponse.error,
        {
          facility_id: alert.facility_id,
          district_id: alert.facilities?.district_id,
          provider_message_id: smsResponse.message_id,
          test_mode
        }
      )
      
      smsResults.push({
        alert_id: alert.id,
        facility_name: alert.facilities.name,
        district_name: alert.facilities.districts.name,
        alert_type: alert.alert_type,
        severity: alert.severity,
        recipients: smsResponse.recipients || recipients.length,
        success: smsResponse.success,
        message_id: smsResponse.message_id,
        cost: smsResponse.cost,
        error: smsResponse.error,
        message: smsMessage.substring(0, 100) + (smsMessage.length > 100 ? '...' : '')
      })
      
      if (smsResponse.success) {
        totalSMSSent += smsResponse.recipients || recipients.length
      } else {
        totalErrors++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const summary = {
      alerts_processed: alerts.length,
      sms_sent: totalSMSSent,
      errors: totalErrors,
      success_rate: alerts.length > 0 ? Math.round((alerts.length - totalErrors) / alerts.length * 100) : 0
    }

    console.log(`✅ SMS alert process completed:`)
    console.log(`   Alerts processed: ${summary.alerts_processed}`)
    console.log(`   SMS sent: ${summary.sms_sent}`)
    console.log(`   Errors: ${summary.errors}`)
    console.log(`   Success rate: ${summary.success_rate}%`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS alerts processed for ${alerts.length} alerts`,
        summary,
        results: smsResults,
        test_mode,
        timestamp: new Date().toISOString()
      }),
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