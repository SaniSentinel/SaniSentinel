import React from 'react'
import { useAuth } from '../hooks'

const AuthGuardDemo = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AuthGuard Demo</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>

          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">🎉 Success!</h2>
            <p className="text-green-700">
              You're seeing this page because you're authenticated! The AuthGuard component 
              successfully verified your session and allowed access to this protected route.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Session Info</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{user?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-900">{user?.role || 'No role assigned'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-sm">{user?.id}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AuthGuard Features</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Automatic session checking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Redirect to login if not authenticated</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Role-based access control</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Loading states during auth checks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Real-time auth state updates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Preserves intended destination</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Different Access Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Any Authenticated User</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Pages that require any authenticated user can access.
                </p>
                <a
                  href="/dashboard"
                  className="block w-full text-center bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Visit Dashboard
                </a>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Officer Level</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Pages that require district officer or admin role.
                </p>
                <a
                  href="/reports"
                  className="block w-full text-center bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700"
                >
                  Visit Reports
                </a>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Admin Only</h3>
                <p className="text-sm text-red-700 mb-3">
                  Pages that require system administrator role.
                </p>
                <a
                  href="/workers"
                  className="block w-full text-center bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  Visit Workers
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">How It Works</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. <strong>Route Protection:</strong> Each protected route is wrapped with an AuthGuard component</p>
              <p>2. <strong>Session Check:</strong> AuthGuard checks for a valid Supabase session</p>
              <p>3. <strong>Role Verification:</strong> If roles are specified, it checks user permissions</p>
              <p>4. <strong>Redirect or Allow:</strong> Either redirects to login or renders the protected content</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Home
            </a>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Test Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthGuardDemo