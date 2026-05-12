import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SystemHealthIndicators = ({ systemKPIs, stats, loading }) => {
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  // Simulate system health metrics
  useEffect(() => {
    const generateSystemMetrics = () => {
      return {
        performance: {
          cpuUsage: Math.round(20 + Math.random() * 40), // 20-60%
          memoryUsage: Math.round(30 + Math.random() * 50), // 30-80%
          diskUsage: Math.round(40 + Math.random() * 30), // 40-70%
          networkLatency: Math.round(10 + Math.random() * 40), // 10-50ms
          apiResponseTime: Math.round(100 + Math.random() * 200), // 100-300ms
          databaseConnections: Math.round(5 + Math.random() * 15), // 5-20 connections
          activeUsers: Math.round(50 + Math.random() * 200), // 50-250 users
          requestsPerMinute: Math.round(100 + Math.random() * 500) // 100-600 requests
        },
        availability: {
          uptime: 99.7 + Math.random() * 0.3, // 99.7-100%
          lastDowntime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
          mtbf: Math.round(720 + Math.random() * 480), // 720-1200 hours (30-50 days)
          mttr: Math.round(15 + Math.random() * 45) // 15-60 minutes
        },
        security: {
          failedLogins: Math.round(Math.random() * 10), // 0-10 in last hour
          suspiciousActivity: Math.round(Math.random() * 3), // 0-3 incidents
          lastSecurityScan: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random within last day
          vulnerabilities: Math.round(Math.random() * 2), // 0-2 known vulnerabilities
          sslCertExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        },
        dataIntegrity: {
          backupStatus: 'success',
          lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          dataConsistency: 99.8 + Math.random() * 0.2, // 99.8-100%
          replicationLag: Math.round(Math.random() * 5), // 0-5 seconds
          corruptedRecords: Math.round(Math.random() * 2) // 0-2 records
        },
        integrations: {
          supabaseStatus: 'operational',
          smsGatewayStatus: Math.random() > 0.1 ? 'operational' : 'degraded',
          weatherApiStatus: 'operational',
          mapServiceStatus: 'operational',
          externalApiCalls: Math.round(1000 + Math.random() * 2000), // 1000-3000 calls
          apiErrorRate: Math.round(Math.random() * 3) // 0-3%
        }
      }
    }

    setSystemMetrics(generateSystemMetrics())

    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      setSystemMetrics(generateSystemMetrics())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const healthIndicators = [
    {
      category: 'System Performance',
      icon: '⚡',
      color: 'blue',
      metrics: systemMetrics ? [
        { 
          name: 'CPU Usage', 
          value: systemMetrics.performance.cpuUsage, 
          unit: '%', 
          threshold: { warning: 70, critical: 85 },
          trend: 'stable'
        },
        { 
          name: 'Memory Usage', 
          value: systemMetrics.performance.memoryUsage, 
          unit: '%', 
          threshold: { warning: 75, critical: 90 },
          trend: 'down'
        },
        { 
          name: 'API Response', 
          value: systemMetrics.performance.apiResponseTime, 
          unit: 'ms', 
          threshold: { warning: 250, critical: 400 },
          trend: 'up'
        },
        { 
          name: 'Active Users', 
          value: systemMetrics.performance.activeUsers, 
          unit: '', 
          threshold: { warning: 200, critical: 300 },
          trend: 'up'
        }
      ] : []
    },
    {
      category: 'Availability & Reliability',
      icon: '🛡️',
      color: 'green',
      metrics: systemMetrics ? [
        { 
          name: 'System Uptime', 
          value: systemMetrics.availability.uptime, 
          unit: '%', 
          threshold: { warning: 99.5, critical: 99.0 },
          trend: 'stable'
        },
        { 
          name: 'MTBF', 
          value: systemMetrics.availability.mtbf, 
          unit: 'hrs', 
          threshold: { warning: 500, critical: 300 },
          trend: 'up'
        },
        { 
          name: 'MTTR', 
          value: systemMetrics.availability.mttr, 
          unit: 'min', 
          threshold: { warning: 45, critical: 60 },
          trend: 'down'
        }
      ] : []
    },
    {
      category: 'Security & Compliance',
      icon: '🔒',
      color: 'purple',
      metrics: systemMetrics ? [
        { 
          name: 'Failed Logins', 
          value: systemMetrics.security.failedLogins, 
          unit: '/hr', 
          threshold: { warning: 5, critical: 10 },
          trend: 'stable'
        },
        { 
          name: 'Vulnerabilities', 
          value: systemMetrics.security.vulnerabilities, 
          unit: '', 
          threshold: { warning: 1, critical: 3 },
          trend: 'stable'
        },
        { 
          name: 'SSL Cert Days', 
          value: Math.round((systemMetrics.security.sslCertExpiry - new Date()) / (24 * 60 * 60 * 1000)), 
          unit: 'days', 
          threshold: { warning: 30, critical: 7 },
          trend: 'down'
        }
      ] : []
    },
    {
      category: 'Data & Integrations',
      icon: '🔗',
      color: 'indigo',
      metrics: systemMetrics ? [
        { 
          name: 'Data Consistency', 
          value: systemMetrics.dataIntegrity.dataConsistency, 
          unit: '%', 
          threshold: { warning: 99.5, critical: 99.0 },
          trend: 'stable'
        },
        { 
          name: 'Replication Lag', 
          value: systemMetrics.dataIntegrity.replicationLag, 
          unit: 's', 
          threshold: { warning: 3, critical: 5 },
          trend: 'stable'
        },
        { 
          name: 'API Error Rate', 
          value: systemMetrics.integrations.apiErrorRate, 
          unit: '%', 
          threshold: { warning: 2, critical: 5 },
          trend: 'down'
        }
      ] : []
    }
  ]

  const getHealthStatus = (value, threshold, unit) => {
    if (unit === '%' || unit === 'ms' || unit === '/hr' || unit === 's') {
      // Higher values are worse for these metrics
      if (value >= threshold.critical) return 'critical'
      if (value >= threshold.warning) return 'warning'
      return 'good'
    } else if (unit === 'hrs' || unit === 'days') {
      // Lower values are worse for these metrics
      if (value <= threshold.critical) return 'critical'
      if (value <= threshold.warning) return 'warning'
      return 'good'
    } else {
      // For percentage metrics like uptime and consistency
      if (value < threshold.critical) return 'critical'
      if (value < threshold.warning) return 'warning'
      return 'good'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getCategoryColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
    return colorMap[color] || colorMap.blue
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗️</span>
      case 'down':
        return <span className="text-red-500">↘️</span>
      default:
        return <span className="text-gray-500">➡️</span>
    }
  }

  const overallHealthScore = systemMetrics ? 
    Math.round(
      (systemMetrics.availability.uptime + 
       systemMetrics.dataIntegrity.dataConsistency + 
       (100 - systemMetrics.performance.cpuUsage) + 
       (100 - systemMetrics.performance.memoryUsage)) / 4
    ) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Health Indicators</h3>
          <p className="text-sm text-gray-600">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Overall Health Score */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              overallHealthScore >= 95 ? 'text-green-600' :
              overallHealthScore >= 85 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {loading ? '...' : overallHealthScore}
            </div>
            <div className="text-xs text-gray-600">Health Score</div>
          </div>
          
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Health Categories */}
      <div className="space-y-6">
        {loading || !systemMetrics ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading system metrics...</p>
            </div>
          </div>
        ) : (
          healthIndicators.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg ${getCategoryColor(category.color)} flex items-center justify-center`}>
                  <span className="text-lg">{category.icon}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{category.category}</h4>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-11">
                {category.metrics.map((metric, metricIndex) => {
                  const status = getHealthStatus(metric.value, metric.threshold, metric.unit)
                  return (
                    <div key={metricIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(metric.trend)}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(status)}`}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-bold text-gray-900">
                          {typeof metric.value === 'number' ? 
                            (metric.unit === '%' ? metric.value.toFixed(1) : metric.value) : 
                            metric.value
                          }
                        </span>
                        <span className="text-sm text-gray-600">{metric.unit}</span>
                      </div>
                      
                      {/* Progress bar for percentage metrics */}
                      {(metric.unit === '%' || metric.unit === 'ms') && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                status === 'good' ? 'bg-green-500' :
                                status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: metric.unit === '%' ? 
                                  `${Math.min(metric.value, 100)}%` : 
                                  `${Math.min((metric.value / metric.threshold.critical) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* System Status Summary */}
      {!loading && systemMetrics && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">Last Backup</div>
              <div className="text-xs text-gray-600">
                {systemMetrics.dataIntegrity.lastBackup.toLocaleTimeString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">SMS Gateway</div>
              <div className={`text-xs font-medium ${
                systemMetrics.integrations.smsGatewayStatus === 'operational' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {systemMetrics.integrations.smsGatewayStatus.toUpperCase()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">DB Connections</div>
              <div className="text-xs text-gray-600">
                {systemMetrics.performance.databaseConnections} active
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">Requests/Min</div>
              <div className="text-xs text-gray-600">
                {systemMetrics.performance.requestsPerMinute}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Metrics updated every 30 seconds
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/system-monitoring"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Detailed Monitoring
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/system-logs"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              System Logs
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/alerts-config"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Alert Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemHealthIndicators