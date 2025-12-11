// Configuration
const SUPABASE_URL = CONFIG.supabase.url || 'https://kwghulqonljulmvlcfnz.supabase.co';
const SUPABASE_ANON_KEY = CONFIG.supabase.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';

// Get JWT token from localStorage (assuming you have an auth system)
const getToken = () => {
    return localStorage.getItem('supabase.auth.token');
};

// Initialize Supabase client
const supabaseClient = {
    async fetchUserData() {
        const token = getToken();
        if (!token) {
            console.error('No JWT token found. Please log in.');
            return null;
        }

        try {
            // First, get the current user's ID from the token
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.sub || payload.user_id;
            
            if (!userId) {
                console.error('User ID not found in token');
                return null;
            }

            // Fetch all user-related data in parallel
            const [
                userData,
                earningsData,
                contentsData,
                paymentData,
                statsData,
                withdrawalsData
            ] = await Promise.all([
                this.fetchFromTable('users', userId),
                this.fetchFromTable('earnings', userId),
                this.fetchFromTable('contents', userId, 'id'),
                this.fetchFromTable('payment_information', userId),
                this.fetchFromTable('statistics', userId),
                this.fetchFromTable('withdrawal_requests', userId, 'id')
            ]);

            return {
                user: userData,
                earnings: earningsData,
                contents: contentsData,
                payment: paymentData,
                statistics: statsData,
                withdrawals: withdrawalsData
            };
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },

    async fetchFromTable(tableName, userId, idColumn = 'id') {
        const token = getToken();
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?${idColumn}=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': CONFIG.supabase.key,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to fetch from ${tableName}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    }
};

// Data display functions
const displayUserData = (data) => {
    if (!data) return;
    
    // Display user data
    if (data.user) {
        setElementText('user_name', data.user.user_name);
        setElementText('email_address', data.user.email_address);
        setElementText('status', data.user.status);
        setElementText('rank', data.user.rank);
        setElementText('last_login', formatDate(data.user.last_login));
        setElementText('total_income', formatNumber(data.user.total_income));
    }
    
    // Display earnings data
    if (data.earnings) {
        setElementText('youtube', formatNumber(data.earnings.youtube));
        setElementText('tiktok', formatNumber(data.earnings.tiktok));
        setElementText('trivia', formatNumber(data.earnings.trivia));
        setElementText('refferal', formatNumber(data.earnings.refferal));
        setElementText('bonus', formatNumber(data.earnings.bonus));
        setElementText('all_time_earn', formatNumber(data.earnings.all_time_earn));
        setElementText('total_withdrawn', formatNumber(data.earnings.total_withdrawn));
        
        // Calculate available balance
        const available = (data.earnings.all_time_earn || 0) - (data.earnings.total_withdrawn || 0);
        setElementText('available_balance', formatNumber(available));
    }
    
    // Display contents data
    if (data.contents) {
        setElementText('post_id', data.contents.post_id);
        setElementText('content_title', data.contents.content_title);
        setElementText('content_type', data.contents.content_type);
        setElementText('total_actions', formatNumber(data.contents.total_actions));
    }
    
    // Display payment information
    if (data.payment) {
        setElementText('mobile_number', data.payment.mobile_number);
        setElementText('payment_method', data.payment.payment_method);
        setElementText('email', data.payment.email);
        setElementText('notification_preference', data.payment.notification_preference);
    }
    
    // Display statistics (if user has access)
    if (data.statistics) {
        setElementText('total_users', formatNumber(data.statistics.total_users));
        setElementText('total_income', formatNumber(data.statistics.total_income));
        setElementText('total_withdrawn', formatNumber(data.statistics.total_withdrawn));
        setElementText('pending_withdrawals', formatNumber(data.statistics.pending_withdrawals));
        setElementText('available_income', formatNumber(data.statistics.available_income));
    }
    
    // Display withdrawal requests
    if (data.withdrawals) {
        setElementText('request_id', data.withdrawals.request_id);
        setElementText('withdrawal_payment_method', data.withdrawals.payment_method);
        setElementText('withdrawal_phone_number', data.withdrawals.phone_number);
        setElementText('withdrawal_email', data.withdrawals.email);
        setElementText('withdrawal_status', data.withdrawals.status);
    }
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
    if (!dateString) return 'N/A';
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
    loadingDiv.innerHTML = 'Loading...';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        z-index: 999;
        display: none;
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
};

// Main initialization function
const initializeDashboard = async () => {
    try {
        setLoading(true);
        displayError('');
        
        const userData = await supabaseClient.fetchUserData();
        
        if (userData) {
            displayUserData(userData);
        } else {
            displayError('Unable to load user data. Please try again.');
        }
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        displayError('An error occurred while loading your data.');
    } finally {
        setLoading(false);
    }
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
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

// Export functions for manual control (if needed)
window.dashboard = {
    refresh: initializeDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    getUserData: () => supabaseClient.fetchUserData()
};