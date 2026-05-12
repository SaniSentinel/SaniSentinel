import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
    { name: 'Contact', href: '#contact' }
  ]

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setIsMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 w-full bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo and Branding - Left Aligned */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                SaniSentinel
              </h1>
              <p className="text-xs lg:text-sm text-gray-600 leading-tight">
                Climate-Resilient Sanitation Monitoring
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="px-4 py-2 font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 space-y-2 border-t border-gray-200 mt-4">
                <Link
                  to="/dashboard"
                  className="block w-full text-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium border border-gray-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/login"
                  className="block w-full text-center bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 font-medium shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar