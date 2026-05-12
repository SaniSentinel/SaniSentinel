import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const RealTimeActivityFeed = ({ activity, loading, timeRange }) => {
  const [liveActivities, setLiveActivities] = useState([])
  const [filter, setFilter] = useState('all')
  const [isLive, setIsLive] = useState(true)

  // Simulate real-time activity updates
  useEffect(() => {
    if (!isLive) return

    const generateActivity = () => {
      const activityTypes = [
        {
          type: 'report',
          icon: '📝',
          color: 'blue',
          templates: [
            'New facility report received from {district}',
            'SMS report processed for {facility}',
            'Field worker submitted condition update'
          ]
        },
        {
          type: 'alert',
          icon: '🚨',
          color: 'red',
          templates: [
            'Critical alert generated for {facility}',
            'High risk facility detected in {district}',
            'Overflow alert triggered at {facility}'
          ]
        },
        {
          type: 'maintenance',
          icon: '🔧',
          color: 'green',
          templates: [
            'Maintenance task completed at {facility}',
            'Worker assigned to {facility}',
            'Maintenance scheduled for {district}'
          ]
        },
        {
          type: 'system',
          icon: '⚙️',
          color: 'purple',
          templates: [
            'System backup completed successfully',
            'Database optimization finished',
            'SMS gateway connection restored'
          ]
        },
        {
          type: 'user',
          icon: '👤',
          color: 'indigo',
          templates: [
            'New district officer registered',
            'User login from {district}',
            'Admin access granted to user'
          ]
        }
      ]

      const districts = ['Tamale', 'Yendi', 'Damongo', 'Bimbilla', 'Salaga', 'Kpandai']
      const facilities = [
        'Central Market Toilet',
        'Hospital Septic Tank',
        'School Block Latrine',
        'Community Toilet',
        'Treatment Plant'
      ]

      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
      const template = activityType.templates[Math.floor(Math.random() * activityType.templates.length)]
      
      let message = template
        .replace('{district}', districts[Math.floor(Math.random() * districts.length)])
        .replace('{facility}', facilities[Math.floor(Math.random() * facilities.length)])

      return {
        id: Date.now() + Math.random(),
        type: activityType.type,
        icon: activityType.icon,
        color: activityType.color,
        message,
        timestamp: new Date(),
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      }
    }

    // Add initial activities
    const initialActivities = Array.from({ length: 8 }, generateActivity)
    setLiveActivities(initialActivities.sort((a, b) => b.timestamp - a.timestamp))

    // Set up interval for new activities
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance of new activity
        const newActivity = generateActivity()
        setLiveActivities(prev => [newActivity, ...prev.slice(0, 19)]) // Keep last 20
      }
    }, 3000 + Math.random() * 7000) // Random interval between 3-10 seconds

    return () => clearInterval(interval)
  }, [isLive])

  const filteredActivities = liveActivities.filter(activity => 
    filter === 'all' || activity.type === filter
  )

  const filterOptions = [
    { value: 'all', label: 'All Activity', icon: '📊' },
    { value: 'report', label: 'Reports', icon: '📝' },
    { value: 'alert', label: 'Alerts', icon: '🚨' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'system', label: 'System', icon: '⚙️' },
    { value: 'user', label: 'Users', icon: '👤' }
  ]

  const getColorClasses = (color, type = 'bg') => {
    const colorMap = {
      blue: type === 'bg' ? 'bg-blue-100' : type === 'text' ? 'text-blue-700' : 'border-blue-200',
      red: type === 'bg' ? 'bg-red-100' : type === 'text' ? 'text-red-700' : 'border-red-200',
      green: type === 'bg' ? 'bg-green-100' : type === 'text' ? 'text-green-700' : 'border-green-200',
      purple: type === 'bg' ? 'bg-purple-100' : type === 'text' ? 'text-purple-700' : 'border-purple-200',
      indigo: type === 'bg' ? 'bg-indigo-100' : type === 'text' ? 'text-indigo-700' : 'border-indigo-200',
      yellow: type === 'bg' ? 'bg-yellow-100' : type === 'text' ? 'text-yellow-700' : 'border-yellow-200'
    }
    return colorMap[color] || colorMap.blue
  }

  const getSeverityIndicator = (severity) => {
    switch (severity) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
          <div className="flex items-center space-x-2">
            {isLive && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isLive 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {isLive ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading activity feed...</p>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-gray-400 text-3xl mb-2">📡</div>
              <p className="text-sm text-gray-600">
                {filter === 'all' ? 'No recent activity' : `No ${filter} activity`}
              </p>
            </div>
          </div>
        ) : (
          filteredActivities.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                item.severity === 'high' 
                  ? 'bg-red-50 border-red-200' 
                  : item.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${getColorClasses(item.color, 'bg')} flex items-center justify-center`}>
                <span className="text-sm">{item.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-900 font-medium">
                    {item.message}
                  </p>
                  <div className="flex items-center space-x-2 ml-2">
                    {getSeverityIndicator(item.severity)}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
                
                {/* Activity Type Badge */}
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getColorClasses(item.color, 'bg')} ${getColorClasses(item.color, 'text')}`}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Activity Summary */}
      {!loading && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {activity.reports?.total || 0}
              </div>
              <div className="text-xs text-gray-600">Reports ({timeRange})</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {activity.alerts?.total || 0}
              </div>
              <div className="text-xs text-gray-600">Alerts ({timeRange})</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {activity.maintenance?.completed || 0}
              </div>
              <div className="text-xs text-gray-600">Tasks Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Activity updates every 3-10 seconds
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/activity-log"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Log
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/system-monitoring"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              System Monitor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeActivityFeed