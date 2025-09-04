import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/supabase-browser.min.js'

// Initialize Supabase client - USE ENVIRONMENT VARIABLES IN PRODUCTION
const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to fetch and display user data
async function fetchUserData() {
    try {
        // Show loading state
        showLoadingState(true);

        // Get current user session
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error('User not authenticated:', userError)
            // Redirect to login or handle unauthorized access
            window.location.href = '/login.html'
            return
        }

        // Fetch data from profiles table
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, phone, email_address, created_at')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile data:', profileError)
            // Check if it's a "not found" error and create profile if needed
            if (profileError.code === 'PGRST116') {
                await createUserProfile(user);
                // Retry fetching
                return fetchUserData();
            }
            return
        }

        // Display profile data (robust)
        if (profileData) {
            console.log('Profile Data:', profileData);
            // Username: update all elements with class 'username00'
            document.querySelectorAll('.username00').forEach(el => el.innerText = profileData.username || 'N/A');
            // Phone number
            document.querySelectorAll('.phoneNumber').forEach(el => el.innerText = profileData.phone || 'N/A');
            // Email
            document.querySelectorAll('.emailAdress').forEach(el => el.innerText = profileData.email_address || user.email || 'N/A');
            // Date created
            document.querySelectorAll('#dateCreated').forEach(el => el.innerText = formatDate(profileData.created_at) || 'N/A');
        } else {
            console.warn('No profile data found for user:', user);
        }

        // Fetch data from userStats table
        const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('total, youtube, tiktok, trivia, bonus, allTimeEarning, withdrawn, refferals')
            .eq('user_id', user.id)
            .single()

        if (statsError) {
            console.error('Error fetching user stats:', statsError)
            // Create stats record if it doesn't exist
            if (statsError.code === 'PGRST116') {
                await createUserStats(user.id);
                // Retry fetching
                return fetchUserData();
            }
            return
        }

        // Display user stats data (robust)
        if (statsData) {
            console.log('Stats Data:', statsData);
            // Try to update all possible stat fields
            document.querySelectorAll('#youtube').forEach(el => el.innerText = statsData.youtube || 0);
            document.querySelectorAll('#tiktok').forEach(el => el.innerText = statsData.tiktok || 0);
            document.querySelectorAll('#triviaEarn').forEach(el => el.innerText = statsData.trivia || 0);
            document.querySelectorAll('#bonus').forEach(el => el.innerText = statsData.bonus || 0);
            document.querySelectorAll('#totalCash').forEach(el => el.innerText = formatCurrency(statsData.allTimeEarning) || 'UGX 0.00');
            document.querySelectorAll('#withdrawnCash').forEach(el => el.innerText = formatCurrency(statsData.withdrawn) || 'UGX 0.00');
            document.querySelectorAll('#refferals').forEach(el => el.innerText = statsData.refferals || 0);
            document.querySelectorAll('#total').forEach(el => el.innerText = statsData.total || 0);
        } else {
            console.warn('No stats data found for user:', user);
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        showErrorMessage('Failed to load user data. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

// Helper function to create user profile if it doesn't exist
async function createUserProfile(user) {
    const { error } = await supabase
        .from('profiles')
        .insert([
            {
                id: user.id,
                email: user.email,
                username: user.email.split('@')[0],
                created_at: new Date().toISOString()
            }
        ]);

    if (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Helper function to create user stats if it doesn't exist
async function createUserStats(userId) {
    const { error } = await supabase
        .from('user_stats')
        .insert([
            {
                user_id: userId,
                total: 0,
                youtube: 0,
                tiktok: 0,
                trivia: 0,
                bonus: 0,
                allTimeEarning: 0,
                withdrawn: 0,
                refferals: 0,
                created_at: new Date().toISOString()
            }
        ]);

    if (error) {
        console.error('Error creating user stats:', error);
        throw error;
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A'

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
}

// Helper function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'UGX 0.00'
    // Use a more reliable method for UGX formatting
    return `UGX ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
}

// UI helper functions
function showLoadingState(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

function showErrorMessage(message) {
    // Implement error message display logic
    console.error('Error:', message);
    // You could show a toast notification here
}

// Function to check authentication status and fetch data
async function initializeApp() {
    try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            // Redirect to login if not authenticated
            window.location.href = '/login.html'
            return
        }

        // Fetch and display user data
        await fetchUserData()
    } catch (error) {
        console.error('Failed to initialize app:', error);
        window.location.href = '/login.html';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp)

// Listen for a custom event 'userLoggedIn' to fetch user data immediately after login
document.addEventListener('userLoggedIn', async () => {
    await fetchUserData();
    // Optionally, set up real-time subscriptions for live updates
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setupRealtimeSubscriptions(user.id);
});

// Optional: Set up real-time subscriptions for live updates
function setupRealtimeSubscriptions(userId) {
    // Clean up any existing subscriptions
    cleanupSubscriptions();

    // Subscribe to profile changes
    const profileSubscription = supabase
        .channel('profile-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
        }, (payload) => {
            // Update UI with new profile data (robust)
            document.querySelectorAll('.username00').forEach(el => el.innerText = payload.new.username || 'N/A');
            document.querySelectorAll('.phoneNumber').forEach(el => el.innerText = payload.new.phone || 'N/A');
            document.querySelectorAll('.emailAdress').forEach(el => el.innerText = payload.new.email || 'N/A');
            document.querySelectorAll('#dateCreated').forEach(el => el.innerText = formatDate(payload.new.created_at) || 'N/A');
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Profile subscription active');
            }
        })

    // Subscribe to userStats changes
    const statsSubscription = supabase
        .channel('stats-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_stats',
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            // Update UI with new stats data (robust)
            document.querySelectorAll('#total').forEach(el => el.innerText = payload.new.total || 0);
            document.querySelectorAll('#youtube').forEach(el => el.innerText = payload.new.youtube || 0);
            document.querySelectorAll('#tiktok').forEach(el => el.innerText = payload.new.tiktok || 0);
            document.querySelectorAll('#triviaEarn').forEach(el => el.innerText = payload.new.trivia || 0);
            document.querySelectorAll('#bonus').forEach(el => el.innerText = payload.new.bonus || 0);
            document.querySelectorAll('#totalCash').forEach(el => el.innerText = formatCurrency(payload.new.allTimeEarning) || 'UGX 0.00');
            document.querySelectorAll('#withdrawnCash').forEach(el => el.innerText = formatCurrency(payload.new.withdrawn) || 'UGX 0.00');
            document.querySelectorAll('#refferals').forEach(el => el.innerText = payload.new.refferals || 0);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Stats subscription active');
            }
        })

    // Store subscriptions for cleanup
    window.supabaseSubscriptions = {
        profile: profileSubscription,
        stats: statsSubscription
    };
}

// Clean up subscriptions
function cleanupSubscriptions() {
    if (window.supabaseSubscriptions) {
        if (window.supabaseSubscriptions.profile) {
            supabase.removeChannel(window.supabaseSubscriptions.profile);
        }
        if (window.supabaseSubscriptions.stats) {
            supabase.removeChannel(window.supabaseSubscriptions.stats);
        }
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanupSubscriptions);
