import { useState, useEffect, useCallback } from 'react'
import { workers } from '../lib/workers'

/**
 * Custom hook for managing workers data and operations
 * Provides state management and CRUD operations for workers
 */
const useWorkers = () => {
  const [workersData, setWorkersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    byDistrict: {}
  })

  // Load all workers with statistics
  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await workers.getAll()
      
      if (result.error) {
        throw new Error(result.error)
      }

      const workersWithDistricts = result.data || []
      setWorkersData(workersWithDistricts)

      // Calculate comprehensive stats
      const newStats = {
        total: workersWithDistricts.length,
        active: workersWithDistricts.filter(w => w.active).length,
        inactive: workersWithDistricts.filter(w => !w.active).length,
        byRole: {},
        byDistrict: {}
      }

      // Calculate role distribution
      workersWithDistricts.forEach(worker => {
        newStats.byRole[worker.role] = (newStats.byRole[worker.role] || 0) + 1
        if (worker.district?.name) {
          newStats.byDistrict[worker.district.name] = (newStats.byDistrict[worker.district.name] || 0) + 1
        }
      })

      setStats(newStats)

    } catch (err) {
      console.error('Error loading workers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new worker
  const createWorker = useCallback(async (workerData) => {
    try {
      const result = await workers.create(workerData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh data after successful creation
      await loadWorkers()
      
      return { success: true, data: result.data }
    } catch (err) {
      console.error('Error creating worker:', err)
      return { success: false, error: err.message }
    }
  }, [loadWorkers])

  // Update existing worker
  const updateWorker = useCallback(async (workerId, updates) => {
    try {
      const result = await workers.update(workerId, updates)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh data after successful update
      await loadWorkers()
      
      return { success: true, data: result.data }
    } catch (err) {
      console.error('Error updating worker:', err)
      return { success: false, error: err.message }
    }
  }, [loadWorkers])

  // Toggle worker active status
  const toggleWorkerStatus = useCallback(async (workerId, currentStatus) => {
    try {
      const result = currentStatus 
        ? await workers.deactivate(workerId)
        : await workers.reactivate(workerId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh data after successful status change
      await loadWorkers()
      
      return { success: true, data: result.data }
    } catch (err) {
      console.error('Error toggling worker status:', err)
      return { success: false, error: err.message }
    }
  }, [loadWorkers])

  // Delete worker (hard delete)
  const deleteWorker = useCallback(async (workerId) => {
    try {
      const result = await workers.delete(workerId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh data after successful deletion
      await loadWorkers()
      
      return { success: true, data: result.data }
    } catch (err) {
      console.error('Error deleting worker:', err)
      return { success: false, error: err.message }
    }
  }, [loadWorkers])

  // Search workers
  const searchWorkers = useCallback(async (searchTerm) => {
    try {
      if (!searchTerm.trim()) {
        return { success: true, data: workersData }
      }

      const result = await workers.search(searchTerm)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Error searching workers:', err)
      return { success: false, error: err.message }
    }
  }, [workersData])

  // Get workers by district
  const getWorkersByDistrict = useCallback(async (districtId) => {
    try {
      const result = await workers.getByDistrict(districtId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Error getting workers by district:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Get workers by role
  const getWorkersByRole = useCallback(async (role) => {
    try {
      const result = await workers.getByRole(role)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Error getting workers by role:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Get worker by phone (useful for SMS processing)
  const getWorkerByPhone = useCallback(async (phoneNumber) => {
    try {
      const result = await workers.getByPhone(phoneNumber)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data }
    } catch (err) {
      console.error('Error getting worker by phone:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Validate phone number format
  const validatePhone = useCallback((phoneNumber) => {
    return workers.validatePhone(phoneNumber)
  }, [])

  // Get workers with recent activity
  const getWorkersWithActivity = useCallback(async (daysBack = 30) => {
    try {
      const result = await workers.getWithActivity(daysBack)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Error getting workers with activity:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Get inactive workers (haven't reported recently)
  const getInactiveWorkers = useCallback(async (daysBack = 7) => {
    try {
      const result = await workers.getInactive(daysBack)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Error getting inactive workers:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadWorkers()
  }, [loadWorkers])

  return {
    // State
    workersData,
    loading,
    error,
    stats,
    
    // Actions
    loadWorkers,
    createWorker,
    updateWorker,
    toggleWorkerStatus,
    deleteWorker,
    searchWorkers,
    getWorkersByDistrict,
    getWorkersByRole,
    getWorkerByPhone,
    validatePhone,
    getWorkersWithActivity,
    getInactiveWorkers
  }
}

export default useWorkers