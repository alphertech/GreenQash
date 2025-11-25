import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// REPLACE THESE WITH YOUR ACTUAL NEW CREDENTIALS
const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co' // Your Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM' // Your anon public key

console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Test function to check Supabase connection
async function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    
    try {
        // Test 1: Basic connection
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
            console.error('❌ Supabase connection failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
    }
}

// Enhanced fetch function with detailed logging
async function fetchAndBindRow(table, pkColumn, pkValue, opts = {}) {
    console.log(`🔄 Fetching from ${table} where ${pkColumn} = ${pkValue}`);
    
    if (!table || !pkColumn) {
        console.error('❌ table and pkColumn are required');
        return null;
    }

    try {
        const select = opts.select ?? '*';
        console.log(`📋 Select query: ${select}`);
        
        const { data, error, status } = await supabase
            .from(table)
            .select(select)
            .eq(pkColumn, pkValue)
            .limit(1)
            .maybeSingle();

        console.log(`📊 Query status: ${status}`);
        
        if (error) {
            console.error(`❌ Error fetching ${table}:`, error);
            return null;
        }
        
        if (!data) {
            console.warn(`⚠️ No row found in ${table} where ${pkColumn} = ${pkValue}`);
            return null;
        }

        console.log(`✅ Successfully fetched ${table} data:`, data);

        // Map each column to element with same id
        let boundCount = 0;
        Object.entries(data).forEach(([col, val]) => {
            // Handle special formatting for certain fields
            let formattedValue = val;
            
            if (col === 'created_at' || col === 'last_login') {
                formattedValue = formatDate(val);
            } else if (col === 'all_time_earn' || col === 'total_withdrawn' || col === 'total_income') {
                formattedValue = formatCurrency(val);
            }
            
            if (setInnerTextIfExists(col, formattedValue)) {
                boundCount++;
                console.log(`🔗 Bound ${col} = ${formattedValue}`);
            }
        });

        console.log(`📝 Bound ${boundCount} fields from ${table}`);
        
        // Also set an element with id equal to table name with the full JSON
        setInnerTextIfExists(table, JSON.stringify(data, null, 2));

        return data;
    } catch (err) {
        console.error('❌ Unexpected error in fetchAndBindRow:', err);
        return null;
    }
}

// Enhanced utility function with logging
function setInnerTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (!el) {
        console.log(`🔍 Element with id "${id}" not found`);
        return false;
    }
    
    const displayValue = value === null || value === undefined ? '' : String(value);
    el.innerText = displayValue;
    console.log(`✅ Set #${id} = "${displayValue}"`);
    return true;
}

// Check if user exists in your database
async function findUserInDatabase(authUser) {
    console.log('🔍 Looking for user in database:', authUser.email);
    
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, user_name, email_address')
        .eq('email_address', authUser.email)
        .maybeSingle();

    if (userError) {
        console.error('❌ Error finding user in database:', userError);
        return null;
    }
    
    if (!userData) {
        console.warn('⚠️ User not found in database, creating new user...');
        return await createUserInDatabase(authUser);
    }
    
    console.log('✅ Found user in database:', userData);
    return userData;
}

// Create user in database if they don't exist
async function createUserInDatabase(authUser) {
    console.log('👤 Creating new user in database...');
    
    const { data, error } = await supabase
        .from('users')
        .insert([
            {
                user_name: authUser.email.split('@')[0],
                email_address: authUser.email,
                created_at: new Date().toISOString(),
                status: 'active',
                total_income: 0
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('❌ Error creating user:', error);
        return null;
    }
    
    console.log('✅ Created new user:', data);
    return data;
}

// Main function to fetch all data
async function fetchAllUserData() {
    console.log('🚀 Starting to fetch all user data...');
    showLoadingState(true);

    try {
        // First test the connection
        const connectionOk = await testSupabaseConnection();
        if (!connectionOk) {
            showErrorMessage('Cannot connect to database. Please check your connection.');
            return;
        }

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('❌ Auth error:', authError);
            showErrorMessage('Please log in to continue.');
            window.location.href = '/login.html';
            return;
        }

        console.log('✅ Authenticated user:', user);

        // Find user in database
        const dbUser = await findUserInDatabase(user);
        if (!dbUser) {
            showErrorMessage('User account not found. Please contact support.');
            return;
        }

        const userId = dbUser.id;
        console.log(`🆗 Using user ID: ${userId}`);

        // Fetch all user data
        console.log('📥 Fetching user profile...');
        await fetchAndBindRow('users', 'id', userId, { 
            select: 'id, user_name, email_address, created_at, status, rank, last_login, total_income' 
        });

        console.log('📥 Fetching earnings...');
        await fetchAndBindRow('earnings', 'id', userId);

        console.log('📥 Fetching payment information...');
        await fetchAndBindRow('payment_information', 'id', userId);

        // Test: Check what elements exist on the page
        console.log('🔍 Checking available elements on page:');
        const testElements = ['user_name', 'email_address', 'total_income', 'youtube', 'tiktok', 'all_time_earn'];
        testElements.forEach(id => {
            const el = document.getElementById(id);
            console.log(`   ${el ? '✅' : '❌'} Element #${id}: ${el ? 'EXISTS' : 'MISSING'}`);
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        showErrorMessage('Failed to load user data: ' + error.message);
    } finally {
        showLoadingState(false);
        console.log('🏁 Finished fetching user data');
    }
}

// Rest of your helper functions (keep these the same)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'UGX 0';
    return `UGX ${Number(amount).toLocaleString()}`;
}

function showLoadingState(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
        console.log(show ? '🔄 Showing loader' : '✅ Hiding loader');
    }
}

function showErrorMessage(message) {
    console.error('💥 Error:', message);
    const errorEl = document.getElementById('errorMessage') || createErrorMessageElement();
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function createErrorMessageElement() {
    const errorEl = document.createElement('div');
    errorEl.id = 'errorMessage';
    errorEl.style.cssText = 'background: #fee; border: 1px solid #f00; color: #c00; padding: 10px; margin: 10px;';
    document.body.prepend(errorEl);
    return errorEl;
}

// Initialize app
async function initializeApp() {
    console.log('🎯 Initializing application...');
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Session:', session);

        if (!session) {
            console.log('❌ No session, redirecting to login...');
            window.location.href = '/login.html';
            return;
        }

        await fetchAllUserData();
        
    } catch (error) {
        console.error('💥 Failed to initialize app:', error);
        showErrorMessage('Application error: ' + error.message);
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, starting app...');
    initializeApp();
});

// Add a manual test function you can run in browser console
window.testConnection = testSupabaseConnection;
window.reloadData = fetchAllUserData;
