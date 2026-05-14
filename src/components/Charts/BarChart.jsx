import React from 'react'

const BarChart = ({ data }) => {
  if (!data || !Array.isArray(data.datasets) || !Array.isArray(data.labels)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  const { labels, datasets } = data

  const numericRows = datasets.map((dataset) =>
    (dataset.data || []).map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
  )
  const flatValues = numericRows.flat()

  if (labels.length === 0 || flatValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  const maxValue = Math.max(0, ...flatValues)
  const scaleMax = maxValue > 0 ? maxValue : 1

  const chartHeight = 200
  const chartWidth = 400
  const denom = labels.length * datasets.length + labels.length
  const barWidth = Math.min(40, chartWidth / Math.max(denom, 1))
  const groupWidth = barWidth * datasets.length
  const groupSpacing = 20

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={chartWidth + 100} height={chartHeight + 80} className="overflow-visible">
          {/* Y-axis */}
          <line 
            x1="50" 
            y1="20" 
            x2="50" 
            y2={chartHeight + 20} 
            stroke="#e5e7eb" 
            strokeWidth="1"
          />
          
          {/* X-axis */}
          <line 
            x1="50" 
            y1={chartHeight + 20} 
            x2={chartWidth + 50} 
            y2={chartHeight + 20} 
            stroke="#e5e7eb" 
            strokeWidth="1"
          />
          
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((value) => {
            const percentage = value / 100
            const scaledValue = Math.round(maxValue * percentage)
            const y = chartHeight + 20 - percentage * chartHeight
            
            return (
              <g key={value}>
                <line 
                  x1="45" 
                  y1={y} 
                  x2="50" 
                  y2={y} 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                />
                <text 
                  x="40" 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-xs fill-gray-600"
                >
                  {scaledValue}
                </text>
                {value > 0 && (
                  <line 
                    x1="50" 
                    y1={y} 
                    x2={chartWidth + 50} 
                    y2={y} 
                    stroke="#f3f4f6" 
                    strokeWidth="1"
                  />
                )}
              </g>
            )
          })}
          
          {/* Bars */}
          {labels.map((label, labelIndex) => {
            const groupX = 50 + labelIndex * (groupWidth + groupSpacing)
            
            return (
              <g key={labelIndex}>
                {datasets.map((dataset, datasetIndex) => {
                  const value = numericRows[datasetIndex]?.[labelIndex] ?? 0
                  const barHeight = (value / scaleMax) * chartHeight
                  const barX = groupX + datasetIndex * barWidth
                  const barY = chartHeight + 20 - barHeight
                  
                  return (
                    <g key={datasetIndex}>
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth - 2}
                        height={barHeight}
                        fill={dataset.backgroundColor}
                        rx={dataset.borderRadius || 0}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      {/* Value label on top of bar */}
                      {value > 0 && (
                        <text
                          x={barX + (barWidth - 2) / 2}
                          y={barY - 5}
                          textAnchor="middle"
                          className="text-xs fill-gray-700 font-medium"
                        >
                          {String(value)}
                        </text>
                      )}
                    </g>
                  )
                })}
                
                {/* X-axis label */}
                <text
                  x={groupX + groupWidth / 2}
                  y={chartHeight + 40}
                  textAnchor="middle"
                  className="text-xs fill-gray-700"
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: dataset.backgroundColor }}
              ></div>
              <span className="text-sm text-gray-700">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BarChart