import React from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks'
import MetricCard from '../components/UI/MetricCard'
import StatusBadge from '../components/UI/StatusBadge'
import RiskIndicator from '../components/UI/RiskIndicator'

const ProfessionalHome = () => {
  const { stats, loading, error } = useDashboard({
    autoRefresh: true,
    refreshInterval: 60000,
    includeActivity: false,
    includeMetrics: false
  })

  const features = [
    {
      icon: '📱',
      title: 'SMS-Based Reporting',
      description: 'Field workers report facility conditions via simple SMS format - no smartphone required.',
      highlight: 'Works offline'
    },
    {
      icon: '🌦️',
      title: 'Climate Integration',
      description: 'Weather data drives risk assessment with flood risk scoring and climate-triggered alerts.',
      highlight: 'Proactive monitoring'
    },
    {
      icon: '🔄',
      title: 'Automated Maintenance',
      description: 'Auto-generated tasks assigned to workers based on risk scores and facility conditions.',
      highlight: 'Smart scheduling'
    },
    {
      icon: '📊',
      title: 'Real-time Dashboard',
      description: 'Live updates with color-coded facility maps and instant alert notifications.',
      highlight: 'Live monitoring'
    }
  ]

  const quickActions = [
    {
      title: 'View Facility Map',
      description: 'Interactive map with real-time facility status',
      href: '/professional-facility-map',
      icon: '🗺️',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'System Overview',
      description: 'Dashboard with metrics and performance data',
      href: '/professional-dashboard',
      icon: '📊',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'View Reports',
      description: 'Community reports and facility conditions',
      href: '/reports',
      icon: '📝',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Maintenance Tasks',
      description: 'Scheduled and emergency maintenance work',
      href: '/maintenance',
      icon: '🔧',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SS</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">SaniSentinel</div>
                  <div className="text-xs text-gray-500">Climate-Resilient Sanitation Monitoring</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/professional-dashboard"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Enter System
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Climate-Resilient Sanitation Monitoring
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Real-time facility monitoring system for Northern Ghana, combining SMS-based field reporting 
            with climate-aware risk assessment and automated maintenance scheduling.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/professional-dashboard"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              View Dashboard
            </Link>
            <Link 
              to="/professional-facility-map"
              className="bg-white text-green-600 border border-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
            >
              View Map
            </Link>
          </div>
        </div>

        {/* System Status Overview */}
        {!error && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Facilities"
                value={stats.facilities.total}
                subtitle="monitored"
                icon="🏢"
                color="blue"
                loading={loading}
              />
              
              <MetricCard
                title="Critical Facilities"
                value={stats.facilities.critical}
                subtitle="need attention"
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

            {!loading && stats.facilities.total > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.facilities.good}</div>
                    <div className="text-sm text-gray-600">Good Condition</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.facilities.atRisk}</div>
                    <div className="text-sm text-gray-600">At Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.facilities.highRisk}</div>
                    <div className="text-sm text-gray-600">High Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.facilities.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-green-600">
                  <span>Open</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coverage Area</h3>
              <p className="text-gray-600">Northern Ghana region with 18+ districts monitored</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SMS Integration</h3>
              <p className="text-gray-600">Works with basic phones via Africa's Talking SMS gateway</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">Live dashboard updates via Supabase Realtime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">SaniSentinel</span>
            </div>
            <p className="text-gray-600 text-sm">
              Built for UNICEF StartUp Lab Hackathon 2026 • Climate-Resilient Sanitation Monitoring
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ProfessionalHome