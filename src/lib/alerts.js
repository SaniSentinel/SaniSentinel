import { supabase } from './supabase'

// Alerts API functions
export const alerts = {
  // Get all alerts with facility and district information
  getAll: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Get active (unresolved) alerts
  getActive: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
            district:districts(id, name, region)
          )
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get alerts by facility
  getByFacility: async (facilityId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Get alerts by type
  getByType: async (alertType, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
            district:districts(id, name, region)
          )
        `)
        .eq('alert_type', alertType)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get alerts by severity
  getBySeverity: async (severity, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
            district:districts(id, name, region)
          )
        `)
        .eq('severity', severity)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get critical alerts (severity = critical)
  getCritical: async (limit = 50) => {
    return await alerts.getBySeverity('critical', limit)
  },

  // Get high priority alerts (severity = high or critical)
  getHighPriority: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
            district:districts(id, name, region)
          )
        `)
        .in('severity', ['high', 'critical'])
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get recent alerts (last 24 hours by default)
  getRecent: async (hoursBack = 24, limit = 50) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack)
      
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Get alerts within date range
  getByDateRange: async (startDate, endDate, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Get alert by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Create new alert
  create: async (alertData) => {
    const { facility_id, alert_type, severity, message } = alertData
    
    // Validate required fields
    if (!facility_id || !alert_type || !severity || !message) {
      return { 
        data: null, 
        error: 'Missing required fields: facility_id, alert_type, severity, message' 
      }
    }

    // Validate alert type
    const validTypes = ['maintenance_due', 'high_risk', 'critical_status', 'overflow_detected', 'system_failure', 'climate_warning']
    if (!validTypes.includes(alert_type)) {
      return { 
        data: null, 
        error: `Invalid alert type. Must be one of: ${validTypes.join(', ')}` 
      }
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return { 
        data: null, 
        error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` 
      }
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          facility_id,
          alert_type,
          severity,
          message,
          resolved: false
        }])
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Resolve alert (mark as resolved)
  resolve: async (id) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ resolved: true })
        .eq('id', id)
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Resolve multiple alerts
  resolveMultiple: async (alertIds) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ resolved: true })
        .in('id', alertIds)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Reopen alert (mark as unresolved)
  reopen: async (id) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ resolved: false })
        .eq('id', id)
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            risk_score,
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

  // Delete alert
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
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

  // Get alert statistics
  getStats: async (daysBack = 30) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('alerts')
        .select('alert_type, severity, resolved, created_at')
        .gte('created_at', cutoffDate.toISOString())
      
      if (error) throw error

      const stats = {
        total: data.length,
        active: 0,
        resolved: 0,
        byType: {},
        bySeverity: {},
        byDay: {},
        resolutionRate: 0
      }

      data.forEach(alert => {
        // Count active vs resolved
        if (alert.resolved) {
          stats.resolved++
        } else {
          stats.active++
        }
        
        // Count by type
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1
        
        // Count by severity
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1
        
        // Count by day
        const day = alert.created_at.split('T')[0]
        stats.byDay[day] = (stats.byDay[day] || 0) + 1
      })

      stats.resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get alert summary for dashboard
  getSummary: async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('severity, resolved')
        .eq('resolved', false)
      
      if (error) throw error

      const summary = {
        total: data.length,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }

      data.forEach(alert => {
        summary[alert.severity]++
      })

      return { data: summary, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Subscribe to real-time alert updates
  subscribeToAlerts: (callback) => {
    const subscription = supabase
      .channel('alerts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'alerts' 
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
  getAll: getAllAlerts,
  getActive: getActiveAlerts,
  getByFacility: getAlertsByFacility,
  getByType: getAlertsByType,
  getBySeverity: getAlertsBySeverity,
  getCritical: getCriticalAlerts,
  getHighPriority: getHighPriorityAlerts,
  getRecent: getRecentAlerts,
  getById: getAlertById,
  create: createAlert,
  resolve: resolveAlert,
  resolveMultiple: resolveMultipleAlerts,
  reopen: reopenAlert,
  delete: deleteAlert,
  getStats: getAlertStats,
  getSummary: getAlertSummary,
  subscribeToAlerts,
  unsubscribe: unsubscribeFromAlerts
} = alerts