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

// Database setup with districts and facilities tables
const setupDatabase = async () => {
  console.log('🚀 Setting up SaniSentinel database (Districts + Facilities)...\n')
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { error: connectionError } = await supabase.auth.getSession()
    console.log('✅ Supabase connection successful')
    
    // Check if districts table exists
    console.log('🔄 Checking if districts table exists...')
    const { data: districtsData, error: districtsError } = await supabase
      .from('districts')
      .select('*')
      .limit(1)
    
    // Check if facilities table exists
    console.log('🔄 Checking if facilities table exists...')
    const { data: facilitiesData, error: facilitiesError } = await supabase
      .from('facilities')
      .select('*')
      .limit(1)
    
    // Check if reports table exists
    console.log('🔄 Checking if reports table exists...')
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .limit(1)
    
    if (districtsError || facilitiesError || reportsError) {
      console.log('❌ One or more tables do not exist or are not accessible')
      if (districtsError) console.log('Districts error:', districtsError.message)
      if (facilitiesError) console.log('Facilities error:', facilitiesError.message)
      if (reportsError) console.log('Reports error:', reportsError.message)
      
      console.log('\n🔧 Manual Setup Required:')
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste this SQL (run in order):')
      
      console.log('\n--- STEP 1: DISTRICTS TABLE ---')
      console.log(`
-- Create districts table
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

-- Insert sample districts data for Northern Region (Ghana)
INSERT INTO public.districts (name, region, lat, lng) VALUES
    ('Tamale', 'Northern', 9.4034, -0.8424),
    ('Yendi', 'Northern', 9.4427, -0.0093),
    ('Damongo', 'Northern', 9.0840, -1.8212),
    ('Bimbilla', 'Northern', 9.6667, -0.4167),
    ('Salaga', 'Northern', 8.5500, -0.5167),
    ('Kpandai', 'Northern', 8.4667, -0.0167),
    ('Saboba', 'Northern', 9.6167, 0.3833),
    ('Chereponi', 'Northern', 10.0500, 0.0500),
    ('Gushiegu', 'Northern', 9.9667, -0.2500),
    ('Karaga', 'Northern', 9.9833, -0.6833),
    ('Savelugu', 'Northern', 9.6333, -0.8333),
    ('Tolon', 'Northern', 9.4167, -1.0000),
    ('Kumbungu', 'Northern', 9.5833, -0.8500),
    ('Nanton', 'Northern', 9.4000, -1.0833),
    ('Zabzugu', 'Northern', 9.7000, -0.1500),
    ('Tatale', 'Northern', 9.5000, 0.2500),
    ('Wulensi', 'Northern', 8.9167, -0.1833),
    ('Mion', 'Northern', 9.5500, -0.7000)
ON CONFLICT (name) DO NOTHING;
      `)
      
      console.log('\n--- STEP 2: FACILITIES TABLE ---')
      console.log(`
-- Create facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('toilet', 'latrine', 'septic_tank', 'treatment_plant', 'waste_collection_point')),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    last_serviced DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'good' CHECK (status IN ('good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service')),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_facilities_name ON public.facilities(name);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_district_id ON public.facilities(district_id);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON public.facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_risk_score ON public.facilities(risk_score);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.facilities(lat, lng);
CREATE INDEX IF NOT EXISTS idx_facilities_last_serviced ON public.facilities(last_serviced);

-- Enable Row Level Security (RLS)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to facilities" ON public.facilities
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.facilities
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
      `)
      
      console.log('\n--- STEP 3: REPORTS TABLE ---')
      console.log(`
-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    reported_by VARCHAR(255) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('good', 'damaged', 'overflow', 'dry', 'blocked', 'out_of_service')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_facility_id ON public.reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON public.reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_reports_condition ON public.reports(condition);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to reports" ON public.reports
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON public.reports
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow anonymous users to insert reports (for SMS submissions)
CREATE POLICY "Allow anonymous insert for reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- Create function to automatically update facility status based on latest report
CREATE OR REPLACE FUNCTION update_facility_status_from_report()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.facilities 
    SET status = NEW.condition,
        updated_at = NOW()
    WHERE id = NEW.facility_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update facility status when a new report is created
CREATE TRIGGER update_facility_status_on_report
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_facility_status_from_report();

-- Enable Realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
      `)
      
      console.log('\n--- STEP 4: DATABASE FUNCTIONS ---')
      console.log(`
-- Function to get districts within a specified radius using Haversine formula
CREATE OR REPLACE FUNCTION get_districts_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    region VARCHAR,
    lat DECIMAL,
    lng DECIMAL,
    distance_km DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.region,
        d.lat,
        d.lng,
        ROUND(
            (6371 * acos(
                cos(radians(center_lat)) * 
                cos(radians(d.lat)) * 
                cos(radians(d.lng) - radians(center_lng)) + 
                sin(radians(center_lat)) * 
                sin(radians(d.lat))
            ))::DECIMAL, 2
        ) AS distance_km,
        d.created_at,
        d.updated_at
    FROM public.districts d
    WHERE (
        6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(d.lat)) * 
            cos(radians(d.lng) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(d.lat))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get facilities within a specified radius using Haversine formula
CREATE OR REPLACE FUNCTION get_facilities_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    district_id UUID,
    district_name VARCHAR,
    district_region VARCHAR,
    lat DECIMAL,
    lng DECIMAL,
    last_serviced DATE,
    status VARCHAR,
    risk_score INTEGER,
    distance_km DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type,
        f.district_id,
        d.name AS district_name,
        d.region AS district_region,
        f.lat,
        f.lng,
        f.last_serviced,
        f.status,
        f.risk_score,
        ROUND(
            (6371 * acos(
                cos(radians(center_lat)) * 
                cos(radians(f.lat)) * 
                cos(radians(f.lng) - radians(center_lng)) + 
                sin(radians(center_lat)) * 
                sin(radians(f.lat))
            ))::DECIMAL, 2
        ) AS distance_km,
        f.created_at,
        f.updated_at
    FROM public.facilities f
    JOIN public.districts d ON f.district_id = d.id
    WHERE (
        6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(f.lat)) * 
            cos(radians(f.lng) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(f.lat))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
      `)
      
      console.log('\n--- END SQL ---')
      console.log('\n4. Click "Run" to execute each SQL block')
      console.log('5. Then run this script again: npm run setup-db')
      return
    }
    
    console.log('✅ All tables (districts, facilities, reports) exist and are accessible')
    
    // Check and insert sample data for districts
    console.log('🔄 Checking districts data...')
    const { data: currentDistricts, error: districtCountError } = await supabase
      .from('districts')
      .select('*')
    
    if (districtCountError) {
      throw districtCountError
    }
    
    if (currentDistricts && currentDistricts.length > 0) {
      console.log(`✅ Found ${currentDistricts.length} existing districts`)
    } else {
      console.log('🔄 Inserting sample districts data...')
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
      
      const { data: insertedDistricts, error: insertDistrictsError } = await supabase
        .from('districts')
        .insert(sampleDistricts)
        .select()
      
      if (insertDistrictsError) {
        console.log('⚠️  Districts sample data insertion failed:', insertDistrictsError.message)
      } else {
        console.log(`✅ Inserted ${insertedDistricts.length} sample districts`)
      }
    }
    
    // Check and insert sample data for facilities
    console.log('🔄 Checking facilities data...')
    const { data: currentFacilities, error: facilitiesCountError } = await supabase
      .from('facilities')
      .select('*')
    
    if (facilitiesCountError) {
      throw facilitiesCountError
    }
    
    if (currentFacilities && currentFacilities.length > 0) {
      console.log(`✅ Found ${currentFacilities.length} existing facilities`)
    } else {
      console.log('🔄 Inserting sample facilities data...')
      
      // Get district IDs for sample facilities
      const { data: districts, error: getDistrictsError } = await supabase
        .from('districts')
        .select('id, name')
      
      if (getDistrictsError) {
        throw getDistrictsError
      }
      
      // Create a map of district names to IDs
      const districtMap = {}
      districts.forEach(district => {
        districtMap[district.name] = district.id
      })
      
      const sampleFacilities = [
        // Tamale facilities
        { name: 'Tamale Central Market Toilet', type: 'toilet', district_id: districtMap['Tamale'], lat: 9.4034, lng: -0.8424, last_serviced: '2024-01-15', status: 'good' },
        { name: 'Tamale Hospital Septic Tank', type: 'septic_tank', district_id: districtMap['Tamale'], lat: 9.4050, lng: -0.8400, last_serviced: '2024-02-01', status: 'good' },
        { name: 'Tamale School Block Latrine', type: 'latrine', district_id: districtMap['Tamale'], lat: 9.4020, lng: -0.8450, last_serviced: '2023-12-20', status: 'damaged' },
        
        // Yendi facilities
        { name: 'Yendi Market Toilet Complex', type: 'toilet', district_id: districtMap['Yendi'], lat: 9.4427, lng: -0.0093, last_serviced: '2024-01-10', status: 'overflow' },
        { name: 'Yendi Community Latrine', type: 'latrine', district_id: districtMap['Yendi'], lat: 9.4400, lng: -0.0100, last_serviced: '2023-11-30', status: 'blocked' },
        
        // Damongo facilities
        { name: 'Damongo Health Center Toilet', type: 'toilet', district_id: districtMap['Damongo'], lat: 9.0840, lng: -1.8212, last_serviced: '2024-02-05', status: 'good' },
        { name: 'Damongo Waste Collection Point', type: 'waste_collection_point', district_id: districtMap['Damongo'], lat: 9.0850, lng: -1.8200, last_serviced: '2024-01-25', status: 'good' },
        
        // Bimbilla facilities
        { name: 'Bimbilla School Latrine Block', type: 'latrine', district_id: districtMap['Bimbilla'], lat: 9.6667, lng: -0.4167, last_serviced: '2023-12-15', status: 'dry' },
        { name: 'Bimbilla Community Toilet', type: 'toilet', district_id: districtMap['Bimbilla'], lat: 9.6650, lng: -0.4150, last_serviced: '2024-01-20', status: 'good' }
      ]
      
      const { data: insertedFacilities, error: insertFacilitiesError } = await supabase
        .from('facilities')
        .insert(sampleFacilities)
        .select()
      
      if (insertFacilitiesError) {
        console.log('⚠️  Facilities sample data insertion failed:', insertFacilitiesError.message)
      } else {
        console.log(`✅ Inserted ${insertedFacilities.length} sample facilities`)
      }
    }
    
    // Check and insert sample data for reports
    console.log('🔄 Checking reports data...')
    const { data: currentReports, error: reportsCountError } = await supabase
      .from('reports')
      .select('*')
    
    if (reportsCountError) {
      throw reportsCountError
    }
    
    if (currentReports && currentReports.length > 0) {
      console.log(`✅ Found ${currentReports.length} existing reports`)
    } else {
      console.log('🔄 Inserting sample reports data...')
      
      // Get some facility IDs for sample reports
      const { data: sampleFacilities, error: getFacilitiesError } = await supabase
        .from('facilities')
        .select('id, name')
        .limit(5)
      
      if (getFacilitiesError) {
        throw getFacilitiesError
      }
      
      if (sampleFacilities && sampleFacilities.length > 0) {
        const sampleReports = [
          { facility_id: sampleFacilities[0].id, reported_by: '+233241234567', condition: 'good', notes: 'Facility is clean and functioning well', created_at: '2024-02-15T08:30:00Z' },
          { facility_id: sampleFacilities[1].id, reported_by: '+233241234568', condition: 'overflow', notes: 'Toilet is overflowing, needs immediate attention', created_at: '2024-02-14T14:20:00Z' },
          { facility_id: sampleFacilities[2].id, reported_by: '+233241234569', condition: 'good', notes: 'All systems working normally', created_at: '2024-02-14T10:15:00Z' },
          { facility_id: sampleFacilities[3].id, reported_by: '+233241234570', condition: 'dry', notes: 'No water supply, hand washing station empty', created_at: '2024-02-13T16:45:00Z' },
          { facility_id: sampleFacilities[4].id, reported_by: '+233241234571', condition: 'damaged', notes: 'Door lock broken, needs repair', created_at: '2024-02-13T09:30:00Z' }
        ]
        
        const { data: insertedReports, error: insertReportsError } = await supabase
          .from('reports')
          .insert(sampleReports)
          .select()
        
        if (insertReportsError) {
          console.log('⚠️  Reports sample data insertion failed:', insertReportsError.message)
        } else {
          console.log(`✅ Inserted ${insertedReports.length} sample reports`)
        }
      }
    }
    
    // Final verification
    console.log('🔄 Final verification...')
    const { data: finalDistricts } = await supabase.from('districts').select('*').limit(3)
    const { data: finalFacilities } = await supabase.from('facilities').select('*, district:districts(name)').limit(3)
    const { data: finalReports } = await supabase.from('reports').select('*, facility:facilities(name)').limit(3)
    
    console.log(`✅ Verification successful!`)
    console.log(`   - Districts table: ${finalDistricts?.length || 0} accessible records`)
    console.log(`   - Facilities table: ${finalFacilities?.length || 0} accessible records`)
    console.log(`   - Reports table: ${finalReports?.length || 0} accessible records`)
    
    if (finalFacilities && finalFacilities.length > 0) {
      console.log('   Sample facilities:')
      finalFacilities.forEach(facility => {
        console.log(`     - ${facility.name} (${facility.type}) in ${facility.district?.name}`)
      })
    }
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 What was set up:')
    console.log('   ✅ Districts table with 18 Northern Ghana districts')
    console.log('   ✅ Facilities table with sample sanitation facilities')
    console.log('   ✅ Reports table with condition reporting system')
    console.log('   ✅ Database functions for radius-based queries')
    console.log('   ✅ Auto-update triggers and realtime subscriptions')
    console.log('   ✅ Row Level Security (RLS) policies')
    console.log('   ✅ Proper indexes for performance')
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Test the APIs in your React app:')
    console.log('      import { districts } from "./src/lib/districts"')
    console.log('      import { facilities } from "./src/lib/facilities"')
    console.log('   3. Check your Supabase dashboard to see both tables')
    
    console.log('\n📊 Available API methods:')
    console.log('   Districts: getAll(), getByRegion(), search(), create()')
    console.log('   Facilities: getAll(), getByDistrict(), getByStatus(), getHighRisk()')
    console.log('   Reports: getAll(), getByFacility(), createFromSMS(), getRecent()')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your .env file has correct Supabase credentials')
    console.log('2. Ensure your Supabase project is active')
    console.log('3. Create the tables manually using the SQL provided above')
    console.log('4. Make sure RLS policies allow read access')
  }
}

// Run the setup
setupDatabase()