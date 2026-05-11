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
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute -right-32 top-0 space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-gray-700">{segment.label}</span>
              <span className="text-gray-500">({segment.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PieChart