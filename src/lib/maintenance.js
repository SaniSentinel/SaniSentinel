import { supabase } from './supabase'

// Maintenance Tasks API functions
export const maintenance = {
  // Get all maintenance tasks with facility, worker, and district information
  getAll: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
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

  // Get tasks by status
  getByStatus: async (status, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .eq('status', status)
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get pending tasks
  getPending: async (limit = 50) => {
    return await maintenance.getByStatus('pending', limit)
  },

  // Get assigned tasks
  getAssigned: async (limit = 50) => {
    return await maintenance.getByStatus('assigned', limit)
  },

  // Get in-progress tasks
  getInProgress: async (limit = 50) => {
    return await maintenance.getByStatus('in_progress', limit)
  },

  // Get completed tasks
  getCompleted: async (limit = 100) => {
    return await maintenance.getByStatus('completed', limit)
  },

  // Get tasks by priority
  getByPriority: async (priority, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .eq('priority', priority)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get urgent tasks
  getUrgent: async (limit = 50) => {
    return await maintenance.getByPriority('urgent', limit)
  },

  // Get high priority tasks
  getHighPriority: async (limit = 50) => {
    return await maintenance.getByPriority('high', limit)
  },

  // Get tasks by facility
  getByFacility: async (facilityId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
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

  // Get tasks assigned to a worker
  getByWorker: async (workerId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .eq('assigned_to', workerId)
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get overdue tasks
  getOverdue: async (limit = 50) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .lt('due_date', today)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get tasks due soon (within specified days)
  getDueSoon: async (daysAhead = 7, limit = 50) => {
    try {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + daysAhead)
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get tasks by type
  getByType: async (taskType, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .eq('task_type', taskType)
        .order('due_date', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get task by ID
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
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

  // Create new maintenance task
  create: async (taskData) => {
    const { facility_id, assigned_to, priority = 'medium', task_type, description, due_date } = taskData
    
    // Validate required fields
    if (!facility_id || !task_type || !due_date) {
      return { 
        data: null, 
        error: 'Missing required fields: facility_id, task_type, due_date' 
      }
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      return { 
        data: null, 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      }
    }

    // Validate task type
    const validTypes = ['routine_cleaning', 'emptying', 'repair', 'inspection', 'emergency_response', 'preventive_maintenance']
    if (!validTypes.includes(task_type)) {
      return { 
        data: null, 
        error: `Invalid task type. Must be one of: ${validTypes.join(', ')}` 
      }
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert([{
          facility_id,
          assigned_to: assigned_to || null,
          status: assigned_to ? 'assigned' : 'pending',
          priority,
          task_type,
          description: description || null,
          due_date
        }])
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Update maintenance task
  update: async (id, updates) => {
    try {
      // Validate priority if provided
      if (updates.priority) {
        const validPriorities = ['low', 'medium', 'high', 'urgent']
        if (!validPriorities.includes(updates.priority)) {
          return { 
            data: null, 
            error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
          }
        }
      }

      // Validate status if provided
      if (updates.status) {
        const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
        if (!validStatuses.includes(updates.status)) {
          return { 
            data: null, 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          }
        }
      }

      // Validate task type if provided
      if (updates.task_type) {
        const validTypes = ['routine_cleaning', 'emptying', 'repair', 'inspection', 'emergency_response', 'preventive_maintenance']
        if (!validTypes.includes(updates.task_type)) {
          return { 
            data: null, 
            error: `Invalid task type. Must be one of: ${validTypes.join(', ')}` 
          }
        }
      }

      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          facility:facilities(
            id,
            name,
            type,
            status,
            district:districts(id, name, region)
          ),
          worker:workers(
            id,
            name,
            phone,
            role
          )
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Assign task to worker
  assign: async (taskId, workerId) => {
    return await maintenance.update(taskId, { 
      assigned_to: workerId, 
      status: 'assigned' 
    })
  },

  // Start task (mark as in progress)
  start: async (taskId) => {
    try {
      // Read current state first so we only notify on an actual transition.
      const { data: beforeTask, error: beforeError } = await supabase
        .from('maintenance_tasks')
        .select('id, status, assigned_to')
        .eq('id', taskId)
        .single()

      if (beforeError) throw beforeError
      if (!beforeTask) return { data: null, error: 'Task not found' }

      const updateResult = await maintenance.update(taskId, { status: 'in_progress' })
      if (updateResult.error) return updateResult

      const shouldNotify =
        beforeTask.status !== 'in_progress' && !!beforeTask.assigned_to

      if (shouldNotify) {
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke(
          'notify-task-started',
          {
            body: { task_id: taskId },
          },
        )

        if (notifyError) {
          return {
            data: updateResult.data,
            error: `Task started, but notification failed: ${notifyError.message}`,
          }
        }

        if (!notifyData?.success) {
          const emailErr = notifyData?.email?.error ? ` Email: ${notifyData.email.error}.` : ''
          const smsErr = notifyData?.sms?.error ? ` SMS: ${notifyData.sms.error}.` : ''
          return {
            data: updateResult.data,
            error:
              `Task started, but notification failed.` +
              `${emailErr}${smsErr}`.trim(),
          }
        }
      }

      return updateResult
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Complete task
  complete: async (taskId) => {
    return await maintenance.update(taskId, { status: 'completed' })
  },

  // Cancel task
  cancel: async (taskId) => {
    return await maintenance.update(taskId, { status: 'cancelled' })
  },

  // Delete task
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
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

  // Get maintenance statistics
  getStats: async (daysBack = 30) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('status, priority, task_type, due_date, completed_at, created_at')
        .gte('created_at', cutoffDate.toISOString())
      
      if (error) throw error

      const today = new Date().toISOString().split('T')[0]
      
      const stats = {
        total: data.length,
        byStatus: {},
        byPriority: {},
        byType: {},
        overdue: 0,
        dueSoon: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }

      let completedTasks = 0
      let totalCompletionTime = 0

      data.forEach(task => {
        // Count by status
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1
        
        // Count by priority
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1
        
        // Count by type
        stats.byType[task.task_type] = (stats.byType[task.task_type] || 0) + 1
        
        // Count overdue tasks
        if (task.due_date < today && task.status !== 'completed' && task.status !== 'cancelled') {
          stats.overdue++
        }
        
        // Count tasks due soon (next 7 days)
        const dueDate = new Date(task.due_date)
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        if (dueDate >= new Date() && dueDate <= weekFromNow && task.status !== 'completed') {
          stats.dueSoon++
        }
        
        // Calculate completion metrics
        if (task.status === 'completed' && task.completed_at) {
          completedTasks++
          const created = new Date(task.created_at)
          const completed = new Date(task.completed_at)
          totalCompletionTime += (completed - created) / (1000 * 60 * 60 * 24) // days
        }
      })

      stats.completionRate = stats.total > 0 ? Math.round((completedTasks / stats.total) * 100) : 0
      stats.averageCompletionTime = completedTasks > 0 ? Math.round((totalCompletionTime / completedTasks) * 10) / 10 : 0

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get dashboard summary
  getSummary: async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('status, priority, due_date')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
      
      if (error) throw error

      const today = new Date().toISOString().split('T')[0]
      
      const summary = {
        total: data.length,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        urgent: 0,
        overdue: 0
      }

      data.forEach(task => {
        // Count by status
        if (task.status === 'pending') summary.pending++
        if (task.status === 'assigned') summary.assigned++
        if (task.status === 'in_progress') summary.inProgress++
        
        // Count urgent tasks
        if (task.priority === 'urgent') summary.urgent++
        
        // Count overdue tasks
        if (task.due_date < today) summary.overdue++
      })

      return { data: summary, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Subscribe to real-time maintenance task updates
  subscribeToTasks: (callback) => {
    const subscription = supabase
      .channel('maintenance_tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_tasks' 
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
  getAll: getAllMaintenanceTasks,
  getByStatus: getMaintenanceTasksByStatus,
  getPending: getPendingTasks,
  getAssigned: getAssignedTasks,
  getInProgress: getInProgressTasks,
  getCompleted: getCompletedTasks,
  getByPriority: getTasksByPriority,
  getUrgent: getUrgentTasks,
  getHighPriority: getHighPriorityTasks,
  getByFacility: getTasksByFacility,
  getByWorker: getTasksByWorker,
  getOverdue: getOverdueTasks,
  getDueSoon: getTasksDueSoon,
  getByType: getTasksByType,
  getById: getTaskById,
  create: createMaintenanceTask,
  update: updateMaintenanceTask,
  assign: assignTask,
  start: startTask,
  complete: completeTask,
  cancel: cancelTask,
  delete: deleteMaintenanceTask,
  getStats: getMaintenanceStats,
  getSummary: getMaintenanceSummary,
  subscribeToTasks: subscribeToMaintenanceTasks,
  unsubscribe: unsubscribeFromMaintenanceTasks
} = maintenance