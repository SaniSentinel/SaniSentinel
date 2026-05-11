import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
    { name: 'Contact', href: '#contact' }
  ]

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b backdrop-blur-md ${
      isScrolled
        ? 'bg-white/95 shadow-md border-slate-200/90'
        : 'bg-white/90 shadow-sm border-white/40'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 bg-gradient-to-r from-blue-600 to-green-600 shadow-md">
              <svg className="w-7 h-7 text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-2xl font-bold text-slate-900 transition-colors duration-300">
                SaniSentinel
              </div>
              <div className="text-sm font-medium text-blue-700 transition-colors duration-300">
                Protecting Communities
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="relative font-semibold text-slate-700 hover:text-blue-700 transition-all duration-300 hover:scale-105 group py-1"
              >
                {item.name}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-green-700"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all duration-300"
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-6 space-y-1 bg-white border border-slate-200 rounded-2xl mt-2 mx-2 shadow-xl">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left px-4 py-3 text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-xl transition-all duration-300 font-medium"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <Link
                  to="/dashboard"
                  className="block w-full text-center px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-300 font-semibold border border-blue-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/login"
                  className="block w-full text-center bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold shadow-md"
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