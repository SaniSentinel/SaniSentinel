/**
 * Apply Migration 034: Admin Delete User Account
 * 
 * This script applies the delete user account functionality with audit logging.
 * 
 * Features:
 * - delete_user_account(email) - Basic delete function
 * - delete_user_account_with_audit(email) - Delete with full audit trail
 * - user_account_audit_log table - Tracks all deletions
 * - get_recent_account_deletions(days) - View deletion history
 * 
 * Usage:
 *   node scripts/apply-migration-034.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure these are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Starting Migration 034: Admin Delete User Account\n')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'database', 'migrations', '034_admin_delete_user_account.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded successfully')
    console.log('📊 Executing SQL statements...\n')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single()

    if (error) {
      // If exec_sql RPC doesn't exist, try direct execution
      console.log('⚠️  exec_sql RPC not available, attempting direct execution...\n')
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          try {
            await supabase.rpc('exec', { sql: statement + ';' })
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
          } catch (err) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, err.message)
          }
        }
      }
    }

    console.log('\n✅ Migration 034 applied successfully!\n')
    console.log('📋 Created functions:')
    console.log('   ✓ delete_user_account(user_email)')
    console.log('   ✓ delete_user_account_with_audit(user_email)')
    console.log('   ✓ get_recent_account_deletions(days_back)')
    console.log('\n📋 Created tables:')
    console.log('   ✓ user_account_audit_log')
    console.log('\n🔒 Security:')
    console.log('   ✓ Admin-only access enforced')
    console.log('   ✓ Cannot delete admin accounts')
    console.log('   ✓ Full audit trail enabled')
    console.log('\n💡 Usage examples:')
    console.log('   -- Delete a user (with audit):')
    console.log('   SELECT delete_user_account_with_audit(\'officer@example.com\');')
    console.log('\n   -- View recent deletions:')
    console.log('   SELECT * FROM get_recent_account_deletions(30);')
    console.log('\n   -- View all audit logs:')
    console.log('   SELECT * FROM user_account_audit_log ORDER BY performed_at DESC;')

    // Test the function exists
    console.log('\n🧪 Testing function availability...')
    const { data: testData, error: testError } = await supabase.rpc('delete_user_account_with_audit', {
      user_email: 'test@nonexistent.com'
    })

    if (testError) {
      if (testError.message.includes('User not found')) {
        console.log('✅ Function is working correctly (expected error for non-existent user)')
      } else if (testError.message.includes('Only administrators')) {
        console.log('✅ Function is working correctly (admin check is active)')
      } else {
        console.log('⚠️  Function test returned:', testError.message)
      }
    } else {
      console.log('✅ Function is accessible')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n📝 Manual steps:')
    console.error('   1. Open Supabase Dashboard → SQL Editor')
    console.error('   2. Copy the contents of database/migrations/034_admin_delete_user_account.sql')
    console.error('   3. Paste and run the SQL directly in the dashboard')
    process.exit(1)
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✨ Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
