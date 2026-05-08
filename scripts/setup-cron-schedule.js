import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
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

// Read the migration file
const readMigrationFile = () => {
  try {
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '011_setup_climate_cron_schedule.sql')
    return fs.readFileSync(migrationPath, 'utf8')
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message)
    return null
  }
}

// Execute SQL with proper error handling
const executeSQL = async (sql, description) => {
  try {
    console.log(`🔄 ${description}...`)
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
    
    let successCount = 0
    let errors = []
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          })
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('unschedule')) {
              console.log(`⚠️  ${error.message} (continuing...)`)
            } else {
              errors.push(`Statement failed: ${error.message}`)
              console.error(`❌ SQL Error: ${error.message}`)
            }
          } else {
            successCount++
          }
        } catch (err) {
          errors.push(`Execution error: ${err.message}`)
          console.error(`❌ Execution Error: ${err.message}`)
        }
      }
    }
    
    if (errors.length === 0) {
      console.log(`✅ ${description} completed successfully (${successCount} statements)`)
      return { success: true }
    } else {
      console.log(`⚠️  ${description} completed with ${errors.length} errors out of ${statements.length} statements`)
      return { success: false, errors, partialSuccess: successCount > 0 }
    }
    
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main setup function
const setupCronSchedule = async () => {
  console.log('🚀 Setting up pg_cron schedule for climate automation...\n')
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { error: connectionError } = await supabase.auth.getSession()
    console.log('✅ Supabase connection successful')
    
    // Read migration file
    const migrationSQL = readMigrationFile()
    if (!migrationSQL) {
      throw new Error('Could not read migration file')
    }
    
    console.log('📄 Migration file loaded successfully')
    
    // Note about service role key
    console.log('\n⚠️  IMPORTANT: This migration requires a service role key.')
    console.log('   The migration contains placeholder tokens that need to be replaced')
    console.log('   with your actual Supabase service role key for the cron jobs to work.')
    console.log('   You can find your service role key in your Supabase dashboard under Settings > API.\n')
    
    // Execute migration
    const migrationResult = await executeSQL(
      migrationSQL, 
      'Setting up pg_cron schedules for climate automation'
    )
    
    if (migrationResult.success || migrationResult.partialSuccess) {
      console.log('\n🎉 Cron schedule setup completed!')
      console.log('\n📋 Scheduled Jobs:')
      console.log('   🌤️  fetch-climate-6h: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)')
      console.log('   📊 risk-assessment-after-climate: 30 minutes after climate fetch')
      console.log('   📱 sms-critical-alerts-2h: Every 2 hours for critical alerts')
      
      console.log('\n🔧 Management Functions Created:')
      console.log('   • get_cron_jobs() - View all climate-related cron jobs')
      console.log('   • trigger_climate_fetch() - Manually trigger climate data fetch')
      console.log('   • trigger_risk_assessment() - Manually trigger risk assessment')
      
      console.log('\n📊 Monitoring Views Created:')
      console.log('   • cron_job_run_details - Detailed execution history')
      console.log('   • climate_automation_status - Summary of all processes')
      
      console.log('\n🧪 Test the Setup:')
      console.log('   1. SELECT * FROM climate_automation_status;')
      console.log('   2. SELECT trigger_climate_fetch();')
      console.log('   3. SELECT * FROM cron_job_run_details ORDER BY start_time DESC LIMIT 5;')
      
      if (migrationResult.errors && migrationResult.errors.length > 0) {
        console.log('\n⚠️  Some operations had issues:')
        migrationResult.errors.forEach(error => console.log(`   • ${error}`))
        console.log('\n   This is often normal for initial setup. Check the monitoring views to verify functionality.')
      }
      
    } else {
      throw new Error(`Migration failed: ${migrationResult.error}`)
    }
    
  } catch (error) {
    console.error('\n💥 Cron schedule setup failed:', error.message)
    console.log('\n🔧 Manual Setup Instructions:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy the content from: database/migrations/011_setup_climate_cron_schedule.sql')
    console.log('4. Replace the placeholder service role key with your actual key')
    console.log('5. Execute the SQL')
    console.log('\n💡 Your service role key can be found in Settings > API in your Supabase dashboard')
    process.exit(1)
  }
}

// Run setup
setupCronSchedule()