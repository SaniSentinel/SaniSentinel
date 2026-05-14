import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AlertsSidebar from '../AlertsSidebar'
import { useAlerts } from '../../hooks'
import { useAuth } from '../../hooks/useAuth'

const AppLayout = ({ children, title, subtitle, actions }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [alertsSidebarOpen, setAlertsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
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

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-green-50/20">
      {/* Top bar: fixed so it always stays visible while scrolling (sticky can fail with some parent overflow / mobile quirks) */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top,0px)] backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-200 ease-out supports-[backdrop-filter]:backdrop-blur-lg ${
          navScrolled
            ? 'border-gray-200/95 bg-white shadow-[0_6px_28px_-6px_rgba(15,23,42,0.16)] lg:bg-white/98 lg:shadow-[0_8px_30px_-8px_rgba(15,23,42,0.12)]'
            : 'border-gray-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)] lg:border-blue-100/60 lg:bg-gradient-to-r lg:from-white lg:via-blue-50/40 lg:to-green-50/40 lg:shadow-sm'
        }`}
      >
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 items-center justify-between gap-2 min-w-0 sm:h-16">
            {/* Mobile Menu Button (Left side on mobile) */}
            {useSidebarLayout && (
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 lg:flex-initial">
              <Link
                to={isAdminUser ? '/admin-dashboard' : (isOfficer ? '/officer-dashboard' : '/dashboard')}
                className="flex items-center space-x-2 sm:space-x-3 group min-w-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    <span className="text-white font-bold text-xs sm:text-sm">SS</span>
                  </div>
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent leading-tight truncate">
                    SaniSentinel
                  </div>
                  <div className="text-xs text-gray-600 font-medium leading-tight line-clamp-2">Climate-Resilient Sanitation Monitoring</div>
                </div>
              </Link>
            </div>

            {/* Quick Stats - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {quickStats.map((stat, index) => (
                <div key={index} className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-105 ${
                  stat.label === 'Critical' 
                    ? 'bg-red-50/80 border-red-200/50 shadow-red-100' 
                    : stat.label === 'High Risk'
                    ? 'bg-orange-50/80 border-orange-200/50 shadow-orange-100'
                    : 'bg-blue-50/80 border-blue-200/50 shadow-blue-100'
                }`}>
                  <div className="flex items-center space-x-1.5 lg:space-x-2">
                    <span className={`text-xs lg:text-sm font-semibold ${stat.color}`}>{stat.label}</span>
                    <span className={`text-base lg:text-lg font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Alerts Button */}
              <button
                onClick={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
                className="relative p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 border border-transparent hover:border-blue-200/50 backdrop-blur-sm"
                title="View Alerts"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6m0 0l3-3m-3 3l-3-3" />
                </svg>
                {summary.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {summary.total > 99 ? '99+' : summary.total}
                  </span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                  title="User Menu"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileDropdownOpen(false)}
                    ></div>
                    
                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-[min(100vw-1rem,18rem)] sm:w-72 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      {/* User Info Section */}
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {user?.name || user?.email || 'User'}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {user?.role === 'system_admin' ? 'System Administrator' : 
                               user?.role === 'admin' ? 'Administrator' :
                               user?.role === 'district_officer' ? 'District Officer' :
                               user?.role || 'User'}
                            </div>
                            {user?.email && user?.name && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <div className="p-2">
                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false)
                            await handleLogout()
                          }}
                          disabled={isSigningOut}
                          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Layout offset for fixed navbar (safe area + h-14 / sm:h-16 toolbar) */}
      <div
        className="pointer-events-none h-[calc(env(safe-area-inset-top,0px)+3.5rem)] shrink-0 select-none sm:h-[calc(env(safe-area-inset-top,0px)+4rem)]"
        aria-hidden
      />

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
      {(title || subtitle || actions) && useSidebarLayout && (
        <div className="lg:ml-64 bg-gradient-to-r from-white via-blue-50/20 to-green-50/20 border-b border-blue-100/50 backdrop-blur-sm">
          <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-start gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="min-w-0 break-words leading-snug">{subtitle}</span>
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto [&>button]:min-h-[2.5rem] [&>button]:sm:min-h-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Page Header for non-sidebar layouts */}
      {(title || subtitle || actions) && !useSidebarLayout && (
        <div className="bg-gradient-to-r from-white via-blue-50/20 to-green-50/20 border-b border-blue-100/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2 truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center space-x-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{subtitle}</span>
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">{actions}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content — admins & district officers use left sidebar */}
      {useSidebarLayout ? (
        <div className="flex">
          {/* Mobile Sidebar Overlay */}
          {mobileSidebarOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              ></div>
              <aside className="fixed left-0 bottom-0 z-50 w-64 overflow-y-auto border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 lg:hidden top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))]">
                <div className="p-4">
                {isAdminUser &&
                  adminSidebarSections.map((section, sectionIndex) => (
                    <div key={section.title} className="mb-6 last:mb-0">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {section.title}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {section.items.map((item, itemIndex) => {
                          const active =
                            location.pathname === item.href ||
                            (item.alsoMatch && item.alsoMatch.includes(location.pathname))
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                active
                                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                              }`}
                            >
                              <div className={`text-base ${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                                {item.icon}
                              </div>
                              <span className="flex-1">{item.name}</span>
                              {active && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                {isOfficer &&
                  officerSidebarSections.map((section, sectionIndex) => (
                    <div key={section.title} className="mb-6 last:mb-0">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {section.title}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {section.items.map((item, itemIndex) => {
                          const active = officerNavIsActive(item)
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                active
                                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                              }`}
                            >
                              <div className={`text-base ${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                                {item.icon}
                              </div>
                              <span className="flex-1">{item.name}</span>
                              {active && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                
                {/* Sidebar Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">SS</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">SaniSentinel</div>
                        <div className="text-xs text-gray-500">v2.1.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </>
          )}

          {/* Desktop Sidebar - Hidden on mobile */}
          <aside className="fixed bottom-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-gray-200 bg-white shadow-sm lg:block top-[calc(4rem+env(safe-area-inset-top,0px))]">
            <div className="p-4">
              {isAdminUser &&
                adminSidebarSections.map((section, sectionIndex) => (
                  <div key={section.title} className="mb-6 last:mb-0">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {section.title}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => {
                        const active =
                          location.pathname === item.href ||
                          (item.alsoMatch && item.alsoMatch.includes(location.pathname))
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              active
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                            }`}
                          >
                            <div className={`text-base ${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                              {item.icon}
                            </div>
                            <span className="flex-1">{item.name}</span>
                            {active && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              {isOfficer &&
                officerSidebarSections.map((section, sectionIndex) => (
                  <div key={section.title} className="mb-6 last:mb-0">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {section.title}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => {
                        const active = officerNavIsActive(item)
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              active
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                            }`}
                          >
                            <div className={`text-base ${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                              {item.icon}
                            </div>
                            <span className="flex-1">{item.name}</span>
                            {active && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              
              {/* Sidebar Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">SS</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">SaniSentinel</div>
                      <div className="text-xs text-gray-500">v2.1.0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area - Responsive offset */}
          <main
            className={`flex-1 lg:ml-64 min-h-screen bg-gray-50 pt-0 ${
              isOfficer ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : ''
            }`}
          >
            <div className="p-3 sm:p-4 lg:p-6 max-w-[100vw] min-w-0 overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm p-4 sm:p-6">
            {children}
          </div>
        </main>
      )}

      {/* Alerts Sidebar */}
      <AlertsSidebar 
        isOpen={alertsSidebarOpen}
        onToggle={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
      />

      {/* Officer: thumb-friendly bottom navigation (mobile / tablet below lg) */}
      {isOfficer && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.08)] pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]"
          aria-label="District navigation"
        >
          <div className="flex overflow-x-auto gap-0.5 px-1.5 py-1.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {officerSidebarSections.flatMap((section) => section.items).map((item) => {
              const active = officerNavIsActive(item)
              return (
                <Link
                  key={`${item.href}-${item.name}`}
                  to={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 shrink-0 w-[4.75rem] snap-start rounded-xl px-1 py-1.5 transition-colors ${
                    active
                      ? 'bg-gradient-to-br from-blue-500 to-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-tight text-center line-clamp-2 px-0.5 ${
                      active ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

export default AppLayout