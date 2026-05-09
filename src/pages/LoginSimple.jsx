import React, { useState } from 'react'

const LoginSimple = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
    alert(`Login attempt with: ${email}`)
  }

  const handleTestLogin = (testEmail, testPassword) => {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">SS</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">SaniSentinel</div>
              <div className="text-xs text-gray-500">Climate-Resilient Sanitation</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Sign in to your account
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Access the sanitation monitoring system
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Sign in (Test)
          </button>
        </form>

        {/* Test Accounts */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Test Accounts</h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">System Administrator</div>
                  <div className="text-xs text-gray-600">admin@sanissentinel.com</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestLogin('admin@sanissentinel.com', 'SaniSentinel2024!')}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Use
                </button>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">District Officer</div>
                  <div className="text-xs text-gray-600">officer@tamale.gov</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestLogin('officer@tamale.gov', 'Tamale2024!')}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-blue-600">
            <p>💡 Click "Use" to auto-fill credentials, then click "Sign in"</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center space-y-2">
          <div>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
              Go to Dashboard
            </a>
          </div>
          <div>
            <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              Back to Home
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Built for UNICEF StartUp Lab Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginSimple