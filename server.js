// Configuration - Using an IIFE to prevent redeclaration errors
(function() {
    // Check if already declared to avoid "already declared" error
    if (typeof window.APP_CONFIG === 'undefined') {
        window.APP_CONFIG = {
            API_BASE_URL: (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : 'https://kwghulqonljulmvlcfnz.supabase.co',
            SUPABASE_URL: 'https://kwghulqonljulmvlcfnz.supabase.co',
            SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM',
            // CORS proxy for API requests - FAST solution
            CORS_PROXY: 'https://corsproxy.io/?',
            USE_PROXY: true // Enable proxy for CORS issues
        };
    }

    // Use the configuration
    const CONFIG = window.APP_CONFIG;
    const API_BASE_URL = CONFIG.API_BASE_URL;
    const USE_PROXY = CONFIG.USE_PROXY;
    const CORS_PROXY = CONFIG.CORS_PROXY;
    let currentUser = null;

    // Enhanced fetch with CORS handling
    class EnhancedFetch {
        static async fetchWithCORS(url, options = {}) {
            const isSupabaseUrl = url.includes('supabase.co');
            
            // Don't use proxy for local requests or if proxy disabled
            if (!USE_PROXY || !isSupabaseUrl) {
                return await fetch(url, options);
            }

            // Use proxy for Supabase requests
            const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            
            // Prepare headers for proxy
            const proxyOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://alphertech.github.io'
                }
            };

            try {
                return await fetch(proxiedUrl, proxyOptions);
            } catch (proxyError) {
                console.warn('Proxy failed, trying direct fetch:', proxyError);
                
                // Fallback to direct fetch with CORS workaround
                const directOptions = {
                    ...options,
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        ...options.headers,
                        'Origin': window.location.origin
                    }
                };
                
                return await fetch(url, directOptions);
            }
        }

        static async fetchAPI(endpoint, options = {}) {
            const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
            return await this.fetchWithCORS(url, options);
        }
    }

    // Initialize Supabase client with CORS headers
    function initializeSupabaseClient() {
        if (typeof window === 'undefined') return null;

        // Return existing client if already initialized
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        try {
            const cfg = window.SUPABASE_CONFIG || {};
            const url = cfg.url || CONFIG.SUPABASE_URL;
            const key = cfg.key || CONFIG.SUPABASE_KEY;

            let client = null;

            // Try different ways to create Supabase client with CORS configuration
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                client = supabase.createClient(url, key, {
                    global: {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    },
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
            } else if (typeof createClient !== 'undefined') {
                client = createClient(url, key, {
                    global: {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`
                        }
                    }
                });
            } else if (typeof window.supabase !== 'undefined' && window.supabase.auth) {
                client = window.supabase;
            }

            if (client) {
                // Add custom fetch to handle CORS
                client.customFetch = async (url, options = {}) => {
                    return await EnhancedFetch.fetchWithCORS(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'apikey': key,
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        }
                    });
                };
                
                window.supabaseClient = client;
                console.log('Supabase client initialized successfully with CORS handling');
                return client;
            }
        } catch (err) {
            console.warn('Could not initialize Supabase client:', err);
        }

        return null;
    }

    // Initialize Supabase
    const supabaseClient = initializeSupabaseClient();

    // DOM Elements Cache (unchanged)
    class DOMCache {
        static elements = {};

        static getElement(id) {
            if (!this.elements[id]) {
                this.elements[id] = document.getElementById(id);
            }
            return this.elements[id];
        }

        static initializeElements() {
            return {
                // User Info
                userName: this.getElement('user_name'),
                userEmail: this.getElement('user_email'),
                userStatus: this.getElement('user-status') || this.getElement('user_status'),
                userRank: this.getElement('user-rank') || this.getElement('user_rank'),
                lastLogin: this.getElement('last-login') || this.getElement('last_login'),
                totalIncome: this.getElement('total_income'),

                // Earnings
                youtube: this.getElement('youtube'),
                tiktok: this.getElement('tiktok'),
                trivia: this.getElement('trivia'),
                referral: this.getElement('refferal') || this.getElement('referral'),
                bonus: this.getElement('bonus'),
                allTime: this.getElement('all-time-earnings') || this.getElement('all_time_earnings'),
                totalWithdrawn: this.getElement('total-withdrawn') || this.getElement('total_withdrawn'),
                availableBalance: this.getElement('available-balance') || this.getElement('available_balance'),

                // Content
                container: this.getElement('contents-container'),
                totalActions: this.getElement('total-actions'),

                // Payment
                mobileNumber: this.getElement('mobile-number'),
                paymentMethod: this.getElement('payment-method'),
                email: this.getElement('payment-email'),
                notificationPref: this.getElement('notification-preference'),

                // Buttons
                logoutBtn: this.getElement('logout-btn'),
                refreshBtn: this.getElement('refresh-btn'),

                // Forms
                withdrawForm: this.getElement('withdraw-form'),

                // Containers
                withdrawalsContainer: this.getElement('withdrawals-container')
            };
        }
    }

    // Auth Manager with enhanced fetch
    class AuthManager {
        static async login(email, password) {
            try {
                const response = await EnhancedFetch.fetchAPI('/auth/v1/token?grant_type=password', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'apikey': CONFIG.SUPABASE_KEY
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Login failed with status: ${response.status}`);
                }

                const data = await response.json();
                
                this.setAuthData(data);
                return data;
            } catch (error) {
                console.error('Login error:', error);
                throw new Error(`Login failed: ${error.message}`);
            }
        }

        static setAuthData(data) {
            if (data.access_token) {
                localStorage.setItem('authToken', data.access_token);
            }
            if (data.user?.id) {
                localStorage.setItem('userId', data.user.id);
                currentUser = data.user.id;
            }
            if (data.user?.email) {
                localStorage.setItem('userEmail', data.user.email);
            }
        }

        static logout() {
            const itemsToRemove = ['authToken', 'userId', 'userEmail'];
            itemsToRemove.forEach(item => localStorage.removeItem(item));
            currentUser = null;
            
            // Try to sign out from Supabase if available
            if (supabaseClient?.auth?.signOut) {
                supabaseClient.auth.signOut().catch(e => console.debug('Supabase signout error:', e));
            }
            
            window.location.href = '/index.html';
        }

        static async isAuthenticated() {
            // Check for token in localStorage
            const token = localStorage.getItem('authToken');
            if (token) {
                return this.validateToken(token);
            }

            // Try to get session from Supabase with CORS handling
            if (supabaseClient?.auth?.getSession) {
                try {
                    // Use custom fetch for CORS
                    const sessionResponse = await EnhancedFetch.fetchAPI('/auth/v1/user', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
                            'apikey': CONFIG.SUPABASE_KEY
                        }
                    });
                    
                    if (sessionResponse.ok) {
                        const userData = await sessionResponse.json();
                        if (userData) {
                            this.setAuthData({
                                access_token: localStorage.getItem('authToken'),
                                user: userData
                            });
                            return true;
                        }
                    }
                } catch (err) {
                    console.warn('Supabase session recovery failed:', err);
                }
            }

            return false;
        }

        static async validateToken(token) {
            try {
                const response = await EnhancedFetch.fetchAPI('/auth/v1/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': CONFIG.SUPABASE_KEY
                    }
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        }

        static getCurrentUserId() {
            return localStorage.getItem('userId') || currentUser;
        }

        static getCurrentUserEmail() {
            return localStorage.getItem('userEmail');
        }

        static getAuthHeaders() {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_KEY
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            return headers;
        }
    }

    // Enhanced Data Fetcher with CORS handling
    class DataFetcher {
        static async fetchUserData() {
            const userEmail = AuthManager.getCurrentUserEmail();
            const userId = AuthManager.getCurrentUserId();
            
            if (!userEmail && !userId) {
                throw new Error('User not authenticated - no email or user ID found');
            }

            // Use Enhanced Fetch for API calls
            try {
                let url = '';
                if (userId) {
                    url = `/rest/v1/users?id=eq.${userId}`;
                } else if (userEmail) {
                    url = `/rest/v1/users?email_address=eq.${encodeURIComponent(userEmail)}`;
                }
                
                if (url) {
                    const response = await EnhancedFetch.fetchAPI(url, {
                        headers: AuthManager.getAuthHeaders(),
                        signal: AbortSignal.timeout(10000)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        return Array.isArray(data) ? data[0] : data;
                    }
                    console.warn(`API fetch failed with status: ${response.status}`);
                }
            } catch (error) {
                console.warn('API fetch user data error:', error.message);
            }

            // Fall back to Supabase client if available
            if (supabaseClient) {
                try {
                    let query = supabaseClient
                        .from('users')
                        .select('id, user_name, email_address, status, rank, last_login, total_income');

                    if (userId) {
                        query = query.eq('id', userId);
                    } else if (userEmail) {
                        query = query.eq('email_address', userEmail);
                    }

                    const { data, error } = await query.maybeSingle();

                    if (error) throw error;
                    if (data) return data;
                    
                    throw new Error('User not found in database');
                } catch (err) {
                    console.error('Supabase fetch user data failed:', err);
                }
            }

            throw new Error('No data source available. Please check your connection.');
        }

        static async fetchEarnings() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId) return null;

            try {
                const response = await EnhancedFetch.fetchAPI(`/rest/v1/earnings?user_id=eq.${userId}`, {
                    headers: AuthManager.getAuthHeaders(),
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return Array.isArray(data) ? data[0] : data;
                }
            } catch (err) {
                console.warn('API fetch earnings error:', err.message);
            }

            // Fall back to Supabase
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('earnings')
                        .select('*')
                        .eq('user_id', userId)
                        .maybeSingle();
                    if (error) throw error;
                    return data;
                } catch (err) {
                    console.error('Supabase fetch earnings failed:', err);
                }
            }

            return null;
        }

        static async fetchContents() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId) return [];

            try {
                const response = await EnhancedFetch.fetchAPI(`/rest/v1/contents?user_id=eq.${userId}`, {
                    headers: AuthManager.getAuthHeaders(),
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                console.warn('API fetch contents error:', err.message);
            }

            // Fall back to Supabase
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('contents')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return data || [];
                } catch (err) {
                    console.error('Supabase fetch contents failed:', err);
                }
            }

            return [];
        }

        static async fetchPaymentInfo() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId) return null;

            try {
                const response = await EnhancedFetch.fetchAPI(`/rest/v1/payment_info?user_id=eq.${userId}`, {
                    headers: AuthManager.getAuthHeaders(),
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return Array.isArray(data) ? data[0] : data;
                }
            } catch (err) {
                console.warn('API fetch payment info error:', err.message);
            }

            // Fall back to Supabase
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('payment_info')
                        .select('*')
                        .eq('user_id', userId)
                        .maybeSingle();
                    if (error) throw error;
                    return data;
                } catch (err) {
                    console.error('Supabase fetch payment info failed:', err);
                }
            }

            return null;
        }

        static async fetchWithdrawalRequests() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId) return [];

            try {
                const response = await EnhancedFetch.fetchAPI(`/rest/v1/withdrawals?user_id=eq.${userId}&order=created_at.desc`, {
                    headers: AuthManager.getAuthHeaders(),
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                console.warn('API fetch withdrawals error:', err.message);
            }

            // Fall back to Supabase
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('withdrawals')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return data || [];
                } catch (err) {
                    console.error('Supabase fetch withdrawals failed:', err);
                }
            }

            return [];
        }
    }

    // UI Renderer (unchanged - keeping for completeness)
    class UIRenderer {
        static format = {
            currency: (amount) => {
                if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2
                }).format(amount);
            },
            
            date: (dateString) => {
                if (!dateString) return 'Never';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    return 'Invalid date';
                }
            }
        };

        static updateUserProfile(userData) {
            if (!userData) return;

            const elements = DOMCache.initializeElements();

            this.safeUpdate(elements.userName, userData.user_name || 'N/A');
            this.safeUpdate(elements.userEmail, userData.email_address || 'N/A');
            this.safeUpdate(elements.userStatus, userData.status || 'N/A');
            this.safeUpdate(elements.userRank, userData.rank || 'N/A');
            this.safeUpdate(elements.lastLogin, this.format.date(userData.last_login));
            this.safeUpdate(elements.totalIncome, this.format.currency(userData.total_income));
        }

        static updateEarnings(earningsData) {
            if (!earningsData) return;

            const elements = DOMCache.initializeElements();

            this.safeUpdate(elements.youtube, this.format.currency(earningsData.youtube));
            this.safeUpdate(elements.tiktok, this.format.currency(earningsData.tiktok));
            this.safeUpdate(elements.trivia, this.format.currency(earningsData.trivia));
            this.safeUpdate(elements.referral, this.format.currency(earningsData.refferal || earningsData.referral));
            this.safeUpdate(elements.bonus, this.format.currency(earningsData.bonus));
            this.safeUpdate(elements.allTime, this.format.currency(earningsData.all_time_earn));
            this.safeUpdate(elements.totalWithdrawn, this.format.currency(earningsData.total_withdrawn));

            if (elements.availableBalance) {
                const allTime = parseFloat(earningsData.all_time_earn) || 0;
                const withdrawn = parseFloat(earningsData.total_withdrawn) || 0;
                const available = allTime - withdrawn;
                elements.availableBalance.innerText = this.format.currency(available);
            }
        }

        static updateContents(contents) {
            const elements = DOMCache.initializeElements();
            if (!elements.container) return;

            if (!contents || contents.length === 0) {
                elements.container.innerHTML = '<div class="no-content"><p>No content available</p></div>';
                return;
            }

            let totalActions = 0;
            const contentHTML = contents.map(content => {
                const actions = content.total_actions || 0;
                totalActions += actions;
                
                return `
                    <div class="content-item">
                        <h4>${content.content_title || 'Untitled'}</h4>
                        <p><strong>Type:</strong> ${content.content_type || 'N/A'}</p>
                        <p><strong>Actions:</strong> ${actions}</p>
                        <small>Created: ${this.format.date(content.created_at)}</small>
                    </div>
                `;
            }).join('');

            elements.container.innerHTML = contentHTML;
            this.safeUpdate(elements.totalActions, totalActions.toString());
        }

        static updatePaymentInfo(paymentInfo) {
            if (!paymentInfo) return;

            const elements = DOMCache.initializeElements();

            this.safeUpdate(elements.mobileNumber, paymentInfo.mobile_number || 'Not set');
            this.safeUpdate(elements.paymentMethod, paymentInfo.payment_method || 'Not set');
            this.safeUpdate(elements.email, paymentInfo.email || 'Not set');
            this.safeUpdate(elements.notificationPref, paymentInfo.notification_preference || 'Default');
        }

        static updateWithdrawalRequests(requests) {
            const container = DOMCache.getElement('withdrawals-container');
            if (!container) return;

            if (!requests || requests.length === 0) {
                container.innerHTML = '<div class="no-requests"><p>No withdrawal requests</p></div>';
                return;
            }

            const requestsHTML = requests.map(request => `
                <div class="withdrawal-request">
                    <p><strong>Amount:</strong> ${this.format.currency(request.amount)}</p>
                    <p><strong>Method:</strong> ${request.payment_method || 'N/A'}</p>
                    <p><strong>Status:</strong> 
                        <span class="status status-${request.status || 'pending'}">
                            ${request.status || 'Pending'}
                        </span>
                    </p>
                    <small>Requested: ${this.format.date(request.created_at)}</small>
                </div>
            `).join('');

            container.innerHTML = requestsHTML;
        }

        static safeUpdate(element, value) {
            if (element && typeof value !== 'undefined') {
                element.innerText = value;
            }
        }

        static showError(message) {
            console.error('UI Error:', message);
            
            // Try to find existing error container
            let errorDiv = DOMCache.getElement('error-message');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'error-message';
                errorDiv.className = 'error-message';
                document.body.prepend(errorDiv);
            }
            
            errorDiv.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">${message}</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            errorDiv.style.display = 'block';

            // Auto-hide after 7 seconds
            setTimeout(() => {
                if (errorDiv) errorDiv.style.display = 'none';
            }, 7000);
        }

        static showLoading(show = true) {
            let loader = DOMCache.getElement('loading-indicator');
            if (!loader && show) {
                loader = document.createElement('div');
                loader.id = 'loading-indicator';
                loader.className = 'loading-indicator';
                loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
                document.body.appendChild(loader);
            }
            
            if (loader) {
                loader.style.display = show ? 'flex' : 'none';
            }
        }

        static showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.innerHTML = `
                <div class="success-content">
                    <span class="success-icon">✓</span>
                    <span class="success-text">${message}</span>
                </div>
            `;
            document.body.prepend(successDiv);
            
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
    }

    // App Controller with enhanced CORS handling
    class AppController {
        static async initialize() {
            console.log('App initializing with CORS handling...');
            
            // Check authentication
            const isAuthenticated = await AuthManager.isAuthenticated();
            if (!isAuthenticated) {
                console.log('Not authenticated, redirecting to login...');
                window.location.href = '/index.html';
                return;
            }

            // Initialize DOM cache
            DOMCache.initializeElements();

            // Test connection first
            await this.testConnection();

            // Load initial data
            await this.loadUserData();

            // Setup event listeners
            this.setupEventListeners();

            // Setup auto-refresh
            this.setupAutoRefresh();

            console.log('App initialized successfully');
        }

        static async testConnection() {
            try {
                console.log('Testing connection to Supabase...');
                const response = await EnhancedFetch.fetchAPI('/rest/v1/users?limit=1', {
                    headers: {
                        'apikey': CONFIG.SUPABASE_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('Connection test successful');
                    return true;
                } else {
                    console.warn('Connection test failed:', response.status);
                    return false;
                }
            } catch (error) {
                console.error('Connection test error:', error);
                UIRenderer.showError('Connection issue detected. Some features may not work.');
                return false;
            }
        }

        static async loadUserData() {
            try {
                UIRenderer.showLoading(true);

                const promises = [
                    DataFetcher.fetchUserData(),
                    DataFetcher.fetchEarnings(),
                    DataFetcher.fetchContents(),
                    DataFetcher.fetchPaymentInfo(),
                    DataFetcher.fetchWithdrawalRequests()
                ];

                const [userData, earnings, contents, paymentInfo, withdrawals] = await Promise.allSettled(promises);

                // Handle results
                UIRenderer.updateUserProfile(userData.status === 'fulfilled' ? userData.value : null);
                UIRenderer.updateEarnings(earnings.status === 'fulfilled' ? earnings.value : null);
                UIRenderer.updateContents(contents.status === 'fulfilled' ? contents.value : []);
                UIRenderer.updatePaymentInfo(paymentInfo.status === 'fulfilled' ? paymentInfo.value : null);
                UIRenderer.updateWithdrawalRequests(withdrawals.status === 'fulfilled' ? withdrawals.value : []);

                // Check for errors
                const errors = [userData, earnings, contents, paymentInfo, withdrawals]
                    .filter(result => result.status === 'rejected')
                    .map(result => result.reason.message);

                if (errors.length > 0) {
                    console.warn('Some data failed to load:', errors);
                    if (errors.length === 5) {
                        UIRenderer.showError('Failed to load data. Please check your connection.');
                    }
                }

            } catch (error) {
                console.error('Data loading error:', error);
                UIRenderer.showError('Failed to load user data. Please refresh the page.');
            } finally {
                UIRenderer.showLoading(false);
            }
        }

        static setupAutoRefresh() {
            // Refresh every 5 minutes when tab is visible
            setInterval(() => {
                if (document.visibilityState === 'visible') {
                    this.loadUserData();
                }
            }, 5 * 60 * 1000); // 5 minutes
        }

        static setupEventListeners() {
            const elements = DOMCache.initializeElements();

            // Logout button
            if (elements.logoutBtn) {
                elements.logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        AuthManager.logout();
                    }
                });
            }

            // Refresh button
            if (elements.refreshBtn) {
                elements.refreshBtn.addEventListener('click', () => {
                    this.loadUserData();
                    UIRenderer.showSuccess('Data refreshed successfully!');
                });
            }

            // Withdrawal form
            if (elements.withdrawForm) {
                elements.withdrawForm.addEventListener('submit', (e) => this.handleWithdrawalSubmit(e));
            }

            // Refresh on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.loadUserData();
                }
            });

            // Add CORS toggle button for debugging
            this.addCORSToggle();
        }

        static addCORSToggle() {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'cors-toggle';
            toggleBtn.innerHTML = 'CORS: ON';
            toggleBtn.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: #007bff;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                z-index: 9999;
            `;
            
            toggleBtn.addEventListener('click', () => {
                CONFIG.USE_PROXY = !CONFIG.USE_PROXY;
                toggleBtn.innerHTML = CONFIG.USE_PROXY ? 'CORS: PROXY' : 'CORS: DIRECT';
                toggleBtn.style.background = CONFIG.USE_PROXY ? '#007bff' : '#dc3545';
                UIRenderer.showSuccess(`CORS mode switched to ${CONFIG.USE_PROXY ? 'proxy' : 'direct'}`);
            });
            
            document.body.appendChild(toggleBtn);
        }

        static async handleWithdrawalSubmit(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const amount = parseFloat(formData.get('amount'));
            
            // Validation
            if (!amount || amount <= 0) {
                UIRenderer.showError('Please enter a valid amount');
                return;
            }

            const withdrawalData = {
                payment_method: formData.get('payment_method'),
                phone_number: formData.get('phone_number'),
                email: formData.get('email'),
                amount: amount,
                user_id: AuthManager.getCurrentUserId(),
                status: 'pending',
                created_at: new Date().toISOString()
            };

            try {
                UIRenderer.showLoading(true);
                
                // Use Enhanced Fetch for API call
                const response = await EnhancedFetch.fetchAPI('/rest/v1/withdrawals', {
                    method: 'POST',
                    headers: {
                        ...AuthManager.getAuthHeaders(),
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(withdrawalData)
                });

                if (response.ok) {
                    UIRenderer.showSuccess('Withdrawal request submitted successfully!');
                    e.target.reset();
                    await this.loadUserData();
                } else {
                    const errorText = await response.text();
                    throw new Error(`Withdrawal failed: ${response.status} ${errorText}`);
                }
            } catch (error) {
                console.error('Withdrawal submission error:', error);
                UIRenderer.showError('Failed to submit withdrawal request. Please try again.');
            } finally {
                UIRenderer.showLoading(false);
            }
        }
    }

    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AppController.initialize().catch(error => {
                console.error('App initialization failed:', error);
                UIRenderer.showError('Failed to initialize application. Please refresh.');
            });
        });
    } else {
        AppController.initialize().catch(error => {
            console.error('App initialization failed:', error);
            UIRenderer.showError('Failed to initialize application. Please refresh.');
        });
    }

})(); // End of IIFE