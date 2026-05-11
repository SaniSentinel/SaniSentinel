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
  const isAdminUser = user?.role === 'admin' || user?.role === 'system_admin'

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

  const path = location.pathname
  const isOfficer = user?.role === 'district_officer'
  const useSidebarLayout = isAdminUser || isOfficer

  const navigation = [
    { name: 'Overview', href: isAdminUser ? '/system-admin-dashboard' : '/dashboard', icon: '📊', current: path === '/dashboard' || path === '/admin-dashboard' || path === '/system-admin-dashboard' },
    { name: 'Facility Map', href: '/facility-map', icon: '🗺️', current: path === '/facility-map' || path === '/professional-facility-map' },
    { name: 'Reports', href: '/reports', icon: '📝', current: path === '/reports' || path === '/professional-reports' },
    { name: 'Maintenance', href: '/maintenance', icon: '🔧', current: path === '/maintenance' || path === '/professional-maintenance' },
    { name: 'Workers', href: '/workers', icon: '👥', current: path === '/workers' || path === '/professional-workers' },
  ]

  const officerNavIsActive = (item) =>
    path === item.href || (item.alsoMatch && item.alsoMatch.includes(path))

  const officerSidebarSections = [
    {
      title: 'District operations',
      items: [
        { name: 'Overview', href: '/officer-dashboard', icon: '📊' },
        { name: 'Facility Map', href: '/officer-map', icon: '🗺️' },
        { name: 'My Alerts', href: '/officer-alerts', icon: '🚨' },
        { name: 'Reports', href: '/reports', icon: '📝', alsoMatch: ['/professional-reports'] },
        { name: 'Maintenance', href: '/maintenance', icon: '🔧', alsoMatch: ['/professional-maintenance'] },
        { name: 'My Workers', href: '/officer-workers', icon: '👥' }
      ]
    }
  ]

  const adminSidebarSections = [
    {
      title: 'System Administration',
      items: [
        { name: 'System Dashboard', href: '/system-admin-dashboard', icon: '📊' },
        { name: 'Risk Config', href: '/admin/system-config', icon: '🎛️' },
        { name: 'GIS Map', href: '/admin/gis-map', icon: '🗺️' },
        { name: 'SMS Gateway Logs', href: '/admin/sms-logs', icon: '📱' }
      ]
    },
    {
      title: 'User Management',
      items: [
        { name: 'District Officer Accounts', href: '/admin/users', icon: '👥' }
      ]
    },
    {
      title: 'National data',
      items: [
        { name: 'All reports', href: '/reports', icon: '📝', alsoMatch: ['/professional-reports'] },
        { name: 'Facility map', href: '/facility-map', icon: '🗺️', alsoMatch: ['/professional-facility-map'] },
        { name: 'Maintenance', href: '/maintenance', icon: '🔧', alsoMatch: ['/professional-maintenance'] },
        { name: 'All workers', href: '/workers', icon: '👷', alsoMatch: ['/professional-workers'] },
      ]
    },
    {
      title: 'National Reports',
      items: [
        { name: 'Reports & Exports', href: '/admin/reports-exports', icon: '📊' }
      ]
    }
  ]

  const quickStats = [
    { label: 'Critical', value: summary.critical, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'High Risk', value: summary.high, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Active Alerts', value: summary.total, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-green-50/20">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-white via-blue-50/30 to-green-50/30 shadow-lg border-b border-blue-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link
                to={isAdminUser ? '/admin-dashboard' : (isOfficer ? '/officer-dashboard' : '/dashboard')}
                className="flex items-center space-x-3 group"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    <span className="text-white font-bold text-sm">SS</span>
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    SaniSentinel
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Climate-Resilient Sanitation Monitoring</div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-3">
              {quickStats.map((stat, index) => (
                <div key={index} className={`px-4 py-2 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-105 ${
                  stat.label === 'Critical' 
                    ? 'bg-red-50/80 border-red-200/50 shadow-red-100' 
                    : stat.label === 'High Risk'
                    ? 'bg-orange-50/80 border-orange-200/50 shadow-orange-100'
                    : 'bg-blue-50/80 border-blue-200/50 shadow-blue-100'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold ${stat.color}`}>{stat.label}</span>
                    <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Alerts Button */}
              <button
                onClick={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
                className="relative p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 border border-transparent hover:border-blue-200/50 backdrop-blur-sm"
                title="View Alerts"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6m0 0l3-3m-3 3l-3-3" />
                </svg>
                {summary.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {summary.total > 99 ? '99+' : summary.total}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-blue-100/50 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">
                    {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800">{user?.name || user?.email || 'User'}</div>
                  <div className="text-xs text-gray-600 font-medium">{user?.role || 'Authenticated'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-sm font-medium text-gray-700 hover:from-red-50 hover:to-red-100 hover:border-red-200 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                >
                  {isSigningOut ? 'Signing out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary tab navigation — workers / generic users only (officers use sidebar) */}
      {!isAdminUser && !isOfficer && (
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
      )}

      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className="bg-gradient-to-r from-white via-blue-50/20 to-green-50/20 border-b border-blue-100/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{subtitle}</span>
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center space-x-3">{actions}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content — admins & district officers use left sidebar */}
      {useSidebarLayout ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-80 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-2xl border border-blue-100/50 shadow-xl backdrop-blur-sm p-6 h-fit lg:sticky lg:top-4 overflow-hidden relative">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              {/* Content wrapper */}
              <div className="relative z-10">
              {isAdminUser &&
                adminSidebarSections.map((section, sectionIndex) => (
                  <div key={section.title} className="mb-8 last:mb-0">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {section.title}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => {
                        const active =
                          location.pathname === item.href ||
                          (item.alsoMatch && item.alsoMatch.includes(location.pathname))
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
                              active
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25 border border-blue-200'
                                : 'text-gray-700 hover:bg-white/70 hover:shadow-md hover:border-blue-100 border border-transparent backdrop-blur-sm'
                            }`}
                          >
                            <div className={`text-lg transition-transform duration-200 group-hover:scale-110 ${
                              active ? 'drop-shadow-sm' : ''
                            }`}>
                              {item.icon}
                            </div>
                            <span className={`flex-1 ${active ? 'font-semibold' : ''}`}>
                              {item.name}
                            </span>
                            {active && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                            {!active && (
                              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              {isOfficer &&
                officerSidebarSections.map((section, sectionIndex) => (
                  <div key={section.title} className="mb-8 last:mb-0">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {section.title}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => {
                        const active = officerNavIsActive(item)
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
                              active
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25 border border-blue-200'
                                : 'text-gray-700 hover:bg-white/70 hover:shadow-md hover:border-blue-100 border border-transparent backdrop-blur-sm'
                            }`}
                          >
                            <div className={`text-lg transition-transform duration-200 group-hover:scale-110 ${
                              active ? 'drop-shadow-sm' : ''
                            }`}>
                              {item.icon}
                            </div>
                            <span className={`flex-1 ${active ? 'font-semibold' : ''}`}>
                              {item.name}
                            </span>
                            {active && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                            {!active && (
                              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              
              {/* Sidebar Footer */}
              <div className="mt-8 pt-6 border-t border-blue-100/50">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SS</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">SaniSentinel</div>
                      <div className="text-xs text-gray-600">v2.1.0</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    Protecting communities through smart sanitation monitoring
                  </div>
                </div>
              </div>
              
              </div>
            </aside>

            <main className="flex-1 min-w-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-2xl p-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm min-h-full p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-2xl">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm p-6">
            {children}
          </div>
        </main>
      )}

      {/* Alerts Sidebar */}
      <AlertsSidebar 
        isOpen={alertsSidebarOpen}
        onToggle={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
      />
    </div>
  )
}

export default AppLayout