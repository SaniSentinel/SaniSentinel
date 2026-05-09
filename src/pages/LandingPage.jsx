import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Layout/Navbar'
import LandingFooter from '../components/Layout/LandingFooter'
import { useDashboard } from '../hooks'
import MetricCard from '../components/UI/MetricCard'

const LandingPage = () => {
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

  const benefits = [
    {
      icon: '🎯',
      title: 'Proactive Monitoring',
      description: 'Identify issues before they become critical problems'
    },
    {
      icon: '💰',
      title: 'Cost Effective',
      description: 'Reduce maintenance costs through predictive scheduling'
    },
    {
      icon: '🌍',
      title: 'Climate Resilient',
      description: 'Adapt to changing weather patterns and climate risks'
    },
    {
      icon: '📈',
      title: 'Data Driven',
      description: 'Make informed decisions based on real-time data'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Climate-Resilient
              <span className="text-green-600 block">Sanitation Monitoring</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Real-time facility monitoring system for Northern Ghana, combining SMS-based field reporting 
              with climate-aware risk assessment and automated maintenance scheduling.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link 
                to="/dashboard"
                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
              >
                View Dashboard
              </Link>
              <Link 
                to="/facility-map"
                className="bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-colors font-semibold text-lg"
              >
                Explore Map
              </Link>
            </div>

            {/* System Status Overview */}
            {!error && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Live System Status</h2>
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
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Sanitation Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for the challenges of sanitation monitoring in Northern Ghana's climate conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Northern Ghana's Unique Challenges
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                SaniSentinel addresses the growing pressure on Northern Ghana's sanitation infrastructure 
                from climate shocks. Seasonal flooding and drought routinely damage facilities and 
                disrupt the sanitation service chain.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Monitoring</h4>
                    <p className="text-gray-600">Track facility conditions across 18+ districts in real-time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Climate Integration</h4>
                    <p className="text-gray-600">Anticipate climate impacts on sanitation infrastructure</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">SMS Accessibility</h4>
                    <p className="text-gray-600">Works with basic phones - no smartphone required</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">System Coverage</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Districts Monitored</span>
                  <span className="font-semibold text-gray-900">18+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Facilities Tracked</span>
                  <span className="font-semibold text-gray-900">{stats.facilities.total || '25+'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">SMS Integration</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Climate Data</span>
                  <span className="font-semibold text-green-600">Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform sanitation monitoring in your district? Contact us to learn more 
              about implementing SaniSentinel in your area.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">info@sanissentinel.com</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">+233 24 123 4567</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600">Tamale, Northern Region, Ghana</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg inline-block"
            >
              Access System
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

export default LandingPage