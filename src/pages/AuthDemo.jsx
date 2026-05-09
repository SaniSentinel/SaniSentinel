import React from 'react'
import { useAuth } from '../hooks'

const AuthDemo = () => {
  const { 
    user, 
    loading, 
    error, 
    isAuthenticated, 
    isAdmin, 
    isDistrictOfficer,
    hasPermission,
    hasRole,
    canAccessDistrict,
    signOut 
  } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view this page.</p>
          <a 
            href="/login" 
            className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    const result = await signOut()
    if (!result.error) {
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Authentication Demo</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {/* User Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{user.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-900">{user.role || 'No role assigned'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="ml-2 text-gray-900">{user.department || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2 text-gray-900">{user.title || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">District ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-sm">{user.district_id || 'Not assigned'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email Confirmed:</span>
                  <span className={`ml-2 ${user.email_confirmed ? 'text-green-600' : 'text-red-600'}`}>
                    {user.email_confirmed ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Permissions & Access</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Permissions:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.permissions.length > 0 ? (
                      user.permissions.map((permission, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No permissions assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Role Checks:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Is Admin:</span>
                      <span className={isAdmin ? 'text-green-600' : 'text-red-600'}>
                        {isAdmin ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Is District Officer:</span>
                      <span className={isDistrictOfficer ? 'text-green-600' : 'text-red-600'}>
                        {isDistrictOfficer ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Permission Checks:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Can Read:</span>
                      <span className={hasPermission('read') ? 'text-green-600' : 'text-red-600'}>
                        {hasPermission('read') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Can Write:</span>
                      <span className={hasPermission('write') ? 'text-green-600' : 'text-red-600'}>
                        {hasPermission('write') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Can Manage Facilities:</span>
                      <span className={hasPermission('manage_facilities') ? 'text-green-600' : 'text-red-600'}>
                        {hasPermission('manage_facilities') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Has All Permissions:</span>
                      <span className={hasPermission('all') ? 'text-green-600' : 'text-red-600'}>
                        {hasPermission('all') ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {user.district_id && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-2">District Access:</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Can Access Own District:</span>
                        <span className={canAccessDistrict(user.district_id) ? 'text-green-600' : 'text-red-600'}>
                          {canAccessDistrict(user.district_id) ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
            <div className="bg-gray-900 rounded-lg p-6 text-white">
              <pre className="text-sm overflow-x-auto">
{`// Import the hook
import { useAuth } from '../hooks'

// Use in component
const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    hasPermission,
    canAccessDistrict 
  } = useAuth()

  // Check authentication
  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  // Check permissions
  if (!hasPermission('read')) {
    return <AccessDenied />
  }

  // Check role
  if (isAdmin) {
    return <AdminPanel />
  }

  // Check district access
  if (canAccessDistrict(facilityDistrictId)) {
    return <FacilityDetails />
  }

  return <RegularUserView />
}`}
              </pre>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-center space-x-4">
            <a 
              href="/dashboard" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a 
              href="/" 
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthDemo