import React from 'react'
import { Link } from 'react-router-dom'

const SystemMetricsGrid = ({ stats, activity, systemKPIs, loading, timeRange }) => {
  // Calculate derived metrics
  const totalFacilities = stats.facilities?.total || 0
  const criticalFacilities = stats.facilities?.critical || 0
  const highRiskFacilities = stats.facilities?.highRisk || 0
  const atRiskFacilities = stats.facilities?.atRisk || 0
  const goodFacilities = totalFacilities - criticalFacilities - highRiskFacilities - atRiskFacilities

  const systemHealthScore = totalFacilities > 0 
    ? Math.round(((goodFacilities + (atRiskFacilities * 0.7) + (highRiskFacilities * 0.3)) / totalFacilities) * 100)
    : 0

  const openTasks = (activity.maintenance?.pending || 0) + (activity.maintenance?.inProgress || 0)
  const completedTasks = activity.maintenance?.completed || 0
  const taskCompletionRate = (openTasks + completedTasks) > 0 
    ? Math.round((completedTasks / (openTasks + completedTasks)) * 100)
    : 0

  const metrics = [
    {
      id: 'system-health',
      title: 'System Health Score',
      value: systemHealthScore,
      unit: '%',
      icon: '🏥',
      trend: systemHealthScore >= 85 ? 'up' : systemHealthScore >= 70 ? 'stable' : 'down',
      trendValue: '+2.3%',
      color: systemHealthScore >= 85 ? 'green' : systemHealthScore >= 70 ? 'yellow' : 'red',
      description: 'Overall system performance indicator',
      link: '/admin/system-health'
    },
    {
      id: 'total-facilities',
      title: 'Total Facilities',
      value: totalFacilities,
      unit: '',
      icon: '🏢',
      trend: 'up',
      trendValue: '+12',
      color: 'blue',
      description: 'Active sanitation facilities nationwide',
      link: '/facility-map'
    },
    {
      id: 'critical-alerts',
      title: 'Critical Alerts',
      value: criticalFacilities,
      unit: '',
      icon: '🚨',
      trend: criticalFacilities > 5 ? 'up' : 'down',
      trendValue: criticalFacilities > 5 ? '+3' : '-2',
      color: 'red',
      description: 'Facilities requiring immediate attention',
      link: '/admin/critical-alerts'
    },
    {
      id: 'districts-covered',
      title: 'Districts Covered',
      value: stats.districts?.total || 0,
      unit: '',
      icon: '🗺️',
      trend: 'stable',
      trendValue: '0',
      color: 'purple',
      description: 'Geographic coverage across regions',
      link: '/admin/district-coverage'
    },
    {
      id: 'coverage-rate',
      title: 'Coverage Rate',
      value: systemKPIs.coverageRate,
      unit: '%',
      icon: '📊',
      trend: 'up',
      trendValue: '+1.2%',
      color: 'indigo',
      description: 'Facilities per district ratio',
      link: '/admin/coverage-analysis'
    },
    {
      id: 'task-completion',
      title: 'Task Completion',
      value: taskCompletionRate,
      unit: '%',
      icon: '✅',
      trend: taskCompletionRate >= 80 ? 'up' : 'down',
      trendValue: taskCompletionRate >= 80 ? '+5.1%' : '-2.3%',
      color: taskCompletionRate >= 80 ? 'green' : 'orange',
      description: 'Maintenance task completion rate',
      link: '/maintenance'
    },
    {
      id: 'response-time',
      title: 'Avg Response Time',
      value: systemKPIs.alertResolutionTime,
      unit: 'hrs',
      icon: '⚡',
      trend: 'down',
      trendValue: '-0.3hrs',
      color: 'cyan',
      description: 'Average alert resolution time',
      link: '/admin/performance-metrics'
    },
    {
      id: 'user-satisfaction',
      title: 'User Satisfaction',
      value: systemKPIs.userSatisfaction,
      unit: '/5',
      icon: '⭐',
      trend: 'up',
      trendValue: '+0.2',
      color: 'yellow',
      description: 'Average user rating and feedback',
      link: '/admin/user-feedback'
    }
  ]

  const getColorClasses = (color, type = 'bg') => {
    const colorMap = {
      green: type === 'bg' ? 'bg-green-500' : type === 'text' ? 'text-green-700' : 'border-green-200',
      blue: type === 'bg' ? 'bg-blue-500' : type === 'text' ? 'text-blue-700' : 'border-blue-200',
      red: type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-700' : 'border-red-200',
      yellow: type === 'bg' ? 'bg-yellow-500' : type === 'text' ? 'text-yellow-700' : 'border-yellow-200',
      purple: type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-700' : 'border-purple-200',
      indigo: type === 'bg' ? 'bg-indigo-500' : type === 'text' ? 'text-indigo-700' : 'border-indigo-200',
      orange: type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-700' : 'border-orange-200',
      cyan: type === 'bg' ? 'bg-cyan-500' : type === 'text' ? 'text-cyan-700' : 'border-cyan-200'
    }
    return colorMap[color] || colorMap.blue
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      case 'down':
        return <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      default:
        return <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Link
          key={metric.id}
          to={metric.link}
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-1"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                {metric.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metric.description}
              </p>
            </div>
            <div className="flex-shrink-0 ml-3">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(metric.color, 'bg')} bg-opacity-10 flex items-center justify-center`}>
                <span className="text-2xl" role="img" aria-label={metric.title}>
                  {metric.icon}
                </span>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="mb-3">
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold ${getColorClasses(metric.color, 'text')}`}>
                {loading ? '...' : metric.value}
              </span>
              {metric.unit && (
                <span className="text-lg font-medium text-gray-500">
                  {metric.unit}
                </span>
              )}
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getTrendIcon(metric.trend)}
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {metric.trendValue}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              vs {timeRange === '24h' ? 'yesterday' : 'previous period'}
            </div>
          </div>

          {/* Progress Bar for Percentage Metrics */}
          {metric.unit === '%' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorClasses(metric.color, 'bg')} transition-all duration-500`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Hover Effect Indicator */}
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center text-xs text-blue-600">
              <span>View details</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default SystemMetricsGrid