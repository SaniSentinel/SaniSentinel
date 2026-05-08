import { supabase } from './supabase'

// Facilities API functions
export const facilities = {
  // Get all facilities with district information
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities by district
  getByDistrict: async (districtId) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('district_id', districtId)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities by type
  getByType: async (type) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('type', type)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities by status
  getByStatus: async (status) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('status', status)
        .order('risk_score', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities by risk level
  getByRiskLevel: async (minRisk = 0, maxRisk = 100) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .gte('risk_score', minRisk)
        .lte('risk_score', maxRisk)
        .order('risk_score', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get high-risk facilities (risk_score >= 60)
  getHighRisk: async () => {
    return await facilities.getByRiskLevel(60, 100)
  },

  // Get critical facilities (risk_score >= 85)
  getCritical: async () => {
    return await facilities.getByRiskLevel(85, 100)
  },

  // Get facility by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Search facilities by name
  search: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities within radius of a point
  getNearby: async (lat, lng, radiusKm = 10) => {
    try {
      // Using Haversine formula to calculate distance
      const { data, error } = await supabase.rpc('get_facilities_within_radius', {
        center_lat: lat,
        center_lng: lng,
        radius_km: radiusKm
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Create new facility
  create: async (facilityData) => {
    const { name, type, district_id, lat, lng, last_serviced, status = 'good' } = facilityData
    
    // Validate required fields
    if (!name || !type || !district_id || lat === undefined || lng === undefined) {
      return { 
        data: null, 
        error: 'Missing required fields: name, type, district_id, lat, lng' 
      }
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { 
        data: null, 
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' 
      }
    }

    // Validate facility type
    const validTypes = ['toilet', 'latrine', 'septic_tank', 'treatment_plant', 'waste_collection_point']
    if (!validTypes.includes(type)) {
      return { 
        data: null, 
        error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` 
      }
    }

    // Validate status
    const validStatuses = ['good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service']
    if (!validStatuses.includes(status)) {
      return { 
        data: null, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }
    }

    try {
      const { data, error } = await supabase
        .from('facilities')
        .insert([{
          name,
          type,
          district_id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          last_serviced,
          status
        }])
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Update facility
  update: async (id, updates) => {
    try {
      // Validate coordinates if provided
      if (updates.lat !== undefined && (updates.lat < -90 || updates.lat > 90)) {
        return { data: null, error: 'Invalid latitude. Must be between -90 and 90' }
      }
      if (updates.lng !== undefined && (updates.lng < -180 || updates.lng > 180)) {
        return { data: null, error: 'Invalid longitude. Must be between -180 and 180' }
      }

      // Validate facility type if provided
      if (updates.type) {
        const validTypes = ['toilet', 'latrine', 'septic_tank', 'treatment_plant', 'waste_collection_point']
        if (!validTypes.includes(updates.type)) {
          return { 
            data: null, 
            error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` 
          }
        }
      }

      // Validate status if provided
      if (updates.status) {
        const validStatuses = ['good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service']
        if (!validStatuses.includes(updates.status)) {
          return { 
            data: null, 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          }
        }
      }

      const { data, error } = await supabase
        .from('facilities')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Update facility status (common operation)
  updateStatus: async (id, status, lastServiced = null) => {
    const updates = { status }
    if (lastServiced) {
      updates.last_serviced = lastServiced
    }
    return await facilities.update(id, updates)
  },

  // Update risk score
  updateRiskScore: async (id, riskScore) => {
    if (riskScore < 0 || riskScore > 100) {
      return { data: null, error: 'Risk score must be between 0 and 100' }
    }
    return await facilities.update(id, { risk_score: riskScore })
  },

  // Delete facility
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facility statistics
  getStats: async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('status, type, risk_score')
      
      if (error) throw error

      const stats = {
        total: data.length,
        byStatus: {},
        byType: {},
        byRiskLevel: {
          good: 0,      // 0-29
          at_risk: 0,   // 30-59
          high_risk: 0, // 60-84
          critical: 0   // 85-100
        },
        averageRiskScore: 0
      }

      let totalRiskScore = 0

      data.forEach(facility => {
        // Count by status
        stats.byStatus[facility.status] = (stats.byStatus[facility.status] || 0) + 1
        
        // Count by type
        stats.byType[facility.type] = (stats.byType[facility.type] || 0) + 1
        
        // Count by risk level
        const risk = facility.risk_score || 0
        totalRiskScore += risk
        
        if (risk <= 29) stats.byRiskLevel.good++
        else if (risk <= 59) stats.byRiskLevel.at_risk++
        else if (risk <= 84) stats.byRiskLevel.high_risk++
        else stats.byRiskLevel.critical++
      })

      stats.averageRiskScore = data.length > 0 ? Math.round(totalRiskScore / data.length) : 0

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facilities that need servicing (based on last_serviced date)
  getNeedingService: async (daysSinceService = 90) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysSinceService)
      
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .or(`last_serviced.is.null,last_serviced.lt.${cutoffDate.toISOString().split('T')[0]}`)
        .order('last_serviced', { ascending: true, nullsFirst: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

// Export individual functions for convenience
export const {
  getAll: getAllFacilities,
  getByDistrict: getFacilitiesByDistrict,
  getByType: getFacilitiesByType,
  getByStatus: getFacilitiesByStatus,
  getHighRisk: getHighRiskFacilities,
  getCritical: getCriticalFacilities,
  getById: getFacilityById,
  search: searchFacilities,
  create: createFacility,
  update: updateFacility,
  updateStatus: updateFacilityStatus,
  delete: deleteFacility,
  getStats: getFacilityStats
} = facilities