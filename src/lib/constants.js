// Application constants
export const APP_NAME = 'SaniSentinel'
export const APP_VERSION = '1.0.0'

// API endpoints and configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Africa's Talking configuration (add your credentials to .env)
export const AT_CONFIG = {
  apiKey: import.meta.env.VITE_AT_API_KEY,
  username: import.meta.env.VITE_AT_USERNAME,
}

// Map configuration - Centered on Tamale, Northern Ghana
export const MAP_CONFIG = {
  defaultCenter: [9.4034, -0.8424], // Tamale, Northern Region, Ghana
  defaultZoom: 9,
  maxZoom: 18,
  minZoom: 6,
}

// Risk level thresholds
export const RISK_LEVELS = {
  GOOD: { min: 0, max: 29, color: '#10B981', label: 'Good' },
  AT_RISK: { min: 30, max: 59, color: '#EAB308', label: 'At Risk' },
  HIGH_RISK: { min: 60, max: 84, color: '#F59E0B', label: 'High Risk' },
  CRITICAL: { min: 85, max: 100, color: '#DC2626', label: 'Critical' }
}

// Facility types
export const FACILITY_TYPES = {
  toilet: { label: 'Toilet', icon: '🚽' },
  latrine: { label: 'Latrine', icon: '🏚️' },
  septic_tank: { label: 'Septic Tank', icon: '🏭' },
  treatment_plant: { label: 'Treatment Plant', icon: '🏭' },
  waste_collection_point: { label: 'Waste Collection Point', icon: '🗑️' }
}

// Facility statuses
export const FACILITY_STATUSES = {
  good: { label: 'Good', color: 'green', icon: '✅' },
  damaged: { label: 'Damaged', color: 'yellow', icon: '⚠️' },
  overflow: { label: 'Overflow', color: 'blue', icon: '🌊' },
  dry: { label: 'Dry', color: 'gray', icon: '🏜️' },
  blocked: { label: 'Blocked', color: 'orange', icon: '🚫' },
  out_of_service: { label: 'Out of Service', color: 'red', icon: '❌' }
}

// Routes
export const ROUTES = {
  HOME: '/',
  MAP: '/map',
  DASHBOARD: '/dashboard',
  FACILITIES: '/facilities',
  REPORTS: '/reports',
  MAINTENANCE: '/maintenance',
  WORKERS: '/workers'
}