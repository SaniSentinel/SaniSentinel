import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getRoleHomePathFromUser } from '../lib/roleRouting'

const LoginDirect = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        window.location.href = getRoleHomePathFromUser(user)
      }
    }
    checkUser()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Direct call to supabase.auth.signInWithPassword()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        throw error
      }

      console.log('Login successful:', data.user)
      setUser(data.user)
      
      window.location.href = getRoleHomePathFromUser(data.user)
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = (testEmail, testPassword) => {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
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
            Direct Supabase authentication
          </p>
        </div>

        {/* Success Message */}
        {user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">
                Successfully logged in as {user.email}. Redirecting...
              </p>
            </div>
          </div>
        )}

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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Clear form
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
            
            <button
              type="button"
              onClick={clearForm}
              disabled={loading}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>
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
                  disabled={loading}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  disabled={loading}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
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

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Debug Info</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Email: {email || 'Not entered'}</div>
              <div>Password: {password ? '•'.repeat(password.length) : 'Not entered'}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Error: {error || 'None'}</div>
              <div>User: {user ? user.email : 'Not authenticated'}</div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-sm">
            <a href="/" className="text-green-600 hover:text-green-700">
              ← Back to Home
            </a>
            <a href="/demo/auth" className="text-blue-600 hover:text-blue-700">
              Auth Demo
            </a>
          </div>
          <p className="text-xs text-gray-500">
            Built for UNICEF StartUp Lab Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginDirect