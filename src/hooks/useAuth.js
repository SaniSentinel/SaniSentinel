import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Derived user data from metadata
  const userData = user ? {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || null,
    name: user.user_metadata?.name || user.email,
    district_id: user.user_metadata?.district_id || null,
    department: user.user_metadata?.department || null,
    permissions: user.user_metadata?.permissions || [],
    title: user.user_metadata?.title || null,
    created_at: user.created_at,
    email_confirmed: user.email_confirmed_at !== null
  } : null

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!userData) return false
    
    // System admin has all permissions
    if (userData.role === 'system_admin') return true
    
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
    if (userData.role === 'system_admin') return true
    
    // Check if user's district matches
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
    isAdmin: userData?.role === 'system_admin',
    isDistrictOfficer: userData?.role === 'district_officer',
    
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