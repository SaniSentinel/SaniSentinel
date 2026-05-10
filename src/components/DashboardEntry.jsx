import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../lib/roleRouting'
import ProfessionalDashboard from '../pages/ProfessionalDashboard'

/**
 * Sends admins and district officers to their role home;
 * everyone else renders the generic professional dashboard.
 */
const DashboardEntry = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  const home = getRoleHomePath(user?.role)
  if (home !== '/dashboard') {
    return <Navigate to={home} replace />
  }

  return <ProfessionalDashboard />
}

export default DashboardEntry
