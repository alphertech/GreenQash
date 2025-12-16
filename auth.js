// auth.js - Updated with referral system integration
console.log('Supabase loaded:', typeof window.supabase, typeof createClient);

// Configuration
const CONFIG = {
    supabase: {
        url: window.SUPABASE_CONFIG?.url || 'https://kwghulqonljulmvlcfnz.supabase.co',
        key: window.SUPABASE_CONFIG?.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM',
        apiBase: window.API_BASE_URL || window.SUPABASE_CONFIG?.apiBase || ''
    }
};

console.log('Supabase Config:', {
    url: CONFIG.supabase.url,
    keyLength: CONFIG.supabase.key?.length || 0,
    keyPreview: CONFIG.supabase.key ? CONFIG.supabase.key.substring(0, 20) + '...' : 'No key'
});

// DOM Elements Cache
const Elements = {
    // Form toggle buttons
    showLoginBtn: null,
    showRegisterBtn: null,
    showLoginLink: null,
    
    // Forms
    loginForm: null,
    registerForm: null,
    
    // Form inputs
    loginEmail: null,
    loginPassword: null,
    registerUsername: null,
    registerEmail: null,
    registerPassword: null,
    registerConfirmPassword: null,
    
    // Other elements
    notification: null,
    togglePasswordButtons: null,
    
    // Referral elements (added)
    referralMessage: null,
    
    initialize() {
        this.showLoginBtn = document.getElementById('showLogin');
        this.showRegisterBtn = document.getElementById('showRegister');
        this.showLoginLink = document.getElementById('showLoginLink');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.notification = document.getElementById('notification');
        this.togglePasswordButtons = document.querySelectorAll('.toggle-password');
        this.referralMessage = document.getElementById('referral-message'); // Added
        
        // Form inputs
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.registerUsername = document.getElementById('registerUsername');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerConfirmPassword = document.getElementById('registerConfirmPassword');
        
        console.log('Elements initialized:', {
            showLoginBtn: !!this.showLoginBtn,
            showRegisterBtn: !!this.showRegisterBtn,
            loginForm: !!this.loginForm,
            registerForm: !!this.registerForm,
            referralMessage: !!this.referralMessage
        });
    }
};

// Referral System (NEW)
class ReferralSystem {
    static async handleReferralRegistration() {
        try {
            console.log('🔍 Checking for referral data...');
            
            // Get referral data from URL
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            
            let referralData = null;
            
            // Parse referral URL format: /ref/{inviter_id}/{inviter_name}
            if (refParam) {
                console.log('Found referral parameter:', refParam);
                
                // Try to parse as JSON first
                try {
                    referralData = JSON.parse(atob(refParam));
                    console.log('Parsed referral data (JSON):', referralData);
                } catch (e) {
                    // If not JSON, try to parse as slash-separated
                    const parts = refParam.split('/');
                    if (parts.length >= 2) {
                        const inviterId = parseInt(parts[0]);
                        const inviterName = parts[1] ? decodeURIComponent(parts[1]) : null;
                        
                        if (inviterId && !isNaN(inviterId)) {
                            referralData = {
                                inviter_id: inviterId,
                                inviter_name: inviterName || `User${inviterId}`,
                                source: 'url'
                            };
                            console.log('Parsed referral data (URL):', referralData);
                        }
                    }
                }
            }
            
            // Store referral data for use during registration
            if (referralData && referralData.inviter_id) {
                localStorage.setItem('pending_referral', JSON.stringify(referralData));
                console.log('✅ Referral data captured:', referralData);
                
                // Show message to user
                if (Elements.referralMessage) {
                    Elements.referralMessage.textContent = 
                        `🎉 You were referred by ${referralData.inviter_name || 'a friend'}! Both of you will earn rewards.`;
                    Elements.referralMessage.style.display = 'block';
                    Elements.referralMessage.style.backgroundColor = '#e8f5e9';
                    Elements.referralMessage.style.padding = '10px';
                    Elements.referralMessage.style.borderRadius = '5px';
                    Elements.referralMessage.style.margin = '10px 0';
                }
                
                return referralData;
            }
            
            return null;
            
        } catch (error) {
            console.error('Error handling referral registration:', error);
            return null;
        }
    }
    
