import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'

const AuthGuardWithHook = ({ 
  children, 
  redirectTo = '/login', 
  requiredRole = null,
  requiredPermissions = [],
  fallbackComponent = null 
}) => {
  const { 
    user, 
    loading, 
    error, 
    isAuthenticated, 
    hasRole, 
    hasPermission 
  } = useAuth()
  
  const location = useLocation()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href={redirectTo}
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    const AccessDenied = () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have the required role to access this page.
          </p>
          <div className="text-sm text-gray-500 mb-6">
            <p>Required: <span className="font-medium">{requiredRole}</span></p>
            <p>Your role: <span className="font-medium">{user?.role || 'None'}</span></p>
          </div>
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

    return fallbackComponent || <AccessDenied />
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(permission => !hasPermission(permission))
    
    if (missingPermissions.length > 0) {
      const PermissionDenied = () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p>Missing permissions:</p>
              <ul className="list-disc list-inside mt-1">
                {missingPermissions.map(permission => (
                  <li key={permission} className="font-medium">{permission}</li>
                ))}
              </ul>
            </div>
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

      return fallbackComponent || <PermissionDenied />
    }
  }

  // All checks passed - render children
  return children
}

export default AuthGuardWithHook