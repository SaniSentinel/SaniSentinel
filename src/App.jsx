import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components'
import { Home, MapView } from './pages'
import MapViewTest from './pages/MapViewTest'

// Component to conditionally wrap with Layout
const ConditionalLayout = ({ children }) => {
  const location = useLocation()
  
  // Pages that should be full-screen without Layout wrapper
  const fullScreenPages = ['/map', '/', '/map-test']
  
  if (fullScreenPages.includes(location.pathname)) {
    return children
  }
  
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <Router>
      <ConditionalLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/map-test" element={<MapViewTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConditionalLayout>
    </Router>
  )
}

export default App