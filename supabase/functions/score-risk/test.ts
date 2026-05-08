#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test script for the score-risk Edge Function
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

async function testScoreRisk() {
  console.log('🎯 Testing score-risk Edge Function...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/score-risk`
  
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
      body: JSON.stringify({}) // Empty body to process all facilities
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
        console.log('\n📊 Risk Assessment Summary:')
        console.log(`   Total facilities: ${data.summary.total_facilities}`)
        console.log(`   Facilities updated: ${data.summary.facilities_updated}`)
        console.log(`   Average risk score: ${data.summary.average_risk_score}/100`)
        console.log(`   Facilities needing attention: ${data.summary.facilities_needing_attention}`)
        
        console.log('\n🚨 Risk Distribution:')
        console.log(`   Critical (80-100): ${data.summary.risk_distribution.critical}`)
        console.log(`   High (60-79): ${data.summary.risk_distribution.high}`)
        console.log(`   Medium (40-59): ${data.summary.risk_distribution.medium}`)
        console.log(`   Low (0-39): ${data.summary.risk_distribution.low}`)
      }
      
      if (data.assessments && data.assessments.length > 0) {
        console.log('\n📋 Sample Risk Assessments:')
        
        // Show top 3 highest risk facilities
        const sortedAssessments = data.assessments
          .sort((a: any, b: any) => b.new_risk_score - a.new_risk_score)
          .slice(0, 3)
        
        sortedAssessments.forEach((assessment: any, index: number) => {
          console.log(`\n   ${index + 1}. ${assessment.facility_name}`)
          console.log(`      Risk Score: ${assessment.current_risk_score} → ${assessment.new_risk_score}`)
          console.log(`      Priority: ${assessment.priority_level.toUpperCase()}`)
          console.log(`      Status: ${assessment.recommended_status}`)
          console.log(`      Risk Factors:`)
          console.log(`        Climate: ${assessment.risk_factors.climate_risk}/30`)
          console.log(`        Condition: ${assessment.risk_factors.facility_condition}/40`)
          console.log(`        Maintenance: ${assessment.risk_factors.maintenance_overdue}/30`)
          console.log(`        Reports: ${assessment.risk_factors.recent_reports}/20`)
          console.log(`        Location: ${assessment.risk_factors.location_risk}/10`)
          
          if (assessment.action_required.length > 0) {
            console.log(`      Actions Required:`)
            assessment.action_required.forEach((action: string) => {
              console.log(`        • ${action}`)
            })
          }
        })
      }
      
      if (data.updates) {
        console.log(`\n📝 Database Updates:`)
        console.log(`   Facilities updated: ${data.updates.updated_count}`)
        console.log(`   Update errors: ${data.updates.errors}`)
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

// Test with specific facility IDs
async function testSpecificFacilities() {
  console.log('\n🎯 Testing with specific facility IDs...\n')
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/score-risk`
  
  // These are example UUIDs - replace with actual facility IDs from your database
  const testFacilityIds = [
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
        facility_ids: testFacilityIds
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Specific facilities test successful!')
      console.log(`📊 Processed: ${data.summary?.total_facilities || 0} facilities`)
    } else {
      console.log('⚠️ Specific facilities test failed (expected if test IDs don\'t exist)')
      console.log(`💥 Error: ${data.error}`)
    }
    
  } catch (error) {
    console.log('💥 Specific facilities test error!')
    console.error(error)
  }
}

// Test database connectivity
async function testDatabaseConnectivity() {
  console.log('\n🔍 Testing database connectivity...\n')
  
  const testUrls = [
    `${SUPABASE_URL}/rest/v1/facilities?select=count`,
    `${SUPABASE_URL}/rest/v1/climate_snapshots?select=count`,
    `${SUPABASE_URL}/rest/v1/reports?select=count`
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

// Run tests
if (import.meta.main) {
  await testDatabaseConnectivity()
  await testScoreRisk()
  await testSpecificFacilities()
  
  console.log('\n🎉 Testing complete!')
  console.log('\n💡 Tips:')
  console.log('• Run this after setting up climate data with fetch-climate function')
  console.log('• Check facility risk scores in your database after running')
  console.log('• Monitor alerts table for new climate-based warnings')
  console.log('• Use specific facility IDs to test individual assessments')
}