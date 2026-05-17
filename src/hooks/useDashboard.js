import { useState, useEffect, useCallback } from 'react'
import { dashboard } from '../lib/dashboard'
import { supabase } from '../lib/supabase'

export const useDashboard = (options = {}) => {
  const [stats, setStats] = useState({
    facilities: {
      total: 0,
      critical: 0,
      highRisk: 0,
      atRisk: 0,
      good: 0,
      averageRiskScore: 0,
      byStatus: {},
      byType: {},
      byRiskLevel: {}
    },
    alerts: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      today: 0,
      todayByType: {},
      todayBySeverity: {}
    },
    districts: {
      total: 0,
      byRegion: {},
      regions: []
    }
  })
  
  const [activity, setActivity] = useState({
    reports: { total: 0, byCondition: {}, byDay: {} },
    alerts: { total: 0, byType: {}, bySeverity: {}, byDay: {} },
    maintenance: { total: 0, completed: 0, pending: 0, inProgress: 0 }
  })
  
  const [metrics, setMetrics] = useState({
    facilityHealth: {
      averageRiskScore: 0,
      healthyFacilities: 0,
      facilitiesNeedingService: 0
    },
    alertResolution: {
      totalAlerts: 0,
      resolvedAlerts: 0,
      resolutionRate: 0,
      averageResolutionTime: 0
    },
    maintenanceEfficiency: {
      totalTasks: 0,
      completedTasks: 0,
      onTimeCompletion: 0,
      completionRate: 0
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [fatalFetchError, setFatalFetchError] = useState(false)

  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes — realtime channels handle live updates
    includeActivity = true,
    includeMetrics = true
  } = options

  // Load dashboard statistics
  const loadStats = useCallback(async () => {
    if (fatalFetchError) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const promises = [
        dashboard.getStats()
      ]

      if (includeActivity) {
        promises.push(dashboard.getRecentActivity())
      }

      if (includeMetrics) {
        promises.push(dashboard.getPerformanceMetrics())
      }

      const results = await Promise.all(promises)
      
      const [statsResult, activityResult, metricsResult] = results

      if (statsResult.error) throw new Error(statsResult.error)
      
      setStats(statsResult.data)
      
      if (includeActivity && activityResult) {
        if (activityResult.error) throw new Error(activityResult.error)
        setActivity(activityResult.data)
      }
      
      if (includeMetrics && metricsResult) {
        if (metricsResult.error) throw new Error(metricsResult.error)
        setMetrics(metricsResult.data)
      }
      
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError(err.message)

      const message = String(err?.message || '')
      if (message.includes('operator does not exist: text ->> unknown') || message.includes('404')) {
        setFatalFetchError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [includeActivity, includeMetrics, fatalFetchError])

  // Get facility distribution by district
  const [facilityDistribution, setFacilityDistribution] = useState({})
  const [distributionLoading, setDistributionLoading] = useState(false)

  const loadFacilityDistribution = useCallback(async () => {
    if (fatalFetchError) {
      return
    }

    try {
      setDistributionLoading(true)
      const result = await dashboard.getFacilityDistribution()
      if (result.error) throw new Error(result.error)
      setFacilityDistribution(result.data)
    } catch (err) {
      console.error('Error loading facility distribution:', err)
      const message = String(err?.message || '')
      if (message.includes('operator does not exist: text ->> unknown') || message.includes('404')) {
        setFatalFetchError(true)
      }
    } finally {
      setDistributionLoading(false)
    }
  }, [fatalFetchError])

  // Calculate derived statistics
  const derivedStats = {
    totalActiveFacilities: stats.facilities.total - (stats.facilities.byStatus?.out_of_service || 0),
    criticalPercentage: stats.facilities.total > 0 
      ? Math.round((stats.facilities.critical / stats.facilities.total) * 100) 
      : 0,
    healthyPercentage: stats.facilities.total > 0 
      ? Math.round((stats.facilities.good / stats.facilities.total) * 100) 
      : 0,
    alertsResolutionRate: stats.alerts.total > 0 
      ? Math.round(((stats.alerts.total - stats.alerts.critical - stats.alerts.high) / stats.alerts.total) * 100)
      : 0,
    averageAlertsPerDistrict: stats.districts.total > 0 
      ? Math.round(stats.alerts.total / stats.districts.total) 
      : 0
  }

  // Setup real-time subscriptions for live updates
  useEffect(() => {
    if (!autoRefresh || fatalFetchError) return

    const subscriptions = []

    // Subscribe to facilities changes
    const facilitiesSubscription = supabase
      .channel('dashboard-facilities')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'facilities' },
        () => {
          console.log('Facilities changed, refreshing dashboard...')
          loadStats()
        }
      )
      .subscribe()

    subscriptions.push(facilitiesSubscription)

    // Subscribe to alerts changes
    const alertsSubscription = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          console.log('Alerts changed, refreshing dashboard...')
          loadStats()
        }
      )
      .subscribe()

    subscriptions.push(alertsSubscription)

    // Subscribe to reports changes (affects facility status)
    const reportsSubscription = supabase
      .channel('dashboard-reports')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reports' },
        () => {
          console.log('New report received, refreshing dashboard...')
          loadStats()
        }
      )
      .subscribe()

    subscriptions.push(reportsSubscription)

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [autoRefresh, loadStats, fatalFetchError])

  // Setup periodic refresh as a fallback only — realtime channels already
  // handle live updates, so we use a long interval to avoid hammering the
  // token-refresh endpoint and hitting Supabase's 429 rate limit.
  useEffect(() => {
    if (!autoRefresh || !refreshInterval || fatalFetchError) return
    // Skip the interval entirely if realtime is active — channels will trigger
    // loadStats() on any relevant DB change, making polling redundant.
    if (autoRefresh) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard stats...')
      loadStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadStats, fatalFetchError])

  // Load initial data
  useEffect(() => {
    loadStats()
    loadFacilityDistribution()
  }, [loadStats, loadFacilityDistribution])

  // Utility functions
  const getRiskLevelColor = (level) => {
    const colors = {
      good: 'green',
      at_risk: 'yellow',
      high_risk: 'red',
      critical: 'red'
    }
    return colors[level] || 'gray'
  }

  const getAlertSeverityColor = (severity) => {
    const colors = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red'
    }
    return colors[severity] || 'gray'
  }

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  const formatTrend = (current, previous) => {
    if (!previous || previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change))
    }
  }

  return {
    // Core data
    stats,
    activity,
    metrics,
    facilityDistribution,
    
    // State
    loading,
    distributionLoading,
    error,
    lastUpdated,
    
    // Derived data
    derivedStats,
    
    // Actions
    refresh: loadStats,
    refreshDistribution: loadFacilityDistribution,
    
    // Utilities
    getRiskLevelColor,
    getAlertSeverityColor,
    formatPercentage,
    formatTrend
  }
}

export default useDashboard