import { useState, useEffect, useCallback } from 'react'
import { alerts } from '../lib/alerts'
import { supabase } from '../lib/supabase'

export const useAlerts = (options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  })

  const {
    autoRefresh = true,
    includeSummary = true,
    activeOnly = false,
    limit = 100
  } = options

  // Load alerts data
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [alertsResult, summaryResult] = await Promise.all([
        activeOnly ? alerts.getActive(limit) : alerts.getAll(limit),
        includeSummary ? alerts.getSummary() : Promise.resolve({ data: null, error: null })
      ])

      if (alertsResult.error) throw new Error(alertsResult.error)
      if (summaryResult.error) throw new Error(summaryResult.error)

      setData(alertsResult.data || [])
      setSummary(summaryResult.data || {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      })

    } catch (err) {
      console.error('Error loading alerts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeOnly, limit, includeSummary])

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity) => {
    return data.filter(alert => alert.severity === severity)
  }, [data])

  // Get alerts by type
  const getAlertsByType = useCallback((alertType) => {
    return data.filter(alert => alert.alert_type === alertType)
  }, [data])

  // Get active alerts
  const getActiveAlerts = useCallback(() => {
    return data.filter(alert => !alert.resolved)
  }, [data])

  // Get resolved alerts
  const getResolvedAlerts = useCallback(() => {
    return data.filter(alert => alert.resolved)
  }, [data])

  // Resolve an alert
  const resolveAlert = useCallback(async (alertId) => {
    try {
      const result = await alerts.resolve(alertId)
      if (result.error) throw new Error(result.error)
      
      // Update local state
      setData(prevData => 
        prevData.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      )
      
      return result
    } catch (err) {
      console.error('Error resolving alert:', err)
      throw err
    }
  }, [])

  // Reopen an alert
  const reopenAlert = useCallback(async (alertId) => {
    try {
      const result = await alerts.reopen(alertId)
      if (result.error) throw new Error(result.error)
      
      // Update local state
      setData(prevData => 
        prevData.map(alert => 
          alert.id === alertId ? { ...alert, resolved: false } : alert
        )
      )
      
      return result
    } catch (err) {
      console.error('Error reopening alert:', err)
      throw err
    }
  }, [])

  // Create a new alert
  const createAlert = useCallback(async (alertData) => {
    try {
      const result = await alerts.create(alertData)
      if (result.error) throw new Error(result.error)
      
      // Add to local state
      setData(prevData => [result.data, ...prevData])
      
      return result
    } catch (err) {
      console.error('Error creating alert:', err)
      throw err
    }
  }, [])

  // Delete an alert
  const deleteAlert = useCallback(async (alertId) => {
    try {
      const result = await alerts.delete(alertId)
      if (result.error) throw new Error(result.error)
      
      // Remove from local state
      setData(prevData => prevData.filter(alert => alert.id !== alertId))
      
      return result
    } catch (err) {
      console.error('Error deleting alert:', err)
      throw err
    }
  }, [])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!autoRefresh) return

    const subscription = supabase
      .channel('alerts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerts' },
        async (payload) => {
          console.log('Alerts change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Fetch the full alert data with facility information
            const result = await alerts.getById(payload.new.id)
            if (result.data) {
              setData(prevData => [result.data, ...prevData])
            }
          } else if (payload.eventType === 'UPDATE') {
            setData(prevData => 
              prevData.map(alert => 
                alert.id === payload.new.id 
                  ? { ...alert, ...payload.new }
                  : alert
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData(prevData => 
              prevData.filter(alert => alert.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [autoRefresh])

  // Load initial data
  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  return {
    // Data
    data,
    loading,
    error,
    summary,
    
    // Actions
    refresh: loadAlerts,
    resolveAlert,
    reopenAlert,
    createAlert,
    deleteAlert,
    
    // Getters
    getAlertsBySeverity,
    getAlertsByType,
    getActiveAlerts,
    getResolvedAlerts
  }
}

export default useAlerts