import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env file')
  process.exit(1)
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY in .env file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user accounts to create
const testUsers = [
  {
    email: 'admin@sanissentinel.com',
    password: 'SaniSentinel2024!',
    role: 'admin',
    name: 'System Administrator',
    phone: '+233241000001',
    district: 'Tamale',
    metadata: {
      role: 'system_admin',
      permissions: ['all'],
      department: 'IT Administration',
      title: 'System Administrator'
    }
  },
  {
    email: 'officer@tamale.gov',
    password: 'Tamale2024!',
    role: 'district_officer',
    name: 'Tamale District Officer',
    phone: '+233241000002',
    district: 'Tamale',
    metadata: {
      role: 'district_officer',
      permissions: ['read', 'write', 'manage_facilities'],
      department: 'Health Department',
      title: 'District Health Officer'
    }
  }
]

const createTestUsers = async () => {
  console.log('🚀 Creating test user accounts for SaniSentinel...\n')
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { error: connectionError } = await supabase.auth.getSession()
    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }
    console.log('✅ Supabase connection successful')
    
    // Get Tamale district ID for user profiles
    console.log('🔄 Getting district information...')
    const { data: tamaleDistrict, error: districtError } = await supabase
      .from('districts')
      .select('id, name')
      .eq('name', 'Tamale')
      .single()
    
    if (districtError) {
      console.log('⚠️  Could not find Tamale district, users will be created without district assignment')
      console.log('District error:', districtError.message)
    } else {
      console.log(`✅ Found district: ${tamaleDistrict.name} (${tamaleDistrict.id})`)
    }
    
    // Create each test user
    for (const user of testUsers) {
      console.log(`\n🔄 Creating user: ${user.email}`)
      
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              role: user.role,
              ...user.metadata
            }
          }
        })
        
        if (authError) {
          if (authError.message.includes('User already registered')) {
            console.log(`⚠️  User ${user.email} already exists, skipping creation`)
            continue
          } else {
            throw authError
          }
        }
        
        console.log(`✅ Auth user created: ${user.email}`)
        
        // Create worker profile if we have district info
        if (tamaleDistrict) {
          try {
            const { data: workerData, error: workerError } = await supabase
              .from('workers')
              .insert([{
                name: user.name,
                phone: user.phone,
                role: user.metadata.role,
                district_id: tamaleDistrict.id,
                active: true,
                email: user.email
              }])
              .select()
            
            if (workerError) {
              console.log(`⚠️  Could not create worker profile: ${workerError.message}`)
            } else {
              console.log(`✅ Worker profile created for ${user.name}`)
            }
          } catch (workerErr) {
            console.log(`⚠️  Worker profile creation failed: ${workerErr.message}`)
          }
        }
        
        console.log(`✅ User ${user.email} created successfully`)
        
      } catch (userError) {
        console.error(`❌ Failed to create user ${user.email}:`, userError.message)
      }
    }
    
    console.log('\n🎉 Test user creation completed!')
    console.log('\n📋 Test User Accounts Created:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│                     ADMIN ACCOUNT                          │')
    console.log('├─────────────────────────────────────────────────────────────┤')
    console.log('│ Email:    admin@sanissentinel.com                          │')
    console.log('│ Password: SaniSentinel2024!                                │')
    console.log('│ Role:     System Administrator                             │')
    console.log('│ Access:   Full system access                               │')
    console.log('├─────────────────────────────────────────────────────────────┤')
    console.log('│                   DISTRICT OFFICER                         │')
    console.log('├─────────────────────────────────────────────────────────────┤')
    console.log('│ Email:    officer@tamale.gov                               │')
    console.log('│ Password: Tamale2024!                                      │')
    console.log('│ Role:     District Health Officer                          │')
    console.log('│ District: Tamale                                           │')
    console.log('└─────────────────────────────────────────────────────────────┘')
    
    console.log('\n🔐 Security Notes:')
    console.log('• These are test accounts with strong passwords')
    console.log('• Change passwords in production environment')
    console.log('• Admin account has full system access')
    console.log('• District officer has limited access to Tamale district')
    
    console.log('\n🚀 Next Steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Navigate to the login page')
    console.log('3. Use either test account to log in')
    console.log('4. Test different permission levels')
    
    console.log('\n📧 Email Confirmation:')
    console.log('• If email confirmation is required, check your Supabase dashboard')
    console.log('• You may need to confirm emails manually in development')
    console.log('• Or disable email confirmation in Supabase Auth settings')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your .env file has correct Supabase credentials')
    console.log('2. Ensure your Supabase project is active')
    console.log('3. Verify Auth is enabled in your Supabase project')
    console.log('4. Check if email confirmation is required')
    console.log('5. Ensure workers table exists if you want worker profiles')
  }
}

// Run the setup
createTestUsers()