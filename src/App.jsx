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
import UserManagement from './pages/UserManagement'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Authentication Required) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-basic" element={<LoginBasic />} />
        <Route path="/login-direct" element={<LoginDirect />} />
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/login-simple" element={<LoginSimple />} />
        
        {/* Protected Routes (Authentication Required) */}
        <Route path="/home" element={
          <AnyAuthenticatedRoute>
            <ProfessionalHome />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/dashboard" element={
          <AnyAuthenticatedRoute>
            <ProfessionalDashboard />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/professional-dashboard" element={
          <AnyAuthenticatedRoute>
            <ProfessionalDashboard />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/facility-map" element={
          <AnyAuthenticatedRoute>
            <ProfessionalFacilityMap />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/professional-facility-map" element={
          <AnyAuthenticatedRoute>
            <ProfessionalFacilityMap />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/reports" element={
          <OfficerRoute>
            <ProfessionalReports />
          </OfficerRoute>
        } />
        
        <Route path="/professional-reports" element={
          <OfficerRoute>
            <ProfessionalReports />
          </OfficerRoute>
        } />
        
        <Route path="/maintenance" element={
          <OfficerRoute>
            <ProfessionalMaintenance />
          </OfficerRoute>
        } />
        
        <Route path="/professional-maintenance" element={
          <OfficerRoute>
            <ProfessionalMaintenance />
          </OfficerRoute>
        } />
        
        <Route path="/workers" element={
          <AdminRoute>
            <ProfessionalWorkers />
          </AdminRoute>
        } />
        
        <Route path="/professional-workers" element={
          <AdminRoute>
            <ProfessionalWorkers />
          </AdminRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        
        {/* Demo routes (Protected) */}
        <Route path="/demo/add-facility" element={
          <AnyAuthenticatedRoute>
            <AddFacilityDemo />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/demo/auth" element={
          <AnyAuthenticatedRoute>
            <AuthDemo />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/demo/auth-guard" element={
          <AnyAuthenticatedRoute>
            <AuthGuardDemo />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/test/auth" element={
          <AnyAuthenticatedRoute>
            <AuthTestPage />
          </AnyAuthenticatedRoute>
        } />
        
        {/* Legacy routes (Protected) */}
        <Route path="/legacy-home" element={
          <AnyAuthenticatedRoute>
            <Home />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/legacy-facility-map" element={
          <AnyAuthenticatedRoute>
            <FacilityMap />
          </AnyAuthenticatedRoute>
        } />
        
        <Route path="/map" element={
          <AnyAuthenticatedRoute>
            <MapView />
          </AnyAuthenticatedRoute>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App