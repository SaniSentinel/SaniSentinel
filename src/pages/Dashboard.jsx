import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  StatCard, 
  FacilityStatCard, 
  CriticalStatCard, 
  AlertsStatCard, 
  DistrictsStatCard,
  RiskLevelCard,
  MetricCard,
  ActivityCard,
  AlertsSidebar 
} from '../components'
import { useDashboard } from '../hooks'

const Dashboard = () => {
  const [alertsSidebarOpen, setAlertsSidebarOpen] = useState(false)
  const { 
    stats, 
    activity, 
    metrics, 
    facilityDistribution,
    loading, 
    error, 
    lastUpdated,
    derivedStats,
    refresh 
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    includeActivity: true,
    includeMetrics: true
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-semibold text-gray-900">SaniSentinel</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link to="/dashboard" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</Link>
              <Link to="/facility-map" className="text-gray-500 hover:text-gray-900">Facility Map</Link>
            </nav>
            
            {/* Alerts Toggle Button */}
            <button
              onClick={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              title="Toggle Alerts"
            >
              <span className="text-lg">🚨</span>
              <span className="text-sm font-medium">
                Alerts {stats.alerts.total > 0 && `(${stats.alerts.total})`}
              </span>
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={refresh}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh Data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FacilityStatCard
            total={stats.facilities.total}
            critical={stats.facilities.critical}
            loading={loading}
            onClick={() => window.location.href = '/facility-map'}
          />
          
          <CriticalStatCard
            count={stats.facilities.critical}
            loading={loading}
            onClick={() => setAlertsSidebarOpen(true)}
          />
          
          <AlertsStatCard
            count={stats.alerts.today}
            loading={loading}
            onClick={() => setAlertsSidebarOpen(true)}
          />
          
          <DistrictsStatCard
            count={stats.districts.total}
            loading={loading}
          />
        </div>

        {/* Risk Level Distribution */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Facility Risk Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RiskLevelCard
              level="good"
              count={stats.facilities.good}
              percentage={derivedStats.healthyPercentage}
              loading={loading}
            />
            <RiskLevelCard
              level="at_risk"
              count={stats.facilities.atRisk}
              percentage={stats.facilities.total > 0 ? Math.round((stats.facilities.atRisk / stats.facilities.total) * 100) : 0}
              loading={loading}
            />
            <RiskLevelCard
              level="high_risk"
              count={stats.facilities.highRisk}
              percentage={stats.facilities.total > 0 ? Math.round((stats.facilities.highRisk / stats.facilities.total) * 100) : 0}
              loading={loading}
            />
            <RiskLevelCard
              level="critical"
              count={stats.facilities.critical}
              percentage={derivedStats.criticalPercentage}
              loading={loading}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Average Risk Score"
              value={metrics.facilityHealth.averageRiskScore}
              target={30}
              unit="/100"
              icon="📊"
              loading={loading}
            />
            <MetricCard
              title="Alert Resolution Rate"
              value={metrics.alertResolution.resolutionRate}
              target={90}
              unit="%"
              icon="✅"
              loading={loading}
            />
            <MetricCard
              title="Maintenance Completion"
              value={metrics.maintenanceEfficiency.completionRate}
              target={85}
              unit="%"
              icon="🔧"
              loading={loading}
            />
          </div>
        </div>

        {/* Activity Summary and District Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <ActivityCard
            title="Recent Activity (7 days)"
            loading={loading}
            items={[
              {
                icon: '📝',
                label: 'Reports Submitted',
                value: activity.reports.total
              },
              {
                icon: '🚨',
                label: 'Alerts Generated',
                value: activity.alerts.total
              },
              {
                icon: '🔧',
                label: 'Maintenance Tasks',
                value: activity.maintenance.total
              },
              {
                icon: '✅',
                label: 'Tasks Completed',
                value: activity.maintenance.completed
              },
              {
                icon: '⏳',
                label: 'Tasks Pending',
                value: activity.maintenance.pending
              }
            ]}
          />

          {/* District Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Districts Overview</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.districts.byRegion).map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🗺️</span>
                      <span className="text-sm font-medium text-gray-700">{region} Region</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500">districts</span>
                    </div>
                  </div>
                ))}
                
                {stats.districts.regions.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-2xl mb-2">📍</div>
                    <div className="text-sm">No district data available</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alert Types Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Alerts by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.alerts.todayByType).map(([type, count]) => {
              const typeConfigs = {
                maintenance_due: { icon: '🔧', label: 'Maintenance Due', color: 'yellow' },
                high_risk: { icon: '⚠️', label: 'High Risk', color: 'red' },
                critical_status: { icon: '🚨', label: 'Critical Status', color: 'red' },
                overflow_detected: { icon: '💧', label: 'Overflow Detected', color: 'blue' },
                system_failure: { icon: '❌', label: 'System Failure', color: 'red' },
                climate_warning: { icon: '🌧️', label: 'Climate Warning', color: 'purple' }
              }
              
              const config = typeConfigs[type] || { icon: '📋', label: type, color: 'gray' }
              
              return (
                <StatCard
                  key={type}
                  title={config.label}
                  value={count}
                  icon={config.icon}
                  color={config.color}
                  size="sm"
                />
              )
            })}
            
            {Object.keys(stats.alerts.todayByType).length === 0 && !loading && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-sm">No alerts today</div>
              </div>
            )}
          </div>
        </div>

        {/* System Health Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">
                {derivedStats.healthyPercentage >= 80 ? '🟢' : 
                 derivedStats.healthyPercentage >= 60 ? '🟡' : '🔴'}
              </div>
              <div className="text-sm text-gray-600">Overall Health</div>
              <div className="text-lg font-bold text-gray-900">
                {derivedStats.healthyPercentage}% Healthy
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">
                {stats.alerts.critical === 0 ? '✅' : 
                 stats.alerts.critical <= 5 ? '⚠️' : '🚨'}
              </div>
              <div className="text-sm text-gray-600">Critical Issues</div>
              <div className="text-lg font-bold text-gray-900">
                {stats.alerts.critical} Active
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">
                {metrics.maintenanceEfficiency.completionRate >= 80 ? '🎯' : 
                 metrics.maintenanceEfficiency.completionRate >= 60 ? '📈' : '📉'}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
              <div className="text-lg font-bold text-gray-900">
                {metrics.maintenanceEfficiency.completionRate}% Complete
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Alerts Sidebar */}
      <AlertsSidebar 
        isOpen={alertsSidebarOpen}
        onToggle={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
      />
    </div>
  )
}

export default Dashboard