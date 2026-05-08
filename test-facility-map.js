// Test script to verify FacilityMap data fetching
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testFacilityMapData() {
  console.log('🧪 Testing FacilityMap data fetching...')
  
  try {
    // Fetch facilities with district info (same query as FacilityMap)
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        district:districts(id, name, region)
      `)
      .order('name')
    
    if (error) {
      console.error('❌ Query failed:', error.message)
      return
    }
    
    console.log('✅ Query successful!')
    console.log(`📍 Found ${data.length} facilities`)
    
    // Analyze risk distribution
    const stats = {
      total: data.length,
      good: 0,      // 0-29
      amber: 0,     // 30-59
      red: 0,       // 60-84
      critical: 0   // 85-100
    }
    
    data.forEach(facility => {
      const risk = facility.risk_score || 0
      if (risk >= 85) stats.critical++
      else if (risk >= 60) stats.red++
      else if (risk >= 30) stats.amber++
      else stats.good++
    })
    
    console.log('📊 Risk Distribution:')
    console.log(`  🟢 Good (0-29): ${stats.good}`)
    console.log(`  🟡 Amber (30-59): ${stats.amber}`)
    console.log(`  🔴 Red (60-84): ${stats.red}`)
    console.log(`  ⚫ Critical (85-100): ${stats.critical}`)
    
    // Show sample facilities with different risk levels
    console.log('\n📋 Sample Facilities:')
    
    const sampleGood = data.find(f => (f.risk_score || 0) < 30)
    const sampleAmber = data.find(f => (f.risk_score || 0) >= 30 && (f.risk_score || 0) < 60)
    const sampleRed = data.find(f => (f.risk_score || 0) >= 60 && (f.risk_score || 0) < 85)
    const sampleCritical = data.find(f => (f.risk_score || 0) >= 85)
    
    if (sampleGood) {
      console.log(`  🟢 Good: ${sampleGood.name} (Risk: ${sampleGood.risk_score || 0})`)
    }
    if (sampleAmber) {
      console.log(`  🟡 Amber: ${sampleAmber.name} (Risk: ${sampleAmber.risk_score || 0})`)
    }
    if (sampleRed) {
      console.log(`  🔴 Red: ${sampleRed.name} (Risk: ${sampleRed.risk_score || 0})`)
    }
    if (sampleCritical) {
      console.log(`  ⚫ Critical: ${sampleCritical.name} (Risk: ${sampleCritical.risk_score || 0})`)
    }
    
    // Check coordinate validity
    const validCoords = data.filter(f => 
      f.lat && f.lng && 
      f.lat >= -90 && f.lat <= 90 && 
      f.lng >= -180 && f.lng <= 180
    )
    
    console.log(`\n📍 Coordinate Validation:`)
    console.log(`  ✅ Valid coordinates: ${validCoords.length}/${data.length}`)
    
    if (validCoords.length !== data.length) {
      const invalidCoords = data.filter(f => 
        !f.lat || !f.lng || 
        f.lat < -90 || f.lat > 90 || 
        f.lng < -180 || f.lng > 180
      )
      console.log(`  ❌ Invalid coordinates:`)
      invalidCoords.forEach(f => {
        console.log(`    - ${f.name}: (${f.lat}, ${f.lng})`)
      })
    }
    
    console.log('\n🎉 FacilityMap data test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFacilityMapData()