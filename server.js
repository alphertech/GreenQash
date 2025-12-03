// main.js - Main application file

// Configuration
// Prefer a page-provided API base (set `window.API_BASE_URL` in the HTML) so
// the frontend does not hardcode production endpoints. Fallback to same-origin
// API root.
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
let currentUser = null;

// DOM Elements (assuming these IDs exist in your HTML)
// Match the IDs used in `dashboard.html` (underscore style)
const userInfoElements = {
    userName: document.getElementById('user_name'),
    userEmail: document.getElementById('user_email'),
    userStatus: document.getElementById('user-status') || document.getElementById('user_status'),
    userRank: document.getElementById('user-rank') || document.getElementById('user_rank'),
    lastLogin: document.getElementById('last-login') || document.getElementById('last_login'),
    totalIncome: document.getElementById('total_income')
};

const earningsElements = {
    youtube: document.getElementById('youtube'),
    tiktok: document.getElementById('tiktok'),
    trivia: document.getElementById('trivia'),
    referral: document.getElementById('refferal') || document.getElementById('referral'),
    bonus: document.getElementById('bonus'),
    allTime: document.getElementById('all-time-earnings') || document.getElementById('all_time_earnings'),
    totalWithdrawn: document.getElementById('total-withdrawn') || document.getElementById('total_withdrawn'),
    availableBalance: document.getElementById('available-balance') || document.getElementById('available_balance')
};

const contentElements = {
    container: document.getElementById('contents-container'),
    totalActions: document.getElementById('total-actions')
};

const paymentElements = {
    mobileNumber: document.getElementById('mobile-number'),
    paymentMethod: document.getElementById('payment-method'),
    email: document.getElementById('payment-email'),
    notificationPref: document.getElementById('notification-preference')
};

// Authentication and User Management
class AuthManager {
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) throw new Error('Login failed');
            
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId);
            currentUser = data.userId;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static logout() {
        // Clear local storage and sign out from Supabase if available
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        currentUser = null;
        if (typeof window !== 'undefined' && window.supabase) {
            try { window.supabase.auth.signOut(); } catch (e) { /* ignore */ }
        }
        // Redirect to the app entry (index.html) which contains auth UI
        window.location.href = '/index.html';
    }

    static async isAuthenticated() {
        // Prefer localStorage token (fast). If missing, attempt to recover from
        // the Supabase client session and persist it so other modules can use it.
        const token = localStorage.getItem('authToken');
        if (token) return true;

        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data: { session } } = await window.supabase.auth.getSession();
                if (session) {
                    if (session.access_token) localStorage.setItem('authToken', session.access_token);
                    if (session.user && session.user.id) localStorage.setItem('userId', session.user.id);
                    if (session.user && session.user.email) localStorage.setItem('userEmail', session.user.email);
                    return true;
                }
            } catch (err) {
                console.warn('AuthManager: could not recover session from Supabase', err);
            }
        }

        return false;
    }

    static getCurrentUserId() {
        return localStorage.getItem('userId');
    }

    static getCurrentUserEmail() {
        return localStorage.getItem('userEmail');
    }

    static getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Data Fetcher with User-specific Queries
class DataFetcher {
    static async fetchUserData() {
        // Prefer querying by email because the public `users` table uses
        // `email_address` as the lookup key in this project.
        const userEmail = AuthManager.getCurrentUserEmail() || localStorage.getItem('userEmail');
        if (!userEmail) throw new Error('User not authenticated (email missing)');

        // If a backend API base is configured, prefer it. The API should
        // accept an email query param when looking up a user.
        if (API_BASE_URL) {
            try {
                const url = `${API_BASE_URL}/users?email=${encodeURIComponent(userEmail)}`;
                const response = await fetch(url, {
                    headers: AuthManager.getAuthHeaders()
                });
                if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching user data from API:', error);
                // fall through to client-side supabase
            }
        }

        // Client-side Supabase fallback - query by email_address
        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('users')
                    .select('id, user_name, email_address, status, rank, last_login, total_income')
                    .eq('email_address', userEmail)
                    .maybeSingle();

                if (error) throw error;
                return data;
            } catch (err) {
                console.error('Client-side Supabase fetchUserData failed:', err);
                throw err;
            }
        }

        throw new Error('No API_BASE_URL configured and no client-side supabase available');
    }

    static async fetchEarnings() {
        const userId = AuthManager.getCurrentUserId();
        if (API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/earnings/${userId}`, {
                    headers: AuthManager.getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch earnings')
                return await response.json();
            } catch (err) {
                console.error('Error fetching earnings from API:', err)
            }
        }

        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('earnings')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();
                if (error) throw error
                return data
            } catch (err) {
                console.error('Client-side Supabase fetchEarnings failed:', err)
                return null
            }
        }

        return null
    }

    static async fetchContents() {
        const userId = AuthManager.getCurrentUserId();
        if (API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/contents?userId=${userId}`, {
                    headers: AuthManager.getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch contents')
                return await response.json();
            } catch (err) {
                console.error('Error fetching contents from API:', err)
            }
        }

        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('contents')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                if (error) throw error
                return data || []
            } catch (err) {
                console.error('Client-side Supabase fetchContents failed:', err)
                return []
            }
        }

        return []
    }

    static async fetchPaymentInfo() {
        const userId = AuthManager.getCurrentUserId();
        if (API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/payment-info/${userId}`, {
                    headers: AuthManager.getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch payment info')
                return await response.json();
            } catch (err) {
                console.error('Error fetching payment info from API:', err)
            }
        }

        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('payment_info')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle()
                if (error) throw error
                return data
            } catch (err) {
                console.error('Client-side Supabase fetchPaymentInfo failed:', err)
                return null
            }
        }

        return null
    }

    static async fetchWithdrawalRequests() {
        const userId = AuthManager.getCurrentUserId();
        if (API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/withdrawals?userId=${userId}`, {
                    headers: AuthManager.getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch withdrawals')
                return await response.json();
            } catch (err) {
                console.error('Error fetching withdrawals from API:', err)
            }
        }

        if (typeof window !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('withdrawals')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                if (error) throw error
                return data || []
            } catch (err) {
                console.error('Client-side Supabase fetchWithdrawalRequests failed:', err)
                return []
            }
        }

        return []
    }
}

// UI Renderer
class UIRenderer {
    static updateUserProfile(userData) {
        if (!userData) return;

        // Update user info
        if (userInfoElements.userName) userInfoElements.userName.innerText = userData.user_name || 'N/A';
        if (userInfoElements.userEmail) userInfoElements.userEmail.innerText = userData.email_address || 'N/A';
        if (userInfoElements.userStatus) userInfoElements.userStatus.innerText = userData.status || 'N/A';
        if (userInfoElements.userRank) userInfoElements.userRank.innerText = userData.rank || 'N/A';
        if (userInfoElements.lastLogin) userInfoElements.lastLogin.innerText = 
            userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never';
        if (userInfoElements.totalIncome) userInfoElements.totalIncome.innerText = 
            this.formatCurrency(userData.total_income) || '$0';
    }

    static updateEarnings(earningsData) {
        if (!earningsData) return;

        // Update earnings display
        if (earningsElements.youtube) earningsElements.youtube.innerText = this.formatCurrency(earningsData.youtube);
        if (earningsElements.tiktok) earningsElements.tiktok.innerText = this.formatCurrency(earningsData.tiktok);
        if (earningsElements.trivia) earningsElements.trivia.innerText = this.formatCurrency(earningsData.trivia);
        if (earningsElements.referral) earningsElements.referral.innerText = this.formatCurrency(earningsData.refferal);
        if (earningsElements.bonus) earningsElements.bonus.innerText = this.formatCurrency(earningsData.bonus);
        if (earningsElements.allTime) earningsElements.allTime.innerText = this.formatCurrency(earningsData.all_time_earn);
        if (earningsElements.totalWithdrawn) earningsElements.totalWithdrawn.innerText = 
            this.formatCurrency(earningsData.total_withdrawn);
        
        // Calculate and display available balance
        if (earningsElements.availableBalance && earningsData.all_time_earn && earningsData.total_withdrawn) {
            const available = earningsData.all_time_earn - earningsData.total_withdrawn;
            earningsElements.availableBalance.innerText = this.formatCurrency(available);
        }
    }

