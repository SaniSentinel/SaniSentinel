import React from 'react'

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  trend, 
  trendDirection = 'up', 
  icon, 
  color = '#3B82F6', 
  description,
  loading = false 
}) => {
  const getTrendColor = () => {
    if (trendDirection === 'up') return '#10B981' // Green
    if (trendDirection === 'down') return '#EF4444' // Red
    return '#6B7280' // Gray for neutral
  }

  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 0H7" />
        </svg>
      )
    }
    if (trendDirection === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0 0h10" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-baseline space-x-1">
          <span 
            className="text-3xl font-bold group-hover:scale-105 transition-transform"
            style={{ color }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-lg font-medium text-gray-500">{unit}</span>
          )}
        </div>
      </div>

      {/* Trend and Description */}
      <div className="space-y-2">
        {trend && (
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${getTrendColor()}20`,
                color: getTrendColor()
              }}
            >
              {getTrendIcon()}
              <span>{trend}</span>
            </div>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
            {description}
          </p>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
      ></div>
    </div>
  )
}

export default KPICard