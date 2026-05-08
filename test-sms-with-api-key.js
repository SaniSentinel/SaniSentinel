// Test script for SMS function with your API key
// Run this after setting up the environment variables

const SUPABASE_URL = 'http://localhost:54321' // Change to your Supabase URL
const SUPABASE_ANON_KEY = 'your-anon-key-here' // Replace with your anon key

async function testSMSWithRealAPI() {
  console.log('📱 Testing SMS function with real Africa\'s Talking API...\n')
  
  try {
    // Test 1: Check if function is accessible
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms-alert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_mode: true, // IMPORTANT: Start with test mode
        severity_filter: ['critical', 'high']
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ SMS function is working!')
      console.log(`📊 Summary:`)
      console.log(`   Alerts processed: ${data.summary?.alerts_processed || 0}`)
      console.log(`   SMS sent (test): ${data.summary?.sms_sent || 0}`)
      console.log(`   Test mode: ${data.test_mode}`)
      
      if (data.results && data.results.length > 0) {
        console.log('\n📋 Sample results:')
        data.results.slice(0, 2).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.facility_name}`)
          console.log(`      Message: ${result.message?.substring(0, 80)}...`)
          console.log(`      Recipients: ${result.recipients}`)
        })
      }
      
      console.log('\n✅ Ready for production! Set test_mode: false when ready.')
      
    } else {
      console.log('❌ SMS function error:', data.error)
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message)
  }
}

// Test with custom message to specific phone numbers
async function testCustomSMS() {
  console.log('\n📱 Testing custom SMS (TEST MODE)...\n')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms-alert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        worker_phones: ['+233241234567'], // Test phone number
        custom_message: 'Test SMS from sanitation alert system. This is a test message.',
        test_mode: true // IMPORTANT: Keep test mode for now
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Custom SMS test successful!')
      console.log(`📱 Would send to: ${data.summary?.sms_sent || 0} recipients`)
      
      if (data.results && data.results.length > 0) {
        console.log(`📝 Message: ${data.results[0].message}`)
      }
    } else {
      console.log('❌ Custom SMS test failed:', data.error)
    }
    
  } catch (error) {
    console.log('💥 Custom SMS test error:', error.message)
  }
}

// Run tests
testSMSWithRealAPI()
testCustomSMS()

console.log('\n💡 Next Steps:')
console.log('1. If tests pass, you can set test_mode: false for production')
console.log('2. Add real worker phone numbers to your database')
console.log('3. Set up automatic triggers for critical alerts')
console.log('4. Monitor SMS costs in your Africa\'s Talking dashboard')