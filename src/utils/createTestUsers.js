import { supabase } from '../lib/supabase'

// Function to create test users
export const createTestUsers = async () => {
  const results = []
  
  const testUsers = [
    {
      email: 'admin@sanissentinel.com',
      password: 'SaniSentinel2024!',
      metadata: {
        role: 'system_admin',
        name: 'System Administrator',
        department: 'IT Administration',
        permissions: ['all'],
        title: 'System Administrator'
      }
    },
    {
      email: 'officer@tamale.gov',
      password: 'Tamale2024!',
      metadata: {
        role: 'district_officer',
        name: 'Tamale District Officer',
        department: 'Health Department',
        permissions: ['read', 'write', 'manage_facilities'],
        title: 'District Health Officer'
      }
    }
  ]

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`)
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: user.metadata
        }
      })

      if (error) {
        console.error(`Error creating ${user.email}:`, error.message)
        results.push({
          email: user.email,
          success: false,
          error: error.message
        })
      } else {
        console.log(`Successfully created ${user.email}`)
        results.push({
          email: user.email,
          success: true,
          user: data.user
        })
      }
    } catch (err) {
      console.error(`Exception creating ${user.email}:`, err)
      results.push({
        email: user.email,
        success: false,
        error: err.message
      })
    }
  }

  return results
}

// Function to check if users exist
export const checkUsersExist = async () => {
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('email, email_confirmed_at')
      .in('email', ['admin@sanissentinel.com', 'officer@tamale.gov'])

    if (error) {
      console.error('Error checking users:', error)
      return { success: false, error: error.message }
    }

    return { success: true, users: data }
  } catch (err) {
    console.error('Exception checking users:', err)
    return { success: false, error: err.message }
  }
}