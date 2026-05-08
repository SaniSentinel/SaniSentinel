import React from 'react'

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color = 'blue',
  size = 'md',
  loading = false,
  onClick,
  subtitle,
  trend
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      accent: 'text-blue-600',
      border: 'border-blue-200',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      accent: 'text-green-600',
      border: 'border-green-200',
      icon: 'text-green-500'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      accent: 'text-red-600',
      border: 'border-red-200',
      icon: 'text-red-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      accent: 'text-yellow-600',
      border: 'border-yellow-200',
      icon: 'text-yellow-500'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      accent: 'text-gray-600',
      border: 'border-gray-200',
      icon: 'text-gray-500'
    }
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const colors = colorClasses[color] || colorClasses.blue
  const padding = sizeClasses[size] || sizeClasses.md

  const getChangeIcon = () => {
    if (changeType === 'positive') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    } else if (changeType === 'negative') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      )
    }
    return null
  }

  const formatValue = (val) => {
    if (loading) return '...'
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val || '0'
  }

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-sm border ${colors.border} ${padding}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''}
        ${loading ? 'animate-pulse' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {change && (
              <div className="flex items-center space-x-1">
                {getChangeIcon()}
                <span className={`text-xs font-medium ${
                  changeType === 'positive' ? 'text-green-600' : 
                  changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className={`text-3xl font-bold ${colors.text}`}>
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          {trend && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors.accent.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(trend.percentage || 0, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{trend.percentage}%</span>
              </div>
            </div>
          )}
        </div>

        {icon && (
          <div className={`text-2xl ${colors.icon} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard