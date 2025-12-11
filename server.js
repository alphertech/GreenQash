// Configuration - Using an IIFE to prevent redeclaration errors
(function() {
    // Check if already declared to avoid "already declared" error
    if (typeof window.APP_CONFIG === 'undefined') {
        window.APP_CONFIG = {
            SUPABASE_URL: 'https://kwghulqonljulmvlcfnz.supabase.co',
            SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM'
        };
    }

    // REMOVED: API_BASE_URL since we're not using API endpoints
    let currentUser = null;

    // Initialize Supabase client
    function initializeSupabaseClient() {
        if (typeof window === 'undefined') return null;

        // Return existing client if already initialized
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        try {
            const cfg = window.SUPABASE_CONFIG || {};
            const url = cfg.url || window.APP_CONFIG.SUPABASE_URL;
            const key = cfg.key || window.APP_CONFIG.SUPABASE_KEY;

            let client = null;

            // Try different ways to create Supabase client
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                client = supabase.createClient(url, key);
            } else if (typeof createClient !== 'undefined') {
                client = createClient(url, key);
            } else if (typeof window.supabase !== 'undefined' && window.supabase.auth) {
                client = window.supabase;
            }

            if (client) {
                window.supabaseClient = client;
                console.log('Supabase client initialized successfully');
                return client;
            }
        } catch (err) {
            console.warn('Could not initialize Supabase client:', err);
        }

        return null;
    }

    // Initialize Supabase
    const supabaseClient = initializeSupabaseClient();

    // DOM Elements Cache
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

    // Auth Manager - SIMPLIFIED to use only Supabase
    class AuthManager {
        static async login(email, password) {
            try {
                // Use Supabase auth directly
                if (!supabaseClient?.auth) {
                    throw new Error('Supabase client not initialized');
                }

                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;
                
                this.setAuthData(data);
                return data;
            } catch (error) {
                console.error('Login error:', error);
                throw new Error(`Login failed: ${error.message}`);
            }
        }

        static setAuthData(data) {
            if (data.session?.access_token) {
                localStorage.setItem('authToken', data.session.access_token);
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
            
            // Sign out from Supabase
            if (supabaseClient?.auth?.signOut) {
                supabaseClient.auth.signOut().catch(e => console.debug('Supabase signout error:', e));
            }
            
            window.location.href = '/index.html';
        }

        static async isAuthenticated() {
            // Check Supabase session directly
            if (supabaseClient?.auth?.getSession) {
                try {
                    const { data: { session }, error } = await supabaseClient.auth.getSession();
                    
                    if (error) throw error;
                    
                    if (session) {
                        this.setAuthData({ session, user: session.user });
                        return true;
                    }
                } catch (err) {
                    console.warn('Supabase session check failed:', err);
                }
            }

            return false;
        }

        static getCurrentUserId() {
            return localStorage.getItem('userId') || currentUser;
        }

        static getCurrentUserEmail() {
            return localStorage.getItem('userEmail');
        }
    }

    // Data Fetcher - REMOVED all API calls, use Supabase directly
    class DataFetcher {
        static async fetchUserData() {
            const userEmail = AuthManager.getCurrentUserEmail();
            const userId = AuthManager.getCurrentUserId();
            
            if (!userEmail && !userId) {
                throw new Error('User not authenticated');
            }

            if (!supabaseClient) {
                throw new Error('Supabase client not available');
            }

            try {
                let query = supabaseClient
                    .from('users')
                    .select('id, user_name, email_address, status, rank, last_login, total_income, created_at');

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
                throw new Error(`Failed to fetch user data: ${err.message}`);
            }
        }

        static async fetchEarnings() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId || !supabaseClient) return null;

            try {
                // First, check if the user has an earnings record
                const { data, error } = await supabaseClient
                    .from('earnings')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (error) throw error;
                
                // If no record exists, create one
                if (!data) {
                    const { data: newEarnings, error: createError } = await supabaseClient
                        .from('earnings')
                        .insert({
                            id: userId,
                            youtube: 0,
                            tiktok: 0,
                            trivia: 0,
                            refferal: 0,
                            bonus: 0,
                            all_time_earn: 0,
                            total_withdrawn: 0
                        })
                        .select()
                        .single();
                    
                    if (createError) throw createError;
                    return newEarnings;
                }
                
                return data;
            } catch (err) {
                console.error('Supabase fetch earnings failed:', err);
                return null;
            }
        }

        static async fetchContents() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId || !supabaseClient) return [];

            try {
                const { data, error } = await supabaseClient
                    .from('contents')
                    .select('*')
                    .eq('id', userId)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('Supabase fetch contents failed:', err);
                return [];
            }
        }

        static async fetchPaymentInfo() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId || !supabaseClient) return null;

            try {
                // First, check if the user has payment info
                const { data, error } = await supabaseClient
                    .from('payment_information')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (error) throw error;
                
                // If no record exists, create one with default values
                if (!data) {
                    const { data: newPaymentInfo, error: createError } = await supabaseClient
                        .from('payment_information')
                        .insert({
                            id: userId,
                            mobile_number: '',
                            payment_method: '',
                            email: AuthManager.getCurrentUserEmail() || '',
                            notification_preference: 'email'
                        })
                        .select()
                        .single();
                    
                    if (createError) throw createError;
                    return newPaymentInfo;
                }
                
                return data;
            } catch (err) {
                console.error('Supabase fetch payment info failed:', err);
                return null;
            }
        }

        static async fetchWithdrawalRequests() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId || !supabaseClient) return [];

            try {
                const { data, error } = await supabaseClient
                    .from('withdrawal_requests')
                    .select('*')
                    .eq('id', userId)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('Supabase fetch withdrawals failed:', err);
                return [];
            }
        }

        // NEW: Fetch statistics
        static async fetchStatistics() {
            if (!supabaseClient) return null;

            try {
                const { data, error } = await supabaseClient
                    .from('statistics')
                    .select('*')
                    .limit(1)
                    .maybeSingle();
                
                if (error) throw error;
                return data;
            } catch (err) {
                console.error('Supabase fetch statistics failed:', err);
                return null;
            }
        }

        // NEW: Fetch referrals
        static async fetchReferrals() {
            const userId = AuthManager.getCurrentUserId();
            if (!userId || !supabaseClient) return null;

            try {
                const { data, error } = await supabaseClient
                    .from('refferals')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (error) throw error;
                return data;
            } catch (err) {
                console.error('Supabase fetch referrals failed:', err);
                return null;
            }
        }
    }

    // UI Renderer - UPDATED to match your dashboard format
    class UIRenderer {
        static format = {
            currency: (amount) => {
                if (amount === null || amount === undefined || isNaN(amount)) return 'UGX 0';
                return `UGX ${new Intl.NumberFormat('en-US').format(amount)}`;
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
            },
            
            time: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (e) {
                    return '';
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
            
            // Format total income as UGX
            if (elements.totalIncome && userData.total_income !== undefined) {
                elements.totalIncome.textContent = `UGX ${new Intl.NumberFormat('en-US').format(userData.total_income || 0)}`;
            }
        }

        static updateEarnings(earningsData) {
            if (!earningsData) return;

            const elements = DOMCache.initializeElements();

            // Update all earnings fields
            this.safeUpdate(elements.youtube, this.format.currency(earningsData.youtube || 0));
            this.safeUpdate(elements.tiktok, this.format.currency(earningsData.tiktok || 0));
            this.safeUpdate(elements.trivia, this.format.currency(earningsData.trivia || 0));
            this.safeUpdate(elements.referral, this.format.currency(earningsData.refferal || 0));
            this.safeUpdate(elements.bonus, this.format.currency(earningsData.bonus || 0));
            this.safeUpdate(elements.allTime, this.format.currency(earningsData.all_time_earn || 0));
            this.safeUpdate(elements.totalWithdrawn, this.format.currency(earningsData.total_withdrawn || 0));

            // Calculate available balance
            if (elements.availableBalance) {
                const allTime = parseFloat(earningsData.all_time_earn) || 0;
                const withdrawn = parseFloat(earningsData.total_withdrawn) || 0;
                const available = allTime - withdrawn;
                elements.availableBalance.textContent = this.format.currency(available);
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
                    <small>Requested: ${this.format.date(request.created_at)} ${this.format.time(request.created_at)}</small>
                </div>
            `).join('');

            container.innerHTML = requestsHTML;
        }

        static safeUpdate(element, value) {
            if (element && typeof value !== 'undefined') {
                element.textContent = value;
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
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #e74c3c;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: none;
                `;
                document.body.appendChild(errorDiv);
            }
            
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px;">⚠️</span>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.style.display='none'" 
                            style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
                        ×
                    </button>
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
                loader.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;
                loader.innerHTML = `
                    <div class="spinner" style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <p style="margin-top: 10px; color: #333;">Loading...</p>
                `;
                
                // Add spin animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
                
                document.body.appendChild(loader);
            }
            
            if (loader) {
                loader.style.display = show ? 'flex' : 'none';
            }
        }

        static showSuccess(message) {
            // Remove existing success messages
            document.querySelectorAll('.success-message').forEach(el => el.remove());
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            `;
            
            successDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px;">✓</span>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(successDiv);
            
            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
    }

    // App Controller - SIMPLIFIED
    class AppController {
        static async initialize() {
            console.log('App initializing...');
            
            // Check authentication
            const isAuthenticated = await AuthManager.isAuthenticated();
            if (!isAuthenticated) {
                console.log('Not authenticated, redirecting to login...');
                window.location.href = '/index.html';
                return;
            }

            // Initialize DOM cache
            DOMCache.initializeElements();

            // Load initial data
            await this.loadUserData();

            // Setup event listeners
            this.setupEventListeners();

            console.log('App initialized successfully');
        }

        static async loadUserData() {
            try {
                UIRenderer.showLoading(true);

                // Load all data in parallel
                const [userData, earnings, contents, paymentInfo, withdrawals] = await Promise.all([
                    DataFetcher.fetchUserData().catch(err => {
                        console.error('User data error:', err);
                        return null;
                    }),
                    DataFetcher.fetchEarnings().catch(err => {
                        console.error('Earnings error:', err);
                        return null;
                    }),
                    DataFetcher.fetchContents().catch(err => {
                        console.error('Contents error:', err);
                        return [];
                    }),
                    DataFetcher.fetchPaymentInfo().catch(err => {
                        console.error('Payment info error:', err);
                        return null;
                    }),
                    DataFetcher.fetchWithdrawalRequests().catch(err => {
                        console.error('Withdrawals error:', err);
                        return [];
                    })
                ]);

                // Update UI with fetched data
                UIRenderer.updateUserProfile(userData);
                UIRenderer.updateEarnings(earnings);
                UIRenderer.updateContents(contents);
                UIRenderer.updatePaymentInfo(paymentInfo);
                UIRenderer.updateWithdrawalRequests(withdrawals);

            } catch (error) {
                console.error('Data loading error:', error);
                UIRenderer.showError('Failed to load user data. Please refresh the page.');
            } finally {
                UIRenderer.showLoading(false);
            }
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

            // Check available balance
            const userId = AuthManager.getCurrentUserId();
            const earnings = await DataFetcher.fetchEarnings();
            const available = (earnings?.all_time_earn || 0) - (earnings?.total_withdrawn || 0);
            
            if (amount > available) {
                UIRenderer.showError(`Insufficient balance. Available: ${UIRenderer.format.currency(available)}`);
                return;
            }

            const withdrawalData = {
                payment_method: formData.get('payment_method'),
                phone_number: formData.get('phone_number'),
                email: formData.get('email'),
                amount: amount,
                user_id: userId,
                status: 'pending'
            };

            try {
                UIRenderer.showLoading(true);
                
                // Submit withdrawal directly to Supabase
                if (!supabaseClient) {
                    throw new Error('Database connection not available');
                }

                const { data, error } = await supabaseClient
                    .from('withdrawal_requests')
                    .insert([withdrawalData])
                    .select();
                
                if (error) throw error;

                UIRenderer.showSuccess('Withdrawal request submitted successfully!');
                e.target.reset();
                
                // Reload data to show updated withdrawal list
                await this.loadUserData();
                
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