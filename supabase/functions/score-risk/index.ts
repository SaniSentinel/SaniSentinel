import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Facility {
  id: string
  name: string
  type: string
  district_id: string
  status: string
  last_serviced: string | null
  risk_score: number
  lat: number
  lng: number
}

interface ClimateSnapshot {
  district_id: string
  flood_risk_score: number
  rainfall_mm: number
  temperature_celsius: number
  humidity_percent: number
  wind_speed_kmh: number
  weather_condition: string
  recorded_at: string
}

interface Report {
  facility_id: string
  condition: string
  created_at: string
  notes: string
}

interface RiskAssessment {
  facility_id: string
  facility_name: string
  current_risk_score: number
  new_risk_score: number
  risk_factors: {
    climate_risk: number
    facility_condition: number
    maintenance_overdue: number
    recent_reports: number
    location_risk: number
  }
  recommended_status: string
  priority_level: 'low' | 'medium' | 'high' | 'critical'
  action_required: string[]
}

interface RiskConfig {
  climate_weight: number
  condition_weight: number
  maintenance_weight: number
  reports_weight: number
  location_weight: number
  critical_threshold: number
  high_threshold: number
  medium_threshold: number
  low_threshold: number
}

// Calculate days since last service
function daysSinceLastService(lastServiced: string | null): number {
  if (!lastServiced) return 365 // Assume 1 year if never serviced
  
  const lastServiceDate = new Date(lastServiced)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastServiceDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate maintenance overdue risk (0-30 points)
function calculateMaintenanceRisk(lastServiced: string | null, facilityType: string): number {
  const daysSince = daysSinceLastService(lastServiced)
  
  // Different maintenance intervals by facility type
  const maintenanceIntervals = {
    toilet: 30,           // Monthly
    latrine: 60,          // Bi-monthly
    septic_tank: 90,      // Quarterly
    treatment_plant: 14,  // Bi-weekly
    waste_collection_point: 7 // Weekly
  }
  
  const interval = maintenanceIntervals[facilityType as keyof typeof maintenanceIntervals] || 30
  
  if (daysSince <= interval) return 0
  if (daysSince <= interval * 2) return 10
  if (daysSince <= interval * 3) return 20
  return 30
}

// Calculate facility condition risk based on status (0-40 points)
function calculateConditionRisk(status: string): number {
  const statusRisk = {
    good: 0,
    damaged: 25,
    dry: 20,
    blocked: 30,
    overflow: 40,
    out_of_service: 40
  }
  
  return statusRisk[status as keyof typeof statusRisk] || 20
}

// Calculate recent reports risk (0-20 points)
function calculateReportsRisk(reports: Report[]): number {
  if (reports.length === 0) return 10 // No reports is also a risk
  
  // Get reports from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentReports = reports.filter(report => 
    new Date(report.created_at) > thirtyDaysAgo
  )
  
  if (recentReports.length === 0) return 15 // No recent reports
  
  // Calculate risk based on recent report conditions
  const badConditions = recentReports.filter(report => 
    ['damaged', 'overflow', 'blocked', 'out_of_service'].includes(report.condition)
  )
  
  const riskRatio = badConditions.length / recentReports.length
  
  if (riskRatio >= 0.8) return 20
  if (riskRatio >= 0.6) return 15
  if (riskRatio >= 0.4) return 10
  if (riskRatio >= 0.2) return 5
  return 0
}

// Calculate location-based risk (0-10 points)
function calculateLocationRisk(facilityType: string, climateData: ClimateSnapshot | null): number {
  if (!climateData) return 5 // Default risk if no climate data
  
  let locationRisk = 0
  
  // High-risk facility types in flood-prone areas
  if (['septic_tank', 'treatment_plant'].includes(facilityType)) {
    if (climateData.flood_risk_score > 70) locationRisk += 5
    else if (climateData.flood_risk_score > 50) locationRisk += 3
  }
  
  // All facilities at risk in extreme weather
  if (climateData.weather_condition === 'stormy') locationRisk += 3
  if (climateData.rainfall_mm > 50) locationRisk += 2
  
  return Math.min(locationRisk, 10)
}

// Determine recommended status based on risk score
function getRecommendedStatus(riskScore: number, config: RiskConfig): string {
  if (riskScore >= config.critical_threshold) return 'out_of_service'
  if (riskScore >= config.high_threshold) return 'overflow'
  if (riskScore >= config.medium_threshold) return 'damaged'
  if (riskScore >= config.low_threshold) return 'dry'
  return 'good'
}

