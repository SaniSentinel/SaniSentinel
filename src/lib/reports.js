import { supabase } from './supabase'

// Reports API functions
export const reports = {
  // Get all reports with facility and district information
  getAll: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get reports by facility
  getByFacility: async (facilityId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get reports by reporter (phone number or user)
  getByReporter: async (reportedBy, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .eq('reported_by', reportedBy)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get reports by condition
  getByCondition: async (condition, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .eq('condition', condition)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get reports within date range
  getByDateRange: async (startDate, endDate, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get recent reports (last 24 hours by default)
  getRecent: async (hoursBack = 24, limit = 50) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack)
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get problem reports (non-good conditions)
  getProblemReports: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .neq('condition', 'good')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get report by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Create new report
  create: async (reportData) => {
    const { facility_id, reported_by, condition, notes } = reportData
    
    // Validate required fields
    if (!facility_id || !reported_by || !condition) {
      return { 
        data: null, 
        error: 'Missing required fields: facility_id, reported_by, condition' 
      }
    }

    // Validate condition
    const validConditions = ['good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service']
    if (!validConditions.includes(condition)) {
      return { 
        data: null, 
        error: `Invalid condition. Must be one of: ${validConditions.join(', ')}` 
      }
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          facility_id,
          reported_by,
          condition,
          notes: notes || null
        }])
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Create report from SMS (simplified format)
  createFromSMS: async (phoneNumber, facilityId, condition, notes = null) => {
    return await reports.create({
      facility_id: facilityId,
      reported_by: phoneNumber,
      condition: condition.toLowerCase(),
      notes
    })
  },

  // Update report (limited - mainly for notes)
  update: async (id, updates) => {
    try {
      // Only allow updating notes (condition changes should create new reports)
      const allowedUpdates = {}
      if (updates.notes !== undefined) {
        allowedUpdates.notes = updates.notes
      }

      if (Object.keys(allowedUpdates).length === 0) {
        return { data: null, error: 'No valid fields to update' }
      }

      const { data, error } = await supabase
        .from('reports')
        .update(allowedUpdates)
        .eq('id', id)
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Delete report
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reports')
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

  // Get reporting statistics
  getStats: async (daysBack = 30) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('reports')
        .select('condition, created_at, reported_by')
        .gte('created_at', cutoffDate.toISOString())
      
      if (error) throw error

      const stats = {
        total: data.length,
        byCondition: {},
        byDay: {},
        uniqueReporters: new Set(),
        averagePerDay: 0
      }

      data.forEach(report => {
        // Count by condition
        stats.byCondition[report.condition] = (stats.byCondition[report.condition] || 0) + 1
        
        // Count by day
        const day = report.created_at.split('T')[0]
        stats.byDay[day] = (stats.byDay[day] || 0) + 1
        
        // Track unique reporters
        stats.uniqueReporters.add(report.reported_by)
      })

      stats.uniqueReporters = stats.uniqueReporters.size
      stats.averagePerDay = Math.round(stats.total / daysBack * 10) / 10

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facility report history (for trend analysis)
  getFacilityHistory: async (facilityId, daysBack = 90) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('reports')
        .select('condition, created_at, reported_by, notes')
        .eq('facility_id', facilityId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get reports that need follow-up (problem reports older than X hours)
  getNeedingFollowup: async (hoursOld = 24) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hoursOld)
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          )
        `)
        .neq('condition', 'good')
        .lte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Subscribe to real-time report updates
  subscribeToReports: (callback) => {
    const subscription = supabase
      .channel('reports_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reports' 
        }, 
        callback
      )
      .subscribe()

    return subscription
  },

  // Unsubscribe from real-time updates
  unsubscribe: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}

// Export individual functions for convenience
export const {
  getAll: getAllReports,
  getByFacility: getReportsByFacility,
  getByReporter: getReportsByReporter,
  getByCondition: getReportsByCondition,
  getRecent: getRecentReports,
  getProblemReports,
  getById: getReportById,
  create: createReport,
  createFromSMS: createReportFromSMS,
  update: updateReport,
  delete: deleteReport,
  getStats: getReportStats,
  subscribeToReports,
  unsubscribe: unsubscribeFromReports
} = reports