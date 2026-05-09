import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthGuard = ({ children, redirectTo = '/login', allowedRoles = null }) => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const location = useLocation()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (err) {
        console.error('Exception getting session:', err)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthGuard: Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // No session - redirect to login
  if (!session || !user) {
    console.log('AuthGuard: No session, redirecting to login')
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.user_metadata?.role
    const normalizedRole = userRole === 'admin' ? 'system_admin' : userRole
    const normalizedAllowedRoles = allowedRoles.map((role) => (
      role === 'admin' ? 'system_admin' : role
    ))
    
    if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
      console.log('AuthGuard: Insufficient permissions, user role:', userRole, 'required:', allowedRoles)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Required role: {allowedRoles.join(' or ')}<br />
              Your role: {userRole || 'None'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
              <a
                href="/dashboard"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return children
}

export default AuthGuard