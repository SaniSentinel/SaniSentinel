import React from 'react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Your App
            </h1>
          </div>
          <nav className="flex space-x-8">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Home
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header