#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test script for the fetch-climate Edge Function
 * 
 * Usage:
 * deno run --allow-net --allow-env test.ts
 * 
 * Or make executable and run:
 * chmod +x test.ts
 * ./test.ts
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'your-anon-key'

async function testFetchClimate() {
  console.log('🌤️  Testing fetch-climate Edge Function...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/fetch-climate`
  
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
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️  Response time: ${duration}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Success!')
      console.log(`📈 Message: ${data.message}`)
      
      if (data.snapshots) {
        console.log(`📊 Snapshots created: ${data.snapshots.length}`)
        
        // Show sample snapshot
        if (data.snapshots.length > 0) {
          const sample = data.snapshots[0]
          console.log('\n📋 Sample snapshot:')
          console.log(`   District ID: ${sample.district_id}`)
          console.log(`   Flood Risk: ${sample.flood_risk_score}/100`)
          console.log(`   Rainfall: ${sample.rainfall_mm}mm`)
          console.log(`   Temperature: ${sample.temperature_celsius}°C`)
          console.log(`   Humidity: ${sample.humidity_percent}%`)
          console.log(`   Wind Speed: ${sample.wind_speed_kmh} km/h`)
          console.log(`   Condition: ${sample.weather_condition}`)
        }
      }
      
      if (data.errors && data.errors.length > 0) {
        console.log(`⚠️  Errors: ${data.errors.length}`)
        data.errors.forEach((error: string, index: number) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
      
    } else {
      console.log('❌ Error!')
      console.log(`💥 Error: ${data.error}`)
      if (data.details) {
        console.log(`📝 Details: ${data.details}`)
      }
      if (data.errors) {
        console.log('🔍 Individual errors:')
        data.errors.forEach((error: string, index: number) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
    }
    
  } catch (error) {
    console.log('💥 Network/Parse Error!')
    console.error(error)
  }
}

// Test Open-Meteo API directly
async function testOpenMeteoAPI() {
  console.log('\n🌍 Testing Open-Meteo API directly...\n')
  
  // Test with Tamale coordinates
  const lat = 9.4034
  const lng = -0.8424
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=precipitation_sum&timezone=GMT&past_days=7&forecast_days=1`
  
  console.log(`📡 Testing with Tamale coordinates: ${lat}, ${lng}`)
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Open-Meteo API working!')
      console.log(`🌡️  Temperature: ${data.current.temperature_2m}°C`)
      console.log(`💧 Humidity: ${data.current.relative_humidity_2m}%`)
      console.log(`🌧️  Precipitation: ${data.current.precipitation}mm`)
      console.log(`💨 Wind Speed: ${data.current.wind_speed_10m} km/h`)
      console.log(`🌤️  Weather Code: ${data.current.weather_code}`)
    } else {
      console.log('❌ Open-Meteo API Error!')
      console.log(data)
    }
  } catch (error) {
    console.log('💥 Open-Meteo API Network Error!')
    console.error(error)
  }
}

// Run tests
if (import.meta.main) {
  await testOpenMeteoAPI()
  await testFetchClimate()
}