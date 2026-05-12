import React, { useState, useMemo } from 'react'

const NationalOverviewChart = ({ 
  data, 
  facilityDistribution, 
  selectedMetric, 
  onMetricChange, 
  loading, 
  timeRange 
}) => {
  const [chartType, setChartType] = useState('bar') // 'bar', 'line', 'pie'
  const [viewMode, setViewMode] = useState('districts') // 'districts', 'regions', 'facilities'

  // Process data for different chart types
  const chartData = useMemo(() => {
    if (!facilityDistribution) return []

    return Object.entries(facilityDistribution).map(([districtName, districtStats]) => ({
      name: districtName,
      region: districtStats.region || 'Unknown',
      total: districtStats.total || 0,
      good: districtStats.good || 0,
      atRisk: districtStats.atRisk || 0,
      highRisk: districtStats.highRisk || 0,
      critical: districtStats.critical || 0,
      riskScore: districtStats.total > 0 
        ? Math.round(
            (((districtStats.atRisk || 0) * 45) + 
             ((districtStats.highRisk || 0) * 72) + 
             ((districtStats.critical || 0) * 92)) / districtStats.total
          )
        : 0
    })).sort((a, b) => b.riskScore - a.riskScore)
  }, [facilityDistribution])

  // Aggregate by regions for regional view
  const regionalData = useMemo(() => {
    const regions = {}
    chartData.forEach(district => {
      const region = district.region
      if (!regions[region]) {
        regions[region] = {
          name: region,
          total: 0,
          good: 0,
          atRisk: 0,
          highRisk: 0,
          critical: 0,
          districts: 0
        }
      }
      regions[region].total += district.total
      regions[region].good += district.good
      regions[region].atRisk += district.atRisk
      regions[region].highRisk += district.highRisk
      regions[region].critical += district.critical
      regions[region].districts += 1
    })

    return Object.values(regions).map(region => ({
      ...region,
      riskScore: region.total > 0 
        ? Math.round(
            ((region.atRisk * 45) + (region.highRisk * 72) + (region.critical * 92)) / region.total
          )
        : 0
    })).sort((a, b) => b.riskScore - a.riskScore)
  }, [chartData])

  const displayData = viewMode === 'regions' ? regionalData : chartData.slice(0, 12)

  const metricOptions = [
    { value: 'facilities', label: 'Facility Status', icon: '🏢' },
    { value: 'risk', label: 'Risk Distribution', icon: '⚠️' },
    { value: 'maintenance', label: 'Maintenance Status', icon: '🔧' },
    { value: 'alerts', label: 'Alert Trends', icon: '🚨' }
  ]

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ]

  const viewModeOptions = [
    { value: 'districts', label: 'By Districts', icon: '🏘️' },
    { value: 'regions', label: 'By Regions', icon: '🗺️' }
  ]

  // Calculate max value for scaling
  const maxValue = Math.max(...displayData.map(d => d.total), 1)

  // Color scheme for different statuses
  const statusColors = {
    good: '#10B981', // Green
    atRisk: '#F59E0B', // Yellow
    highRisk: '#F97316', // Orange
    critical: '#EF4444' // Red
  }

  const renderBarChart = () => (
    <div className="space-y-4">
      {displayData.map((item, index) => (
        <div key={item.name} className="space-y-2">
          {/* District/Region Name and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-900 min-w-0 flex-1">
                {item.name}
              </span>
              {viewMode === 'districts' && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {item.region}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">Total: {item.total}</span>
              <span className={`font-medium ${
                item.riskScore >= 70 ? 'text-red-600' : 
                item.riskScore >= 50 ? 'text-orange-600' : 
                item.riskScore >= 30 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                Risk: {item.riskScore}
              </span>
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="relative">
            <div className="flex h-8 bg-gray-100 rounded-lg overflow-hidden">
              {item.good > 0 && (
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(item.good / item.total) * 100}%` }}
                  title={`Good: ${item.good}`}
                >
                  {item.good > 0 && item.good}
                </div>
              )}
              {item.atRisk > 0 && (
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(item.atRisk / item.total) * 100}%` }}
                  title={`At Risk: ${item.atRisk}`}
                >
                  {item.atRisk > 0 && item.atRisk}
                </div>
              )}
              {item.highRisk > 0 && (
                <div 
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(item.highRisk / item.total) * 100}%` }}
                  title={`High Risk: ${item.highRisk}`}
                >
                  {item.highRisk > 0 && item.highRisk}
                </div>
              )}
              {item.critical > 0 && (
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(item.critical / item.total) * 100}%` }}
                  title={`Critical: ${item.critical}`}
                >
                  {item.critical > 0 && item.critical}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderPieChart = () => {
    const totalFacilities = displayData.reduce((sum, item) => sum + item.total, 0)
    const statusTotals = {
      good: displayData.reduce((sum, item) => sum + item.good, 0),
      atRisk: displayData.reduce((sum, item) => sum + item.atRisk, 0),
      highRisk: displayData.reduce((sum, item) => sum + item.highRisk, 0),
      critical: displayData.reduce((sum, item) => sum + item.critical, 0)
    }

    return (
      <div className="flex items-center justify-center space-x-8">
        {/* Simple Pie Chart Representation */}
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
            {Object.entries(statusTotals).map(([ status, count], index) => {
              const percentage = totalFacilities > 0 ? (count / totalFacilities) * 100 : 0
              const circumference = 2 * Math.PI * 40
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
              const rotation = Object.entries(statusTotals)
                .slice(0, index)
                .reduce((sum, [, prevCount]) => sum + ((prevCount / totalFacilities) * 360), 0)

              return count > 0 ? (
                <circle
                  key={status}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={statusColors[status]}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  style={{ 
                    transformOrigin: '50% 50%',
                    transform: `rotate(${rotation}deg)`
                  }}
                />
              ) : null
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalFacilities}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {Object.entries(statusTotals).map(([status, count]) => {
            const percentage = totalFacilities > 0 ? ((count / totalFacilities) * 100).toFixed(1) : 0
            return (
              <div key={status} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: statusColors[status] }}
                ></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {status.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {count} facilities ({percentage}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">National Overview</h3>
          <p className="text-sm text-gray-600">
            {viewMode === 'regions' ? 'Regional' : 'District'} facility status distribution
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Metric Selector */}
          <div className="flex items-center space-x-2">
            {metricOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onMetricChange(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {viewModeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setViewMode(option.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {chartTypeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setChartType(option.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <p className="text-gray-600">No data available for the selected time range</p>
            </div>
          </div>
        ) : (
          <div>
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'pie' && renderPieChart()}
            {chartType === 'line' && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📈</div>
                  <p className="text-gray-600">Line chart coming soon</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && displayData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayData.reduce((sum, item) => sum + item.good, 0)}
              </div>
              <div className="text-sm text-gray-600">Good Condition</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {displayData.reduce((sum, item) => sum + item.atRisk, 0)}
              </div>
              <div className="text-sm text-gray-600">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {displayData.reduce((sum, item) => sum + item.highRisk, 0)}
              </div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {displayData.reduce((sum, item) => sum + item.critical, 0)}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NationalOverviewChart