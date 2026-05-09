import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Auth Components
import AuthGuard from './components/AuthGuard'
import { AdminRoute, OfficerRoute, AnyAuthenticatedRoute } from './components/ProtectedRoute'

// Professional UI Components
import ProfessionalHome from './pages/ProfessionalHome'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import ProfessionalFacilityMap from './pages/ProfessionalFacilityMap'
import ProfessionalReports from './pages/ProfessionalReports'
import ProfessionalMaintenance from './pages/ProfessionalMaintenance'
import ProfessionalWorkers from './pages/ProfessionalWorkers'

// Landing Page
import LandingPage from './pages/LandingPage'

// Legacy components (for backward compatibility)
import { Home, MapView } from './pages'
import FacilityMap from './pages/FacilityMap'

// Demo components
import AddFacilityDemo from './pages/AddFacilityDemo'
import AuthDemo from './pages/AuthDemo'
import AuthGuardDemo from './pages/AuthGuardDemo'
import AuthTestPage from './pages/AuthTestPage'
import Login from './pages/Login'
import LoginBasic from './pages/LoginBasic'
import LoginDirect from './pages/LoginDirect'
import LoginTest from './pages/LoginTest'
import LoginSimple from './pages/LoginSimple'
import RouteTestPage from './pages/RouteTestPage'
import UserManagement from './pages/UserManagement'
import AdminDashboard from './pages/AdminDashboard'
import AdminGISMap from './pages/AdminGISMap'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes (No Authentication Required) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-basic" element={<LoginBasic />} />
        <Route path="/login-direct" element={<LoginDirect />} />
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/login-simple" element={<LoginSimple />} />
        
        {/* Dashboard Routes (All Protected with AuthGuard) */}
        <Route path="/home" element={
          <AuthGuard redirectTo="/login">
            <ProfessionalHome />
          </AuthGuard>
        } />
        
        <Route path="/dashboard" element={
          <AuthGuard redirectTo="/login">
            <ProfessionalDashboard />
          </AuthGuard>
        } />
        
        <Route path="/professional-dashboard" element={
          <AuthGuard redirectTo="/login">
            <ProfessionalDashboard />
          </AuthGuard>
        } />
        
        <Route path="/facility-map" element={
          <AuthGuard redirectTo="/login">
            <ProfessionalFacilityMap />
          </AuthGuard>
        } />
        
        <Route path="/professional-facility-map" element={
          <AuthGuard redirectTo="/login">
            <ProfessionalFacilityMap />
          </AuthGuard>
        } />
        
        {/* Officer Level Dashboard Routes */}
        <Route path="/reports" element={
          <AuthGuard redirectTo="/login" allowedRoles={['district_officer', 'system_admin']}>
            <ProfessionalReports />
          </AuthGuard>
        } />
        
        <Route path="/professional-reports" element={
          <AuthGuard redirectTo="/login" allowedRoles={['district_officer', 'system_admin']}>
            <ProfessionalReports />
          </AuthGuard>
        } />
        
        <Route path="/maintenance" element={
          <AuthGuard redirectTo="/login" allowedRoles={['district_officer', 'system_admin']}>
            <ProfessionalMaintenance />
          </AuthGuard>
        } />
        
        <Route path="/professional-maintenance" element={
          <AuthGuard redirectTo="/login" allowedRoles={['district_officer', 'system_admin']}>
            <ProfessionalMaintenance />
          </AuthGuard>
        } />
        
        {/* Admin Only Dashboard Routes */}
        <Route path="/workers" element={
          <AuthGuard redirectTo="/login" allowedRoles={['system_admin']}>
            <ProfessionalWorkers />
          </AuthGuard>
        } />
        
        <Route path="/professional-workers" element={
          <AuthGuard redirectTo="/login" allowedRoles={['system_admin']}>
            <ProfessionalWorkers />
          </AuthGuard>
        } />
        
        {/* Admin Management Routes */}
        <Route path="/admin-dashboard" element={
          <AuthGuard redirectTo="/login" allowedRoles={['admin']}>
            <AdminDashboard />
          </AuthGuard>
        } />

        <Route path="/admin/gis-map" element={
          <AuthGuard redirectTo="/login" allowedRoles={['admin']}>
            <AdminGISMap />
          </AuthGuard>
        } />

        <Route path="/admin/users" element={
          <AuthGuard redirectTo="/login" allowedRoles={['system_admin']}>
            <UserManagement />
          </AuthGuard>
        } />
        
        {/* Demo Routes (Protected) */}
        <Route path="/demo/add-facility" element={
          <AuthGuard redirectTo="/login">
            <AddFacilityDemo />
          </AuthGuard>
        } />
        
        <Route path="/demo/auth" element={
          <AuthGuard redirectTo="/login">
            <AuthDemo />
          </AuthGuard>
        } />
        
        <Route path="/demo/auth-guard" element={
          <AuthGuard redirectTo="/login">
            <AuthGuardDemo />
          </AuthGuard>
        } />
        
        <Route path="/test/auth" element={
          <AuthGuard redirectTo="/login">
            <AuthTestPage />
          </AuthGuard>
        } />
        
        <Route path="/test/routes" element={
          <AuthGuard redirectTo="/login">
            <RouteTestPage />
          </AuthGuard>
        } />
        
        {/* Legacy Routes (Protected) */}
        <Route path="/legacy-home" element={
          <AuthGuard redirectTo="/login">
            <Home />
          </AuthGuard>
        } />
        
        <Route path="/legacy-facility-map" element={
          <AuthGuard redirectTo="/login">
            <FacilityMap />
          </AuthGuard>
        } />
        
        <Route path="/map" element={
          <AuthGuard redirectTo="/login">
            <MapView />
          </AuthGuard>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App