import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Professional UI Components
import ProfessionalHome from './pages/ProfessionalHome'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import ProfessionalFacilityMap from './pages/ProfessionalFacilityMap'
import ProfessionalReports from './pages/ProfessionalReports'
import ProfessionalMaintenance from './pages/ProfessionalMaintenance'
import ProfessionalWorkers from './pages/ProfessionalWorkers'

// Legacy components (for backward compatibility)
import { Home, MapView } from './pages'
import FacilityMap from './pages/FacilityMap'

// Demo components
import AddFacilityDemo from './pages/AddFacilityDemo'

function App() {
  return (
    <Router>
      <Routes>
        {/* Professional UI Routes (Primary) */}
        <Route path="/" element={<ProfessionalHome />} />
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