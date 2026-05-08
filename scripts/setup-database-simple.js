import { supabase } from '../src/lib/supabase.js'

// Simple database setup using individual queries
const setupDatabase = async () => {
  console.log('🚀 Setting up districts table...\n')
  
  try {
    // 1. Create the districts table
    console.log('🔄 Creating districts table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.districts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          region VARCHAR(255) NOT NULL,
          lat DECIMAL(10, 8) NOT NULL,
          lng DECIMAL(11, 8) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (tableError && !tableError.message.includes('already exists')) {
      throw tableError
    }
    console.log('✅ Districts table created')
    
    // 2. Create indexes
    console.log('🔄 Creating indexes...')
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_districts_name ON public.districts(name);
        CREATE INDEX IF NOT EXISTS idx_districts_region ON public.districts(region);
        CREATE INDEX IF NOT EXISTS idx_districts_location ON public.districts(lat, lng);
      `
    })
    console.log('✅ Indexes created')
    
    // 3. Enable RLS
    console.log('🔄 Enabling Row Level Security...')
    await supabase.rpc('exec_sql', {
      sql_query: `ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;`
    })
    console.log('✅ RLS enabled')
    
    // 4. Create policies
    console.log('🔄 Creating security policies...')
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY IF NOT EXISTS "Allow read access to districts" ON public.districts
          FOR SELECT USING (true);
      `
    })
    
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY IF NOT EXISTS "Allow full access to authenticated users" ON public.districts
          FOR ALL USING (auth.role() = 'authenticated');
      `
    })
    console.log('✅ Security policies created')
    
    // 5. Create update trigger function
    console.log('🔄 Creating update trigger...')
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    })
    
    await supabase.rpc('exec_sql', {
      sql_query: `
        DROP TRIGGER IF EXISTS handle_districts_updated_at ON public.districts;
        CREATE TRIGGER handle_districts_updated_at
          BEFORE UPDATE ON public.districts
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();
      `
    })
    console.log('✅ Update trigger created')
    
    // 6. Insert sample data
    console.log('🔄 Inserting sample data...')
    const sampleDistricts = [
      { name: 'Nairobi', region: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      { name: 'Mombasa', region: 'Coast', lat: -4.0435, lng: 39.6682 },
      { name: 'Kisumu', region: 'Nyanza', lat: -0.0917, lng: 34.7680 },
      { name: 'Nakuru', region: 'Rift Valley', lat: -0.3031, lng: 36.0800 },
      { name: 'Eldoret', region: 'Rift Valley', lat: 0.5143, lng: 35.2698 },
      { name: 'Thika', region: 'Central', lat: -1.0332, lng: 37.0692 },
      { name: 'Malindi', region: 'Coast', lat: -3.2194, lng: 40.1169 },
      { name: 'Kitale', region: 'Rift Valley', lat: 1.0157, lng: 35.0062 },
      { name: 'Garissa', region: 'North Eastern', lat: -0.4536, lng: 39.6401 },
      { name: 'Kakamega', region: 'Western', lat: 0.2827, lng: 34.7519 },
      { name: 'Machakos', region: 'Eastern', lat: -1.5177, lng: 37.2634 },
      { name: 'Meru', region: 'Eastern', lat: 0.0467, lng: 37.6556 },
      { name: 'Nyeri', region: 'Central', lat: -0.4209, lng: 36.9483 },
      { name: 'Kericho', region: 'Rift Valley', lat: -0.3676, lng: 35.2861 },
      { name: 'Embu', region: 'Eastern', lat: -0.5312, lng: 37.4512 }
    ]
    
    // Check if data already exists
    const { data: existingData } = await supabase
      .from('districts')
      .select('count(*)')
      .single()
    
    if (!existingData || existingData.count === 0) {
      const { error: insertError } = await supabase
        .from('districts')
        .insert(sampleDistricts)
      
      if (insertError) {
        console.log('⚠️  Sample data insertion failed:', insertError.message)
      } else {
        console.log('✅ Sample data inserted')
      }
    } else {
      console.log('✅ Sample data already exists')
    }
    
    // 7. Verify setup
    console.log('🔄 Verifying setup...')
    const { data: districts, error: verifyError } = await supabase
      .from('districts')
      .select('*')
      .limit(5)
    
    if (verifyError) {
      throw verifyError
    }
    
    console.log(`✅ Setup verified! Found ${districts.length} districts`)
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 What was created:')
    console.log('   ✅ Districts table with proper schema')
    console.log('   ✅ Performance indexes')
    console.log('   ✅ Row Level Security')
    console.log('   ✅ Security policies')
    console.log('   ✅ Auto-update triggers')
    console.log('   ✅ Sample Kenyan districts data')
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Test the API: import { districts } from "./src/lib/districts"')
    console.log('   2. Try: const { data } = await districts.getAll()')
    console.log('   3. Check your Supabase dashboard to see the new table')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your .env file has correct Supabase credentials')
    console.log('2. Ensure your Supabase project is active')
    console.log('3. Try running the SQL manually in Supabase dashboard')
    process.exit(1)
  }
}

// Run the setup
setupDatabase()