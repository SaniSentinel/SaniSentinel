import React from 'react'

const PieChart = ({ data }) => {
  if (!data || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  const dataset = data.datasets[0]
  const total = dataset.data.reduce((sum, value) => sum + value, 0)
  
  // Calculate angles for each segment
  let currentAngle = 0
  const segments = dataset.data.map((value, index) => {
    const percentage = (value / total) * 100
    const angle = (value / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    
    return {
      value,
      percentage,
      angle,
      startAngle,
      endAngle: currentAngle,
      color: dataset.backgroundColor[index],
      label: data.labels[index]
    }
  })

  // Create SVG path for each segment
  const createPath = (segment) => {
    const { startAngle, endAngle } = segment
    const centerX = 100
    const centerY = 100
    const radius = 80
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 p-4">
      {/* Pie Chart */}
      <div className="relative flex-shrink-0">
        <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <g key={index}>
              <path
                d={createPath(segment)}
                fill={segment.color}
                stroke="#ffffff"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            </g>
          ))}
        </svg>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col space-y-3">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: segment.color }}
            ></div>
            <div className="flex items-baseline space-x-2">
              <span className="text-sm font-medium text-gray-700">{segment.label}</span>
              <span className="text-sm text-gray-500">({segment.value})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PieChart