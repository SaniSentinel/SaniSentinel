import { supabase } from './supabase'

// Workers API functions
export const workers = {
  // Get all workers with district information
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
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

  // Get active workers only
  getActive: async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get workers by district
  getByDistrict: async (districtId) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('district_id', districtId)
        .eq('active', true)
        .order('role', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get workers by role
  getByRole: async (role) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('role', role)
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get field workers (most common role)
  getFieldWorkers: async () => {
    return await workers.getByRole('field_worker')
  },

  // Get supervisors
  getSupervisors: async () => {
    return await workers.getByRole('supervisor')
  },

  // Get maintenance technicians
  getMaintenanceTechs: async () => {
    return await workers.getByRole('maintenance_tech')
  },

  // Get health officers
  getHealthOfficers: async () => {
    return await workers.getByRole('health_officer')
  },

  // Get district coordinators
  getDistrictCoordinators: async () => {
    return await workers.getByRole('district_coordinator')
  },

  // Get worker by phone number (for SMS processing)
  getByPhone: async (phoneNumber) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('phone', phoneNumber)
        .eq('active', true)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get worker by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('workers')
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

  // Search workers by name
  search: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .ilike('name', `%${searchTerm}%`)
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Create new worker
  create: async (workerData) => {
    const { name, phone, district_id, role } = workerData
    
    // Validate required fields
    if (!name || !phone || !district_id || !role) {
      return { 
        data: null, 
        error: 'Missing required fields: name, phone, district_id, role' 
      }
    }

    // Validate phone number format (basic validation)
    if (!phone.match(/^\+233\d{9}$/)) {
      return { 
        data: null, 
        error: 'Invalid phone number format. Must be +233XXXXXXXXX' 
      }
    }

    // Validate role
    const validRoles = ['field_worker', 'supervisor', 'maintenance_tech', 'health_officer', 'district_coordinator']
    if (!validRoles.includes(role)) {
      return { 
        data: null, 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      }
    }

    try {
      const { data, error } = await supabase
        .from('workers')
        .insert([{
          name: name.trim(),
          phone: phone.trim(),
          district_id,
          role,
          active: true
        }])
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      // Handle unique constraint violation for phone number
      if (error.code === '23505' && error.message.includes('phone')) {
        return { data: null, error: 'Phone number already exists' }
      }
      return { data: null, error: error.message }
    }
  },

  // Update worker
  update: async (id, updates) => {
    try {
      // Validate phone number format if provided
      if (updates.phone && !updates.phone.match(/^\+233\d{9}$/)) {
        return { 
          data: null, 
          error: 'Invalid phone number format. Must be +233XXXXXXXXX' 
        }
      }

      // Validate role if provided
      if (updates.role) {
        const validRoles = ['field_worker', 'supervisor', 'maintenance_tech', 'health_officer', 'district_coordinator']
        if (!validRoles.includes(updates.role)) {
          return { 
            data: null, 
            error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
          }
        }
      }

      // Clean up string fields
      if (updates.name) updates.name = updates.name.trim()
      if (updates.phone) updates.phone = updates.phone.trim()

      const { data, error } = await supabase
        .from('workers')
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
      // Handle unique constraint violation for phone number
      if (error.code === '23505' && error.message.includes('phone')) {
        return { data: null, error: 'Phone number already exists' }
      }
      return { data: null, error: error.message }
    }
  },

  // Deactivate worker (soft delete)
  deactivate: async (id) => {
    return await workers.update(id, { active: false })
  },

  // Reactivate worker
  reactivate: async (id) => {
    return await workers.update(id, { active: true })
  },

  // Delete worker (hard delete)
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('workers')
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

  // Get worker statistics
  getStats: async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('role, active, district_id')
      
      if (error) throw error

      const stats = {
        total: data.length,
        active: 0,
        inactive: 0,
        byRole: {},
        byDistrict: {}
      }

      data.forEach(worker => {
        // Count active vs inactive
        if (worker.active) {
          stats.active++
        } else {
          stats.inactive++
        }
        
        // Count by role
        stats.byRole[worker.role] = (stats.byRole[worker.role] || 0) + 1
        
        // Count by district
        stats.byDistrict[worker.district_id] = (stats.byDistrict[worker.district_id] || 0) + 1
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get workers with their recent activity (reports submitted)
  getWithActivity: async (daysBack = 30) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region),
          reports:reports!reported_by(id, created_at, condition)
        `)
        .eq('active', true)
        .order('name')
      
      if (error) throw error

      // Process the data to add activity metrics
      const workersWithActivity = data.map(worker => {
        const recentReports = worker.reports?.filter(report => 
          new Date(report.created_at) >= cutoffDate
        ) || []
        
        return {
          ...worker,
          recentReports: recentReports.length,
          lastReportDate: recentReports.length > 0 
            ? Math.max(...recentReports.map(r => new Date(r.created_at)))
            : null
        }
      })

      return { data: workersWithActivity, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get workers who haven't reported recently (inactive workers)
  getInactive: async (daysBack = 7) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data: allWorkers } = await workers.getWithActivity(daysBack)
      
      if (!allWorkers) return { data: null, error: 'Failed to get worker activity' }
      
      const inactiveWorkers = allWorkers.filter(worker => 
        worker.recentReports === 0
      )

      return { data: inactiveWorkers, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Validate worker phone number for SMS
  validatePhone: (phoneNumber) => {
    // Remove any spaces or special characters except +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
    
    // Check if it matches Ghana phone number format
    if (cleanPhone.match(/^\+233\d{9}$/)) {
      return { valid: true, phone: cleanPhone }
    }
    
    // Try to format if it's missing country code
    if (cleanPhone.match(/^0\d{9}$/)) {
      const formatted = '+233' + cleanPhone.substring(1)
      return { valid: true, phone: formatted }
    }
    
    return { valid: false, phone: null, error: 'Invalid phone number format' }
  },

  // Get workers for SMS notifications (by district or role)
  getForNotification: async (filters = {}) => {
    try {
      let query = supabase
        .from('workers')
        .select(`
          *,
          district:districts(id, name, region)
        `)
        .eq('active', true)

      if (filters.district_id) {
        query = query.eq('district_id', filters.district_id)
      }

      if (filters.role) {
        query = query.eq('role', filters.role)
      }

      if (filters.roles && Array.isArray(filters.roles)) {
        query = query.in('role', filters.roles)
      }

      const { data, error } = await query.order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

// Export individual functions for convenience
export const {
  getAll: getAllWorkers,
  getActive: getActiveWorkers,
  getByDistrict: getWorkersByDistrict,
  getByRole: getWorkersByRole,
  getFieldWorkers,
  getSupervisors,
  getMaintenanceTechs,
  getHealthOfficers,
  getDistrictCoordinators,
  getByPhone: getWorkerByPhone,
  getById: getWorkerById,
  search: searchWorkers,
  create: createWorker,
  update: updateWorker,
  deactivate: deactivateWorker,
  reactivate: reactivateWorker,
  delete: deleteWorker,
  getStats: getWorkerStats,
  validatePhone: validateWorkerPhone
} = workers