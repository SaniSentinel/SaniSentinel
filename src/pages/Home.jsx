import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-green-50">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <h1 className="text-xl font-semibold text-gray-900">
                  SaniSentinel
                </h1>
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link 
                to="/" 
                className="text-blue-600 border-b-2 border-blue-600 pb-4 transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/map" 
                className="text-gray-500 hover:text-gray-900 pb-4 transition-colors"
              >
                Map View
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="text-center max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <span className="text-6xl mb-4 block">🌿</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SaniSentinel
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Climate-Resilient Sanitation Monitoring & Alert System
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Real-time monitoring of sanitation facilities across Northern Ghana with 
            climate-aware risk assessment and automated maintenance scheduling.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link 
            to="/facility-map"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors group transform hover:scale-105"
          >
            <div className="text-3xl mb-3">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">Facility Map</h3>
            <p className="text-blue-100">
              Interactive map with color-coded facility markers based on risk levels
            </p>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transform hover:scale-105 transition-transform">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Dashboard</h3>
            <p className="text-gray-600">
              Analytics and insights about facility performance and maintenance needs
            </p>
            <span className="text-sm text-gray-400 mt-2 block">Coming Soon</span>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-semibold text-gray-900">SMS Reports</h4>
            <p className="text-sm text-gray-600">Field workers report via SMS</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🌧️</div>
            <h4 className="font-semibold text-gray-900">Climate Monitoring</h4>
            <p className="text-sm text-gray-600">Weather-based risk assessment</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🔧</div>
            <h4 className="font-semibold text-gray-900">Auto Maintenance</h4>
            <p className="text-sm text-gray-600">Automated task scheduling</p>
          </div>
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
          <h4 className="font-semibold text-gray-900 mb-4">System Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">25+</div>
              <div className="text-sm text-gray-500">Facilities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">18+</div>
              <div className="text-sm text-gray-500">Districts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-500">Monitoring</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">SMS</div>
              <div className="text-sm text-gray-500">Alerts</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Home