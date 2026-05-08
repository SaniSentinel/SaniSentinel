import React, { useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/UI/MetricCard'
import StatusBadge from '../components/UI/StatusBadge'
import RiskIndicator, { RiskProgressBar } from '../components/UI/RiskIndicator'
import { useDashboard } from '../hooks'

const ProfessionalDashboard = () => {
  const { 
    stats, 
    activity, 
    metrics, 
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

  const [timeRange, setTimeRange] = useState('7d')

  if (error) {
    return (
      <AppLayout title="System Overview" subtitle="Real-time facility monitoring and alerts">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">System Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </AppLayout>
    )
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <select 
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
      </select>
      <button
        onClick={refresh}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  )

  return (
    <AppLayout 
      title="System Overview" 
      subtitle={lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'Loading system data...'}
      actions={actions}
    >
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Facilities"
          value={stats.facilities.total}
          subtitle="monitored"
          icon="🏢"
          color="blue"
          loading={loading}
          onClick={() => window.location.href = '/facility-map'}
        />
        
        <MetricCard
          title="Critical Facilities"
          value={stats.facilities.critical}
          change={stats.facilities.critical > 0 ? `${derivedStats.criticalPercentage}%` : null}
          changeType={stats.facilities.critical > 0 ? 'negative' : 'positive'}
          icon="🚨"
          color="red"
          loading={loading}
        />
        
        <MetricCard
          title="Active Alerts"
          value={stats.alerts.total}
          subtitle="unresolved"
          icon="⚠️"
          color="yellow"
          loading={loading}
        />
        
        <MetricCard
          title="Districts Covered"
          value={stats.districts.total}
          subtitle="regions"
          icon="🗺️"
          color="green"
          loading={loading}
        />
      </div>

      {/* System Health Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              derivedStats.healthyPercentage >= 80 ? 'bg-green-500' : 
              derivedStats.healthyPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {derivedStats.healthyPercentage}% Healthy
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.facilities.good}
            </div>
            <div className="text-sm text-gray-600 mb-2">Good Condition</div>
            <RiskProgressBar score={(stats.facilities.good / stats.facilities.total) * 100} />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {stats.facilities.atRisk}
            </div>
            <div className="text-sm text-gray-600 mb-2">At Risk</div>
            <RiskProgressBar score={(stats.facilities.atRisk / stats.facilities.total) * 100} />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {stats.facilities.highRisk}
            </div>
            <div className="text-sm text-gray-600 mb-2">High Risk</div>
            <RiskProgressBar score={(stats.facilities.highRisk / stats.facilities.total) * 100} />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {stats.facilities.critical}
            </div>
            <div className="text-sm text-gray-600 mb-2">Critical</div>
            <RiskProgressBar score={(stats.facilities.critical / stats.facilities.total) * 100} />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Average Risk Score</span>
                <span className="text-lg font-bold text-gray-900">
                  {metrics.facilityHealth.averageRiskScore}/100
                </span>
              </div>
              <RiskProgressBar 
                score={metrics.facilityHealth.averageRiskScore} 
                showPercentage={false}
              />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <RiskIndicator score={metrics.facilityHealth.averageRiskScore} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alert Resolution</h3>
            <span className="text-2xl">✅</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {metrics.alertResolution.resolutionRate}%
                </span>
              </div>
              <RiskProgressBar 
                score={metrics.alertResolution.resolutionRate} 
                showPercentage={false}
              />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {metrics.alertResolution.resolvedAlerts} of {metrics.alertResolution.totalAlerts} resolved
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Maintenance</h3>
            <span className="text-2xl">🔧</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {metrics.maintenanceEfficiency.completionRate}%
                </span>
              </div>
              <RiskProgressBar 
                score={metrics.maintenanceEfficiency.completionRate} 
                showPercentage={false}
              />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {metrics.maintenanceEfficiency.completedTasks} of {metrics.maintenanceEfficiency.totalTasks} completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & District Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Reports Submitted</div>
                    <div className="text-xs text-gray-500">Last 7 days</div>
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-600">{activity.reports.total}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🚨</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Alerts Generated</div>
                    <div className="text-xs text-gray-500">Last 7 days</div>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-600">{activity.alerts.total}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tasks Completed</div>
                    <div className="text-xs text-gray-500">Last 7 days</div>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">{activity.maintenance.completed}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⏳</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pending Tasks</div>
                    <div className="text-xs text-gray-500">Requires attention</div>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-600">{activity.maintenance.pending}</span>
              </div>
            </div>
          )}
        </div>

        {/* District Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">District Coverage</h3>
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
                <div key={region} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🗺️</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{region} Region</div>
                      <div className="text-xs text-gray-500">{count} districts</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{count}</div>
                    <div className="text-xs text-gray-500">districts</div>
                  </div>
                </div>
              ))}
              
              {stats.districts.regions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📍</div>
                  <div className="text-sm">No district data available</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's Alerts Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Alert Summary</h3>
        {Object.keys(stats.alerts.todayByType).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.alerts.todayByType).map(([type, count]) => {
              const typeConfigs = {
                maintenance_due: { icon: '🔧', label: 'Maintenance Due', color: 'yellow' },
                high_risk: { icon: '⚠️', label: 'High Risk', color: 'orange' },
                critical_status: { icon: '🚨', label: 'Critical Status', color: 'red' },
                overflow_detected: { icon: '💧', label: 'Overflow Detected', color: 'blue' },
                system_failure: { icon: '❌', label: 'System Failure', color: 'red' },
                climate_warning: { icon: '🌧️', label: 'Climate Warning', color: 'gray' }
              }
              
              const config = typeConfigs[type] || { icon: '📋', label: type, color: 'gray' }
              
              return (
                <div key={type} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{config.label}</div>
                      <div className="text-lg font-bold text-gray-700">{count}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-sm">No alerts today - system running smoothly</div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default ProfessionalDashboard