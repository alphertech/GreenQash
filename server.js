import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/supabase-browser.min.js'

// Initialize Supabase client
const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to fetch and display user data
async function fetchUserData() {
    try {
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
            .select('username, phone, email, created_at')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile data:', profileError)
            return
        }

        // Display profile data (robust)
        if (profileData) {
            console.log('Profile Data:', profileData);
            // Username: update all elements with id 'username00'
            document.querySelectorAll('#username00').forEach(el => el.innerText = profileData.username || 'N/A');
            // Phone number
            document.querySelectorAll('#phoneNumber').forEach(el => el.innerText = profileData.phone || 'N/A');
            // Email
            document.querySelectorAll('#emailAdress, .emailAdress').forEach(el => el.innerText = profileData.email || user.email || 'N/A');
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
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'UGX'
    }).format(amount)
}

// Function to check authentication status and fetch data
async function initializeApp() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html'
        return
    }

    // Fetch and display user data
    await fetchUserData()
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
            document.querySelectorAll('#username00').forEach(el => el.innerText = payload.new.username || 'N/A');
            document.querySelectorAll('#phoneNumber').forEach(el => el.innerText = payload.new.phone || 'N/A');
            document.querySelectorAll('#emailAddress, .emailAddress').forEach(el => el.innerText = payload.new.email || 'N/A');
            document.querySelectorAll('#dateCreated').forEach(el => el.innerText = formatDate(payload.new.created_at) || 'N/A');
        })
        .subscribe()

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
            document.querySelectorAll('#withdrawn').forEach(el => el.innerText = formatCurrency(payload.new.withdrawn) || 'UGX 0.00');
            document.querySelectorAll('#refferals').forEach(el => el.innerText = payload.new.refferals || 0);
        })
        .subscribe()

    return { profileSubscription, statsSubscription }
}

// Call this after successful authentication to set up real-time updates
// setupRealtimeSubscriptions(user.id)
