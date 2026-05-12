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
      highlight: 'Works offline',
      image: '/3.jpg'
    },
    {
      icon: '🌦️',
      title: 'Climate Integration',
      description: 'Weather data drives risk assessment with flood risk scoring and climate-triggered alerts.',
      highlight: 'Proactive monitoring',
      image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    {
      icon: '🔄',
      title: 'Automated Maintenance',
      description: 'Auto-generated tasks assigned to workers based on risk scores and facility conditions.',
      highlight: 'Smart scheduling',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    {
      icon: '📊',
      title: 'Real-time Dashboard',
      description: 'Live updates with color-coded facility maps and instant alert notifications.',
      highlight: 'Live monitoring',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    }
  ]

  const impactStats = [
    {
      number: '2.4M',
      label: 'People Served',
      description: 'Across Northern Ghana'
    },
    {
      number: '18+',
      label: 'Districts',
      description: 'Monitored daily'
    },
    {
      number: '95%',
      label: 'Uptime',
      description: 'System reliability'
    },
    {
      number: '24/7',
      label: 'Monitoring',
      description: 'Real-time alerts'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/1.jpg"
            alt="Climate resilient sanitation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-green-800/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-6 max-w-full">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0 animate-pulse"></span>
              <span className="text-center">Protecting Communities Through Smart Sanitation</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Clean Water,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-green-200 block">
                Healthy Future
              </span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Empowering Northern Ghana with climate-resilient sanitation monitoring. 
              Real-time facility tracking, SMS-based reporting, and predictive maintenance 
              to ensure every community has access to safe, reliable sanitation.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link 
                to="/dashboard"
                className="group bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-center">
                  View Live Dashboard
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                to="/facility-map"
                className="group bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-full hover:bg-white/20 transition-all duration-300 font-semibold text-lg"
              >
                <span className="flex items-center justify-center">
                  Explore Facilities
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Live Stats */}
          {!error && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-5xl mx-auto shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Live System Impact</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {impactStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-blue-200 font-semibold mb-1">{stat.label}</div>
                    <div className="text-blue-300 text-sm">{stat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Real Impact, Real Results
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transforming Sanitation
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 block">
                Across Northern Ghana
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every day, our system monitors critical sanitation infrastructure, 
              preventing health crises and ensuring communities have access to safe, reliable facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative">
              <img 
                src="/1.jpg"
                alt="Climate resilient sanitation"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-6 shadow-xl border border-gray-100">
                <div className="text-2xl font-bold text-green-600 mb-1">99.2%</div>
                <div className="text-sm text-gray-600">Facility Uptime</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Preventing Health Crises Before They Start
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Our predictive monitoring system identifies potential facility failures weeks in advance, 
                allowing maintenance teams to act proactively rather than reactively.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Early Warning System</h4>
                    <p className="text-gray-600">Climate data integration provides 72-hour advance warnings for weather-related risks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Rapid Response</h4>
                    <p className="text-gray-600">SMS-based alerts reach field teams instantly, reducing response time by 85%</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Data-Driven Decisions</h4>
                    <p className="text-gray-600">Real-time analytics help optimize resource allocation and maintenance scheduling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Powerful Technology
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for the Real World
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our technology is designed specifically for the challenges of sanitation monitoring 
              in Northern Ghana's unique climate and infrastructure conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0">
                  <img 
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-gray-900/20"></div>
                </div>
                
                <div className="relative z-10 p-8 h-80 flex flex-col justify-end">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-4xl">{feature.icon}</div>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-200 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Impact Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full text-green-800 text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Community First
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Every Child Deserves
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 block">
                  Safe Sanitation
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                In Northern Ghana, access to reliable sanitation directly impacts child health, 
                school attendance, and community development. Our system ensures facilities 
                remain operational when communities need them most.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-green-600 mb-1">89%</div>
                  <div className="text-sm text-gray-600">Reduced Downtime</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 mb-1">72hrs</div>
                  <div className="text-sm text-gray-600">Early Warning</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Monitoring</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 mb-1">18+</div>
                  <div className="text-sm text-gray-600">Districts</div>
                </div>
              </div>
              
              <Link
                to="/about"
                className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                Learn more about our impact
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            <div className="relative">
              <img 
                src="/2.jpg"
                alt="Children in Ghana"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-6 -left-6 bg-white rounded-xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="text-sm font-medium text-gray-900">System Active</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Protecting communities 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join the growing network of districts using SaniSentinel to ensure 
            reliable, climate-resilient sanitation for all.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-full hover:bg-gray-50 transition-colors font-semibold text-lg shadow-xl"
            >
              Access Dashboard
            </Link>
            <a
              href="mailto:info@sanissentinel.com"
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-full hover:bg-white/20 transition-colors font-semibold text-lg"
            >
              Contact Us
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
              <p className="text-blue-100">info@sanissentinel.com</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
              <p className="text-blue-100">+233 24 123 4567</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
              <p className="text-blue-100">Tamale, Northern Region</p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

export default LandingPage