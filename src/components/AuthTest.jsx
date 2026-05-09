import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks'

const AuthTest = () => {
  const { 
    user, 
    rawUser,
    loading, 
    error, 
    isAuthenticated, 
    isAdmin, 
    isDistrictOfficer,
    hasPermission,
    hasRole,
    canAccessDistrict,
    signIn,
    signOut,
    getCurrentUser
  } = useAuth()

  const [testResults, setTestResults] = useState([])
  const [testEmail, setTestEmail] = useState('admin@sanissentinel.com')
  const [testPassword, setTestPassword] = useState('SaniSentinel2024!')

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, {
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runAuthTests = async () => {
    setTestResults([])
    
    // Test 1: Check initial state
    addTestResult('Initial State', 'INFO', `Loading: ${loading}, Authenticated: ${isAuthenticated}`)
    
    // Test 2: Get current user
    try {
      const currentUser = await getCurrentUser()
      addTestResult('Get Current User', currentUser ? 'PASS' : 'FAIL', 
        currentUser ? `User: ${currentUser.email}` : 'No user found')
    } catch (err) {
      addTestResult('Get Current User', 'ERROR', err.message)
    }

    // Test 3: Test sign in (if not authenticated)
    if (!isAuthenticated) {
      try {
        const result = await signIn(testEmail, testPassword)
        addTestResult('Sign In Test', result.error ? 'FAIL' : 'PASS', 
          result.error || `Signed in as: ${result.user?.email}`)
      } catch (err) {
        addTestResult('Sign In Test', 'ERROR', err.message)
      }
    }
  }

  const testPermissions = () => {
    if (!user) {
      addTestResult('Permission Tests', 'SKIP', 'No authenticated user')
      return
    }

    const permissions = ['read', 'write', 'manage_facilities', 'all', 'admin']
    permissions.forEach(permission => {
      const hasIt = hasPermission(permission)
      addTestResult(`Permission: ${permission}`, hasIt ? 'PASS' : 'FAIL', 
        `User ${hasIt ? 'has' : 'does not have'} ${permission} permission`)
    })

    // Test role checks
    const roles = ['system_admin', 'district_officer', 'worker']
    roles.forEach(role => {
      const hasIt = hasRole(role)
      addTestResult(`Role: ${role}`, hasIt ? 'PASS' : 'FAIL', 
        `User ${hasIt ? 'has' : 'does not have'} ${role} role`)
    })

    // Test district access
    if (user.district_id) {
      const canAccess = canAccessDistrict(user.district_id)
      addTestResult('District Access', canAccess ? 'PASS' : 'FAIL', 
        `Can access own district: ${canAccess}`)
    }
  }

  useEffect(() => {
    if (!loading) {
      testPermissions()
    }
  }, [user, loading])

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">useAuth Hook Test Suite</h2>
      
      {/* Current State */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Current State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading.toString()}</span></div>
          <div>Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated.toString()}</span></div>
          <div>Is Admin: <span className={isAdmin ? 'text-green-600' : 'text-gray-600'}>{isAdmin.toString()}</span></div>
          <div>Is District Officer: <span className={isDistrictOfficer ? 'text-green-600' : 'text-gray-600'}>{isDistrictOfficer.toString()}</span></div>
          <div>Error: <span className={error ? 'text-red-600' : 'text-green-600'}>{error || 'None'}</span></div>
          <div>User Email: <span className="text-blue-600">{user?.email || 'None'}</span></div>
        </div>
      </div>

      {/* User Data */}
      {user && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">User Data</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw User Data */}
      {rawUser && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Raw User Data (from Supabase)</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto max-h-40">
            {JSON.stringify(rawUser, null, 2)}
          </pre>
        </div>
      )}

      {/* Test Controls */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button
            onClick={runAuthTests}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Run Auth Tests
          </button>
          <button
            onClick={testPermissions}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            Test Permissions
          </button>
          {isAuthenticated && (
            <button
              onClick={async () => {
                const result = await signOut()
                addTestResult('Sign Out', result.error ? 'FAIL' : 'PASS', result.error || 'Signed out successfully')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Results</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm">No tests run yet. Click "Run Auth Tests" to start.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.result === 'PASS' ? 'bg-green-100 text-green-800' :
                    result.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                    result.result === 'ERROR' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.result}
                  </span>
                  <span className="font-medium">{result.test}</span>
                  {result.details && <span className="text-gray-600">- {result.details}</span>}
                </div>
                <span className="text-gray-400 text-xs">{result.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-center space-x-4">
        <a 
          href="/demo/auth" 
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
        >
          Go to Auth Demo
        </a>
        <a 
          href="/login" 
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
        >
          Go to Login
        </a>
        <a 
          href="/dashboard" 
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

export default AuthTest