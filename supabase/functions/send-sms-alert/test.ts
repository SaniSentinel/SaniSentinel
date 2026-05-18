#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test script for the send-sms-alert Edge Function
 * 
 * Usage:
 * deno run --allow-net --allow-env test.ts
 * 
 * Or make executable and run:
 * chmod +x test.ts
 * ./test.ts
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs'

async function testSendSMSAlert() {
  console.log('📱 Testing send-sms-alert Edge Function...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/send-sms-alert`
  
  console.log(`📡 Calling: ${functionUrl}`)
  console.log(`🔑 Using key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`)
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_mode: true,
        severity_filter: ['critical', 'high']
      })
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️  Response time: ${duration}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Success!')
      console.log(`📈 Message: ${data.message}`)
      
      if (data.summary) {
        console.log('\n📊 SMS Alert Summary:')
        console.log(`   Alerts processed: ${data.summary.alerts_processed}`)
        console.log(`   SMS sent: ${data.summary.sms_sent}`)
        console.log(`   Errors: ${data.summary.errors}`)
        console.log(`   Success rate: ${data.summary.success_rate}%`)
        console.log(`   Test mode: ${data.test_mode}`)
      }
      
      if (data.results && data.results.length > 0) {
        console.log('\n📋 SMS Results:')
        
        data.results.forEach((result: any, index: number) => {
          console.log(`\n   ${index + 1}. ${result.facility_name} (${result.district_name})`)
          console.log(`      Alert Type: ${result.alert_type}`)
          console.log(`      Severity: ${result.severity.toUpperCase()}`)
          console.log(`      Recipients: ${result.recipients}`)
          console.log(`      Success: ${result.success ? '✅' : '❌'}`)
          
          if (result.success) {
            console.log(`      Message ID: ${result.message_id}`)
            if (result.cost) {
              console.log(`      Cost: $${result.cost}`)
            }
          } else if (result.error) {
            console.log(`      Error: ${result.error}`)
          }
          
          if (result.message) {
            console.log(`      Message: ${result.message}`)
          }
        })
      }
      
    } else {
      console.log('❌ Error!')
      console.log(`💥 Error: ${data.error}`)
      if (data.details) {
        console.log(`📝 Details: ${data.details}`)
      }
    }
    
  } catch (error) {
    console.log('💥 Network/Parse Error!')
    console.error(error)
  }
}

// Test with specific alert IDs
async function testSpecificAlerts() {
  console.log('\n📱 Testing with specific alert IDs...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/send-sms-alert`
  
  // These are example UUIDs - replace with actual alert IDs from your database
  const testAlertIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  ]
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alert_ids: testAlertIds,
        test_mode: true
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Specific alerts test successful!')
      console.log(`📊 Processed: ${data.summary?.alerts_processed || 0} alerts`)
    } else {
      console.log('⚠️ Specific alerts test failed (expected if test IDs don\'t exist)')
      console.log(`💥 Error: ${data.error}`)
    }
    
  } catch (error) {
    console.log('💥 Specific alerts test error!')
    console.error(error)
  }
}

// Test custom message
async function testCustomMessage() {
  console.log('\n📱 Testing custom message...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/send-sms-alert`
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        worker_phones: ['+233241234567', '+233241234568'],
        custom_message: 'Test message from SMS alert system. This is a test - please ignore.',
        test_mode: true
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Custom message test successful!')
      console.log(`📊 Recipients: ${data.summary?.sms_sent || 0}`)
      
      if (data.results && data.results.length > 0) {
        console.log(`📝 Message sent: ${data.results[0].message}`)
      }
    } else {
      console.log('❌ Custom message test failed')
      console.log(`💥 Error: ${data.error}`)
    }
    
  } catch (error) {
    console.log('💥 Custom message test error!')
    console.error(error)
  }
}

// Test database connectivity for SMS-related tables
async function testDatabaseConnectivity() {
  console.log('\n🔍 Testing database connectivity for SMS function...\n')
  
  const testUrls = [
    `${SUPABASE_URL}/rest/v1/alerts?select=count&resolved=eq.false`,
    `${SUPABASE_URL}/rest/v1/workers?select=count&active=eq.true`,
    `${SUPABASE_URL}/rest/v1/facilities?select=count`
  ]
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      })
      
      const tableName = url.split('/').pop()?.split('?')[0]
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${tableName}: ${data.length || 0} records accessible`)
      } else {
        console.log(`❌ ${tableName}: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`💥 ${url}: Network error`)
    }
  }
}

// Test Africa's Talking API configuration
async function testAfricasTalkingConfig() {
  console.log('\n🌍 Testing Africa\'s Talking configuration...\n')
  
  const apiKey = Deno.env.get('AFRICAS_TALKING_API_KEY')
  const username = Deno.env.get('AFRICAS_TALKING_USERNAME')
  
  if (!apiKey) {
    console.log('⚠️ AFRICAS_TALKING_API_KEY not set in environment')
    console.log('   Set it with: export AFRICAS_TALKING_API_KEY=your_api_key')
  } else {
    console.log(`✅ API Key configured: ${apiKey.substring(0, 10)}...`)
  }
  
  if (!username) {
    console.log('⚠️ AFRICAS_TALKING_USERNAME not set (will default to "sandbox")')
    console.log('   Set it with: export AFRICAS_TALKING_USERNAME=your_username')
  } else {
    console.log(`✅ Username configured: ${username}`)
  }
  
  // Test API connectivity (if credentials are available)
  if (apiKey && username) {
    try {
      const formData = new FormData()
      formData.append('username', username)
      
      const userHost = username.toLowerCase() === 'sandbox'
        ? 'https://api.sandbox.africastalking.com'
        : 'https://api.africastalking.com'
      const response = await fetch(`${userHost}/version1/user`, {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Accept': 'application/json'
        },
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Africa\'s Talking API connection successful!')
        console.log(`   Balance: ${data.UserData?.balance || 'Unknown'}`)
      } else {
        console.log(`❌ Africa's Talking API error: ${response.status}`)
      }
    } catch (error) {
      console.log('💥 Africa\'s Talking API connection failed:', error.message)
    }
  }
}

// Run tests
if (import.meta.main) {
  await testDatabaseConnectivity()
  await testAfricasTalkingConfig()
  await testSendSMSAlert()
  await testSpecificAlerts()
  await testCustomMessage()
  
  console.log('\n🎉 Testing complete!')
  console.log('\n💡 Tips:')
  console.log('• Always test with test_mode: true first')
  console.log('• Set up Africa\'s Talking credentials for production')
  console.log('• Monitor SMS costs and delivery rates')
  console.log('• Use severity filters to control which alerts trigger SMS')
  console.log('• Set up database triggers for automatic SMS alerts')
}