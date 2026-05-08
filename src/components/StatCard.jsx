import React from 'react'

// Base StatCard component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  size = 'md',
  loading = false,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500',
      border: 'border-red-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'text-yellow-500',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-500',
      border: 'border-purple-200'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      icon: 'text-gray-500',
      border: 'border-gray-200'
    }
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const colors = colorClasses[color] || colorClasses.blue
  const padding = sizeClasses[size] || sizeClasses.md

  const cardClasses = `
    bg-white rounded-lg shadow-sm border ${colors.border} ${padding} 
    ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${className}
  `.trim()

  const formatValue = (val) => {
    if (loading) return '...'
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val || '0'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    } else if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      )
    }
    
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${colors.text}`}>
              {formatValue(value)}
            </p>
            {trend && trendValue && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {icon && (
          <div className={`text-3xl ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized stat card components
export const FacilityStatCard = ({ total, critical, loading, onClick }) => (
  <StatCard
    title="Total Facilities"
    value={total}
    icon="🏢"
    color="blue"
    loading={loading}
    onClick={onClick}
    className={critical > 0 ? 'ring-2 ring-red-200' : ''}
  />
)

export const CriticalStatCard = ({ count, loading, onClick }) => (
  <StatCard
    title="Critical Facilities"
    value={count}
    icon="🚨"
    color="red"
    loading={loading}
    onClick={onClick}
  />
)

export const AlertsStatCard = ({ count, loading, onClick }) => (
  <StatCard
    title="Alerts Today"
    value={count}
    icon="⚠️"
    color="yellow"
    loading={loading}
    onClick={onClick}
  />
)

export const DistrictsStatCard = ({ count, loading, onClick }) => (
  <StatCard
    title="Districts Covered"
    value={count}
    icon="🗺️"
    color="green"
    loading={loading}
    onClick={onClick}
  />
)

// Risk level stat card
export const RiskLevelCard = ({ level, count, percentage, loading }) => {
  const configs = {
    good: { color: 'green', icon: '✅', label: 'Good' },
    at_risk: { color: 'yellow', icon: '⚠️', label: 'At Risk' },
    high_risk: { color: 'red', icon: '🔥', label: 'High Risk' },
    critical: { color: 'red', icon: '🚨', label: 'Critical' }
  }
  
  const config = configs[level] || configs.good
  
  return (
    <StatCard
      title={config.label}
      value={count}
      icon={config.icon}
      color={config.color}
      loading={loading}
      trendValue={percentage ? `${percentage}%` : undefined}
    />
  )
}

// Performance metric card
export const MetricCard = ({ title, value, target, unit = '', icon, loading }) => {
  const percentage = target ? Math.round((value / target) * 100) : 0
  const isGood = percentage >= 80
  const isOk = percentage >= 60
  
  return (
    <StatCard
      title={title}
      value={`${value}${unit}`}
      icon={icon}
      color={isGood ? 'green' : isOk ? 'yellow' : 'red'}
      loading={loading}
      trendValue={target ? `${percentage}%` : undefined}
      trend={isGood ? 'up' : isOk ? 'neutral' : 'down'}
    />
  )
}

// Activity summary card
export const ActivityCard = ({ title, items, loading }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {loading ? (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

export default StatCard