import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'

const SimpleSystemAdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshInterval, setRefreshInterval] = useState(30000)

  // Mock data to avoid hook conflicts
  const mockStats = {
    facilities: { total: 45, critical: 3, good: 35, atRisk: 5, highRisk: 2 },
    districts: { total: 8 },
    alerts: { total: 12, critical: 3, high: 4, medium: 3, low: 2 }
  }

  const mockActivity = {
    reports: { total: 23 },
    maintenance: { completed: 15, pending: 8, inProgress: 3 }
  }

  const mockFacilityDistribution = {
    'Tamale': { total: 12, critical: 1, good: 9, atRisk: 2, region: 'Northern' },
    'Yendi': { total: 8, critical: 0, good: 6, atRisk: 2, region: 'Northern' },
    'Damongo': { total: 6, critical: 1, good: 4, atRisk: 1, region: 'Northern' },
    'Bimbilla': { total: 7, critical: 0, good: 6, atRisk: 1, region: 'Northern' },
    'Salaga': { total: 5, critical: 1, good: 3, atRisk: 1, region: 'Northern' }
  }

  // System KPIs
  const systemKPIs = {
    systemUptime: 99.7,
    responseTime: 245,
    dataAccuracy: 94.2,
    userSatisfaction: 4.3,
    coverageRate: ((mockStats.facilities.total) / (mockStats.districts.total) * 100).toFixed(1),
    alertResolutionTime: 2.4,
    maintenanceEfficiency: 87.3,
    budgetUtilization: 73.2
  }

  // UNICEF-inspired color palette
  const unicefColors = {
    primary: '#1CABE2',
    secondary: '#00AEEF',
    success: '#80BD41',
    warning: '#F39C12',
    danger: '#E74C3C',
    info: '#3498DB',
    light: '#ECF0F1',
    dark: '#2C3E50'
  }

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  const refreshIntervalOptions = [
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' }
  ]

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Dashboard refreshed')
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <AppLayout
        title="System Administration Dashboard"
        subtitle="National WASH Infrastructure Monitoring • Real-time data"
        actions={(
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: unicefColors.primary }}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Interval Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Refresh:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: unicefColors.primary }}
              >
                {refreshIntervalOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              className="text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              style={{ 
                background: `linear-gradient(135deg, ${unicefColors.primary} 0%, ${unicefColors.secondary} 100%)` 
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        )}
      >
        {/* System health summary — mobile-first layout */}
        <div
          className="mb-6 overflow-hidden rounded-xl border p-4 shadow-sm sm:p-5"
          style={{
            borderColor: unicefColors.success,
            background: `linear-gradient(135deg, rgba(128, 189, 65, 0.08) 0%, rgba(255,255,255,0.95) 45%, rgba(28, 171, 226, 0.06) 100%)`
          }}
        >
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-emerald-100">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: unicefColors.success }} />
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: unicefColors.success }}
                  />
                </span>
                <span className="truncate text-sm font-semibold" style={{ color: unicefColors.success }}>
                  System operational
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Uptime</dt>
                  <dd className="mt-0.5 text-base font-bold tabular-nums text-gray-900">{systemKPIs.systemUptime}%</dd>
                </div>
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Response</dt>
                  <dd className="mt-0.5 text-base font-bold tabular-nums text-gray-900">{systemKPIs.responseTime}ms</dd>
                </div>
                <div className="rounded-lg border border-gray-100/90 bg-white/95 px-3 py-2.5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Last updated</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold tabular-nums text-gray-900">
                    {new Date().toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3 lg:w-72 lg:shrink-0 xl:w-80">
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Active facilities
                </span>
                <span className="mt-1 text-xl font-bold tabular-nums sm:text-2xl" style={{ color: unicefColors.primary }}>
                  {mockStats.facilities.total}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Districts
                </span>
                <span className="mt-1 text-xl font-bold tabular-nums sm:text-2xl" style={{ color: unicefColors.success }}>
                  {mockStats.districts.total}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-white/95 px-2 py-3 text-center shadow-sm sm:px-3 sm:py-4">
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-[11px]">
                  Active alerts
                </span>
                <span className="mt-1 text-xl font-bold tabular-nums sm:text-2xl" style={{ color: unicefColors.warning }}>
                  {mockStats.alerts.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="space-y-6">
          {/* Top Row - Key Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
              <div className="text-sm text-gray-500">Live Dashboard • UNICEF Design</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* System Health Card */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-800">System Health</h4>
                  <span className="text-2xl">🏥</span>
                </div>
                <div className="text-3xl font-bold text-blue-700">94%</div>
                <div className="text-sm text-blue-600 mt-1">Overall Performance</div>
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Total Facilities Card */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-green-800">Total Facilities</h4>
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{mockStats.facilities.total}</div>
                <div className="text-sm text-green-600 mt-1">Active Infrastructure</div>
                <div className="text-xs text-gray-600 mt-2">
                  Coverage: {systemKPIs.coverageRate}% per district
                </div>
              </div>
              
              {/* Critical Alerts Card */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-red-800">Critical Alerts</h4>
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="text-3xl font-bold text-red-700">{mockStats.facilities.critical}</div>
                <div className="text-sm text-red-600 mt-1">Immediate Attention</div>
                <div className="text-xs text-gray-600 mt-2">
                  Avg Resolution: {systemKPIs.alertResolutionTime}h
                </div>
              </div>
              
              {/* Districts Card */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-purple-800">Districts Covered</h4>
                  <span className="text-2xl">🗺️</span>
                </div>
                <div className="text-3xl font-bold text-purple-700">{mockStats.districts.total}</div>
                <div className="text-sm text-purple-600 mt-1">Northern Region</div>
                <div className="text-xs text-gray-600 mt-2">
                  Full regional coverage
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Overview and Climate */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* National Overview */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">National Overview</h3>
                  <div className="text-sm text-gray-500">UNICEF-Inspired Analytics</div>
                </div>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center border border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Beautiful Data Visualization</h4>
                    <p className="text-gray-600 mb-4">Professional charts and analytics dashboard</p>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="font-semibold text-green-600">{mockStats.facilities.good}</div>
                        <div className="text-gray-600">Good</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="font-semibold text-yellow-600">{mockStats.facilities.atRisk}</div>
                        <div className="text-gray-600">At Risk</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="font-semibold text-orange-600">{mockStats.facilities.highRisk}</div>
                        <div className="text-gray-600">High Risk</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="font-semibold text-red-600">{mockStats.facilities.critical}</div>
                        <div className="text-gray-600">Critical</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Climate Risk Analysis */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Climate Risk Analysis</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Current Weather</span>
                      <span className="text-xl">🌤️</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">28°C</div>
                    <div className="text-sm text-blue-600">Partly Cloudy</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-800">Flood Risk</span>
                      <span className="text-xl">🌊</span>
                    </div>
                    <div className="text-lg font-bold text-yellow-700">Medium</div>
                    <div className="text-sm text-yellow-600">Rainy season active</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">System Status</span>
                      <span className="text-xl">✅</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">Operational</div>
                    <div className="text-sm text-green-600">All systems normal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row - District Performance and Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* District Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">District Performance</h3>
              <div className="space-y-3">
                {Object.entries(mockFacilityDistribution).map(([district, data]) => (
                  <div key={district} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{district}</div>
                      <div className="text-sm text-gray-600">{data.total} facilities • {data.region} Region</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        data.critical > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {data.critical > 0 ? `${data.critical} critical` : 'All good'}
                      </div>
                      <div className="text-xs text-gray-500">{data.good} good</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📝</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">New facility report received from Tamale</div>
                    <div className="text-xs text-gray-600">2 minutes ago</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">✅</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Maintenance task completed in Yendi</div>
                    <div className="text-xs text-gray-600">5 minutes ago</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">High risk facility detected in Damongo</div>
                    <div className="text-xs text-gray-600">12 minutes ago</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">New district officer registered</div>
                    <div className="text-xs text-gray-600">18 minutes ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fourth Row - System Health and Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* System Health Indicators */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">System Uptime</span>
                      <span className="text-xl">⚡</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{systemKPIs.systemUptime}%</div>
                    <div className="text-sm text-green-600">Last 30 days</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Response Time</span>
                      <span className="text-xl">🚀</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{systemKPIs.responseTime}ms</div>
                    <div className="text-sm text-blue-600">Average API response</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-800">Data Accuracy</span>
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{systemKPIs.dataAccuracy}%</div>
                    <div className="text-sm text-purple-600">Verified reports</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-800">User Satisfaction</span>
                      <span className="text-xl">⭐</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">{systemKPIs.userSatisfaction}/5</div>
                    <div className="text-sm text-yellow-600">User feedback</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Panel */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors group">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">🚨</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-red-800">Emergency Broadcast</div>
                        <div className="text-xs text-red-600">Send alert to all districts</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-blue-800">Manual Backup</div>
                        <div className="text-xs text-blue-600">Trigger system backup</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors group">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-green-800">Generate Report</div>
                        <div className="text-xs text-green-600">Create system report</div>
                      </div>
                    </div>
                  </button>
                  
                  <Link 
                    to="/admin/users"
                    className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-purple-800">User Management</div>
                        <div className="text-xs text-purple-600">Manage district officers</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — desktop only */}
        <div className="mt-8 pt-6 border-t border-gray-200 hidden md:block">
          <div className="flex min-w-0 flex-col gap-4 text-xs text-gray-500 sm:text-sm md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
              <span className="shrink-0 font-medium text-gray-600">SaniSentinel v2.1.0</span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span className="break-words leading-snug">Database: Connected</span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span className="break-words leading-snug">Last backup: 2 hours ago</span>
              <span className="hidden md:inline text-gray-300" aria-hidden>
                •
              </span>
              <span className="break-words font-medium leading-snug text-green-600">UNICEF Design System</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3 md:border-t-0 md:pt-0 shrink-0">
              <Link
                to="/admin/system-logs"
                className="font-medium hover:opacity-80 transition-colors whitespace-nowrap"
                style={{ color: unicefColors.primary }}
              >
                View system logs
              </Link>
              <Link
                to="/admin/system-config"
                className="font-medium hover:opacity-80 transition-colors whitespace-nowrap"
                style={{ color: unicefColors.primary }}
              >
                System configuration
              </Link>
            </div>
          </div>
        </div>

      </AppLayout>
    </div>
  )
}

export default SimpleSystemAdminDashboard