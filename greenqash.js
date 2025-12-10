// Configuration - Consolidated configuration
const CONFIG = {
    supabase: {
        url: window.SUPABASE_CONFIG?.url || 'https://kwghulqonljulmvlcfnz.supabase.co',
        key: window.SUPABASE_CONFIG?.key || '',
        apiBase: window.API_BASE_URL || window.SUPABASE_CONFIG?.apiBase || ''
    }
};

// DOM Elements Cache
const DOM = {
    elements: {},
    
    get(id) {
        if (!this.elements[id]) {
            this.elements[id] = document.getElementById(id);
        }
        return this.elements[id];
    },
    
    getUsername() {
        const usernameElem = this.get('username00');
        if (!usernameElem) return '';
        
        return usernameElem.tagName === 'INPUT' 
            ? usernameElem.value.trim() 
            : usernameElem.textContent.trim();
    }
};

// Utility Functions
class Utils {
    static greetUser() {
        const hour = new Date().getHours();
        let message = "";
        
        if (hour < 12) {
            message = "Good Morning";
        } else if (hour < 16) {
            message = "Good Afternoon";
        } else {
            message = "Good Evening";
        }
        
        const greetingsElement = DOM.get("greetings");
        if (greetingsElement) {
            greetingsElement.innerText = message;
        }
    }
    
    static showNotification(message, type = 'success', duration = 2000) {
        const notification = DOM.get('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
    static async copyToClipboard(text) {
        try {
            // Modern Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers/HTTP
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Copy failed:', error);
            return false;
        }
    }
}

// Supabase Service
class SupabaseService {
    static client = null;
    
    static initialize() {
        try {
            // Check if Supabase is available globally
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                this.client = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
                console.log('Supabase client initialized successfully');
                return this.client;
            }
            
            // Alternative global function
            if (typeof createClient === 'function') {
                this.client = createClient(CONFIG.supabase.url, CONFIG.supabase.key);
                console.log('Supabase client initialized via createClient');
                return this.client;
            }
            
            console.warn('Supabase SDK not loaded. Please include Supabase CDN.');
            return null;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return null;
        }
    }
    
    static getClient() {
        if (!this.client) {
            return this.initialize();
        }
        return this.client;
    }
    
    static async saveUserSettings(data) {
        const client = this.getClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        try {
            const { error } = await client
                .from('user_settings')
                .upsert(data, { 
                    onConflict: 'username',
                    ignoreDuplicates: false 
                });
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }
}

// Clipboard Manager
class ClipboardManager {
    constructor() {
        this.linkInput = DOM.get('link');
        this.copyButton = DOM.get('CopyLink');
        this.init();
    }
    
    init() {
        if (!this.linkInput || !this.copyButton) return;
        
        // Set referral link
        const username = DOM.getUsername();
        if (username) {
            this.linkInput.value = `https://alphertech.github.io/greenqash.com/ref/${encodeURIComponent(username)}`;
        }
        
        // Set up event listeners
        this.copyButton.addEventListener('click', () => this.handleCopy());
        this.linkInput.addEventListener('click', () => this.linkInput.select());
    }
    
    async handleCopy() {
        if (!this.linkInput || !this.copyButton) return;
        
        try {
            const success = await Utils.copyToClipboard(this.linkInput.value);
            
            if (success) {
                this.copyButton.textContent = 'Copied!';
                this.copyButton.classList.add('copied');
                Utils.showNotification('Link copied successfully!');
                
                setTimeout(() => {
                    this.copyButton.textContent = 'Copy Link';
                    this.copyButton.classList.remove('copied');
                }, 2000);
            } else {
                Utils.showNotification('Failed to copy link', 'error');
            }
        } catch (error) {
            console.error('Copy failed:', error);
            Utils.showNotification('Failed to copy link', 'error');
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor() {
        this.elements = this.getElements();
        this.init();
    }
    
    getElements() {
        return {
            username: DOM.get('username00'),
            email: DOM.get('emailAdress'),
            phone: DOM.get('phoneNumber'),
            paymentMethod: DOM.get('payMeth'),
            notificationPref: DOM.get('notificationPref'),
            saveButton: DOM.get('saveSettings')
        };
    }
    
    init() {
        if (!this.elements.saveButton) return;
        
        this.loadSettings();
        this.elements.saveButton.addEventListener('click', () => this.saveSettings());
    }
    
    getFormData() {
        const data = {};
        
        for (const [key, element] of Object.entries(this.elements)) {
            if (element && element.value !== undefined && key !== 'saveButton') {
                data[key] = element.value.trim();
            }
        }
        
        return data;
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.username) errors.push('Username is required');
        if (!data.email) errors.push('Email is required');
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async saveSettings() {
        const formData = this.getFormData();
        const validation = this.validate(formData);
        
        if (!validation.isValid) {
            alert(validation.errors.join('\n'));
            return;
        }
        
        try {
            // Try to save to Supabase first
            const supabase = SupabaseService.getClient();
            if (supabase) {
                await SupabaseService.saveUserSettings(formData);
                Utils.showNotification('Settings saved to database!');
            } else {
                // Fallback to localStorage
                localStorage.setItem('userSettings', JSON.stringify(formData));
                Utils.showNotification('Settings saved locally');
            }
        } catch (error) {
            console.error('Save failed:', error);
            // Fallback to localStorage on error
            localStorage.setItem('userSettings', JSON.stringify(formData));
            Utils.showNotification('Settings saved locally (database unavailable)');
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('userSettings');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            // Populate form fields
            for (const [key, element] of Object.entries(this.elements)) {
                if (element && data[key] && key !== 'saveButton') {
                    element.value = data[key];
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
}

// Main Application Controller
class GreenQashApp {
    constructor() {
        this.clipboardManager = null;
        this.settingsManager = null;
    }
    
    initialize() {
        console.log('GreenQash application initialized');
        
        // Initialize greeting
        Utils.greetUser();
        
        // Initialize Supabase (non-blocking)
        setTimeout(() => {
            SupabaseService.initialize();
        }, 0);
        
        // Initialize clipboard functionality
        this.clipboardManager = new ClipboardManager();
        
        // Initialize settings
        this.settingsManager = new SettingsManager();
    }
}

// Application Bootstrap with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GreenQashApp();
        app.initialize();
    } catch (error) {
        console.error('Application initialization failed:', error);
        Utils.showNotification('Application failed to load properly', 'error');
    }
});

// Make sure Supabase CDN is loaded in HTML head before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>