import React from 'react'
import { Link } from 'react-router-dom'

const AdminDashboardLink = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        to="/system-admin-dashboard"
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 font-medium"
      >
        <span className="text-lg">📊</span>
        <span>Admin Dashboard</span>
      </Link>
    </div>
  )
}

export default AdminDashboardLink