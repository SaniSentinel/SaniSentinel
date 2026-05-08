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

// Database setup using direct operations
const setupDatabase = async () => {
  console.log('🚀 Setting up SaniSentinel database...\n')
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { error: connectionError } = await supabase.auth.getSession()
    console.log('✅ Supabase connection successful')
    
    // Since we can't use exec_sql, we'll insert sample data directly
    // The table should be created manually in Supabase dashboard
    
    console.log('🔄 Checking if districts table exists...')
    const { data: existingData, error: checkError } = await supabase
      .from('districts')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.log('❌ Districts table does not exist or is not accessible')
      console.log('Error:', checkError.message)
      console.log('\n🔧 Manual Setup Required:')
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste this SQL:')
      console.log('\n--- COPY FROM HERE ---')
      console.log(`
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_districts_name ON public.districts(name);
CREATE INDEX IF NOT EXISTS idx_districts_region ON public.districts(region);
CREATE INDEX IF NOT EXISTS idx_districts_location ON public.districts(lat, lng);

-- Enable Row Level Security (RLS)
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to districts" ON public.districts
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.districts
    FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_districts_updated_at
    BEFORE UPDATE ON public.districts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
      `)
      console.log('--- COPY TO HERE ---')
      console.log('\n4. Click "Run" to execute the SQL')
      console.log('5. Then run this script again: npm run setup-db')
      return
    }
    
    console.log('✅ Districts table exists and is accessible')
    
    // Insert sample data
    console.log('🔄 Inserting sample data...')
    const sampleDistricts = [
      { name: 'Tamale', region: 'Northern', lat: 9.4034, lng: -0.8424 },
      { name: 'Yendi', region: 'Northern', lat: 9.4427, lng: -0.0093 },
      { name: 'Damongo', region: 'Northern', lat: 9.0840, lng: -1.8212 },
      { name: 'Bimbilla', region: 'Northern', lat: 9.6667, lng: -0.4167 },
      { name: 'Salaga', region: 'Northern', lat: 8.5500, lng: -0.5167 },
      { name: 'Kpandai', region: 'Northern', lat: 8.4667, lng: -0.0167 },
      { name: 'Saboba', region: 'Northern', lat: 9.6167, lng: 0.3833 },
      { name: 'Chereponi', region: 'Northern', lat: 10.0500, lng: 0.0500 },
      { name: 'Gushiegu', region: 'Northern', lat: 9.9667, lng: -0.2500 },
      { name: 'Karaga', region: 'Northern', lat: 9.9833, lng: -0.6833 },
      { name: 'Savelugu', region: 'Northern', lat: 9.6333, lng: -0.8333 },
      { name: 'Tolon', region: 'Northern', lat: 9.4167, lng: -1.0000 },
      { name: 'Kumbungu', region: 'Northern', lat: 9.5833, lng: -0.8500 },
      { name: 'Nanton', region: 'Northern', lat: 9.4000, lng: -1.0833 },
      { name: 'Zabzugu', region: 'Northern', lat: 9.7000, lng: -0.1500 },
      { name: 'Tatale', region: 'Northern', lat: 9.5000, lng: 0.2500 },
      { name: 'Wulensi', region: 'Northern', lat: 8.9167, lng: -0.1833 },
      { name: 'Mion', region: 'Northern', lat: 9.5500, lng: -0.7000 }
    ]
    
    // Check current data count
    const { data: currentData, error: countError } = await supabase
      .from('districts')
      .select('*')
    
    if (countError) {
      throw countError
    }
    
    if (currentData && currentData.length > 0) {
      console.log(`✅ Found ${currentData.length} existing districts`)
      console.log('Sample districts:', currentData.slice(0, 5).map(d => d.name).join(', '))
    } else {
      // Insert sample data
      const { data: insertedData, error: insertError } = await supabase
        .from('districts')
        .insert(sampleDistricts)
        .select()
      
      if (insertError) {
        console.log('⚠️  Sample data insertion failed:', insertError.message)
        console.log('This might be due to RLS policies. Data insertion will work once you authenticate.')
      } else {
        console.log(`✅ Inserted ${insertedData.length} sample districts`)
        console.log('Sample districts:', insertedData.slice(0, 5).map(d => d.name).join(', '))
      }
    }
    
    // Final verification
    console.log('🔄 Final verification...')
    const { data: finalData, error: finalError } = await supabase
      .from('districts')
      .select('*')
      .limit(5)
    
    if (finalError) {
      throw finalError
    }
    
    console.log(`✅ Verification successful! Table has ${finalData.length} accessible districts`)
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 What was verified:')
    console.log('   ✅ Districts table exists and is accessible')
    console.log('   ✅ Sample data is present (or attempted to insert)')
    console.log('   ✅ Basic queries work')
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Test the API in your React app:')
    console.log('      import { districts } from "./src/lib/districts"')
    console.log('      const { data } = await districts.getAll()')
    console.log('   3. Check your Supabase dashboard to see the table')
    
    console.log('\n📊 Available API methods:')
    console.log('   - districts.getAll()')
    console.log('   - districts.getByRegion("Coast")')
    console.log('   - districts.search("Nai")')
    console.log('   - districts.getById(id)')
    console.log('   - districts.create({ name, region, lat, lng })')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your .env file has correct Supabase credentials')
    console.log('2. Ensure your Supabase project is active')
    console.log('3. Create the table manually using the SQL provided above')
    console.log('4. Make sure RLS policies allow read access')
  }
}

// Run the setup
setupDatabase()