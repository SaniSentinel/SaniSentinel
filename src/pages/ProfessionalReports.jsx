import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import StatusBadge from '../components/UI/StatusBadge'
import MetricCard from '../components/UI/MetricCard'
import { reports } from '../lib/reports'
import { useAuth } from '../hooks/useAuth'

const ProfessionalReports = () => {
  const { user } = useAuth()
  const isNationalAdmin = user?.role === 'system_admin' || user?.role === 'admin'
  const [reportsData, setReportsData] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    good: 0,
    problems: 0,
    today: 0
  })

  // Filter states
  const [filters, setFilters] = useState({
    district: 'all',
    condition: 'all',
    dateRange: '7d',
    startDate: '',
    endDate: '',
    reporter: '',
    facility: ''
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Available districts for filtering
  const [availableDistricts, setAvailableDistricts] = useState([])
  const printableReportRef = useRef(null)

  // Load reports data
  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let reportsResult
      
      // Apply date range filter
      if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        reportsResult = await reports.getByDateRange(
          new Date(filters.startDate).toISOString(),
          new Date(filters.endDate + 'T23:59:59').toISOString(),
          1000
        )
      } else if (filters.dateRange !== 'all') {
        const daysBack = {
          '1d': 1,
          '7d': 7,
          '30d': 30,
          '90d': 90
        }[filters.dateRange] || 7

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysBack)
        
        reportsResult = await reports.getByDateRange(
          cutoffDate.toISOString(),
          new Date().toISOString(),
          1000
        )
      } else {
        reportsResult = await reports.getAll(1000)
      }

      if (reportsResult.error) {
        throw new Error(reportsResult.error)
      }

      const reportsWithDistricts = reportsResult.data || []
      setReportsData(reportsWithDistricts)

      // Calculate stats
      const newStats = {
        total: reportsWithDistricts.length,
        good: reportsWithDistricts.filter(r => r.condition === 'good').length,
        problems: reportsWithDistricts.filter(r => r.condition !== 'good').length,
        today: reportsWithDistricts.filter(r => {
          const reportDate = new Date(r.created_at).toDateString()
          const today = new Date().toDateString()
          return reportDate === today
        }).length
      }
      setStats(newStats)

      // Extract unique districts
      const districts = new Set()
      reportsWithDistricts.forEach(report => {
        if (report.facility?.district?.name) {
          districts.add(report.facility.district.name)
        }
      })
      setAvailableDistricts(Array.from(districts).sort())

    } catch (err) {
      console.error('Error loading reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.dateRange, filters.startDate, filters.endDate])

  // Apply filters to reports
  useEffect(() => {
    let filtered = [...reportsData]

    // District filter
    if (filters.district !== 'all') {
      filtered = filtered.filter(report => 
        report.facility?.district?.name === filters.district
      )
    }

    // Condition filter
    if (filters.condition !== 'all') {
      filtered = filtered.filter(report => report.condition === filters.condition)
    }

    // Reporter filter
    if (filters.reporter.trim()) {
      filtered = filtered.filter(report => 
        report.reported_by.toLowerCase().includes(filters.reporter.toLowerCase())
      )
    }

    // Facility filter
    if (filters.facility.trim()) {
      filtered = filtered.filter(report => 
        report.facility?.name?.toLowerCase().includes(filters.facility.toLowerCase())
      )
    }

    setFilteredReports(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [reportsData, filters])

  // Load initial data
  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      district: 'all',
      condition: 'all',
      dateRange: '7d',
      startDate: '',
      endDate: '',
      reporter: '',
      facility: ''
    })
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReports = filteredReports.slice(startIndex, endIndex)

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (phone.startsWith('+233')) {
      return phone.replace('+233', '0')
    }
    return phone
  }

  // Get condition color for table rows
  const getConditionRowColor = (condition) => {
    const colors = {
      good: 'bg-green-50',
      damaged: 'bg-orange-50',
      overflow: 'bg-red-50',
      dry: 'bg-yellow-50',
      blocked: 'bg-red-50',
      out_of_service: 'bg-gray-50'
    }
    return colors[condition] || 'bg-white'
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={loadReports}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
      <button
        onClick={() => {
          if (!printableReportRef.current) return
          const printWindow = window.open('', '_blank')
          if (!printWindow) return

          printWindow.document.write(`
            <html>
              <head>
                <title>SaniSentinel Reports</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
                  h1 { font-size: 20px; margin-bottom: 6px; }
                  .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
                  th { background: #f3f4f6; }
                </style>
              </head>
              <body>
                <h1>SaniSentinel Report</h1>
                <div class="meta">Generated ${new Date().toLocaleString()}</div>
                ${printableReportRef.current.innerHTML}
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Print</span>
      </button>
    </div>
  )

  if (loading) {
    return (
      <AppLayout title="Reports" subtitle="Loading reports data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Reports</h2>
            <p className="text-gray-600">Fetching data from database...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Reports" subtitle="Error loading data" actions={actions}>
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Reports</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadReports}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  const reportsSubtitle = isNationalAdmin
    ? `${filteredReports.length} of ${stats.total} reports shown • National view (all districts)`
    : `${filteredReports.length} of ${stats.total} reports shown`

  return (
    <AppLayout 
      title="Reports" 
      subtitle={reportsSubtitle}
      actions={actions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Reports"
          value={stats.total}
          subtitle="all time"
          icon="📝"
          color="blue"
        />
        
        <MetricCard
          title="Good Condition"
          value={stats.good}
          subtitle={`${stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0}% of total`}
          icon="✅"
          color="green"
        />
        
        <MetricCard
          title="Problem Reports"
          value={stats.problems}
          subtitle={`${stats.total > 0 ? Math.round((stats.problems / stats.total) * 100) : 0}% of total`}
          icon="⚠️"
          color="red"
        />
        
        <MetricCard
          title="Today's Reports"
          value={stats.today}
          subtitle="last 24 hours"
          icon="📅"
          color="yellow"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select 
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select 
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Conditions</option>
              <option value="good">Good</option>
              <option value="damaged">Damaged</option>
              <option value="overflow">Overflow</option>
              <option value="dry">Dry</option>
              <option value="blocked">Blocked</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select 
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Reporter Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={filters.reporter}
              onChange={(e) => handleFilterChange('reporter', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        )}

        {/* Facility Search */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Facility Search</label>
          <input
            type="text"
            placeholder="Search by facility name..."
            value={filters.facility}
            onChange={(e) => handleFilterChange('facility', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div ref={printableReportRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Reports ({filteredReports.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className={`${getConditionRowColor(report.condition)} hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{report.facility?.name || 'Unknown Facility'}</div>
                          <div className="text-gray-500 text-xs">{report.facility?.type || 'Unknown Type'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{report.facility?.district?.name || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs">{report.facility?.district?.region || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={report.condition} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPhoneNumber(report.reported_by)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={report.notes}>
                          {report.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-green-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default ProfessionalReports