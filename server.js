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

        // Display profile data
        if (profileData) {
            // Username: update all elements with id 'username00'
            const usernameEls = document.querySelectorAll('#username00');
            usernameEls.forEach(el => el.innerText = profileData.username || 'N/A');

            // Phone number
            const phoneEl = document.getElementById('phoneNumber');
            if (phoneEl) phoneEl.innerText = profileData.phone || 'N/A';

            // Email: try to find by class or add fallback
            const emailEl = document.getElementById('emailAddress') || document.querySelector('.emailAddress');
            if (emailEl) emailEl.innerText = profileData.email || user.email || 'N/A';

            // Date created
            const dateEls = document.querySelectorAll('#dateCreated');
            dateEls.forEach(el => el.innerText = formatDate(profileData.created_at) || 'N/A');
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

        // Display user stats data
        if (statsData) {
            // Youtube
            const youtubeEl = document.getElementById('youtube');
            if (youtubeEl) youtubeEl.innerText = statsData.youtube || 0;

            // Tiktok
            const tiktokEl = document.getElementById('tiktok');
            if (tiktokEl) tiktokEl.innerText = statsData.tiktok || 0;

            // Trivia
            const triviaEl = document.getElementById('triviaEarn');
            if (triviaEl) triviaEl.innerText = statsData.trivia || 0;

            // Bonus (may not exist)
            const bonusEl = document.getElementById('bonus');
            if (bonusEl) bonusEl.innerText = statsData.bonus || 0;

            // Total Cash
            const totalCashEl = document.getElementById('totalCash');
            if (totalCashEl) totalCashEl.innerText = formatCurrency(statsData.allTimeEarning) || '$0.00';

            // Withdrawn (may not exist)
            const withdrawnEl = document.getElementById('withdrawn');
            if (withdrawnEl) withdrawnEl.innerText = formatCurrency(statsData.withdrawn) || '$0.00';

            // Refferals
            const refferalsEl = document.getElementById('refferals');
            if (refferalsEl) refferalsEl.innerText = statsData.refferals || 0;
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
            // Update UI with new profile data
            document.getElementById('Username00').innerText = payload.new.username || 'N/A'
            document.getElementById('phoneNumber').innerText = payload.new.phone || 'N/A'
            document.getElementById('emailAddress').innerText = payload.new.email || 'N/A'
            document.getElementById('dateCreated').innerText = formatDate(payload.new.created_at) || 'N/A'
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
            // Update UI with new stats data
            document.getElementById('total').innerText = payload.new.total || 0
            document.getElementById('youtube').innerText = payload.new.youtube || 0
            document.getElementById('tiktok').innerText = payload.new.tiktok || 0
            document.getElementById('triviaEarn').innerText = payload.new.trivia || 0
            document.getElementById('bonus').innerText = payload.new.bonus || 0
            document.getElementById('totalCash').innerText = formatCurrency(payload.new.allTimeEarning) || 'UGX 0.00'
            document.getElementById('withdrawn').innerText = formatCurrency(payload.new.withdrawn) || 'UGX 0.00'
            document.getElementById('refferals').innerText = payload.new.Refferals || 0
        })
        .subscribe()

    return { profileSubscription, statsSubscription }
}

// Call this after successful authentication to set up real-time updates
// setupRealtimeSubscriptions(user.id)
