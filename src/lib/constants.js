// Application constants
export const APP_NAME = 'Your App'
export const APP_VERSION = '1.0.0'

// API endpoints and configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Africa's Talking configuration (add your credentials to .env)
export const AT_CONFIG = {
  apiKey: import.meta.env.VITE_AT_API_KEY,
  username: import.meta.env.VITE_AT_USERNAME,
}

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: [9.4034, -0.8424], // Tamale, Northern Region, Ghana
  defaultZoom: 9,
}

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
}