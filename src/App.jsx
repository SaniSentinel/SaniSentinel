import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

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
        {/* Landing Page (Default) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Professional UI Routes (Primary) */}
        <Route path="/home" element={<ProfessionalHome />} />
        <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
        <Route path="/professional-facility-map" element={<ProfessionalFacilityMap />} />
        <Route path="/professional-reports" element={<ProfessionalReports />} />
        <Route path="/professional-maintenance" element={<ProfessionalMaintenance />} />
        <Route path="/professional-workers" element={<ProfessionalWorkers />} />
        
        {/* Main application routes */}
        <Route path="/dashboard" element={<ProfessionalDashboard />} />
        <Route path="/facility-map" element={<ProfessionalFacilityMap />} />
        <Route path="/reports" element={<ProfessionalReports />} />
        <Route path="/maintenance" element={<ProfessionalMaintenance />} />
        <Route path="/workers" element={<ProfessionalWorkers />} />
        
        {/* Demo routes */}
        <Route path="/demo/add-facility" element={<AddFacilityDemo />} />
        <Route path="/demo/auth" element={<AuthDemo />} />
        <Route path="/test/auth" element={<AuthTestPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-basic" element={<LoginBasic />} />
        <Route path="/login-direct" element={<LoginDirect />} />
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/login-simple" element={<LoginSimple />} />
        
        {/* Legacy routes (for backward compatibility) */}
        <Route path="/legacy-home" element={<Home />} />
        <Route path="/legacy-facility-map" element={<FacilityMap />} />
        <Route path="/map" element={<MapView />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App