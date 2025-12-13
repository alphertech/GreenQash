// dashboard-core.js - UPDATED TO USE API
(function() {
    console.log('Dashboard core starting with API...');
    
    let userProfile = null;
    let earningsData = null;
    
    async function initDashboard() {
        console.log('Initializing dashboard with API...');
        
        // Check if API client is available
        if (!window.apiClient) {
            console.error('API client not available');
            
            // Fallback to direct Supabase if API is down
            if (window.supabase) {
                console.log('Falling back to direct Supabase...');
                await initDirectSupabase();
            } else {
                showError('Application not properly initialized. Please refresh.');
            }
            return;
        }
        
        try {
            // Test API connection
            const health = await window.apiClient.healthCheck();
            console.log('API health:', health);
            
            if (health.status !== 'ok') {
                console.warn('API appears offline, using fallback');
                await initDirectSupabase();
                return;
            }
            
            // Load user data via API
            await loadUserDataViaAPI();
            
            // Setup event listeners
            setupEventListeners();
            
            console.log('Dashboard initialized successfully via API');
            
        } catch (error) {
            console.error('API initialization error:', error);
            
            // Fallback to direct Supabase
            if (window.supabase) {
                console.log('Falling back to direct Supabase due to API error');
                await initDirectSupabase();
            }
        }
    }
    
    async function loadUserDataViaAPI() {
        try {
            console.log('Loading user data via API...');
            
            const response = await window.apiClient.getUserProfile();
            
            if (!response.success) {
                throw new Error('Failed to load user data');
            }
            
            userProfile = response.user;
            earningsData = response.earnings;
            
            console.log('Data loaded via API:', { userProfile, earningsData });
            
            // Update UI
            updateAllUI();
            
        } catch (error) {
            console.error('API data load error:', error);
            throw error;
        }
    }
    
    async function initDirectSupabase() {
        // Fallback: Load data directly from Supabase
        console.log('Loading data directly from Supabase...');
        
        if (!window.supabase) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        
        if (userError || !user) {
            throw new Error('No authenticated user found');
        }
        
        // Load data directly (same as before but without API)
        const [profile, earnings, payment] = await Promise.all([
            loadFromSupabase('users', 'email_address', user.email),
            loadFromSupabase('earnings', 'id', user.id),
            loadFromSupabase('payment_information', 'id', user.id)
        ]);
        
        userProfile = profile;
        earningsData = earnings;
        
        updateAllUI();
    }
    
    async function loadFromSupabase(table, column, value) {
        const { data, error } = await window.supabase
            .from(table)
            .select('*')
            .eq(column, value)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error(`Error loading from ${table}:`, error);
            return null;
        }
        
        return data;
    }
    
    function updateAllUI() {
        // Update all UI elements with data
        if (userProfile) {
            // Update username everywhere
            const username = userProfile.user_name || 
                            userProfile.authMetadata?.full_name || 
                            userProfile.email?.split('@')[0] || 'User';
            
            document.querySelectorAll('#user_name').forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = username;
                } else {
                    el.textContent = username;
                }
            });
            
            // Update email
            document.querySelectorAll('#email_address, .emailAdress').forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = userProfile.email || '';
                } else {
                    el.textContent = userProfile.email || '';
                }
            });
            
            // Update status if element exists
            const statusElement = document.getElementById('status');
            if (statusElement && userProfile.status) {
                statusElement.textContent = userProfile.status;
                statusElement.className = `status-${userProfile.status}`;
            }
        }
        
        // Update earnings
        if (earningsData) {
            const stats = {
                'youtube': earningsData.youtube || 0,
                'tiktok': earningsData.tiktok || 0,
                'trivia': earningsData.trivia || 0,
                'refferal': earningsData.refferal || 0,
                'bonus': earningsData.bonus || 0,
                'total_income': earningsData.all_time_earn || 0,
                'withdrawn': earningsData.total_withdrawn || 0,
                'walletQash': (earningsData.all_time_earn || 0) - (earningsData.total_withdrawn || 0)
            };
            
            Object.entries(stats).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = typeof value === 'number' ? 
                        value.toLocaleString('en-US') : value;
                }
            });
        }
    }
    
    function setupEventListeners() {
        // Task claims using API
        document.getElementById('claim')?.addEventListener('click', async () => {
            try {
                const response = await window.apiClient.claimTask('tiktok');
                showNotification(response.message, 'success');
                
                // Refresh data
                await loadUserDataViaAPI();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        document.getElementById('claimYoutube')?.addEventListener('click', async () => {
            try {
                const response = await window.apiClient.claimTask('youtube');
                showNotification(response.message, 'success');
                
                // Refresh data
                await loadUserDataViaAPI();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        // Trivia form using API
        document.getElementById('quizForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect answers
            const answers = {};
            ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                answers[q] = selected ? selected.value : null;
            });
            
            try {
                const response = await window.apiClient.submitTrivia(answers);
                showNotification(response.message, 'success');
                
                // Refresh data
                await loadUserDataViaAPI();
                
                // Disable form
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Completed Today';
                }
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        // Withdrawal form using API
        document.getElementById('withdrawalForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = parseFloat(e.target.querySelector('input[type="number"]').value);
            const paymentMethod = e.target.querySelector('select').value;
            const accountDetails = document.getElementById('account_number')?.value;
            
            if (amount < 59000) {
                showNotification('Minimum withdrawal is UGX 59,000', 'warning');
                return;
            }
            
            try {
                const response = await window.apiClient.requestWithdrawal({
                    amount,
                    paymentMethod,
                    accountDetails
                });
                
                showNotification(response.message, 'success');
                e.target.reset();
                
                // Refresh data
                await loadUserDataViaAPI();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        // Settings save using API
        document.getElementById('saveSettings')?.addEventListener('click', async () => {
            const username = document.querySelector('#settings-section #user_name')?.value;
            const email = document.querySelector('#settings-section #email_address')?.value;
            const phone = document.querySelector('#settings-section #phone_number')?.value;
            
            try {
                await window.apiClient.updateUserProfile({
                    username,
                    email,
                    phone
                });
                
                showNotification('Settings saved successfully!', 'success');
                
                // Refresh data
                await loadUserDataViaAPI();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        // Same notification function as before
        console.log(`${type}: ${message}`);
    }
    
    // Initialize
    setTimeout(initDashboard, 1000);
})();