import React, { useState, useEffect, useCallback } from 'react'
import { alerts } from '../lib/alerts'
import { supabase } from '../lib/supabase'

// Alert type configuration
const ALERT_TYPES = {
  maintenance_due: {
    label: 'Maintenance Due',
    icon: '🔧',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  high_risk: {
    label: 'High Risk',
    icon: '⚠️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  critical_status: {
    label: 'Critical Status',
    icon: '🚨',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  overflow_detected: {
    label: 'Overflow Detected',
    icon: '💧',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  system_failure: {
    label: 'System Failure',
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  climate_warning: {
    label: 'Climate Warning',
    icon: '🌧️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  }
}

// Severity configuration
const SEVERITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500'
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500'
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    dotColor: 'bg-orange-500'
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-500'
  }
}

// Format time helper
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Alert item component
const AlertItem = ({ alert, onResolve, onReopen, isNew = false }) => {
  const alertType = ALERT_TYPES[alert.alert_type] || ALERT_TYPES.high_risk
  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium

  return (
    <div className={`p-3 border rounded-lg transition-all duration-300 ${
      isNew ? 'ring-2 ring-blue-500 ring-opacity-50 animate-pulse' : ''
    } ${alert.resolved ? 'bg-gray-50 opacity-75' : alertType.bgColor} ${alertType.borderColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{alertType.icon}</span>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {alertType.label}
            </div>
            <div className="text-xs text-gray-600">
              {alert.facility?.name}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Severity indicator */}
          <div className={`w-2 h-2 rounded-full ${severity.dotColor}`}></div>
          
          {/* Action button */}
          {alert.resolved ? (
            <button
              onClick={() => onReopen(alert.id)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
              title="Reopen alert"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => onResolve(alert.id)}
              className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-100"
              title="Mark as resolved"
            >
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="text-sm text-gray-700 mb-2">
        {alert.message}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>{alert.facility?.district?.name}</span>
          <span>•</span>
          <span className={severity.color}>{severity.label}</span>
        </div>
        <div>
          {formatTimeAgo(alert.created_at)}
        </div>
      </div>
    </div>
  )
}

// Filter tabs component
const FilterTabs = ({ activeFilter, onFilterChange, counts }) => {
  const filters = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'critical', label: 'Critical', count: counts.critical },
    { key: 'high', label: 'High', count: counts.high },
    { key: 'resolved', label: 'Resolved', count: counts.resolved }
  ]

  return (
    <div className="flex space-x-1 mb-4">
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            activeFilter === filter.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {filter.label} {filter.count > 0 && `(${filter.count})`}
        </button>
      ))}
    </div>
  )
}

const AlertsSidebar = ({ isOpen = true, onToggle, className = '' }) => {
  const [allAlerts, setAllAlerts] = useState([])
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('active')
  const [newAlertIds, setNewAlertIds] = useState(new Set())
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    critical: 0,
    high: 0,
    resolved: 0
  })

  // Load initial alerts
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await alerts.getAll(100)
      if (result.error) {
        throw new Error(result.error)
      }
      
      setAllAlerts(result.data || [])
    } catch (err) {
      console.error('Error loading alerts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter alerts based on active filter
  useEffect(() => {
    let filtered = [...allAlerts]
    
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(alert => !alert.resolved)
        break
      case 'critical':
        filtered = filtered.filter(alert => alert.severity === 'critical' && !alert.resolved)
        break
      case 'high':
        filtered = filtered.filter(alert => alert.severity === 'high' && !alert.resolved)
        break
      case 'resolved':
        filtered = filtered.filter(alert => alert.resolved)
        break
      case 'all':
      default:
        // Show all alerts
        break
    }
    
    // Sort by created_at (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    setFilteredAlerts(filtered)
  }, [allAlerts, activeFilter])

  // Update counts
  useEffect(() => {
    const newCounts = {
      total: allAlerts.length,
      active: allAlerts.filter(alert => !alert.resolved).length,
      critical: allAlerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length,
      high: allAlerts.filter(alert => alert.severity === 'high' && !alert.resolved).length,
      resolved: allAlerts.filter(alert => alert.resolved).length
    }
    setCounts(newCounts)
  }, [allAlerts])

  // Handle real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('alerts_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'alerts' 
        }, 
        async (payload) => {
          console.log('Real-time alert update:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Fetch the full alert data with facility information
            const result = await alerts.getById(payload.new.id)
            if (result.data) {
              setAllAlerts(prev => [result.data, ...prev])
              
              // Mark as new for animation
              setNewAlertIds(prev => new Set([...prev, result.data.id]))
              setTimeout(() => {
                setNewAlertIds(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(result.data.id)
                  return newSet
                })
              }, 3000)
            }
          } else if (payload.eventType === 'UPDATE') {
            setAllAlerts(prev => 
              prev.map(alert => 
                alert.id === payload.new.id 
                  ? { ...alert, ...payload.new }
                  : alert
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAllAlerts(prev => 
              prev.filter(alert => alert.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Handle resolve alert
  const handleResolve = async (alertId) => {
    try {
      const result = await alerts.resolve(alertId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Update local state
      setAllAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true }
            : alert
        )
      )
    } catch (err) {
      console.error('Error resolving alert:', err)
      // Could show a toast notification here
    }
  }

  // Handle reopen alert
  const handleReopen = async (alertId) => {
    try {
      const result = await alerts.reopen(alertId)
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Update local state
      setAllAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: false }
            : alert
        )
      )
    } catch (err) {
      console.error('Error reopening alert:', err)
      // Could show a toast notification here
    }
  }

  if (!isOpen) {
    return (
      <div className={`fixed right-0 top-0 h-full z-40 ${className}`}>
        <button
          onClick={onToggle}
          className="bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors mt-20"
          title="Open Alerts"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚨</span>
            {counts.active > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {counts.active}
              </span>
            )}
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l z-40 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🚨</span>
          <h2 className="text-lg font-semibold text-gray-900">Live Alerts</h2>
          {counts.active > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {counts.active}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAlerts}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 border-b">
        <FilterTabs 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-600 text-sm mb-2">Failed to load alerts</div>
            <div className="text-xs text-gray-500 mb-3">{error}</div>
            <button
              onClick={loadAlerts}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-sm">
              {activeFilter === 'active' ? 'No active alerts' : `No ${activeFilter} alerts`}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onResolve={handleResolve}
                onReopen={handleReopen}
                isNew={newAlertIds.has(alert.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Real-time updates • Last refresh: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default AlertsSidebar