    static updateContents(contents) {
        if (!contentElements.container) return;

        if (contents.length === 0) {
            contentElements.container.innerHTML = '<p class="no-content">No content available</p>';
            return;
        }

        let totalActions = 0;
        const contentHTML = contents.map(content => {
            totalActions += content.total_actions || 0;
            return `
                <div class="content-item">
                    <h4>${content.content_title || 'Untitled'}</h4>
                    <p>Type: ${content.content_type || 'N/A'}</p>
                    <p>Actions: ${content.total_actions || 0}</p>
                    <small>Created: ${new Date(content.created_at).toLocaleDateString()}</small>
                </div>
            `;
        }).join('');

        contentElements.container.innerHTML = contentHTML;
        
        if (contentElements.totalActions) {
            contentElements.totalActions.innerText = totalActions;
        }
    }

    static updatePaymentInfo(paymentInfo) {
        if (!paymentInfo) return;

        if (paymentElements.mobileNumber) paymentElements.mobileNumber.innerText = 
            paymentInfo.mobile_number || 'Not set';
        if (paymentElements.paymentMethod) paymentElements.paymentMethod.innerText = 
            paymentInfo.payment_method || 'Not set';
        if (paymentElements.email) paymentElements.email.innerText = 
            paymentInfo.email || 'Not set';
        if (paymentElements.notificationPref) paymentElements.notificationPref.innerText = 
            paymentInfo.notification_preference || 'Default';
    }

    static updateWithdrawalRequests(requests) {
        const container = document.getElementById('withdrawals-container');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = '<p>No withdrawal requests</p>';
            return;
        }

        const requestsHTML = requests.map(request => `
            <div class="withdrawal-request">
                <p>Amount: ${this.formatCurrency(request.amount)}</p>
                <p>Method: ${request.payment_method}</p>
                <p>Status: <span class="status-${request.status}">${request.status}</span></p>
                <small>Requested: ${new Date(request.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');

        container.innerHTML = requestsHTML;
    }

    static formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static showError(message) {
        // Create or update error display element
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'error-message';
            document.body.prepend(errorDiv);
        }
        errorDiv.innerText = message;
        errorDiv.style.display = 'block';

        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    static showLoading(show = true) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }
}

// Main Application Controller
class AppController {
    static async initialize() {
        // Check authentication (attempt to recover session if needed)
        if (!(await AuthManager.isAuthenticated())) {
            window.location.href = '/index.html';
            return;
        }

        // Load all user data
        await this.loadUserData();
        
        // Set up auto-refresh (optional)
        this.setupAutoRefresh();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    static async loadUserData() {
        try {
            UIRenderer.showLoading(true);

            // Fetch all data in parallel
            const [userData, earnings, contents, paymentInfo, withdrawals] = await Promise.all([
                DataFetcher.fetchUserData(),
                DataFetcher.fetchEarnings(),
                DataFetcher.fetchContents(),
                DataFetcher.fetchPaymentInfo(),
                DataFetcher.fetchWithdrawalRequests()
            ]);

            // Update UI with fetched data
            UIRenderer.updateUserProfile(userData);
            UIRenderer.updateEarnings(earnings);
            UIRenderer.updateContents(contents);
            UIRenderer.updatePaymentInfo(paymentInfo);
            UIRenderer.updateWithdrawalRequests(withdrawals);

        } catch (error) {
            UIRenderer.showError('Failed to load user data. Please try again.');
            console.error('Data loading error:', error);
        } finally {
            UIRenderer.showLoading(false);
        }
    }

    static setupAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadUserData();
            }
        }, 300000); // 5 minutes
    }

    static setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', AuthManager.logout);
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUserData());
        }

        // Withdrawal form submission
        const withdrawForm = document.getElementById('withdraw-form');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', this.handleWithdrawalSubmit);
        }
    }

    static async handleWithdrawalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const withdrawalData = {
            payment_method: formData.get('payment_method'),
            phone_number: formData.get('phone_number'),
            email: formData.get('email'),
            amount: formData.get('amount')
        };

        try {
            const response = await fetch(`${API_BASE_URL}/withdrawals`, {
                method: 'POST',
                headers: AuthManager.getAuthHeaders(),
                body: JSON.stringify(withdrawalData)
            });

            if (response.ok) {
                alert('Withdrawal request submitted successfully!');
                e.target.reset();
                await this.loadUserData(); // Refresh data
            } else {
                throw new Error('Withdrawal request failed');
            }
        } catch (error) {
            UIRenderer.showError('Failed to submit withdrawal request');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AppController.initialize();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        AppController.loadUserData();
    }
});