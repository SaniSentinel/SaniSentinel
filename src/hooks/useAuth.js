import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { resolveDistrictUuidFromMetadata, isDistrictUuid } from '../lib/districtId'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  /** Resolved UUID when JWT stores a district name in district_id (legacy / fallback form). */
  const [officerDistrictUuid, setOfficerDistrictUuid] = useState(null)
  const [officerDistrictResolved, setOfficerDistrictResolved] = useState(true)

  useEffect(() => {
    let cancelled = false
    const meta = user?.user_metadata

    if (!user || !meta) {
      setOfficerDistrictUuid(null)
      setOfficerDistrictResolved(true)
      return
    }

    if (meta.role !== 'district_officer') {
      setOfficerDistrictUuid(null)
      setOfficerDistrictResolved(true)
      return
    }

    const raw = meta.district_id

    if (isDistrictUuid(raw)) {
      setOfficerDistrictUuid(null)
      setOfficerDistrictResolved(true)
      return
    }

    if (!raw && !meta.district_name) {
      setOfficerDistrictUuid(null)
      setOfficerDistrictResolved(true)
      return
    }

    setOfficerDistrictResolved(false)
    setOfficerDistrictUuid(null)

    resolveDistrictUuidFromMetadata({
      district_id: raw,
      district_name: meta.district_name
    }).then((id) => {
      if (!cancelled) {
        setOfficerDistrictUuid(id)
        setOfficerDistrictResolved(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    user?.id,
    user?.user_metadata?.role,
    user?.user_metadata?.district_id,
    user?.user_metadata?.district_name
  ])

  const officerDistrictScopeLoading = useMemo(() => {
    const meta = user?.user_metadata
    if (!meta || meta.role !== 'district_officer') return false
    const raw = meta.district_id
    if (isDistrictUuid(raw)) return false
    if (!raw && !meta.district_name) return false
    return !officerDistrictResolved
  }, [user, officerDistrictResolved])

  // Derived user data from metadata (district officers get UUID from DB when metadata had a name/slug)
  const userData = user
    ? (() => {
        const meta = user.user_metadata || {}
        let district_id = meta.district_id ?? null
        if (meta.role === 'district_officer') {
          district_id = isDistrictUuid(meta.district_id)
            ? meta.district_id.trim()
            : officerDistrictUuid
        }
        return {
          id: user.id,
          email: user.email,
          role: meta.role || null,
          name: meta.name || user.email,
          district_id,
          district_name: meta.district_name ?? null,
          department: meta.department || null,
          permissions: meta.permissions || [],
          title: meta.title || null,
          created_at: user.created_at,
          email_confirmed: user.email_confirmed_at !== null
        }
      })()
    : null

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!userData) return false
    
    // System admin has all permissions
    if (userData.role === 'system_admin' || userData.role === 'admin') return true
    
    // Check if user has 'all' permission
    if (userData.permissions.includes('all')) return true
    
    // Check specific permission
    return userData.permissions.includes(permission)
  }

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!userData) return false
    return userData.role === role
  }

  // Check if user can access a specific district
  const canAccessDistrict = (districtId) => {
    if (!userData) return false
    
    // System admin can access all districts
    if (userData.role === 'system_admin' || userData.role === 'admin') return true
    
    // Check if user's district matches (districtId should be UUID from DB)
    return userData.district_id === districtId
  }

  // Get current user session
  const getCurrentUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw error
      }

      setUser(user)
      return user
    } catch (err) {
      console.error('Error getting current user:', err)
      setError(err.message)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      setUser(data.user)
      return { user: data.user, session: data.session, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message)
      return { user: null, session: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      return { error: null }
    } catch (err) {
      console.error('Sign out error:', err)
      setError(err.message)
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Update user metadata
  const updateProfile = async (updates) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        throw error
      }

      setUser(data.user)
      return { user: data.user, error: null }
    } catch (err) {
      console.error('Update profile error:', err)
      setError(err.message)
      return { user: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth state and set up listener
  useEffect(() => {
    // Get initial session
    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return {
    // User data
    user: userData,
    rawUser: user,
    loading,
    error,
    
    // Authentication state
    isAuthenticated: !!user,
    isAdmin: userData?.role === 'system_admin' || userData?.role === 'admin',
    isDistrictOfficer: userData?.role === 'district_officer',
    /** True while resolving a non-UUID district_id / district_name from JWT into districts.id */
    officerDistrictScopeLoading,
    
    // Permission helpers
    hasPermission,
    hasRole,
    canAccessDistrict,
    
    // Authentication methods
    signIn,
    signOut,
    updateProfile,
    getCurrentUser
  }
}

export default useAuth