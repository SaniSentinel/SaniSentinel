import React from 'react'

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const statusConfig = {
    good: {
      label: 'Good',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    damaged: {
      label: 'Damaged',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⚠️'
    },
    overflow: {
      label: 'Overflow',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚨'
    },
    dry: {
      label: 'Dry',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🏜️'
    },
    blocked: {
      label: 'Blocked',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚫'
    },
    out_of_service: {
      label: 'Out of Service',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '❌'
    },
    // Alert severities
    low: {
      label: 'Low',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: 'ℹ️'
    },
    medium: {
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⚠️'
    },
    high: {
      label: 'High',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '🔥'
    },
    critical: {
      label: 'Critical',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚨'
    },
    // Task statuses
    pending: {
      label: 'Pending',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '⏳'
    },
    assigned: {
      label: 'Assigned',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👤'
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🔄'
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '❌'
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const config = statusConfig[status] || statusConfig.good
  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-full border font-medium
      ${config.color} ${sizeClass}
    `}>
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

export default StatusBadge