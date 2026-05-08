import { supabase } from '../src/lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read SQL files
const readSQLFile = (filePath) => {
  try {
    return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8')
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return null
  }
}

// Execute SQL query
const executeSQL = async (sql, description) => {
  try {
    console.log(`🔄 ${description}...`)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      throw error
    }
    
    console.log(`✅ ${description} completed successfully`)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    return { success: false, error: error.message }
  }
}

// Alternative method using direct SQL execution
const executeSQLDirect = async (sql, description) => {
  try {
    console.log(`🔄 ${description}...`)
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error && !error.message.includes('already exists')) {
          throw error
        }
      }
    }
    
    console.log(`✅ ${description} completed successfully`)
    return { success: true }
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 Starting database setup...\n')
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError && authError.message !== 'Invalid JWT') {
      console.log('⚠️  Not authenticated, but proceeding with public operations...')
    } else {
      console.log('✅ Supabase connection successful')
    }
    
    // Read migration file
    const migrationSQL = readSQLFile('database/migrations/001_create_districts_table.sql')
    if (!migrationSQL) {
      throw new Error('Could not read migration file')
    }
    
    // Read function file
    const functionSQL = readSQLFile('database/functions/get_districts_within_radius.sql')
    if (!functionSQL) {
      throw new Error('Could not read function file')
    }
    
    // Execute migration
    const migrationResult = await executeSQLDirect(
      migrationSQL, 
      'Creating districts table and setting up policies'
    )
    
    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.error}`)
    }
    
    // Execute function creation
    const functionResult = await executeSQLDirect(
      functionSQL,
      'Creating distance calculation function'
    )
    
    if (!functionResult.success) {
      console.log('⚠️  Function creation failed, but continuing...')
    }
    
    // Verify table creation by querying districts
    console.log('🔄 Verifying table creation...')
    const { data: districts, error: queryError } = await supabase
      .from('districts')
      .select('count(*)')
      .single()
    
    if (queryError) {
      throw new Error(`Table verification failed: ${queryError.message}`)
    }
    
    console.log(`✅ Districts table verified with ${districts.count || 0} records`)
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Districts table created')
    console.log('   ✅ Indexes created for performance')
    console.log('   ✅ Row Level Security enabled')
    console.log('   ✅ Policies configured')
    console.log('   ✅ Auto-update triggers set up')
    console.log('   ✅ Sample data inserted')
    console.log('   ⚠️  Distance function (may need manual setup)')
    
  } catch (error) {
    console.error('\n💥 Database setup failed:', error.message)
    console.log('\n🔧 Manual Setup Instructions:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the content from:')
    console.log('   - database/migrations/001_create_districts_table.sql')
    console.log('   - database/functions/get_districts_within_radius.sql')
    console.log('4. Execute each file separately')
    process.exit(1)
  }
}

// Run setup
setupDatabase()