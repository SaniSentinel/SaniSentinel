import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AlertsSidebar from '../AlertsSidebar'
import { useAlerts } from '../../hooks'
import { useAuth } from '../../hooks/useAuth'

const AppLayout = ({ children, title, subtitle, actions }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [alertsSidebarOpen, setAlertsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { summary } = useAlerts({ includeSummary: true })
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      setIsSigningOut(true)
      const result = await signOut()
      if (!result?.error) {
        navigate('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: '📊', current: location.pathname === '/dashboard' },
    { name: 'Facility Map', href: '/facility-map', icon: '🗺️', current: location.pathname === '/facility-map' },
    { name: 'Reports', href: '/reports', icon: '📝', current: location.pathname === '/reports' },
    { name: 'Maintenance', href: '/maintenance', icon: '🔧', current: location.pathname === '/maintenance' },
    { name: 'Workers', href: '/workers', icon: '👥', current: location.pathname === '/workers' },
  ]

  const quickStats = [
    { label: 'Critical', value: summary.critical, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'High Risk', value: summary.high, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Active Alerts', value: summary.total, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SS</span>
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">SaniSentinel</div>
                  <div className="text-xs text-gray-500">Climate-Resilient Sanitation Monitoring</div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4">
              {quickStats.map((stat, index) => (
                <div key={index} className={`px-3 py-1 rounded-full ${stat.bgColor}`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${stat.color}`}>{stat.label}</span>
                    <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Alerts Button */}
              <button
                onClick={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Alerts"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6m0 0l3-3m-3 3l-3-3" />
                </svg>
                {summary.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {summary.total > 99 ? '99+' : summary.total}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'User'}</div>
                  <div className="text-xs text-gray-500">{user?.role || 'Authenticated'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="ml-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? 'Signing out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center space-x-3">{actions}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Alerts Sidebar */}
      <AlertsSidebar 
        isOpen={alertsSidebarOpen}
        onToggle={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
      />
    </div>
  )
}

export default AppLayout