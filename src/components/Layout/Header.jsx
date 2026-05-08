import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-sm border-b">
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
              className={`${
                isActive('/') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-900'
              } pb-4 transition-colors`}
            >
              Home
            </Link>
            <Link 
              to="/map" 
              className={`${
                isActive('/map') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-900'
              } pb-4 transition-colors`}
            >
              Map View
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header