// Export all hooks from this index file for easier imports
export * from './useLocalStorage'
export * from './useFacilities'
export { default as useAlerts } from './useAlerts'
export { default as useDashboard } from './useDashboard'
export { default as useReports } from './useReports'
export { default as useMaintenance } from './useMaintenance'
export { default as useWorkers } from './useWorkers'
export { default as useAuth } from './useAuth'
// Note: useSupabaseQuery is available via direct import from './useSupabase' if needed