    static async saveReferralAfterRegistration(newUserId, newUserName) {
        try {
            console.log('💾 Saving referral after registration...');
            
            const pendingReferral = localStorage.getItem('pending_referral');
            if (!pendingReferral) {
                console.log('No pending referral found');
                return null;
            }
            
            const referralData = JSON.parse(pendingReferral);
            console.log('Processing referral data:', referralData);
            
            // Check if referral already exists (prevent duplicates)
            const { data: existingReferral } = await SupabaseService.getClient()
                .from('refferals')
                .select('referral_id')
                .eq('referred_id', newUserId)
                .maybeSingle();
            
            if (existingReferral) {
                console.log('Referral already exists for this user');
                localStorage.removeItem('pending_referral');
                return existingReferral;
            }
            
            // Save to referrals table
            const { data, error } = await SupabaseService.getClient()
                .from('refferals')
                .insert({
                    inviter_id: referralData.inviter_id,
                    referred_id: newUserId,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error saving referral:', error);
                return null;
            }
            
            // Clear pending referral
            localStorage.removeItem('pending_referral');
            
            console.log('✅ Referral saved successfully:', data);
            
            // Determine secondary beneficiary (Level 2)
            await this.determineSecondaryBenefit(referralData.inviter_id, newUserId);
            
            return data;
            
        } catch (error) {
            console.error('Error in saveReferralAfterRegistration:', error);
            return null;
        }
    }
    
    static async determineSecondaryBenefit(inviterId, referredId) {
        try {
            console.log('🔍 Determining secondary benefit...');
            
            // Find who invited the inviter (if any)
            const { data: inviterReferral, error } = await SupabaseService.getClient()
                .from('refferals')
                .select('inviter_id')
                .eq('referred_id', inviterId)
                .maybeSingle();
            
            if (error) throw error;
            
            if (inviterReferral && inviterReferral.inviter_id) {
                // Update the new referral with secondary beneficiary
                await SupabaseService.getClient()
                    .from('refferals')
                    .update({ 
                        secondary_benefit: inviterReferral.inviter_id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('referred_id', referredId);
                
                console.log(`✅ Secondary benefit assigned to user ${inviterReferral.inviter_id}`);
            }
            
        } catch (error) {
            console.error('Error determining secondary benefit:', error);
        }
    }
}

// Supabase Service with error handling
class SupabaseService {
    static client = null;
    static isInitialized = false;
    
    static async initialize() {
        if (this.isInitialized) {
            return this.client;
        }
        
        try {
            console.log('Initializing Supabase...');
            
            // Wait for Supabase to be available globally
            await this.waitForSupabase();
            
            // Create client
            const supabaseUrl = CONFIG.supabase.url;
            const supabaseKey = CONFIG.supabase.key;
            
            if (!supabaseUrl) {
                console.error('Supabase URL is missing');
                return null;
            }
            
            if (!supabaseKey || supabaseKey.length < 100) {
                console.error('Supabase Key is invalid or too short. Please check your configuration.');
                
                // Show user-friendly message
                if (Elements.notification) {
                    Elements.notification.textContent = 'Authentication service configuration error. Please check your API key.';
                    Elements.notification.classList.add('error', 'show');
                }
                return null;
            }
            
            // Try different ways to initialize Supabase
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                console.log('Using window.supabase.createClient');
                this.client = window.supabase.createClient(supabaseUrl, supabaseKey);
            } 
            else if (typeof createClient === 'function') {
                console.log('Using createClient function');
                this.client = createClient(supabaseUrl, supabaseKey);
            }
            else {
                // Try dynamic import as last resort
                console.log('Attempting dynamic import of Supabase');
                try {
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                    this.client = createClient(supabaseUrl, supabaseKey);
                } catch (importError) {
                    console.error('Failed to import Supabase:', importError);
                    throw new Error('Supabase SDK could not be loaded');
                }
            }
            
            if (!this.client) {
                throw new Error('Failed to create Supabase client');
            }
            
            // Test the connection
            try {
                const { error } = await this.client.auth.getSession();
                if (error && error.message.includes('JWT')) {
                    console.error('Invalid Supabase key detected:', error.message);
                    throw new Error('Invalid API key configuration');
                }
            } catch (testError) {
                console.warn('Session test failed (may be normal for new users):', testError.message);
            }
            
            this.isInitialized = true;
            console.log('Supabase initialized successfully');
            
            // Expose to window for other modules
            window.supabase = this.client;
            
            return this.client;
            
        } catch (error) {
            console.error('Supabase initialization failed:', error);
            this.isInitialized = false;
            this.client = null;
            
            // Show user-friendly message
            let errorMessage = 'Authentication service is temporarily unavailable. Please try again later.';
            
            if (error.message.includes('API key') || error.message.includes('JWT') || error.message.includes('Invalid')) {
                errorMessage = 'Authentication service configuration error. Please contact the administrator.';
            }
            
            if (Elements.notification) {
                Elements.notification.textContent = errorMessage;
                Elements.notification.classList.add('error', 'show');
            }
            
            return null;
        }
    }
    
    static waitForSupabase(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkInterval = setInterval(() => {
                // Check if Supabase is available
                const isAvailable = (
                    (window.supabase && typeof window.supabase.createClient === 'function') ||
                    (typeof createClient === 'function')
                );
                
                if (isAvailable) {
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                
                // Timeout check
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error('Supabase SDK not loaded within timeout'));
                }
            }, 100);
        });
    }
    
    static getClient() {
        if (!this.client && !this.isInitialized) {
            console.warn('Supabase not initialized. Call initialize() first.');
        }
        return this.client;
    }
}

