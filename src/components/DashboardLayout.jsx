import React from 'react'
import AuthGuard from './AuthGuard'

// Wrapper component for all dashboard-related routes
const DashboardLayout = ({ children, requiredRole = null, requiredPermissions = [] }) => {
  const allowedRoles = requiredRole ? [requiredRole] : null

  return (
    <AuthGuard 
      redirectTo="/login" 
      allowedRoles={allowedRoles}
    >
      <div className="dashboard-layout">
        {children}
      </div>
    </AuthGuard>
  )
}

// Specific dashboard route wrappers
export const BasicDashboardRoute = ({ children }) => (
  <DashboardLayout>
    {children}
  </DashboardLayout>
)

export const OfficerDashboardRoute = ({ children }) => (
  <DashboardLayout requiredRole="district_officer">
    {children}
  </DashboardLayout>
)

export const AdminDashboardRoute = ({ children }) => (
  <DashboardLayout requiredRole="system_admin">
    {children}
  </DashboardLayout>
)

// Multi-role dashboard routes
export const OfficerOrAdminRoute = ({ children }) => (
  <AuthGuard 
    redirectTo="/login" 
    allowedRoles={['district_officer', 'system_admin']}
  >
    <div className="dashboard-layout">
      {children}
    </div>
  </AuthGuard>
)

export default DashboardLayout