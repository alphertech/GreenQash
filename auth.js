// auth.js - Updated with proper Supabase initialization and error handling
// Add this before any other script to test
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
    
    initialize() {
        this.showLoginBtn = document.getElementById('showLogin');
        this.showRegisterBtn = document.getElementById('showRegister');
        this.showLoginLink = document.getElementById('showLoginLink');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.notification = document.getElementById('notification');
        this.togglePasswordButtons = document.querySelectorAll('.toggle-password');
        
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
            registerForm: !!this.registerForm
        });
    }
};

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
            console.log('Supabase URL:', CONFIG.supabase.url);
            console.log('Supabase Key length:', CONFIG.supabase.key?.length || 0);
            
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
                console.error('Current key:', supabaseKey);
                
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
            
            // Show user-friendly message based on error type
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
                    data: { username }
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
            if (data.user) {
                await this.createUserInPublicTable(data.user, email, username);
            }
            
            this.showNotification('Account created successfully! Please check your email for verification.');
            
            // Reset form and switch to login
            setTimeout(() => {
                if (Elements.registerForm) Elements.registerForm.reset();
                this.toggleForms('login');
            }, 2000);
            
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
        if (!this.supabase) return;
        
        try {
            const finalUsername = username || email.split('@')[0];
            
            const { error } = await this.supabase
                .from('users')
                .insert([{
                    user_name: finalUsername,
                    email_address: email,
                    rank: 'user'
                }]);
                
            if (error && error.code !== '23505') {
                console.error('Error creating public user:', error);
            }
        } catch (error) {
            console.error('Error in createUserInPublicTable:', error);
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
    } catch (error) {
        console.error('Failed to initialize auth system:', error);
        if (Elements.notification) {
            Elements.notification.textContent = 'Failed to load authentication system. Please refresh the page.';
            Elements.notification.classList.add('error', 'show');
        }
    }
});