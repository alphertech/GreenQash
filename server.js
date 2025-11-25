import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Initialize Supabase client
const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co' // Your Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM' // Your anon public key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Utility: set innerText for element with given id
function setInnerTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.innerText = value === null || value === undefined ? '' : String(value);
    return true;
}

// Fetch a single row by primary key and map columns to DOM elements
async function fetchAndBindRow(table, pkColumn, pkValue, opts = {}) {
    if (!table || !pkColumn) {
        console.error('table and pkColumn are required');
        return null;
    }

    try {
        const select = opts.select ?? '*';
        const { data, error, status } = await supabase
            .from(table)
            .select(select)
            .eq(pkColumn, pkValue)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            return null;
        }
        if (!data) {
            console.warn(`No row found in ${table} where ${pkColumn} = ${pkValue}`);
            return null;
        }

        console.log(`Fetched ${table} data:`, data);

        // Map each column to element with same id
        Object.entries(data).forEach(([col, val]) => {
            // Handle special formatting for certain fields
            let formattedValue = val;
            
            if (col === 'created_at' || col === 'last_login') {
                formattedValue = formatDate(val);
            } else if (col === 'all_time_earn' || col === 'total_withdrawn' || col === 'total_income') {
                formattedValue = formatCurrency(val);
            }
            
            setInnerTextIfExists(col, formattedValue);
        });

        // Also set an element with id equal to table name with the full JSON (optional)
        setInnerTextIfExists(table, JSON.stringify(data, null, 2));

        return data;
    } catch (err) {
        console.error('Unexpected error in fetchAndBindRow:', err);
        return null;
    }
}

// Function to check authentication and get user ID
async function getAuthenticatedUserId() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            console.error('User not authenticated:', error);
            window.location.href = '/login.html';
            return null;
        }
        
        // Get the user ID from your users table (since auth user ID might be different)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email_address', user.email)
            .single();
            
        if (userError) {
            console.error('Error finding user in database:', userError);
            return null;
        }
        
        return userData.id;
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
    }
}

// Main function to fetch and bind all user data
async function fetchAllUserData() {
    try {
        showLoadingState(true);

        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        // Fetch and bind user profile data
        await fetchAndBindRow('users', 'id', userId, { 
            select: 'id, user_name, email_address, created_at, status, rank, last_login, total_income' 
        });

        // Fetch and bind earnings data
        await fetchAndBindRow('earnings', 'id', userId);

        // Fetch and bind payment information
        await fetchAndBindRow('payment_information', 'id', userId);

        // Optional: Fetch user's content posts
        const { data: userContents, error: contentsError } = await supabase
            .from('contents')
            .select('*')
            .eq('id', userId);
            
        if (!contentsError && userContents) {
            console.log('User contents:', userContents);
            // You could display a list of contents or bind the first one
            if (userContents.length > 0) {
                // Bind the first content post to elements
                Object.entries(userContents[0]).forEach(([col, val]) => {
                    let formattedValue = val;
                    if (col === 'created_at') formattedValue = formatDate(val);
                    setInnerTextIfExists(col, formattedValue);
                });
            }
        }

        // Optional: Fetch withdrawal requests
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('id', userId)
            .order('created_at', { ascending: false });
            
        if (!withdrawalsError && withdrawals) {
            console.log('Withdrawal requests:', withdrawals);
            // You could display these in a table or list
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        showErrorMessage('Failed to load user data. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'UGX 0';
    return `UGX ${Number(amount).toLocaleString()}`;
}

// UI helper functions
function showLoadingState(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

function showErrorMessage(message) {
    console.error('Error:', message);
    // You could show a toast notification here
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Initialize the application
async function initializeApp() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.href = '/login.html';
            return;
        }

        await fetchAllUserData();
        
        // Set up real-time subscriptions for live updates
        const userId = await getAuthenticatedUserId();
        if (userId) setupRealtimeSubscriptions(userId);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        window.location.href = '/login.html';
    }
}

// Set up real-time subscriptions
function setupRealtimeSubscriptions(userId) {
    cleanupSubscriptions();

    // Subscribe to users table changes
    const usersSubscription = supabase
        .channel('users-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`
        }, (payload) => {
            console.log('Users data updated:', payload.new);
            Object.entries(payload.new).forEach(([col, val]) => {
                let formattedValue = val;
                if (col === 'created_at' || col === 'last_login') formattedValue = formatDate(val);
                if (col === 'total_income') formattedValue = formatCurrency(val);
                setInnerTextIfExists(col, formattedValue);
            });
        })
        .subscribe();

    // Subscribe to earnings table changes
    const earningsSubscription = supabase
        .channel('earnings-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'earnings',
            filter: `id=eq.${userId}`
        }, (payload) => {
            console.log('Earnings data updated:', payload.new);
            Object.entries(payload.new).forEach(([col, val]) => {
                let formattedValue = val;
                if (col === 'all_time_earn' || col === 'total_withdrawn') formattedValue = formatCurrency(val);
                setInnerTextIfExists(col, formattedValue);
            });
        })
        .subscribe();

    // Store subscriptions for cleanup
    window.supabaseSubscriptions = {
        users: usersSubscription,
        earnings: earningsSubscription
    };
}

// Clean up subscriptions
function cleanupSubscriptions() {
    if (window.supabaseSubscriptions) {
        Object.values(window.supabaseSubscriptions).forEach(channel => {
            if (channel) supabase.removeChannel(channel);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Clean up on page unload
window.addEventListener('beforeunload', cleanupSubscriptions);

// Example usage for specific pages:
// If you have a page that shows a specific content post, you can also do:
async function loadSpecificContent(postId) {
    await fetchAndBindRow('contents', 'post_id', postId);
}

// If you need to load statistics (admin feature)
async function loadStatistics() {
    // This would typically be for admin users only
    await fetchAndBindRow('statistics', 'id', 1); // Assuming there's only one stats row
}
