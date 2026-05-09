import React from 'react'

const LoginTest = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Test Page</h1>
        <p className="text-gray-600">This is a simple test to verify the login route works.</p>
        <div className="mt-4">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

export default LoginTest