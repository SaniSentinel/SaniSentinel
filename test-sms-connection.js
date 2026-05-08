// Test SMS connection with your API key
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://aaxgfnzcbyerjlcftwuo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc4NDgsImV4cCI6MjA5Mzc2Mzg0OH0.rur02SV6Yy0gLjUmkFMwUTB7msz1f3bXzyQPokaWJrk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSMSConnection() {
  console.log('📱 Testing SMS Alert Connection...\n')
  
  try {
    // Test 1: Check if we can call the SMS function
    console.log('🧪 Testing SMS function with test mode...')
    
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: {
        test_mode: true, // SAFE: No actual SMS sent
        severity_filter: ['critical', 'high'],
        custom_message: 'Test connection from SaniSentinel system'
      }
    })

    if (error) {
      console.log('❌ SMS function error:', error.message)
      console.log('💡 Make sure to deploy the function first:')
      console.log('   supabase functions deploy send-sms-alert')
      return
    }

    if (data.success) {
      console.log('✅ SMS function is working!')
      console.log(`📊 Test Results:`)
      console.log(`   - Alerts processed: ${data.summary?.alerts_processed || 0}`)
      console.log(`   - SMS that would be sent: ${data.summary?.sms_sent || 0}`)
      console.log(`   - Test mode: ${data.test_mode}`)
      console.log(`   - Success rate: ${data.summary?.success_rate || 0}%`)
      
      if (data.results && data.results.length > 0) {
        console.log('\n📋 Sample SMS messages that would be sent:')
        data.results.slice(0, 3).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.facility_name || 'Custom Message'}`)
          console.log(`      Recipients: ${result.recipients}`)
          console.log(`      Message: ${result.message?.substring(0, 80)}...`)
        })
      }
      
      console.log('\n🎉 SMS Alert System is ready!')
      console.log('💡 To send real SMS, set test_mode: false')
      
    } else {
      console.log('❌ SMS function failed:', data.error)
    }

  } catch (error) {
    console.log('💥 Connection error:', error.message)
    console.log('💡 Make sure Supabase is running and function is deployed')
  }
}

// Test 2: Check database connectivity for SMS-related tables
async function testDatabaseTables() {
  console.log('\n🔍 Checking database tables for SMS...')
  
  try {
    // Check alerts table
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('id, severity, alert_type')
      .eq('resolved', false)
      .limit(5)

    if (alertsError) {
      console.log('❌ Alerts table error:', alertsError.message)
    } else {
      console.log(`✅ Alerts table: ${alerts.length} unresolved alerts found`)
    }

    // Check workers table
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, phone, role')
      .eq('active', true)
      .limit(5)

    if (workersError) {
      console.log('❌ Workers table error:', workersError.message)
    } else {
      console.log(`✅ Workers table: ${workers.length} active workers found`)
      if (workers.length > 0) {
        console.log('   Sample workers:')
        workers.forEach(worker => {
          console.log(`   - ${worker.name} (${worker.phone}) - ${worker.role}`)
        })
      }
    }

    // Check facilities table
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, status, risk_score')
      .limit(5)

    if (facilitiesError) {
      console.log('❌ Facilities table error:', facilitiesError.message)
    } else {
      console.log(`✅ Facilities table: ${facilities.length} facilities found`)
    }

  } catch (error) {
    console.log('💥 Database connection error:', error.message)
  }
}

// Run tests
async function runAllTests() {
  await testDatabaseTables()
  await testSMSConnection()
  
  console.log('\n📚 Next Steps:')
  console.log('1. Deploy SMS function: supabase functions deploy send-sms-alert')
  console.log('2. Test with real phone numbers (still in test mode)')
  console.log('3. Switch to production mode when ready')
  console.log('4. Set up automatic triggers for critical alerts')
}

runAllTests()