// Auth Manager
class AuthManager {
    constructor() {
        this.supabase = null;
        this.init();
    }
    
    async init() {
        console.log('🚀 GreenQash Auth System Initializing...');
        
        // Initialize elements
        Elements.initialize();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for referral data on page load
        await ReferralSystem.handleReferralRegistration();
        
        // Initialize Supabase (non-blocking)
        setTimeout(async () => {
            try {
                this.supabase = await SupabaseService.initialize();
                if (this.supabase) {
                    await this.checkCurrentSession();
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            }
        }, 100);
    }
    
    setupEventListeners() {
        // Form toggle listeners
        if (Elements.showLoginBtn) {
            Elements.showLoginBtn.addEventListener('click', () => this.toggleForms('login'));
        }
        
        if (Elements.showRegisterBtn) {
            Elements.showRegisterBtn.addEventListener('click', () => this.toggleForms('register'));
        }
        
        if (Elements.showLoginLink) {
            Elements.showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms('login');
            });
        }
        
        // Password toggle listeners
        if (Elements.togglePasswordButtons && Elements.togglePasswordButtons.length > 0) {
            Elements.togglePasswordButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const input = this.parentElement.querySelector('input');
                    if (input) {
                        AuthManager.togglePasswordVisibility(input, this);
                    }
                });
            });
        }
        
        // Form submission
        if (Elements.loginForm) {
            Elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (Elements.registerForm) {
            Elements.registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }
        
        // Set default active form
        if (Elements.loginForm && Elements.registerForm) {
            this.toggleForms('login', true);
        }
    }
    
    toggleForms(form, force = false) {
        console.log('Switching to form:', form);
        
        // Update button states
        if (Elements.showLoginBtn) {
            Elements.showLoginBtn.classList.toggle('active', form === 'login');
        }
        
        if (Elements.showRegisterBtn) {
            Elements.showRegisterBtn.classList.toggle('active', form === 'register');
        }
        
        // Update form visibility
        if (Elements.loginForm) {
            Elements.loginForm.classList.toggle('active', form === 'login');
        }
        
        if (Elements.registerForm) {
            Elements.registerForm.classList.toggle('active', form === 'register');
        }
    }
    
    static togglePasswordVisibility(input, button) {
        if (input.type === 'password') {
            input.type = 'text';
            button.classList.remove('fa-eye');
            button.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            button.classList.remove('fa-eye-slash');
            button.classList.add('fa-eye');
        }
    }
    
    async checkCurrentSession() {
        if (!this.supabase) {
            console.log('Supabase not available for session check');
            return;
        }
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session && session.user) {
                console.log('User already logged in');
                this.persistSession(session);
                const redirectUrl = await this.getUserRedirectUrl(session.user.email);
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.log('No active session or error checking session:', error);
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        if (!Elements.loginEmail || !Elements.loginPassword) {
            this.showNotification('Login form elements not found', true);
            return;
        }
        
        const email = Elements.loginEmail.value.trim();
        const password = Elements.loginPassword.value;
        
        if (!email || !password) {
            this.showNotification('Please fill in all fields', true);
            return;
        }
        
        if (!this.supabase) {
            this.showNotification('Authentication service is unavailable. Please try again later.', true);
            return;
        }
        
        try {
            this.showNotification('Signing you in...');
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                // Handle specific error cases
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid email or password. Please try again.');
                } else if (error.message.includes('Email not confirmed')) {
                    throw new Error('Please verify your email address before logging in.');
                } else if (error.message.includes('Invalid API key') || error.status === 401) {
                    throw new Error('Authentication service error. Please contact support.');
                } else {
                    throw error;
                }
            }
            
            // Persist session data
            this.persistSession(data.session);
            
            // Create user in public table if needed
            await this.createUserInPublicTable(data.user, email);
            
            // Redirect based on role
            const redirectUrl = await this.getUserRedirectUrl(email);
            
            this.showNotification('Welcome back! Redirecting...');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please check your credentials and try again.', true);
        }
    }
    
    async handleRegistration(e) {
        e.preventDefault();
        
        if (!Elements.registerUsername || !Elements.registerEmail || !Elements.registerPassword || !Elements.registerConfirmPassword) {
            this.showNotification('Registration form elements not found', true);
            return;
        }
        
        const username = Elements.registerUsername.value.trim();
        const email = Elements.registerEmail.value.trim();
        const password = Elements.registerPassword.value;
        const confirmPassword = Elements.registerConfirmPassword.value;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', true);
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', true);
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', true);
            return;
        }
        
        if (!this.supabase) {
            this.showNotification('Registration service is unavailable. Please try again later.', true);
            return;
        }
        
        try {
            this.showNotification('Creating your account...');
            
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { 
                        username,
                        full_name: username 
                    }
                }
            });
            
            if (error) {
                // Handle specific error cases
                if (error.message.includes('User already registered')) {
                    throw new Error('This email is already registered. Please login instead.');
                } else if (error.message.includes('Invalid API key') || error.status === 401) {
                    throw new Error('Registration service error. Please contact support.');
                } else {
                    throw error;
                }
            }
            
            // Create user in public table
            let userId = null;
            if (data.user) {
                const publicUser = await this.createUserInPublicTable(data.user, email, username);
                userId = publicUser?.id || null;
            }
            
            // Save referral if user came from referral link
            if (userId) {
                const referralSaved = await ReferralSystem.saveReferralAfterRegistration(userId, username);
                
                if (referralSaved) {
                    this.showNotification('Account created successfully! You were referred by a friend. Both of you will earn rewards!');
                } else {
                    this.showNotification('Account created successfully! Please check your email for verification.');
                }
            } else {
                this.showNotification('Account created successfully! Please check your email for verification.');
            }
            
            // Reset form and switch to login
            setTimeout(() => {
                if (Elements.registerForm) Elements.registerForm.reset();
                this.toggleForms('login');
            }, 3000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', true);
        }
    }
    
    persistSession(session) {
        try {
            if (session?.access_token) {
                localStorage.setItem('authToken', session.access_token);
            }
            if (session?.user?.id) {
                localStorage.setItem('userId', session.user.id);
            }
            if (session?.user?.email) {
                localStorage.setItem('userEmail', session.user.email);
            }
        } catch (err) {
            console.warn('Could not persist session to localStorage:', err);
        }
    }
    
    async createUserInPublicTable(authUser, email, username = null) {
        if (!this.supabase) return null;
        
        try {
            const finalUsername = username || email.split('@')[0];
            
            // First check if user already exists
            const { data: existingUser, error: checkError } = await this.supabase
                .from('users')
                .select('id')
                .eq('email_address', email)
                .maybeSingle();
            
            if (existingUser) {
                console.log('User already exists in public table:', existingUser);
                return existingUser;
            }
            
            // Create new user
            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    user_name: finalUsername,
                    email_address: email,
                    uuid: authUser.id,
                    rank: 'user',
                    status: 'not active',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) {
                console.error('Error creating public user:', error);
                return null;
            }
            
            console.log('✅ Public user created:', data);
            return data;
            
        } catch (error) {
            console.error('Error in createUserInPublicTable:', error);
            return null;
        }
    }
    
    async getUserRedirectUrl(email) {
        if (!this.supabase) {
            return 'dashboard.html';
        }
        
        try {
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('rank')
                .eq('email_address', email)
                .single();
            
            if (error) {
                console.warn('Could not fetch user role:', error.message);
                return 'dashboard.html';
            }
            
            if (userData?.rank === 'admin') {
                console.log('Admin user detected');
                return 'level1/administrators.html';
            }
            
            return 'dashboard.html';
            
        } catch (error) {
            console.error('Error checking user role:', error);
            return 'dashboard.html';
        }
    }
    
    showNotification(message, isError = false) {
        if (!Elements.notification) {
            console.log('Notification:', message);
            return;
        }
        
        Elements.notification.textContent = message;
        Elements.notification.className = 'notification' + (isError ? ' error' : '');
        Elements.notification.classList.add('show');
        
        setTimeout(() => {
            if (Elements.notification) {
                Elements.notification.classList.remove('show');
            }
        }, 5000);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const authManager = new AuthManager();
        window.authManager = authManager; // Expose for debugging
        window.ReferralSystem = ReferralSystem; // Expose referral system
    } catch (error) {
        console.error('Failed to initialize auth system:', error);
        if (Elements.notification) {
            Elements.notification.textContent = 'Failed to load authentication system. Please refresh the page.';
            Elements.notification.classList.add('error', 'show');
        }
    }
});