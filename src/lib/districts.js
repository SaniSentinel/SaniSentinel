import { db } from './supabase'

// Districts API functions
export const districts = {
  // Get all districts
  getAll: async () => {
    return await db.select('districts', '*')
  },

  // Get districts by region
  getByRegion: async (region) => {
    return await db.select('districts', '*', { region })
  },

  // Get district by ID
  getById: async (id) => {
    const result = await db.select('districts', '*', { id })
    return {
      data: result.data?.[0] || null,
      error: result.error
    }
  },

  // Get district by name
  getByName: async (name) => {
    const result = await db.select('districts', '*', { name })
    return {
      data: result.data?.[0] || null,
      error: result.error
    }
  },

  // Search districts by name (partial match)
  search: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get districts within a radius (in kilometers) from a point
  getNearby: async (lat, lng, radiusKm = 50) => {
    try {
      // Using Haversine formula to calculate distance
      const { data, error } = await supabase.rpc('get_districts_within_radius', {
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

  // Create new district
  create: async (districtData) => {
    const { name, region, lat, lng } = districtData
    
    // Validate required fields
    if (!name || !region || lat === undefined || lng === undefined) {
      return { 
        data: null, 
        error: 'Missing required fields: name, region, lat, lng' 
      }
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { 
        data: null, 
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' 
      }
    }

    return await db.insert('districts', {
      name: name.trim(),
      region: region.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    })
  },

  // Update district
  update: async (id, updates) => {
    // Validate coordinates if provided
    if (updates.lat !== undefined && (updates.lat < -90 || updates.lat > 90)) {
      return { 
        data: null, 
        error: 'Invalid latitude. Must be between -90 and 90' 
      }
    }
    
    if (updates.lng !== undefined && (updates.lng < -180 || updates.lng > 180)) {
      return { 
        data: null, 
        error: 'Invalid longitude. Must be between -180 and 180' 
      }
    }

    // Clean up string fields
    const cleanUpdates = { ...updates }
    if (cleanUpdates.name) cleanUpdates.name = cleanUpdates.name.trim()
    if (cleanUpdates.region) cleanUpdates.region = cleanUpdates.region.trim()
    if (cleanUpdates.lat) cleanUpdates.lat = parseFloat(cleanUpdates.lat)
    if (cleanUpdates.lng) cleanUpdates.lng = parseFloat(cleanUpdates.lng)

    return await db.update('districts', cleanUpdates, { id })
  },

  // Delete district
  delete: async (id) => {
    return await db.delete('districts', { id })
  },

  // Get unique regions
  getRegions: async () => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('region')
        .order('region')
      
      if (error) throw error
      
      // Extract unique regions
      const uniqueRegions = [...new Set(data.map(item => item.region))]
      return { data: uniqueRegions, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get districts count by region
  getRegionStats: async () => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('region')
      
      if (error) throw error
      
      // Count districts per region
      const stats = data.reduce((acc, district) => {
        acc[district.region] = (acc[district.region] || 0) + 1
        return acc
      }, {})
      
      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

// Utility functions for working with district coordinates
export const districtUtils = {
  // Calculate distance between two points using Haversine formula
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  // Find closest district to given coordinates
  findClosest: async (lat, lng) => {
    const { data: allDistricts, error } = await districts.getAll()
    if (error || !allDistricts) return { data: null, error }

    let closest = null
    let minDistance = Infinity

    allDistricts.forEach(district => {
      const distance = districtUtils.calculateDistance(
        lat, lng, district.lat, district.lng
      )
      if (distance < minDistance) {
        minDistance = distance
        closest = { ...district, distance }
      }
    })

    return { data: closest, error: null }
  },

  // Validate coordinates
  isValidCoordinate: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  },

  // Format coordinates for display
  formatCoordinates: (lat, lng, precision = 4) => {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
  }
}