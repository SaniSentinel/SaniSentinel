import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const UserManagement = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [existingUsers, setExistingUsers] = useState([])

  const testUsers = [
    {
      email: 'admin@sanissentinel.com',
      password: 'SaniSentinel2024!',
      role: 'system_admin',
      name: 'System Administrator'
    },
    {
      email: 'officer@tamale.gov',
      password: 'Tamale2024!',
      role: 'district_officer',
      name: 'Tamale District Officer'
    }
  ]

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const createUser = async (userInfo) => {
    try {
      addResult(`Creating user: ${userInfo.email}`, 'info')
      
      const { data, error } = await supabase.auth.signUp({
        email: userInfo.email,
        password: userInfo.password,
        options: {
          data: {
            role: userInfo.role,
            name: userInfo.name,
            department: userInfo.role === 'system_admin' ? 'IT Administration' : 'Health Department',
            permissions: userInfo.role === 'system_admin' ? ['all'] : ['read', 'write', 'manage_facilities'],
            title: userInfo.role === 'system_admin' ? 'System Administrator' : 'District Health Officer'
          }
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          addResult(`User ${userInfo.email} already exists`, 'warning')
          return { success: true, exists: true }
        } else {
          addResult(`Error creating ${userInfo.email}: ${error.message}`, 'error')
          return { success: false, error: error.message }
        }
      }

      addResult(`Successfully created ${userInfo.email}`, 'success')
      return { success: true, user: data.user }
    } catch (err) {
      addResult(`Exception creating ${userInfo.email}: ${err.message}`, 'error')
      return { success: false, error: err.message }
    }
  }

  const createAllUsers = async () => {
    setLoading(true)
    setResults([])
    
    addResult('Starting user creation process...', 'info')
    
    for (const user of testUsers) {
      await createUser(user)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    addResult('User creation process completed', 'info')
    setLoading(false)
  }

  const testLogin = async (email, password) => {
    try {
      addResult(`Testing login for: ${email}`, 'info')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        addResult(`Login failed for ${email}: ${error.message}`, 'error')
        return false
      }

      addResult(`Login successful for ${email}`, 'success')
      
      // Sign out immediately after test
      await supabase.auth.signOut()
      addResult(`Signed out ${email}`, 'info')
      
      return true
    } catch (err) {
      addResult(`Login exception for ${email}: ${err.message}`, 'error')
      return false
    }
  }

  const testAllLogins = async () => {
    setLoading(true)
    addResult('Testing all user logins...', 'info')
    
    for (const user of testUsers) {
      await testLogin(user.email, user.password)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setLoading(false)
  }

  const checkExistingUsers = async () => {
    try {
      addResult('Checking existing users...', 'info')
      
      // Note: We can't directly query auth.users from the client
      // So we'll try to get current user info instead
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setExistingUsers([user])
        addResult(`Current user: ${user.email}`, 'info')
      } else {
        addResult('No current user session', 'info')
      }
      
    } catch (err) {
      addResult(`Error checking users: ${err.message}`, 'error')
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
          
          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h2>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. Click "Create Test Users" to create the admin and officer accounts</p>
              <p>2. Click "Test All Logins" to verify the accounts work</p>
              <p>3. If creation fails, you may need to create users manually in Supabase Dashboard</p>
              <p>4. Check the results below for detailed feedback</p>
            </div>
          </div>

          {/* Test Users Info */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUsers.map((user, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Email: {user.email}</div>
                  <div>Password: {user.password}</div>
                  <div>Role: {user.role}</div>
                </div>
                <button
                  onClick={() => testLogin(user.email, user.password)}
                  disabled={loading}
                  className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Login
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={createAllUsers}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Users'}
            </button>
            
            <button
              onClick={testAllLogins}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test All Logins'}
            </button>
            
            <button
              onClick={checkExistingUsers}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Check Current User
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {/* Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            {results.length === 0 ? (
              <p className="text-gray-500">No results yet. Click a button above to start.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                      result.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                      result.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                      'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span>{result.message}</span>
                      <span className="text-xs opacity-75">{result.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Manual User Creation (if needed)</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>If automatic creation fails, create users manually in Supabase:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to Supabase Dashboard → Authentication → Users</li>
                <li>Click "Add User"</li>
                <li>Enter email, password, and check "Email Confirm"</li>
                <li>After creation, run the SQL in CHECK_AND_CREATE_USERS.sql to add metadata</li>
              </ol>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-center space-x-4">
            <a href="/login-direct" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Test Login Page
            </a>
            <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement