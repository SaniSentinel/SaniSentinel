import { useState, useEffect, useCallback } from 'react'
import { facilities } from '../lib/facilities'
import { supabase } from '../lib/supabase'

export const useFacilities = (options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  const {
    autoRefresh = true,
    includeStats = true,
    filters = {}
  } = options

  // Load facilities data
  const loadFacilities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [facilitiesResult, statsResult] = await Promise.all([
        facilities.getAll(),
        includeStats ? facilities.getStats() : Promise.resolve({ data: null, error: null })
      ])

      if (facilitiesResult.error) throw new Error(facilitiesResult.error)
      if (statsResult.error) throw new Error(statsResult.error)

      setData(facilitiesResult.data || [])
      setStats(statsResult.data)

    } catch (err) {
      console.error('Error loading facilities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [includeStats])

  // Filter facilities based on provided filters
  const filteredData = data.filter(facility => {
    if (filters.status && filters.status !== 'all' && facility.status !== filters.status) {
      return false
    }
    
    if (filters.type && filters.type !== 'all' && facility.type !== filters.type) {
      return false
    }
    
    if (filters.district && filters.district !== 'all' && facility.district_id !== filters.district) {
      return false
    }
    
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      const risk = facility.risk_score || 0
      switch (filters.riskLevel) {
        case 'critical':
          if (risk < 85) return false
          break
        case 'high':
          if (risk < 60 || risk >= 85) return false
          break
        case 'medium':
          if (risk < 30 || risk >= 60) return false
          break
        case 'good':
          if (risk >= 30) return false
          break
      }
    }
    
    return true
  })

  // Get facilities by risk level
  const getFacilitiesByRisk = useCallback((riskLevel) => {
    return data.filter(facility => {
      const risk = facility.risk_score || 0
      switch (riskLevel) {
        case 'critical':
          return risk >= 85
        case 'high':
          return risk >= 60 && risk < 85
        case 'medium':
          return risk >= 30 && risk < 60
        case 'good':
          return risk < 30
        default:
          return true
      }
    })
  }, [data])

  // Get facilities by status
  const getFacilitiesByStatus = useCallback((status) => {
    return data.filter(facility => facility.status === status)
  }, [data])

  // Get facilities by type
  const getFacilitiesByType = useCallback((type) => {
    return data.filter(facility => facility.type === type)
  }, [data])

  // Get facilities by district
  const getFacilitiesByDistrict = useCallback((districtId) => {
    return data.filter(facility => facility.district_id === districtId)
  }, [data])

  // Update a facility
  const updateFacility = useCallback(async (id, updates) => {
    try {
      const result = await facilities.update(id, updates)
      if (result.error) throw new Error(result.error)
      
      // Update local state
      setData(prevData => 
        prevData.map(facility => 
          facility.id === id ? { ...facility, ...updates } : facility
        )
      )
      
      return result
    } catch (err) {
      console.error('Error updating facility:', err)
      throw err
    }
  }, [])

  // Create a new facility
  const createFacility = useCallback(async (facilityData) => {
    try {
      const result = await facilities.create(facilityData)
      if (result.error) throw new Error(result.error)
      
      // Add to local state
      setData(prevData => [...prevData, result.data])
      
      return result
    } catch (err) {
      console.error('Error creating facility:', err)
      throw err
    }
  }, [])

  // Delete a facility
  const deleteFacility = useCallback(async (id) => {
    try {
      const result = await facilities.delete(id)
      if (result.error) throw new Error(result.error)
      
      // Remove from local state
      setData(prevData => prevData.filter(facility => facility.id !== id))
      
      return result
    } catch (err) {
      console.error('Error deleting facility:', err)
      throw err
    }
  }, [])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!autoRefresh) return

    const facilitiesSubscription = supabase
      .channel('facilities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'facilities' },
        (payload) => {
          console.log('Facilities change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            setData(prevData => [...prevData, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setData(prevData => 
              prevData.map(facility => 
                facility.id === payload.new.id ? payload.new : facility
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData(prevData => 
              prevData.filter(facility => facility.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Also listen for reports changes that might affect facility status
    const reportsSubscription = supabase
      .channel('reports-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('New report received:', payload)
          // Reload facilities data to get updated status
          loadFacilities()
        }
      )
      .subscribe()

    return () => {
      facilitiesSubscription.unsubscribe()
      reportsSubscription.unsubscribe()
    }
  }, [autoRefresh, loadFacilities])

  // Load initial data
  useEffect(() => {
    loadFacilities()
  }, [loadFacilities])

  return {
    // Data
    data: filteredData,
    allData: data,
    loading,
    error,
    stats,
    
    // Actions
    refresh: loadFacilities,
    updateFacility,
    createFacility,
    deleteFacility,
    
    // Getters
    getFacilitiesByRisk,
    getFacilitiesByStatus,
    getFacilitiesByType,
    getFacilitiesByDistrict
  }
}

export default useFacilities