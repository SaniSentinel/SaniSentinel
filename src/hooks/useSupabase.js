import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Custom hook for Supabase authentication
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading }
}

// Custom hook for database operations
export const useSupabaseQuery = (table, query = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let supabaseQuery = supabase.from(table).select('*')
        
        // Apply filters if provided
        if (query.filter) {
          supabaseQuery = supabaseQuery.filter(query.filter.column, query.filter.operator, query.filter.value)
        }
        
        const { data, error } = await supabaseQuery
        
        if (error) throw error
        setData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, JSON.stringify(query)])

  return { data, loading, error }
}