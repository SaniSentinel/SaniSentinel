// ============================================================================
// BROWSER CONSOLE TEST - Run this in your browser console on the admin page
// ============================================================================

console.log('🔍 Starting SaniSentinel Frontend Debug Test...');

// Test 1: Check if supabase is available
console.log('\n📡 Test 1: Supabase Connection');
if (typeof supabase !== 'undefined') {
    console.log('✅ Supabase client is available');
} else {
    console.log('❌ Supabase client not found - check imports');
}

// Test 2: Check authentication
console.log('\n🔐 Test 2: Authentication Status');
supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
        console.log('❌ Auth Error:', error.message);
    } else if (user) {
        console.log('✅ User authenticated:', user.email);
        console.log('📋 User metadata:', user.user_metadata);
        console.log('🎭 User role:', user.user_metadata?.role);
        console.log('🏛️ User district:', user.user_metadata?.district_id);
    } else {
        console.log('❌ No user authenticated');
    }
});

// Test 3: Test facilities query
console.log('\n📍 Test 3: Facilities Query');
supabase
    .from('facilities')
    .select(`
        *,
        district:districts(id, name, region)
    `)
    .then(({ data, error }) => {
        if (error) {
            console.log('❌ Facilities Error:', error.message);
            console.log('🔍 Error details:', error);
        } else {
            console.log('✅ Facilities query successful');
            console.log('📊 Total facilities:', data?.length || 0);
            console.log('🗺️ Facilities with coordinates:', 
                data?.filter(f => f.lat && f.lng).length || 0);
            
            if (data && data.length > 0) {
                console.log('📋 Sample facilities:', data.slice(0, 3));
            } else {
                console.log('⚠️ No facilities found in database');
            }
        }
    });

// Test 4: Test districts query
console.log('\n🏛️ Test 4: Districts Query');
supabase
    .from('districts')
    .select('*')
    .then(({ data, error }) => {
        if (error) {
            console.log('❌ Districts Error:', error.message);
        } else {
            console.log('✅ Districts query successful');
            console.log('📊 Total districts:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('📋 Districts:', data.map(d => d.name));
            }
        }
    });

// Test 5: Test RLS policies
console.log('\n🔒 Test 5: RLS Policy Test');
supabase
    .from('rls_policy_test')
    .select('*')
    .then(({ data, error }) => {
        if (error) {
            console.log('❌ RLS Test Error:', error.message);
        } else {
            console.log('✅ RLS test successful');
            console.log('📊 RLS results:', data);
        }
    });

// Test 6: Check browser environment
console.log('\n🌐 Test 6: Browser Environment');
console.log('📍 Current URL:', window.location.href);
console.log('🔧 User Agent:', navigator.userAgent);
console.log('📱 Screen size:', `${window.innerWidth}x${window.innerHeight}`);

// Test 7: Check for JavaScript errors
console.log('\n⚠️ Test 7: Error Monitoring');
window.addEventListener('error', (event) => {
    console.log('❌ JavaScript Error:', event.error);
});

console.log('\n🎯 Debug test complete! Check the results above.');
console.log('💡 If you see errors, copy them and share for troubleshooting.');

// Helper function to run a complete diagnostic
window.runSaniSentinelDiagnostic = async () => {
    console.log('\n🚀 Running Complete Diagnostic...');
    
    try {
        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth Status:', user ? '✅ Logged in' : '❌ Not logged in');
        
        // Check facilities
        const { data: facilities, error: facilityError } = await supabase
            .from('facilities')
            .select('*, district:districts(*)');
        
        if (facilityError) {
            console.log('Facilities Error:', facilityError);
        } else {
            console.log(`Facilities: ${facilities?.length || 0} total`);
            console.log(`With coordinates: ${facilities?.filter(f => f.lat && f.lng).length || 0}`);
        }
        
        // Check if map container exists
        const mapContainer = document.querySelector('.leaflet-container');
        console.log('Map container:', mapContainer ? '✅ Found' : '❌ Not found');
        
        return {
            authenticated: !!user,
            isAdmin: user?.user_metadata?.role === 'system_admin',
            facilitiesCount: facilities?.length || 0,
            facilitiesWithCoords: facilities?.filter(f => f.lat && f.lng).length || 0,
            mapExists: !!mapContainer
        };
        
    } catch (error) {
        console.log('Diagnostic Error:', error);
        return { error: error.message };
    }
};

console.log('\n💡 Run window.runSaniSentinelDiagnostic() for a quick summary');