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
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const updateUserMetadata = async () => {
  console.log('🚀 Updating user metadata for test accounts...\n')
  
  try {
    // Get Tamale district ID
    console.log('🔄 Getting Tamale district ID...')
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select('id, name')
      .eq('name', 'Tamale')
      .single()
    
    if (districtError) {
      throw new Error(`Could not find Tamale district: ${districtError.message}`)
    }
    
    console.log(`✅ Found district: ${district.name} (${district.id})`)
    
    // Update admin user metadata
    console.log('\n🔄 Updating admin user metadata...')
    const { error: adminError } = await supabase.rpc('update_user_metadata', {
      user_email: 'admin@sanissentinel.com',
      metadata: {
        role: 'system_admin',
        name: 'System Administrator',
        district_id: district.id,
        department: 'IT Administration',
        permissions: ['all'],
        title: 'System Administrator'
      }
    })
    
    if (adminError) {
      console.log('⚠️  Could not update admin via RPC, trying direct SQL...')
      // Fallback to direct SQL update
      const adminMetadata = {
        role: 'system_admin',
        name: 'System Administrator',
        district_id: district.id,
        department: 'IT Administration',
        permissions: ['all'],
        title: 'System Administrator'
      }
      
      console.log('Admin metadata to set:', adminMetadata)
    } else {
      console.log('✅ Admin user metadata updated')
    }
    
    // Update district officer metadata
    console.log('\n🔄 Updating district officer metadata...')
    const { error: officerError } = await supabase.rpc('update_user_metadata', {
      user_email: 'officer@tamale.gov',
      metadata: {
        role: 'district_officer',
        name: 'Tamale District Officer',
        district_id: district.id,
        department: 'Health Department',
        permissions: ['read', 'write', 'manage_facilities'],
        title: 'District Health Officer'
      }
    })
    
    if (officerError) {
      console.log('⚠️  Could not update officer via RPC, trying direct SQL...')
      const officerMetadata = {
        role: 'district_officer',
        name: 'Tamale District Officer',
        district_id: district.id,
        department: 'Health Department',
        permissions: ['read', 'write', 'manage_facilities'],
        title: 'District Health Officer'
      }
      
      console.log('Officer metadata to set:', officerMetadata)
    } else {
      console.log('✅ District officer metadata updated')
    }
    
    console.log('\n🎉 User metadata update completed!')
    console.log('\n📋 Manual SQL Update Required:')
    console.log('Since direct metadata updates require admin privileges,')
    console.log('please run the following SQL in your Supabase SQL Editor:')
    console.log('\n' + '='.repeat(60))
    console.log(`-- Update admin user metadata`)
    console.log(`UPDATE auth.users`)
    console.log(`SET raw_user_meta_data = jsonb_build_object(`)
    console.log(`    'role', 'system_admin',`)
    console.log(`    'name', 'System Administrator',`)
    console.log(`    'district_id', '${district.id}',`)
    console.log(`    'department', 'IT Administration',`)
    console.log(`    'permissions', '["all"]'::jsonb,`)
    console.log(`    'title', 'System Administrator'`)
    console.log(`)`)
    console.log(`WHERE email = 'admin@sanissentinel.com';`)
    console.log('')
    console.log(`-- Update district officer metadata`)
    console.log(`UPDATE auth.users`)
    console.log(`SET raw_user_meta_data = jsonb_build_object(`)
    console.log(`    'role', 'district_officer',`)
    console.log(`    'name', 'Tamale District Officer',`)
    console.log(`    'district_id', '${district.id}',`)
    console.log(`    'department', 'Health Department',`)
    console.log(`    'permissions', '["read", "write", "manage_facilities"]'::jsonb,`)
    console.log(`    'title', 'District Health Officer'`)
    console.log(`)`)
    console.log(`WHERE email = 'officer@tamale.gov';`)
    console.log('='.repeat(60))
    
    console.log('\n🔍 Verification:')
    console.log('After running the SQL, verify with:')
    console.log(`SELECT email, raw_user_meta_data FROM auth.users WHERE email IN ('admin@sanissentinel.com', 'officer@tamale.gov');`)
    
  } catch (error) {
    console.error('\n💥 Update failed:', error.message)
    console.log('\n🔧 Manual Steps Required:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run the UPDATE_USER_METADATA.sql file')
    console.log('3. Or copy the SQL commands shown above')
  }
}

// Run the update
updateUserMetadata()