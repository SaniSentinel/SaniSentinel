import React from 'react'

const RiskIndicator = ({ score, size = 'md', showLabel = true, showScore = true }) => {
  const getRiskLevel = (riskScore) => {
    if (riskScore >= 85) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }

  const riskConfig = {
    low: {
      label: 'Good',
      color: 'text-green-700',
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-100',
      borderColor: 'border-green-200'
    },
    medium: {
      label: 'At Risk',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-500',
      lightBg: 'bg-yellow-100',
      borderColor: 'border-yellow-200'
    },
    high: {
      label: 'High Risk',
      color: 'text-orange-700',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-100',
      borderColor: 'border-orange-200'
    },
    critical: {
      label: 'Critical',
      color: 'text-red-700',
      bgColor: 'bg-red-500',
      lightBg: 'bg-red-100',
      borderColor: 'border-red-200'
    }
  }

  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      container: 'space-x-1'
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      container: 'space-x-2'
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-base',
      container: 'space-x-2'
    }
  }

  const riskLevel = getRiskLevel(score)
  const config = riskConfig[riskLevel]
  const sizes = sizeConfig[size]

  return (
    <div className={`flex items-center ${sizes.container}`}>
      <div className={`${sizes.dot} ${config.bgColor} rounded-full`}></div>
      {showScore && (
        <span className={`font-medium ${config.color} ${sizes.text}`}>
          {score}
        </span>
      )}
      {showLabel && (
        <span className={`${config.color} ${sizes.text}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

// Risk Progress Bar Component
export const RiskProgressBar = ({ score, height = 'h-2', showPercentage = false }) => {
  const getRiskLevel = (riskScore) => {
    if (riskScore >= 85) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }

  const riskLevel = getRiskLevel(score)
  const config = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div 
          className={`${height} rounded-full ${config[riskLevel]} transition-all duration-300`}
          style={{ width: `${Math.min(score, 100)}%` }}
        ></div>
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span className="font-medium">{score}</span>
          <span>100</span>
        </div>
      )}
    </div>
  )
}

export default RiskIndicator