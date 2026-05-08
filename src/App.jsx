import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Professional UI Components
import ProfessionalHome from './pages/ProfessionalHome'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import ProfessionalFacilityMap from './pages/ProfessionalFacilityMap'

// Legacy components (for backward compatibility)
import { Home, MapView } from './pages'
import FacilityMap from './pages/FacilityMap'

function App() {
  return (
    <Router>
      <Routes>
        {/* Professional UI Routes (Primary) */}
        <Route path="/" element={<ProfessionalHome />} />
        <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
        <Route path="/professional-facility-map" element={<ProfessionalFacilityMap />} />
        
        {/* Main application routes */}
        <Route path="/dashboard" element={<ProfessionalDashboard />} />
        <Route path="/facility-map" element={<ProfessionalFacilityMap />} />
        
        {/* Placeholder routes for future professional pages */}
        <Route path="/reports" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Reports Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/maintenance" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Maintenance Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="/workers" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Workers Page</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        
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