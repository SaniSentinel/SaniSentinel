import { useState, useEffect, useCallback } from 'react'
import { reports } from '../lib/reports'
import { supabase } from '../lib/supabase'

export const useReports = (options = {}) => {
  const [reportsData, setReportsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    limit = 1000,
    includeStats = true
  } = options

  // Load reports with optional filtering
  const loadReports = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)

      let result

      // Apply filters based on provided options
      if (filters.dateRange && filters.startDate && filters.endDate) {
        result = await reports.getByDateRange(
          filters.startDate,
          filters.endDate,
          limit
        )
      } else if (filters.facilityId) {
        result = await reports.getByFacility(filters.facilityId, limit)
      } else if (filters.condition) {
        result = await reports.getByCondition(filters.condition, limit)
      } else if (filters.reporter) {
        result = await reports.getByReporter(filters.reporter, limit)
      } else if (filters.hoursBack) {
        result = await reports.getRecent(filters.hoursBack, limit)
      } else {
        result = await reports.getAll(limit)
      }

      if (result.error) {
        throw new Error(result.error)
      }

      setReportsData(result.data || [])
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Error loading reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  // Get reports statistics
  const [stats, setStats] = useState({
    total: 0,
    byCondition: {},
    byDay: {},
    uniqueReporters: 0,
    averagePerDay: 0
  })

  const loadStats = useCallback(async (daysBack = 30) => {
    if (!includeStats) return

    try {
      const result = await reports.getStats(daysBack)
      if (result.error) {
        throw new Error(result.error)
      }
      setStats(result.data)
    } catch (err) {
      console.error('Error loading report stats:', err)
    }
  }, [includeStats])

  // Create new report
  const createReport = useCallback(async (reportData) => {
    try {
      const result = await reports.create(reportData)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after creating
      await loadReports()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadReports])

  // Update report
  const updateReport = useCallback(async (id, updates) => {
    try {
      const result = await reports.update(id, updates)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after updating
      await loadReports()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadReports])

  // Delete report
  const deleteReport = useCallback(async (id) => {
    try {
      const result = await reports.delete(id)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data after deleting
      await loadReports()
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [loadReports])

  // Get facility report history
  const getFacilityHistory = useCallback(async (facilityId, daysBack = 90) => {
    try {
      const result = await reports.getFacilityHistory(facilityId, daysBack)
      if (result.error) {
        throw new Error(result.error)
      }
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [])

  // Get reports needing follow-up
  const getFollowupReports = useCallback(async (hoursOld = 24) => {
    try {
      const result = await reports.getNeedingFollowup(hoursOld)
      if (result.error) {
        throw new Error(result.error)
      }
      return { data: result.data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!autoRefresh) return

    const subscription = supabase
      .channel('reports-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('Reports changed, refreshing data...', payload)
          loadReports()
          if (includeStats) {
            loadStats()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [autoRefresh, loadReports, loadStats, includeStats])

  // Setup periodic refresh
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing reports data...')
      loadReports()
      if (includeStats) {
        loadStats()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadReports, loadStats, includeStats])

  // Load initial data
  useEffect(() => {
    loadReports()
    if (includeStats) {
      loadStats()
    }
  }, [loadReports, loadStats, includeStats])

  // Utility functions
  const getConditionColor = (condition) => {
    const colors = {
      good: 'green',
      damaged: 'orange',
      overflow: 'red',
      dry: 'yellow',
      blocked: 'red',
      out_of_service: 'gray'
    }
    return colors[condition] || 'gray'
  }

  const formatReportDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPhoneNumber = (phone) => {
    if (phone.startsWith('+233')) {
      return phone.replace('+233', '0')
    }
    return phone
  }

  const getReportsByCondition = (condition) => {
    return reportsData.filter(report => report.condition === condition)
  }

  const getReportsByDistrict = (districtName) => {
    return reportsData.filter(report => 
      report.facility?.district?.name === districtName
    )
  }

  const getReportsByDateRange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return reportsData.filter(report => {
      const reportDate = new Date(report.created_at)
      return reportDate >= start && reportDate <= end
    })
  }

  const getTodaysReports = () => {
    const today = new Date().toDateString()
    return reportsData.filter(report => 
      new Date(report.created_at).toDateString() === today
    )
  }

  const getProblemReports = () => {
    return reportsData.filter(report => report.condition !== 'good')
  }

  const getUniqueDistricts = () => {
    const districts = new Set()
    reportsData.forEach(report => {
      if (report.facility?.district?.name) {
        districts.add(report.facility.district.name)
      }
    })
    return Array.from(districts).sort()
  }

  const getUniqueReporters = () => {
    const reporters = new Set()
    reportsData.forEach(report => {
      reporters.add(report.reported_by)
    })
    return Array.from(reporters).sort()
  }

  const getUniqueFacilities = () => {
    const facilities = new Set()
    reportsData.forEach(report => {
      if (report.facility?.name) {
        facilities.add(report.facility.name)
      }
    })
    return Array.from(facilities).sort()
  }

  return {
    // Core data
    reports: reportsData,
    stats,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    loadReports,
    loadStats,
    createReport,
    updateReport,
    deleteReport,
    getFacilityHistory,
    getFollowupReports,
    refresh: () => {
      loadReports()
      if (includeStats) loadStats()
    },
    
    // Utility functions
    getConditionColor,
    formatReportDate,
    formatPhoneNumber,
    
    // Filter functions
    getReportsByCondition,
    getReportsByDistrict,
    getReportsByDateRange,
    getTodaysReports,
    getProblemReports,
    
    // Data extraction
    getUniqueDistricts,
    getUniqueReporters,
    getUniqueFacilities
  }
}

export default useReports