import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const DistrictPerformanceTable = ({ facilityDistribution, loading, timeRange }) => {
  const [sortBy, setSortBy] = useState('riskScore')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterRegion, setFilterRegion] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Process and sort data
  const processedData = useMemo(() => {
    if (!facilityDistribution) return []

    let data = Object.entries(facilityDistribution).map(([districtName, districtStats]) => {
      const total = districtStats.total || 0
      const critical = districtStats.critical || 0
      const highRisk = districtStats.highRisk || 0
      const atRisk = districtStats.atRisk || 0
      const good = districtStats.good || 0

      // Calculate weighted risk score
      const weightedRisk = total > 0 
        ? Math.round(((atRisk * 45) + (highRisk * 72) + (critical * 92)) / total)
        : 0

      // Calculate performance metrics
      const maintenanceEfficiency = Math.max(0, 100 - (critical * 10) - (highRisk * 5))
      const responseTime = critical > 0 ? Math.random() * 4 + 1 : Math.random() * 2 + 0.5 // Simulated
      const coverageScore = total > 0 ? Math.min(100, (total / 10) * 100) : 0 // Assuming 10 facilities per district is ideal

      return {
        district: districtName,
        region: districtStats.region || 'Unknown',
        total,
        good,
        atRisk,
        highRisk,
        critical,
        riskScore: weightedRisk,
        maintenanceEfficiency: Math.round(maintenanceEfficiency),
        responseTime: Number(responseTime.toFixed(1)),
        coverageScore: Math.round(coverageScore),
        lastUpdated: new Date(Date.now() - Math.random() * 86400000 * 7), // Random within last week
        trend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining'
      }
    })

    // Filter by region
    if (filterRegion !== 'all') {
      data = data.filter(item => item.region === filterRegion)
    }

    // Filter by search term
    if (searchTerm) {
      data = data.filter(item => 
        item.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.region.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort data
    data.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (sortBy === 'lastUpdated') {
        aVal = aVal.getTime()
        bVal = bVal.getTime()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return data
  }, [facilityDistribution, sortBy, sortOrder, filterRegion, searchTerm])

  // Get unique regions for filter
  const regions = useMemo(() => {
    if (!facilityDistribution) return []
    const regionSet = new Set(Object.values(facilityDistribution).map(d => d.region || 'Unknown'))
    return Array.from(regionSet).sort()
  }, [facilityDistribution])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const getRiskBadge = (score) => {
    if (score >= 70) return { color: 'bg-red-100 text-red-800 border-red-200', label: 'High Risk' }
    if (score >= 50) return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Medium Risk' }
    if (score >= 30) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Low Risk' }
    return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Good' }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <span className="text-green-500">↗️</span>
      case 'declining':
        return <span className="text-red-500">↘️</span>
      default:
        return <span className="text-gray-500">➡️</span>
    }
  }

  const getPerformanceColor = (value, type) => {
    switch (type) {
      case 'efficiency':
        if (value >= 90) return 'text-green-600'
        if (value >= 70) return 'text-yellow-600'
        return 'text-red-600'
      case 'response':
        if (value <= 2) return 'text-green-600'
        if (value <= 4) return 'text-yellow-600'
        return 'text-red-600'
      case 'coverage':
        if (value >= 80) return 'text-green-600'
        if (value >= 60) return 'text-yellow-600'
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">District Performance</h3>
          <p className="text-sm text-gray-600">
            Comprehensive performance metrics by district
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Region Filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading performance data...</p>
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <p className="text-gray-600">No districts found matching your criteria</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('district')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>District</span>
                    {getSortIcon('district')}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('region')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Region</span>
                    {getSortIcon('region')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Facilities</span>
                    {getSortIcon('total')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('riskScore')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Risk Score</span>
                    {getSortIcon('riskScore')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('maintenanceEfficiency')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Efficiency</span>
                    {getSortIcon('maintenanceEfficiency')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('responseTime')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Response Time</span>
                    {getSortIcon('responseTime')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('trend')}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Trend</span>
                    {getSortIcon('trend')}
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <span className="text-sm font-medium text-gray-700">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedData.map((district) => {
                const riskBadge = getRiskBadge(district.riskScore)
                return (
                  <tr key={district.district} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{district.district}</div>
                        <div className="text-sm text-gray-500">
                          Updated {district.lastUpdated.toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {district.region}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-medium text-gray-900">{district.total}</div>
                      <div className="text-xs text-gray-500">
                        {district.critical > 0 && (
                          <span className="text-red-600">{district.critical} critical</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskBadge.color}`}>
                        {district.riskScore}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(district.maintenanceEfficiency, 'efficiency')}`}>
                        {district.maintenanceEfficiency}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(district.responseTime, 'response')}`}>
                        {district.responseTime}h
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getTrendIcon(district.trend)}
                        <span className="text-xs text-gray-600 capitalize">{district.trend}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/admin/district/${district.district}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          to={`/admin/district/${district.district}/reports`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Reports
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && processedData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {processedData.length} districts
              {filterRegion !== 'all' && ` in ${filterRegion}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            <div className="flex items-center space-x-6">
              <div>
                Avg Risk Score: <span className="font-medium">
                  {Math.round(processedData.reduce((sum, d) => sum + d.riskScore, 0) / processedData.length)}
                </span>
              </div>
              <div>
                Avg Efficiency: <span className="font-medium">
                  {Math.round(processedData.reduce((sum, d) => sum + d.maintenanceEfficiency, 0) / processedData.length)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DistrictPerformanceTable