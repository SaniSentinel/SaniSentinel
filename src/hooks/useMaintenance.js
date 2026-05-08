import { useState, useEffect, useCallback } from 'react'
import { maintenance } from '../lib/maintenance'
import { supabase } from '../lib/supabase'

export const useMaintenance = (options = {}) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    limit = 500,
    includeStats = true,
    status = null // Filter by status if provided
  } = options

  // Load maintenance tasks
  const loadTasks = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)

      let result

      // Apply filters based on provided options
      if (filters.status) {
        result = await maintenance.getByStatus(filters.status, limit)
      } else if (filters.priority) {
        result = await maintenance.getByPriority(filters.priority, limit)
      } else if (filters.facilityId) {
        result = await maintenance.getByFacility(filters.facilityId, limit)
      } else if (filters.workerId) {
        result = await maintenance.getByWorker(filters.workerId, limit)
      } else if (filters.taskType) {
        result = await maintenance.getByType(filters.taskType, limit)
      } else if (filters.overdue) {
        result = await maintenance.getOverdue(limit)
      } else if (filters.dueSoon) {
        result = await maintenance.getDueSoon(filters.dueSoon, limit)
      } else if (status) {
        result = await maintenance.getByStatus(status, limit)
      } else {
        result = await maintenance.getAll(limit)
      }

      if (result.error) {
        throw new Error(result.error)
      }

      setTasks(result.data || [])
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Error loading maintenance tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit, status])

  // Get maintenance statistics
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byPriority: {},
    byType: {},
    overdue: 0,
    dueSoon: 0,
    completionRate: 0,
    averageCompletionTime: 0
  })

  const loadStats = useCallback(async (daysBack = 30) => {
    if (!includeStats) return

    try {
      const result = await maintenance.getStats(daysBack)
      if (result.error) {
        throw new Error(result.error)
      }
      setStats(result.data)
    } catch (err) {
      console.error('Error loading maintenance stats:', err)
    }
  }, [includeStats])

  // Get dashboard summary
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    urgent: 0,
    overdue: 0
  })

  const loadSummary = useCallback(async () => {
    if (!includeStats) return

    try {
      const result = await maintenance.getSummary()
      if (result.error) {
        throw new Error(result.error)
      }
      setSummary(result.data)
    } catch (err) {
      console.error('Error loading maintenance summary:', err)
    }
  }, [includeStats])

  // Create new maintenance task
  const createTask = useCallback(async (taskData) => {
    try {
      const result = await maintenance.create(taskData)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after creating
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Update maintenance task
  const updateTask = useCallback(async (id, updates) => {
    try {
      const result = await maintenance.update(id, updates)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after updating
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Assign task to worker
  const assignTask = useCallback(async (taskId, workerId) => {
    try {
      const result = await maintenance.assign(taskId, workerId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after assigning
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Start task (mark as in progress)
  const startTask = useCallback(async (taskId) => {
    try {
      const result = await maintenance.start(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after starting
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Complete task
  const completeTask = useCallback(async (taskId) => {
    try {
      const result = await maintenance.complete(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after completing
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Cancel task
  const cancelTask = useCallback(async (taskId) => {
    try {
      const result = await maintenance.cancel(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after cancelling
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Delete task
  const deleteTask = useCallback(async (taskId) => {
    try {
      const result = await maintenance.delete(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after deleting
      await loadTasks()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadTasks])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!autoRefresh) return

    const subscription = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_tasks' },
        (payload) => {
          console.log('Maintenance tasks changed, refreshing data...', payload)
          loadTasks()
          if (includeStats) {
            loadStats()
            loadSummary()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [autoRefresh, loadTasks, loadStats, loadSummary, includeStats])

  // Setup periodic refresh
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing maintenance data...')
      loadTasks()
      if (includeStats) {
        loadStats()
        loadSummary()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadTasks, loadStats, loadSummary, includeStats])

  // Load initial data
  useEffect(() => {
    loadTasks()
    if (includeStats) {
      loadStats()
      loadSummary()
    }
  }, [loadTasks, loadStats, loadSummary, includeStats])

  // Utility functions
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green'
    }
    return colors[priority] || 'gray'
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'gray',
      assigned: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red'
    }
    return colors[status] || 'gray'
  }

  const formatTaskDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTaskTypeDisplay = (taskType) => {
    const types = {
      routine_cleaning: 'Routine Cleaning',
      emptying: 'Emptying',
      repair: 'Repair',
      inspection: 'Inspection',
      emergency_response: 'Emergency Response',
      preventive_maintenance: 'Preventive Maintenance'
    }
    return types[taskType] || taskType
  }

  const isOverdue = (dueDate, status) => {
    const today = new Date().toISOString().split('T')[0]
    return dueDate < today && status !== 'completed' && status !== 'cancelled'
  }

  const isDueSoon = (dueDate, daysAhead = 7) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= daysAhead
  }

  // Filter functions
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  const getTasksByPriority = (priority) => {
    return tasks.filter(task => task.priority === priority)
  }

  const getTasksByType = (taskType) => {
    return tasks.filter(task => task.task_type === taskType)
  }

  const getOverdueTasks = () => {
    return tasks.filter(task => isOverdue(task.due_date, task.status))
  }

  const getDueSoonTasks = (daysAhead = 7) => {
    return tasks.filter(task => 
      isDueSoon(task.due_date, daysAhead) && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    )
  }

  const getOpenTasks = () => {
    return tasks.filter(task => 
      ['pending', 'assigned', 'in_progress'].includes(task.status)
    )
  }

  const getUrgentTasks = () => {
    return tasks.filter(task => 
      task.priority === 'urgent' && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    )
  }

  const getTasksByFacility = (facilityId) => {
    return tasks.filter(task => task.facility_id === facilityId)
  }

  const getTasksByWorker = (workerId) => {
    return tasks.filter(task => task.assigned_to === workerId)
  }

  const getUnassignedTasks = () => {
    return tasks.filter(task => !task.assigned_to && task.status === 'pending')
  }

  return {
    // Core data
    tasks,
    stats,
    summary,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    loadTasks,
    loadStats,
    loadSummary,
    createTask,
    updateTask,
    assignTask,
    startTask,
    completeTask,
    cancelTask,
    deleteTask,
    refresh: () => {
      loadTasks()
      if (includeStats) {
        loadStats()
        loadSummary()
      }
    },
    
    // Utility functions
    getPriorityColor,
    getStatusColor,
    formatTaskDate,
    getTaskTypeDisplay,
    isOverdue,
    isDueSoon,
    
    // Filter functions
    getTasksByStatus,
    getTasksByPriority,
    getTasksByType,
    getOverdueTasks,
    getDueSoonTasks,
    getOpenTasks,
    getUrgentTasks,
    getTasksByFacility,
    getTasksByWorker,
    getUnassignedTasks
  }
}

export default useMaintenance