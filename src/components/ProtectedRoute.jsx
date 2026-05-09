import React from 'react'
import AuthGuard from './AuthGuard'

// Higher-order component for protecting individual routes
const ProtectedRoute = ({ 
  children, 
  redirectTo = '/login',
  allowedRoles = null,
  requiredPermissions = [],
  fallback = null 
}) => {
  return (
    <AuthGuard 
      redirectTo={redirectTo}
      allowedRoles={allowedRoles}
    >
      {children}
    </AuthGuard>
  )
}

// Specific route protectors for common use cases
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['system_admin']}>
    {children}
  </ProtectedRoute>
)

export const OfficerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['district_officer', 'system_admin']}>
    {children}
  </ProtectedRoute>
)

export const WorkerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['worker', 'district_officer', 'system_admin']}>
    {children}
  </ProtectedRoute>
)

export const AnyAuthenticatedRoute = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute