import React from 'react'
import AuthTest from '../components/AuthTest'

const AuthTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication System Test</h1>
          <p className="text-gray-600">Test the useAuth hook functionality and authentication flow</p>
        </div>
        <AuthTest />
      </div>
    </div>
  )
}

export default AuthTestPage