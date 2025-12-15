// Configuration
const SUPABASE_URL = CONFIG.supabase.url || 'https://kwghulqonljulmvlcfnz.supabase.co';
const SUPABASE_ANON_KEY = CONFIG.supabase.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';

// Initialize Supabase client
const supabase = window.supabase || null;

// Check if Supabase client is available globally (from CDN)
if (!supabase) {
    console.error('Supabase client not found. Make sure to include Supabase JS in your HTML.');
}

// Get current user ID from Supabase session
const getCurrentUserId = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!session || !session.user) {
            console.error('No active session found');
            return null;
        }
        
        return session.user.id; // This is the UUID from auth.users
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
};

// Get the numeric user ID from public.users table using auth UUID
const getNumericUserId = async (authUserId) => {
    if (!authUserId) return null;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUserId)
            .single();
            
        if (error) {
            // If user not found in public.users yet (race condition), try to create it
            console.log('User not found in public.users, attempting to create...');
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({ uuid: authUserId })
                .select('id')
                .single();
                
            if (createError) {
                console.error('Error creating user profile:', createError);
                return null;
            }
            
            return newUser.id;
        }
        
        return data.id;
    } catch (error) {
        console.error('Error fetching numeric user ID:', error);
        return null;
    }
};

// Supabase data fetching functions
const supabaseClient = {
    async fetchUserData() {
        try {
            // Get current authenticated user's UUID
            const authUserId = await getCurrentUserId();
            if (!authUserId) {
                displayError('Please log in to view your dashboard.');
                return null;
            }
            
            // Get numeric ID from public.users
            const numericUserId = await getNumericUserId(authUserId);
            if (!numericUserId) {
                displayError('Unable to load user profile. Please try again.');
                return null;
            }
            
            console.log('Fetching data for user ID:', numericUserId);
            
            // Fetch all user-related data in parallel
            const [
                userData,
                earningsData,
                contentsData,
                paymentData,
                withdrawalsData
            ] = await Promise.all([
                this.fetchUserProfile(numericUserId),
                this.fetchFromTable('earnings', numericUserId),
                this.fetchUserContents(numericUserId),
                this.fetchFromTable('payment_information', numericUserId),
                this.fetchWithdrawals(numericUserId)
            ]);
            
            return {
                user: userData,
                earnings: earningsData,
                contents: contentsData,
                payment: paymentData,
                withdrawals: withdrawalsData
            };
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            displayError('An error occurred while loading your data.');
            return null;
        }
    },
    
    async fetchUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },
    
    async fetchFromTable(tableName, userId) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error) {
                // If no data exists (first-time user), return null instead of throwing
                if (error.code === 'PGRST116') {
                    console.log(`No data found in ${tableName} for user ${userId}`);
                    return null;
                }
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            return null;
        }
    },
    
    async fetchUserContents(userId) {
        try {
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('id', userId);
                
            if (error) throw error;
            
            // Return the latest content or null if none
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error fetching user contents:', error);
            return null;
        }
    },
    
    async fetchWithdrawals(userId) {
        try {
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('id', userId)
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (error) throw error;
            
            // Return the latest withdrawal request or null if none
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            return null;
        }
    }
};

// Data display functions
const displayUserData = (data) => {
    if (!data) return;
    
    console.log('Displaying user data:', data);
    
    // Display user data
    if (data.users) {
        setElementText('user_name', data.users.user_name || 'Not set');
        setElementText('email_address', data.users.email_address || 'Not set');
        setElementText('status', data.users.status || 'Not active');
        setElementText('rank', data.users.rank || 'User');
        setElementText('last_login', formatDate(data.users.last_login));
        setElementText('total_income', formatNumber(data.users.total_income));
    }
    
    // Display earnings data
    if (data.earnings) {
        setElementText('youtube', formatNumber(data.earnings.youtube));
        setElementText('tiktok', formatNumber(data.earnings.tiktok));
        setElementText('trivia', formatNumber(data.earnings.trivia));
        setElementText('refferal', formatNumber(data.earnings.refferal));
        setElementText('bonus', formatNumber(data.earnings.bonus || 5000));
        setElementText('all_time_earn', formatNumber(data.earnings.all_time_earn));
        setElementText('total_withdrawn', formatNumber(data.earnings.total_withdrawn));
        
        // Calculate available balance
        const allTimeEarn = data.earnings.all_time_earn || 0;
        const totalWithdrawn = data.earnings.total_withdrawn || 0;
        const available = allTimeEarn - totalWithdrawn;
        setElementText('available_balance', formatNumber(available));
    } else {
        // If no earnings record exists, show defaults
        setElementText('youtube', '0');
        setElementText('tiktok', '0');
        setElementText('trivia', '0');
        setElementText('refferal', '0');
        setElementText('bonus', '5,000');
        setElementText('all_time_earn', '0');
        setElementText('total_withdrawn', '0');
        setElementText('available_balance', '0');
    }
    
    // Display contents data
    if (data.contents) {
        setElementText('post_id', data.contents.post_id);
        setElementText('content_title', data.contents.content_title || 'No content');
        setElementText('content_type', data.contents.content_type || 'N/A');
        setElementText('total_actions', formatNumber(data.contents.total_actions));
    } else {
        setElementText('post_id', 'N/A');
        setElementText('content_title', 'No content available');
        setElementText('content_type', 'N/A');
        setElementText('total_actions', '0');
    }
    
    // Display payment information
    if (data.payment) {
        setElementText('mobile_number', data.payment.mobile_number || 'Not set');
        setElementText('payment_method', data.payment.payment_method || 'Not set');
        setElementText('email', data.payment.email || 'Not set');
        setElementText('notification_preference', data.payment.notification_preference || 'Not set');
    } else {
        setElementText('mobile_number', 'Not set');
        setElementText('payment_method', 'Not set');
        setElementText('email', 'Not set');
        setElementText('notification_preference', 'Not set');
    }
    
    // Display withdrawal requests
    if (data.withdrawals) {
        setElementText('request_id', data.withdrawals.request_id);
        setElementText('withdrawal_payment_method', data.withdrawals.payment_method || 'N/A');
        setElementText('withdrawal_phone_number', data.withdrawals.phone_number || 'N/A');
        setElementText('withdrawal_email', data.withdrawals.email || 'N/A');
        setElementText('withdrawal_status', data.withdrawals.status || 'Pending');
    } else {
        setElementText('request_id', 'N/A');
        setElementText('withdrawal_payment_method', 'No withdrawal requests');
        setElementText('withdrawal_phone_number', 'N/A');
        setElementText('withdrawal_email', 'N/A');
        setElementText('withdrawal_status', 'N/A');
    }
    
    // Note: Statistics table is typically admin-only, so we don't fetch it for regular users
    // If you need user-specific statistics, you should add a user_id column to that table
};