// Determine priority level
function getPriorityLevel(riskScore: number, config: RiskConfig): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= config.critical_threshold) return 'critical'
  if (riskScore >= config.high_threshold) return 'high'
  if (riskScore >= config.medium_threshold) return 'medium'
  return 'low'
}

// Generate action recommendations
function getActionRecommendations(riskAssessment: RiskAssessment): string[] {
  const actions: string[] = []
  const { risk_factors, new_risk_score, facility_name } = riskAssessment
  
  if (risk_factors.climate_risk > 15) {
    actions.push('Monitor for flood damage and drainage issues')
  }
  
  if (risk_factors.maintenance_overdue > 20) {
    actions.push('Schedule immediate maintenance inspection')
  }
  
  if (risk_factors.facility_condition > 25) {
    actions.push('Repair facility damage and restore functionality')
  }
  
  if (risk_factors.recent_reports > 15) {
    actions.push('Investigate recurring issues reported by users')
  }
  
  if (new_risk_score >= 80) {
    actions.push('URGENT: Take facility out of service until repairs completed')
  } else if (new_risk_score >= 60) {
    actions.push('Prioritize this facility for immediate attention')
  }
  
  if (actions.length === 0) {
    actions.push('Continue regular monitoring and maintenance schedule')
  }
  
  return actions
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

    // Parse request body for optional facility filtering
    let facilityIds: string[] = []
    try {
      const body = await req.json()
      facilityIds = body.facility_ids || []
    } catch {
      // No body or invalid JSON, process all facilities
    }

    console.log(`🎯 Starting risk assessment for ${facilityIds.length > 0 ? facilityIds.length + ' specific facilities' : 'all facilities'}`)

    // Get all facilities (or filtered ones)
    let facilitiesQuery = supabase
      .from('facilities')
      .select('id, name, type, district_id, status, last_serviced, risk_score, lat, lng')

    if (facilityIds.length > 0) {
      facilitiesQuery = facilitiesQuery.in('id', facilityIds)
    }

    const { data: facilities, error: facilitiesError } = await facilitiesQuery

    if (facilitiesError) {
      console.error('❌ Error fetching facilities:', facilitiesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch facilities' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!facilities || facilities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No facilities found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get active risk scoring configuration, fallback to defaults
    const defaultConfig: RiskConfig = {
      climate_weight: 0.3,
      condition_weight: 1,
      maintenance_weight: 1,
      reports_weight: 1,
      location_weight: 1,
      critical_threshold: 80,
      high_threshold: 60,
      medium_threshold: 40,
      low_threshold: 20
    }

    const { data: riskConfigRow, error: riskConfigError } = await supabase
      .rpc('get_active_risk_scoring_config')
      .single()

    if (riskConfigError) {
      console.warn('⚠️ Could not fetch risk config, using defaults:', riskConfigError)
    }

    const riskConfig: RiskConfig = riskConfigRow
      ? {
          climate_weight: Number(riskConfigRow.climate_weight ?? defaultConfig.climate_weight),
          condition_weight: Number(riskConfigRow.condition_weight ?? defaultConfig.condition_weight),
          maintenance_weight: Number(riskConfigRow.maintenance_weight ?? defaultConfig.maintenance_weight),
          reports_weight: Number(riskConfigRow.reports_weight ?? defaultConfig.reports_weight),
          location_weight: Number(riskConfigRow.location_weight ?? defaultConfig.location_weight),
          critical_threshold: Number(riskConfigRow.critical_threshold ?? defaultConfig.critical_threshold),
          high_threshold: Number(riskConfigRow.high_threshold ?? defaultConfig.high_threshold),
          medium_threshold: Number(riskConfigRow.medium_threshold ?? defaultConfig.medium_threshold),
          low_threshold: Number(riskConfigRow.low_threshold ?? defaultConfig.low_threshold)
        }
      : defaultConfig

    // Get latest climate data for all districts
    const { data: climateData, error: climateError } = await supabase
      .rpc('get_latest_climate_data')

    if (climateError) {
      console.warn('⚠️ Could not fetch climate data:', climateError)
    }

    // Get recent reports for all facilities
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('facility_id, condition, created_at, notes')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days

    if (reportsError) {
      console.warn('⚠️ Could not fetch reports:', reportsError)
    }

    // Create climate data lookup
    const climateByDistrict = new Map<string, ClimateSnapshot>()
    if (climateData) {
      climateData.forEach((climate: any) => {
        climateByDistrict.set(climate.district_id, climate)
      })
    }

    // Create reports lookup
    const reportsByFacility = new Map<string, Report[]>()
    if (reports) {
      reports.forEach((report: any) => {
        if (!reportsByFacility.has(report.facility_id)) {
          reportsByFacility.set(report.facility_id, [])
        }
        reportsByFacility.get(report.facility_id)!.push(report)
      })
    }

    const riskAssessments: RiskAssessment[] = []
    const facilityUpdates: { id: string; risk_score: number; status: string }[] = []

    // Process each facility
    for (const facility of facilities as Facility[]) {
      console.log(`📊 Assessing risk for ${facility.name}...`)
      
      const facilityReports = reportsByFacility.get(facility.id) || []
      const climateSnapshot = climateByDistrict.get(facility.district_id)

      // Calculate individual risk factors
      const climateRisk = (climateSnapshot ? Math.min(climateSnapshot.flood_risk_score * 0.3, 30) : 15) * riskConfig.climate_weight
      const conditionRisk = calculateConditionRisk(facility.status) * riskConfig.condition_weight
      const maintenanceRisk = calculateMaintenanceRisk(facility.last_serviced, facility.type) * riskConfig.maintenance_weight
      const reportsRisk = calculateReportsRisk(facilityReports) * riskConfig.reports_weight
      const locationRisk = calculateLocationRisk(facility.type, climateSnapshot) * riskConfig.location_weight

      // Calculate total risk score (0-100)
      const totalRiskScore = Math.min(
        Math.round(climateRisk + conditionRisk + maintenanceRisk + reportsRisk + locationRisk),
        100
      )

      const recommendedStatus = getRecommendedStatus(totalRiskScore, riskConfig)
      const priorityLevel = getPriorityLevel(totalRiskScore, riskConfig)

      const riskAssessment: RiskAssessment = {
        facility_id: facility.id,
        facility_name: facility.name,
        current_risk_score: facility.risk_score,
        new_risk_score: totalRiskScore,
        risk_factors: {
          climate_risk: Math.round(climateRisk),
          facility_condition: conditionRisk,
          maintenance_overdue: maintenanceRisk,
          recent_reports: reportsRisk,
          location_risk: locationRisk
        },
        recommended_status: recommendedStatus,
        priority_level: priorityLevel,
        action_required: []
      }

      riskAssessment.action_required = getActionRecommendations(riskAssessment)
      riskAssessments.push(riskAssessment)

      // Prepare facility update if risk score changed significantly or status needs updating
      const riskScoreChanged = Math.abs(totalRiskScore - facility.risk_score) >= 5
      const statusNeedsUpdate = recommendedStatus !== facility.status && totalRiskScore >= 60

      if (riskScoreChanged || statusNeedsUpdate) {
        facilityUpdates.push({
          id: facility.id,
          risk_score: totalRiskScore,
          status: statusNeedsUpdate ? recommendedStatus : facility.status
        })
      }
    }

    // Update facilities in batch
    let updateResults = null
    if (facilityUpdates.length > 0) {
      console.log(`📝 Updating ${facilityUpdates.length} facilities...`)
      
      // Update each facility individually to handle the status change properly
      const updatePromises = facilityUpdates.map(update => 
        supabase
          .from('facilities')
          .update({ 
            risk_score: update.risk_score, 
            status: update.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .select()
      )

      const updateResponses = await Promise.all(updatePromises)
      const updateErrors = updateResponses.filter(response => response.error)
      
      if (updateErrors.length > 0) {
        console.error('❌ Some facility updates failed:', updateErrors)
      } else {
        console.log('✅ All facility updates successful')
      }

      updateResults = {
        updated_count: facilityUpdates.length,
        errors: updateErrors.length
      }
    }

    // Generate summary statistics
    const summary = {
      total_facilities: facilities.length,
      facilities_updated: facilityUpdates.length,
      risk_distribution: {
        critical: riskAssessments.filter(r => r.priority_level === 'critical').length,
        high: riskAssessments.filter(r => r.priority_level === 'high').length,
        medium: riskAssessments.filter(r => r.priority_level === 'medium').length,
        low: riskAssessments.filter(r => r.priority_level === 'low').length
      },
      average_risk_score: Math.round(
        riskAssessments.reduce((sum, r) => sum + r.new_risk_score, 0) / riskAssessments.length
      ),
      facilities_needing_attention: riskAssessments.filter(r => r.new_risk_score >= 60).length
    }

    console.log(`✅ Risk assessment completed for ${facilities.length} facilities`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Risk assessment completed for ${facilities.length} facilities`,
        summary,
        assessments: riskAssessments,
        updates: updateResults,
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