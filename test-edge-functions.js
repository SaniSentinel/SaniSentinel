#!/usr/bin/env node

/**
 * Comprehensive Edge Function Testing Script
 * Tests all 4 edge functions with various scenarios
 * 
 * Prerequisites:
 * 1. Supabase CLI installed: https://supabase.com/docs/guides/cli
 * 2. Local Supabase project running: supabase start
 * 3. Edge functions served locally: supabase functions serve
 * 
 * Usage:
 * node test-edge-functions.js
 */

const BASE_URL = 'http://localhost:54321/functions/v1'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test utilities
async function testFunction(functionName, payload = {}, method = 'POST') {
  const url = `${BASE_URL}/${functionName}`
  
  console.log(`\n🧪 Testing ${functionName}...`)
  console.log(`📡 URL: ${url}`)
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2))
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined
    })
    
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, status: response.status, data }
  } catch (error) {
    console.error(`❌ Error testing ${functionName}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Edge Function Tests')
  console.log('=' .repeat(50))
  
  const results = {}
  
  // Test 1: fetch-climate
  console.log('\n📊 TEST 1: FETCH-CLIMATE')
  console.log('-'.repeat(30))
  results.fetchClimate = await testFunction('fetch-climate')
  
  // Wait a bit for climate data to be processed
  if (results.fetchClimate.success) {
    console.log('⏳ Waiting 5 seconds for climate data to be processed...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  
  // Test 2: score-risk (all facilities)
  console.log('\n🎯 TEST 2: SCORE-RISK (All Facilities)')
  console.log('-'.repeat(30))
  results.scoreRiskAll = await testFunction('score-risk')
  
  // Test 3: score-risk (specific facilities)
  console.log('\n🎯 TEST 3: SCORE-RISK (Specific Facilities)')
  console.log('-'.repeat(30))
  results.scoreRiskSpecific = await testFunction('score-risk', {
    facility_ids: ['facility-1', 'facility-2']
  })
  
  // Test 4: send-sms-alert (test mode)
  console.log('\n📱 TEST 4: SEND-SMS-ALERT (Test Mode)')
  console.log('-'.repeat(30))
  results.smsAlertTest = await testFunction('send-sms-alert', {
    severity_filter: ['critical', 'high'],
    test_mode: true
  })
  
  // Test 5: send-sms-alert (specific workers)
  console.log('\n📱 TEST 5: SEND-SMS-ALERT (Specific Workers)')
  console.log('-'.repeat(30))
  results.smsAlertWorkers = await testFunction('send-sms-alert', {
    worker_phones: ['+233123456789'],
    custom_message: 'Test message from automated testing',
    test_mode: true
  })
  
  // Test 6: inbound-sms (valid format)
  console.log('\n📥 TEST 6: INBOUND-SMS (Valid Format)')
  console.log('-'.repeat(30))
  results.inboundSmsValid = await testFunction('inbound-sms', {
    text: 'F1#A#good',
    from: '+233123456789'
  })
  
  // Test 7: inbound-sms (invalid format)
  console.log('\n📥 TEST 7: INBOUND-SMS (Invalid Format)')
  console.log('-'.repeat(30))
  results.inboundSmsInvalid = await testFunction('inbound-sms', {
    text: 'invalid message',
    from: '+233123456789'
  })
  
  // Test 8: inbound-sms (condition aliases)
  console.log('\n📥 TEST 8: INBOUND-SMS (Condition Aliases)')
  console.log('-'.repeat(30))
  results.inboundSmsAlias = await testFunction('inbound-sms', {
    text: 'F1#B#broken',  // 'broken' should map to 'damaged'
    from: '+233987654321'
  })
  
  // Test 9: inbound-sms (Africa's Talking webhook format)
  console.log('\n📥 TEST 9: INBOUND-SMS (Webhook Format)')
  console.log('-'.repeat(30))
  const webhookData = new URLSearchParams({
    id: 'test-webhook-id',
    text: 'F2#C#overflow',
    from: '+233555666777',
    to: '12345',
    date: new Date().toISOString(),
    linkId: 'test-link',
    networkCode: '63902'
  })
  
  try {
    const response = await fetch(`${BASE_URL}/inbound-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: webhookData
    })
    
    const data = await response.json()
    results.inboundSmsWebhook = { success: response.ok, status: response.status, data }
    console.log(`✅ Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`❌ Error testing webhook format:`, error.message)
    results.inboundSmsWebhook = { success: false, error: error.message }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  
  const testNames = {
    fetchClimate: 'Fetch Climate Data',
    scoreRiskAll: 'Score Risk (All Facilities)',
    scoreRiskSpecific: 'Score Risk (Specific Facilities)',
    smsAlertTest: 'SMS Alert (Test Mode)',
    smsAlertWorkers: 'SMS Alert (Specific Workers)',
    inboundSmsValid: 'Inbound SMS (Valid Format)',
    inboundSmsInvalid: 'Inbound SMS (Invalid Format)',
    inboundSmsAlias: 'Inbound SMS (Condition Aliases)',
    inboundSmsWebhook: 'Inbound SMS (Webhook Format)'
  }
  
  let passed = 0
  let total = 0
  
  for (const [key, result] of Object.entries(results)) {
    total++
    const testName = testNames[key] || key
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${testName}`)
    
    if (result.success) passed++
    else if (result.error) console.log(`    Error: ${result.error}`)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`📈 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your edge functions are working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Check the errors above and your function implementations.')
  }
  
  return results
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { testFunction, runAllTests }