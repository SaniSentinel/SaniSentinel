import React from 'react'

const LineChart = ({ data }) => {
  if (!data || !data.datasets || !data.labels) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  const { labels, datasets } = data
  
  // Calculate max and min values for scaling
  const allValues = datasets.flatMap(dataset => dataset.data)
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const valueRange = maxValue - minValue
  const padding = valueRange * 0.1 // 10% padding
  const chartMax = maxValue + padding
  const chartMin = Math.max(0, minValue - padding)
  const chartRange = chartMax - chartMin
  
  const chartHeight = 200
  const chartWidth = 400
  const leftPadding = 50
  const rightPadding = 20
  const topPadding = 20
  const bottomPadding = 40
  
  const plotWidth = chartWidth - leftPadding - rightPadding
  const plotHeight = chartHeight - topPadding - bottomPadding
  
  // Calculate point positions
  const getPointPosition = (dataIndex, value) => {
    const x = leftPadding + (dataIndex / (labels.length - 1)) * plotWidth
    const y = topPadding + plotHeight - ((value - chartMin) / chartRange) * plotHeight
    return { x, y }
  }

  // Create SVG path for line
  const createLinePath = (dataset) => {
    const points = dataset.data.map((value, index) => getPointPosition(index, value))
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    // Use smooth curves (quadratic bezier)
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1]
      const currentPoint = points[i]
      
      if (dataset.tension && dataset.tension > 0) {
        // Smooth curve
        const controlX = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
        path += ` Q ${controlX} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`
      } else {
        // Straight line
        path += ` L ${currentPoint.x} ${currentPoint.y}`
      }
    }
    
    return path
  }

  // Create area path for filled charts
  const createAreaPath = (dataset) => {
    const linePath = createLinePath(dataset)
    const points = dataset.data.map((value, index) => getPointPosition(index, value))
    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    
    return `${linePath} L ${lastPoint.x} ${topPadding + plotHeight} L ${firstPoint.x} ${topPadding + plotHeight} Z`
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <svg width={chartWidth + 40} height={chartHeight + 60} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percentage) => {
            const value = chartMin + (chartRange * percentage / 100)
            const y = topPadding + plotHeight - (percentage / 100) * plotHeight
            
            return (
              <g key={percentage}>
                <line 
                  x1={leftPadding} 
                  y1={y} 
                  x2={leftPadding + plotWidth} 
                  y2={y} 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                />
                <text 
                  x={leftPadding - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-xs fill-gray-600"
                >
                  {Math.round(value)}
                </text>
              </g>
            )
          })}
          
          {/* Y-axis */}
          <line 
            x1={leftPadding} 
            y1={topPadding} 
            x2={leftPadding} 
            y2={topPadding + plotHeight} 
            stroke="#e5e7eb" 
            strokeWidth="2"
          />
          
          {/* X-axis */}
          <line 
            x1={leftPadding} 
            y1={topPadding + plotHeight} 
            x2={leftPadding + plotWidth} 
            y2={topPadding + plotHeight} 
            stroke="#e5e7eb" 
            strokeWidth="2"
          />
          
          {/* X-axis labels */}
          {labels.map((label, index) => {
            const x = leftPadding + (index / (labels.length - 1)) * plotWidth
            return (
              <text
                key={index}
                x={x}
                y={topPadding + plotHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-700"
              >
                {label}
              </text>
            )
          })}
          
          {/* Data lines and areas */}
          {datasets.map((dataset, datasetIndex) => {
            const points = dataset.data.map((value, index) => getPointPosition(index, value))
            
            return (
              <g key={datasetIndex}>
                {/* Fill area if specified */}
                {dataset.fill && (
                  <path
                    d={createAreaPath(dataset)}
                    fill={dataset.backgroundColor || dataset.borderColor + '20'}
                    opacity="0.3"
                  />
                )}
                
                {/* Line */}
                <path
                  d={createLinePath(dataset)}
                  fill="none"
                  stroke={dataset.borderColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="hover:stroke-opacity-80 transition-all"
                />
                
                {/* Data points */}
                {points.map((point, pointIndex) => (
                  <g key={pointIndex}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="white"
                      stroke={dataset.borderColor}
                      strokeWidth="3"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                    {/* Value label on hover */}
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      className="text-xs fill-gray-700 font-medium opacity-0 hover:opacity-100 transition-opacity"
                    >
                      {dataset.data[pointIndex]}
                    </text>
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-0.5 rounded"
                style={{ backgroundColor: dataset.borderColor }}
              ></div>
              <span className="text-sm text-gray-700">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LineChart