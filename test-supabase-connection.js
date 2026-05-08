// Simple test to check Supabase connection
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Has Anon Key:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔄 Testing basic connection...')
    
    // Test 1: Check if we can connect
    const { data: healthCheck, error: healthError } = await supabase
      .from('districts')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError.message)
      return
    }
    
    console.log('✅ Basic connection successful')
    
    // Test 2: Try to get districts
    console.log('🔄 Testing districts table...')
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('*')
      .limit(5)
    
    if (districtsError) {
      console.error('❌ Districts query failed:', districtsError.message)
      return
    }
    
    console.log('✅ Districts query successful')
    console.log(`📍 Found ${districts?.length || 0} districts`)
    if (districts && districts.length > 0) {
      console.log('📋 Sample district:', districts[0])
    }
    
    // Test 3: Try to get facilities
    console.log('🔄 Testing facilities table...')
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('*')
      .limit(5)
    
    if (facilitiesError) {
      console.error('❌ Facilities query failed:', facilitiesError.message)
      return
    }
    
    console.log('✅ Facilities query successful')
    console.log(`🏢 Found ${facilities?.length || 0} facilities`)
    if (facilities && facilities.length > 0) {
      console.log('📋 Sample facility:', facilities[0])
    }
    
    console.log('🎉 All tests passed! Supabase connection is working.')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
}

testConnection()