// Helper functions
const setElementText = (elementId, text) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = text !== null && text !== undefined ? text : 'N/A';
    }
};

const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US');
};

const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Error handling
const displayError = (message) => {
    const errorDiv = document.getElementById('error-message') || createErrorElement();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
};

const createErrorElement = () => {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(errorDiv);
    return errorDiv;
};

// Loading state
const setLoading = (isLoading) => {
    const loadingDiv = document.getElementById('loading') || createLoadingElement();
    loadingDiv.style.display = isLoading ? 'block' : 'none';
};

const createLoadingElement = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 10px;">Loading your dashboard...</div>
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
        </div>
    `;
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        z-index: 999;
        display: none;
    `;
    
    // Add CSS for spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingDiv);
    return loadingDiv;
};

// Main initialization function
const initializeDashboard = async () => {
    try {
        setLoading(true);
        displayError('');
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            displayError('Please log in to access the dashboard.');
            setLoading(false);
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }
        
        const userData = await supabaseClient.fetchUserData();
        
        if (userData) {
            displayUserData(userData);
        } else {
            displayError('Unable to load user data. Please try refreshing the page.');
        }
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        displayError('An error occurred while loading your data. Please try again.');
    } finally {
        setLoading(false);
    }
};

// Handle authentication state changes
const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Refresh dashboard data when user signs in or token refreshes
            initializeDashboard();
        } else if (event === 'SIGNED_OUT') {
            // Clear dashboard and redirect to login
            clearDashboard();
            window.location.href = '/login.html';
        }
    });
};

// Clear dashboard data
const clearDashboard = () => {
    // Clear all displayed data
    const elementsToClear = [
        'user_name', 'email_address', 'status', 'rank', 'last_login', 'total_income',
        'youtube', 'tiktok', 'trivia', 'refferal', 'bonus', 'all_time_earn', 'total_withdrawn', 'available_balance',
        'post_id', 'content_title', 'content_type', 'total_actions',
        'mobile_number', 'payment_method', 'email', 'notification_preference',
        'request_id', 'withdrawal_payment_method', 'withdrawal_phone_number', 'withdrawal_email', 'withdrawal_status'
    ];
    
    elementsToClear.forEach(id => setElementText(id, 'Loading...'));
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // First check if Supabase is loaded
        if (!window.supabase) {
            displayError('Supabase client not loaded. Please refresh the page.');
            return;
        }
        
        setupAuthListener();
        initializeDashboard();
    });
} else {
    if (window.supabase) {
        setupAuthListener();
        initializeDashboard();
    } else {
        displayError('Supabase client not loaded. Please refresh the page.');
    }
}

// Optional: Refresh data periodically (every 30 seconds)
let refreshInterval;
const startAutoRefresh = (interval = 30000) => {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(initializeDashboard, interval);
};

const stopAutoRefresh = () => {
    if (refreshInterval) clearInterval(refreshInterval);
};

// Export functions for manual control
window.dashboard = {
    refresh: initializeDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    getUserData: () => supabaseClient.fetchUserData(),
    signOut: async () => {
        await supabase.auth.signOut();
    }
};

// Make sure to include this CSS for the spinner animation if not already in your stylesheet
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
});