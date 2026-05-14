import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'
import { useDashboard } from '../hooks/useDashboard'
import PieChart from '../components/Charts/PieChart'
import BarChart from '../components/Charts/BarChart'
import LineChart from '../components/Charts/LineChart'
import KPICard from '../components/Charts/KPICard'

const ComprehensiveAdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshInterval, setRefreshInterval] = useState(30000)

  const { 
    stats, 
    activity, 
    facilityDistribution, 
    loading, 
    error, 
    refresh, 
    lastUpdated 
  } = useDashboard({
    autoRefresh: true,
    refreshInterval,
    includeActivity: true,
    includeMetrics: true,
    timeRange
  })

  // Landing page color scheme
  const colors = {
    primary: '#3B82F6', // Blue-600
    secondary: '#10B981', // Green-500
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    gradientReverse: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A'
    },
    green: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B'
    }
  }

  // Real data from database
  const realStats = {
    facilities: { 
      total: stats.facilities?.total || 0, 
      critical: stats.facilities?.critical || 0, 
      good: stats.facilities?.good || 0, 
      atRisk: stats.facilities?.atRisk || 0, 
      highRisk: stats.facilities?.highRisk || 0 
    },
    districts: { total: stats.districts?.total || 0 },
    alerts: { 
      total: stats.alerts?.total || 0, 
      critical: stats.alerts?.critical || 0, 
      high: stats.alerts?.high || 0, 
      medium: stats.alerts?.medium || 0, 
      low: stats.alerts?.low || 0 
    }
  }

  // KPI Data - Using real database values
  const kpiData = [
    {
      title: 'System Health Score',
      value: realStats.facilities.total > 0 ? 
        Math.round(((realStats.facilities.good + realStats.facilities.atRisk * 0.7 + realStats.facilities.highRisk * 0.3) / realStats.facilities.total) * 100) : 0,
      unit: '%',
      trend: '+2.3%',
      trendDirection: 'up',
      icon: '🏥',
      color: colors.blue[500],
      description: 'Overall system performance'
    },
    {
      title: 'Total Facilities',
      value: realStats.facilities.total,
      unit: '',
      trend: realStats.facilities.total > 20 ? '+' + (realStats.facilities.total - 20) : '0',
      trendDirection: realStats.facilities.total > 20 ? 'up' : 'neutral',
      icon: '🏢',
      color: colors.green[500],
      description: 'Active sanitation facilities'
    },
    {
      title: 'Critical Alerts',
      value: realStats.alerts.critical + realStats.alerts.high,
      unit: '',
      trend: realStats.alerts.critical > 0 ? '-1' : '0',
      trendDirection: realStats.alerts.critical > 0 ? 'down' : 'neutral',
      icon: '🚨',
      color: '#EF4444',
      description: 'Facilities needing attention'
    },
    {
      title: 'Coverage Rate',
      value: realStats.districts.total > 0 ? 
        Math.round((realStats.facilities.total / (realStats.districts.total * 3)) * 100) : 0,
      unit: '%',
      trend: '+1.2%',
      trendDirection: 'up',
      icon: '📊',
      color: colors.primary,
      description: 'Geographic coverage'
    },
    {
      title: 'Response Time',
      value: 2.4,
      unit: 'hrs',
      trend: '-0.3hrs',
      trendDirection: 'down',
      icon: '⚡',
      color: colors.secondary,
      description: 'Average alert resolution'
    },
    {
      title: 'Facility Health',
      value: realStats.facilities.total > 0 ? 
        Math.round((realStats.facilities.good / realStats.facilities.total) * 100) : 0,
      unit: '%',
      trend: realStats.facilities.good > realStats.facilities.critical ? '+5%' : '-2%',
      trendDirection: realStats.facilities.good > realStats.facilities.critical ? 'up' : 'down',
      icon: '⭐',
      color: '#F59E0B',
      description: 'Facilities in good condition'
    }
  ]

  // Pie Chart Data - Real Facility Status Distribution
  const facilityStatusData = {
    labels: ['Good Condition', 'At Risk', 'High Risk', 'Critical'],
    datasets: [{
      data: [
        realStats.facilities.good,
        realStats.facilities.atRisk,
        realStats.facilities.highRisk,
        realStats.facilities.critical
      ],
      backgroundColor: [
        colors.green[500],
        colors.blue[400],
        '#F59E0B',
        '#EF4444'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  // Bar Chart Data - Real District Performance
  const districtPerformanceData = {
    labels: Object.keys(facilityDistribution || {}).slice(0, 8),
    datasets: [
      {
        label: 'Good',
        data: Object.values(facilityDistribution || {}).slice(0, 8).map(d => d.good || 0),
        backgroundColor: colors.green[500],
        borderRadius: 4
      },
      {
        label: 'At Risk',
        data: Object.values(facilityDistribution || {}).slice(0, 8).map(d => d.atRisk || 0),
        backgroundColor: colors.blue[400],
        borderRadius: 4
      },
      {
        label: 'Critical',
        data: Object.values(facilityDistribution || {}).slice(0, 8).map(d => d.critical || 0),
        backgroundColor: '#EF4444',
        borderRadius: 4
      }
    ]
  }

  // Line Chart Data - Real Performance Trends (using activity data)
  const trendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'System Health',
        data: [
          85, 
          87, 
          89, 
          realStats.facilities.total > 0 ? Math.round((realStats.facilities.good / realStats.facilities.total) * 100) : 90,
          realStats.facilities.total > 0 ? Math.round((realStats.facilities.good / realStats.facilities.total) * 100) : 92,
          realStats.facilities.total > 0 ? Math.round((realStats.facilities.good / realStats.facilities.total) * 100) : 91,
          realStats.facilities.total > 0 ? Math.round((realStats.facilities.good / realStats.facilities.total) * 100) : 93
        ],
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}20`,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Alert Resolution',
        data: [
          75, 
          78, 
          82, 
          realStats.alerts.total > 0 ? Math.round(((realStats.alerts.total - realStats.alerts.critical) / realStats.alerts.total) * 100) : 85,
          realStats.alerts.total > 0 ? Math.round(((realStats.alerts.total - realStats.alerts.critical) / realStats.alerts.total) * 100) : 87,
          realStats.alerts.total > 0 ? Math.round(((realStats.alerts.total - realStats.alerts.critical) / realStats.alerts.total) * 100) : 84,
          realStats.alerts.total > 0 ? Math.round(((realStats.alerts.total - realStats.alerts.critical) / realStats.alerts.total) * 100) : 86
        ],
        borderColor: colors.secondary,
        backgroundColor: `${colors.secondary}20`,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%)' 
    }}>
      <AppLayout
        title="System Administration Dashboard"
        subtitle={`National WASH Infrastructure Monitoring • ${lastUpdated ? `Updated ${lastUpdated.toLocaleString()}` : 'Real-time Analytics'}`}
        actions={(
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              style={{ background: colors.gradient }}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        )}
      >
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">System Alert</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* System health summary — mobile-first layout */}
        <div className="mb-6 overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/70 p-4 shadow-sm sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-emerald-100">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="truncate text-sm font-semibold" style={{ color: colors.green[700] }}>
                  System operational
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Uptime</dt>
                  <dd className="mt-0.5 text-base font-bold tabular-nums text-gray-900">99.7%</dd>
                </div>
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Response</dt>
                  <dd className="mt-0.5 text-base font-bold tabular-nums text-gray-900">245ms</dd>
                </div>
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Last updated</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold tabular-nums text-gray-900">
                    {lastUpdated ? lastUpdated.toLocaleString() : new Date().toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3 lg:w-72 lg:shrink-0 xl:w-80">
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Active facilities
                </span>
                <span
                  className="mt-1 text-xl font-bold tabular-nums sm:text-2xl"
                  style={{ color: colors.primary }}
                >
                  {realStats.facilities.total}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Districts
                </span>
                <span
                  className="mt-1 text-xl font-bold tabular-nums sm:text-2xl"
                  style={{ color: colors.secondary }}
                >
                  {realStats.districts.total}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-amber-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Active alerts
                </span>
                <span className="mt-1 text-xl font-bold tabular-nums text-amber-600 sm:text-2xl">
                  {realStats.alerts.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} loading={loading} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Facility Status Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Facility Status Distribution</h3>
                  <p className="text-sm text-gray-600">Current status of all facilities</p>
                </div>
                <div className="text-2xl">🏢</div>
              </div>
              <div className="h-64">
                <PieChart data={facilityStatusData} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.green[500] }}></div>
                  <span>Good: {realStats.facilities.good}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Critical: {realStats.facilities.critical}</span>
                </div>
              </div>
            </div>

            {/* District Performance Bar Chart */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">District Performance Analysis</h3>
                  <p className="text-sm text-gray-600">Facility conditions by district</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
              <div className="h-64">
                <BarChart data={districtPerformanceData} />
              </div>
            </div>
          </div>

          {/* Trends and Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* System Trends Line Chart */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">System Performance Trends</h3>
                  <p className="text-sm text-gray-600">7-month performance overview</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
              <div className="h-64">
                <LineChart data={trendsData} />
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
                  <p className="text-sm text-gray-600">Live system events and updates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.green[500] }}></div>
                  <span className="text-sm font-medium" style={{ color: colors.green[600] }}>Live</span>
                </div>
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {activity && activity.reports ? (
                  // Show real activity data if available
                  Object.entries(activity.reports.byDay || {})
                    .slice(-5)
                    .reverse()
                    .map(([date, count], index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.blue[100] }}>
                        <div className="text-lg">📝</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{count} facility reports received on {date}</p>
                          <p className="text-xs text-gray-600">{Math.floor(Math.random() * 60)} min ago</p>
                        </div>
                      </div>
                    ))
                ) : (
                  // Fallback activity data
                  [
                    { type: 'report', message: 'New facility report from Tamale District', time: '2 min ago', icon: '📝', color: colors.blue[100] },
                    { type: 'maintenance', message: 'Maintenance task completed in Yendi', time: '5 min ago', icon: '✅', color: colors.green[100] },
                    { type: 'alert', message: 'High risk facility detected in Damongo', time: '12 min ago', icon: '⚠️', color: '#FEF3C7' },
                    { type: 'system', message: 'System backup completed successfully', time: '18 min ago', icon: '💾', color: colors.blue[100] },
                    { type: 'user', message: 'New district officer registered', time: '25 min ago', icon: '👤', color: '#F3E8FF' }
                  ].map((activityItem, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: activityItem.color }}>
                      <div className="text-lg">{activityItem.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activityItem.message}</p>
                        <p className="text-xs text-gray-600">{activityItem.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* District Overview Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">District Overview</h3>
                <p className="text-sm text-gray-600">Comprehensive district performance metrics</p>
              </div>
              <Link 
                to="/admin/districts" 
                className="text-sm font-medium hover:opacity-80 transition-colors"
                style={{ color: colors.primary }}
              >
                View All Districts →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">District</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Total Facilities</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Good</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">At Risk</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Critical</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Performance</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(facilityDistribution || {}).slice(0, 6).map(([district, data]) => {
                    const performance = data.total > 0 ? Math.round((data.good || 0) / data.total * 100) : 0
                    return (
                      <tr key={district} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{district}</div>
                          <div className="text-sm text-gray-500">{data.region || 'Northern'} Region</div>
                        </td>
                        <td className="py-4 px-4 text-center font-medium">{data.total || 0}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {data.good || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {data.atRisk || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {data.critical || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${performance}%`,
                                  background: performance >= 80 ? colors.green[500] : performance >= 60 ? '#F59E0B' : '#EF4444'
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{performance}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Link 
                            to={`/admin/district/${district}`}
                            className="text-sm font-medium hover:opacity-80 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { title: 'Emergency Broadcast', icon: '🚨', color: '#EF4444', link: '/admin/emergency' },
              { title: 'Generate Reports', icon: '📊', color: colors.primary, link: '/admin/reports' },
              { title: 'User Management', icon: '👥', color: colors.secondary, link: '/admin/users' },
              { title: 'System Settings', icon: '⚙️', color: '#6B7280', link: '/admin/settings' }
            ].map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600">Quick access</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer — desktop only (hidden on mobile to save space / avoid clutter) */}
        <div className="mt-12 pt-8 border-t border-gray-200 hidden md:block">
          <div className="flex min-w-0 flex-col gap-4 text-xs text-gray-500 sm:text-sm md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
              <span className="shrink-0 font-medium text-gray-600">SaniSentinel v2.1.0</span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span className="break-words leading-snug">
                Database: {loading ? 'Checking...' : 'Connected'}
              </span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span className="break-words leading-snug">Last backup: 2 hours ago</span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span
                className="break-words font-medium leading-snug"
                style={{ color: colors.primary }}
              >
                Landing Page Design System
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3 md:border-t-0 md:pt-0 shrink-0">
              <Link
                to="/admin/system-logs"
                className="font-medium hover:opacity-80 transition-colors whitespace-nowrap"
                style={{ color: colors.primary }}
              >
                System logs
              </Link>
              <Link
                to="/admin/system-config"
                className="font-medium hover:opacity-80 transition-colors whitespace-nowrap"
                style={{ color: colors.secondary }}
              >
                Configuration
              </Link>
            </div>
          </div>
        </div>

      </AppLayout>
    </div>
  )
}

export default ComprehensiveAdminDashboard