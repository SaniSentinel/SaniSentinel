#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test script for the inbound-sms Edge Function
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

interface TestCase {
  name: string
  sms: string
  phone: string
  expectedSuccess: boolean
  description: string
}

const testCases: TestCase[] = [
  // Valid SMS messages
  {
    name: "Valid SMS - Good condition",
    sms: "F1#A#good",
    phone: "+233241234567",
    expectedSuccess: true,
    description: "Standard format with good condition"
  },
  {
    name: "Valid SMS - Overflow condition",
    sms: "F2#B#overflow",
    phone: "+233241234568",
    expectedSuccess: true,
    description: "Standard format with overflow condition"
  },
  {
    name: "Valid SMS - Damaged with alias",
    sms: "F3#1#broken",
    phone: "+233241234569",
    expectedSuccess: true,
    description: "Using condition alias 'broken' -> 'damaged'"
  },
  {
    name: "Valid SMS - Blocked with alias",
    sms: "F4#MAIN#clogged",
    phone: "+233241234570",
    expectedSuccess: true,
    description: "Using condition alias 'clogged' -> 'blocked'"
  },
  {
    name: "Valid SMS - Out of service",
    sms: "F5#C#out_of_service",
    phone: "+233241234571",
    expectedSuccess: true,
    description: "Full condition name for out of service"
  },
  
  // Invalid SMS messages
  {
    name: "Invalid SMS - Missing F prefix",
    sms: "123#A#good",
    phone: "+233241234567",
    expectedSuccess: false,
    description: "Should fail - missing F prefix"
  },
  {
    name: "Invalid SMS - Wrong delimiter",
    sms: "F123-A-good",
    phone: "+233241234567",
    expectedSuccess: false,
    description: "Should fail - using dash instead of hash"
  },
  {
    name: "Invalid SMS - Missing parts",
    sms: "F123#good",
    phone: "+233241234567",
    expectedSuccess: false,
    description: "Should fail - missing block number"
  },
  {
    name: "Invalid SMS - Invalid condition",
    sms: "F123#A#invalid_condition",
    phone: "+233241234567",
    expectedSuccess: false,
    description: "Should fail - invalid condition"
  },
  {
    name: "Invalid SMS - Empty condition",
    sms: "F123#A#",
    phone: "+233241234567",
    expectedSuccess: false,
    description: "Should fail - empty condition"
  }
]

async function testInboundSMS() {
  console.log('📱 Testing inbound-sms Edge Function...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/inbound-sms`
  
  console.log(`📡 Function URL: ${functionUrl}`)
  console.log(`🔑 Using key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`)
  console.log('')
  
  let passedTests = 0
  let failedTests = 0
  
  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.name}`)
    console.log(`   SMS: "${testCase.sms}"`)
    console.log(`   Phone: ${testCase.phone}`)
    console.log(`   Expected: ${testCase.expectedSuccess ? 'SUCCESS' : 'FAILURE'}`)
    
    try {
      const startTime = Date.now()
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testCase.sms,
          from: testCase.phone
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const data = await response.json()
      const actualSuccess = response.ok && data.success
      
      if (actualSuccess === testCase.expectedSuccess) {
        console.log(`   ✅ PASS (${duration}ms)`)
        
        if (actualSuccess) {
          console.log(`   📊 Report created for: ${data.report?.facility_name || 'Unknown facility'}`)
          console.log(`   📍 District: ${data.report?.district || 'Unknown'}`)
          console.log(`   🏗️  Block: ${data.report?.block || 'Unknown'}`)
          console.log(`   📋 Condition: ${data.report?.condition || 'Unknown'}`)
        } else {
          console.log(`   ❌ Expected error: ${data.error}`)
        }
        
        passedTests++
      } else {
        console.log(`   ❌ FAIL (${duration}ms)`)
        console.log(`   Expected: ${testCase.expectedSuccess ? 'SUCCESS' : 'FAILURE'}`)
        console.log(`   Actual: ${actualSuccess ? 'SUCCESS' : 'FAILURE'}`)
        
        if (data.error) {
          console.log(`   Error: ${data.error}`)
        }
        
        failedTests++
      }
      
    } catch (error) {
      console.log(`   💥 NETWORK ERROR: ${error.message}`)
      failedTests++
    }
    
    console.log('')
  }
  
  // Summary
  console.log('📊 Test Summary:')
  console.log(`   ✅ Passed: ${passedTests}`)
  console.log(`   ❌ Failed: ${failedTests}`)
  console.log(`   📈 Success Rate: ${Math.round((passedTests / testCases.length) * 100)}%`)
}

// Test webhook format (Africa's Talking format)
async function testWebhookFormat() {
  console.log('\n🌐 Testing Africa\'s Talking webhook format...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/inbound-sms`
  
  const webhookData = new URLSearchParams({
    id: '12345',
    text: 'F1#A#good',
    from: '+233241234567',
    to: '12345',
    date: new Date().toISOString(),
    linkId: 'webhook-test',
    networkCode: '62701'
  })
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: webhookData
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log('✅ Webhook format test successful!')
      console.log(`📊 Report created for: ${data.report?.facility_name || 'Unknown facility'}`)
      console.log(`📱 SMS ID: ${data.sms_id}`)
    } else {
      console.log('❌ Webhook format test failed!')
      console.log(`Error: ${data.error}`)
    }
    
  } catch (error) {
    console.log('💥 Webhook format test error!')
    console.error(error)
  }
}

// Test database connectivity
async function testDatabaseConnectivity() {
  console.log('\n🔍 Testing database connectivity...\n')
  
  const testUrls = [
    `${SUPABASE_URL}/rest/v1/facilities?select=count`,
    `${SUPABASE_URL}/rest/v1/reports?select=count`,
    `${SUPABASE_URL}/rest/v1/workers?select=count`
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

// Test SMS format parsing
async function testSMSFormatExamples() {
  console.log('\n📝 SMS Format Examples and Results...\n')
  
  const examples = [
    'F123#A#good',
    'F456#B#overflow',
    'F789#1#damaged',
    'F101#MAIN#blocked',
    'F202#C#dry',
    'F303#2#out_of_service',
    'F404#BLOCK1#broken',    // alias test
    'F505#X#clogged',        // alias test
    'F606#Y#ok',             // alias test
  ]
  
  console.log('Valid SMS format examples:')
  examples.forEach((example, index) => {
    console.log(`   ${index + 1}. ${example}`)
  })
  
  console.log('\nInvalid SMS format examples:')
  const invalidExamples = [
    '123#A#good',           // Missing F
    'F123-A-good',          // Wrong delimiter
    'F123#good',            // Missing block
    'F123#A#',              // Empty condition
    'F123#A#invalid',       // Invalid condition
    'F#A#good',             // Empty facility ID
    'F123##good',           // Empty block
  ]
  
  invalidExamples.forEach((example, index) => {
    console.log(`   ${index + 1}. ${example}`)
  })
}

// Run all tests
if (import.meta.main) {
  await testDatabaseConnectivity()
  await testSMSFormatExamples()
  await testInboundSMS()
  await testWebhookFormat()
  
  console.log('\n🎉 Testing complete!')
  console.log('\n💡 Tips:')
  console.log('• Configure Africa\'s Talking webhook to point to your function')
  console.log('• Train workers on the SMS format: F{ID}#{BLOCK}#{CONDITION}')
  console.log('• Monitor function logs for parsing errors')
  console.log('• Set up facility ID mapping for easier worker use')
  console.log('• Consider sending confirmation SMS back to workers')
}