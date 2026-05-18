import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import StatusBadge from '../components/UI/StatusBadge'
import MetricCard from '../components/UI/MetricCard'
import { reports } from '../lib/reports'
import { districts } from '../lib/districts'
import { supabase } from '../lib/supabase'
import { buildAreaOptionsFromFacilities, getReportAreaLabel } from '../lib/reportAreas'
import { useAuth } from '../hooks/useAuth'

const ProfessionalReports = () => {
  const { user, isDistrictOfficer, officerDistrictScopeLoading } = useAuth()
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

  // Active tab: 'workers' | 'community'
  const [activeTab, setActiveTab] = useState('workers')

  // Filter states
  const [filters, setFilters] = useState({
    districtId: 'all',
    area: 'all',
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

  const [allDistricts, setAllDistricts] = useState([])
  const [districtAreas, setDistrictAreas] = useState([])
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

    } catch (err) {
      console.error('Error loading reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.dateRange, filters.startDate, filters.endDate])

  // Admin: load every district for the filter dropdown
  useEffect(() => {
    if (!isNationalAdmin) {
      setAllDistricts([])
      return
    }

    let cancelled = false
    districts.getAll().then((result) => {
      if (cancelled) return
      if (result.error) {
        console.error('Error loading districts for filter:', result.error)
        setAllDistricts([])
        return
      }
      setAllDistricts(result.data || [])
    })

    return () => {
      cancelled = true
    }
  }, [isNationalAdmin])

  // Officer: load areas (facility locations) within assigned district
  useEffect(() => {
    if (!isDistrictOfficer) {
      setDistrictAreas([])
      return
    }
    if (officerDistrictScopeLoading || !user?.district_id) {
      setDistrictAreas([])
      return
    }

    let cancelled = false
    supabase
      .from('facilities')
      .select('id, name, district:districts(name)')
      .eq('district_id', user.district_id)
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error loading district areas for filter:', error.message)
          setDistrictAreas([])
          return
        }
        setDistrictAreas(buildAreaOptionsFromFacilities(data || []))
      })

    return () => {
      cancelled = true
    }
  }, [isDistrictOfficer, user?.district_id, officerDistrictScopeLoading])

  // Classify a report as worker or community based on reported_by field
  const isWorkerReport = (report) => {
    const r = report.reported_by || ''
    // Worker reports come from officer: prefix, worker: prefix, or are linked to a known worker phone
    return r.startsWith('officer:') || r.startsWith('worker:') || r.startsWith('USSD:worker:')
  }

  // Apply filters to reports
  useEffect(() => {
    let filtered = [...reportsData]

    // Tab filter: workers vs community
    if (activeTab === 'workers') {
      filtered = filtered.filter(r => isWorkerReport(r))
    } else {
      filtered = filtered.filter(r => !isWorkerReport(r))
    }

    if (isNationalAdmin && filters.districtId !== 'all') {
      filtered = filtered.filter(
        (report) => report.facility?.district?.id === filters.districtId
      )
    }

    if (isDistrictOfficer && filters.area !== 'all') {
      filtered = filtered.filter(
        (report) => getReportAreaLabel(report) === filters.area
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
  }, [reportsData, filters, activeTab, isNationalAdmin, isDistrictOfficer])

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
      districtId: 'all',
      area: 'all',
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

  const workerCount = reportsData.filter(r => isWorkerReport(r)).length
  const communityCount = reportsData.filter(r => !isWorkerReport(r)).length

  const reportsSubtitle = isNationalAdmin
    ? `${filteredReports.length} of ${stats.total} reports shown • National view`
    : isDistrictOfficer
      ? `${filteredReports.length} of ${stats.total} reports shown${user?.district_name ? ` • ${user.district_name} district` : ''}`
      : `${filteredReports.length} of ${stats.total} reports shown`

  return (
    <AppLayout 
      title="Reports" 
      subtitle={reportsSubtitle}
      actions={actions}
    >
      {/* Worker / Community Tabs - Enhanced Design */}
      <div className="flex gap-2 mb-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 w-fit shadow-inner border border-gray-200">
        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform ${
            activeTab === 'workers'
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <span className="text-lg">👷</span>
          <span>Workers Reports</span>
          <span className={`ml-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
            activeTab === 'workers' ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-gray-200 text-gray-700'
          }`}>{workerCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform ${
            activeTab === 'community'
              ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg shadow-green-200 scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <span className="text-lg">🏘️</span>
          <span>Community Reports</span>
          <span className={`ml-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
            activeTab === 'community' ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-gray-200 text-gray-700'
          }`}>{communityCount}</span>
        </button>
      </div>

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

      {/* Filters - Enhanced Design */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Filters</h3>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          {isNationalAdmin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>📍</span>
                Select District
              </label>
              <select
                value={filters.districtId}
                onChange={(e) => handleFilterChange('districtId', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm"
              >
                <option value="all">All Districts</option>
                {allDistricts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isDistrictOfficer && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>🗺️</span>
                Select Area
              </label>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                disabled={officerDistrictScopeLoading}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Areas</option>
                {districtAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span>🔍</span>
              Condition
            </label>
            <select 
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm"
            >
              <option value="all">All Conditions</option>
              <option value="good">✅ Good</option>
              <option value="damaged">🔨 Damaged</option>
              <option value="overflow">💧 Overflow</option>
              <option value="dry">☀️ Dry</option>
              <option value="blocked">🚫 Blocked</option>
              <option value="out_of_service">⚠️ Out of Service</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span>📅</span>
              Date Range
            </label>
            <select 
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm"
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
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span>📞</span>
              Reporter
            </label>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={filters.reporter}
              onChange={(e) => handleFilterChange('reporter', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>📆</span>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>📆</span>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Facility Search */}
        <div className="mt-5">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span>🏢</span>
            Facility Search
          </label>
          <input
            type="text"
            placeholder="Search by facility name..."
            value={filters.facility}
            onChange={(e) => handleFilterChange('facility', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-colors shadow-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Reports Table - Enhanced Design */}
      <div ref={printableReportRef} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Reports <span className="text-green-600">({filteredReports.length})</span>
              </h3>
            </div>
            <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="text-gray-300 text-7xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters to see more results.</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📅 Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🏢 Facility
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {isDistrictOfficer ? '🗺️ Area' : '📍 District'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🔍 Condition
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📞 Reporter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📝 Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className={`${getConditionRowColor(report.condition)} hover:shadow-md hover:scale-[1.01] transition-all duration-200`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-bold text-gray-900">{report.facility?.name || 'Unknown Facility'}</div>
                          <div className="text-gray-500 text-xs font-medium mt-0.5">{report.facility?.type || 'Unknown Type'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {isDistrictOfficer ? (
                            <>
                              <div className="font-semibold">{getReportAreaLabel(report)}</div>
                              <div className="text-gray-500 text-xs font-medium mt-0.5">{report.facility?.name || ''}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold">{report.facility?.district?.name || 'Unknown'}</div>
                              <div className="text-gray-500 text-xs font-medium mt-0.5">{report.facility?.district?.region || ''}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={report.condition} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-semibold">{formatPhoneNumber(report.reported_by)}</div>
                          <div className="text-xs font-medium mt-1">
                            {isWorkerReport(report) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                                <span>👷</span> Worker
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                                <span>🏘️</span> Community
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {report.notes ? (
                          <div className="space-y-1">
                            {report.notes.split(' | ').map((part, i) => (
                              <div key={i} className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 px-2 py-1 rounded">
                                {part}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Enhanced Design */}
            {totalPages > 1 && (
              <div className="px-6 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
                    Showing <span className="text-green-600">{startIndex + 1}</span> to <span className="text-green-600">{Math.min(endIndex, filteredReports.length)}</span> of <span className="text-green-600">{filteredReports.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      ← Previous
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
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg shadow-green-200 scale-110'
                                : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
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
                      className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Next →
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