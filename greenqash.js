// ========== CONFIGURATION ==========
const CONFIG = {
    supabase: {
        url: window.SUPABASE_CONFIG?.url || 'https://kwghulqonljulmvlcfnz.supabase.co',
        // Provide the actual anon/public key here
        key: window.SUPABASE_CONFIG?.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM',
        apiBase: window.API_BASE_URL || window.SUPABASE_CONFIG?.apiBase || ''
    }
};

// ========== DOM MANAGER ==========
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

// ========== UTILITY FUNCTIONS ==========
class Utils {
    static greetUser() {
        const hour = new Date().getHours();
        let message = "";
        
        if (hour < 12) message = "Good Morning";
        else if (hour < 16) message = "Good Afternoon";
        else message = "Good Evening";
        
        const greetingsElement = DOM.get("greetings");
        if (greetingsElement) greetingsElement.innerText = message;
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
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
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

// ========== SUPABASE SERVICE ==========
class SupabaseService {
    static client = null;
    static loadingPromise = null;
    static isAvailable = false;
    
    static async loadSDK() {
        // Check if already loaded
        if (window.supabase || typeof createClient !== 'undefined') {
            return true;
        }
        
        // If already loading, wait for it
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        
        // Load Supabase SDK
        this.loadingPromise = new Promise((resolve, reject) => {
            console.log('Loading Supabase SDK...');
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log('Supabase SDK loaded successfully');
                resolve(true);
            };
            
            script.onerror = (error) => {
                console.error('Failed to load Supabase SDK:', error);
                reject(new Error('Failed to load Supabase SDK'));
            };
            
            document.head.appendChild(script);
        });
        
        return this.loadingPromise;
    }
    
    static async initialize() {
        try {
            // Try to load SDK if not present
            if (!window.supabase && typeof createClient === 'undefined') {
                await this.loadSDK();
            }
            
            // Check if we have a valid key
            if (!CONFIG.supabase.key || CONFIG.supabase.key.trim() === '') {
                console.warn('Supabase key is missing or empty. Supabase features disabled.');
                this.isAvailable = false;
                return null;
            }
            
            // Check if Supabase exists after loading
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                this.client = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
                console.log('Supabase initialized successfully');
                this.isAvailable = true;
                return this.client;
            }
            
            // Check alternative
            if (typeof createClient === 'function') {
                this.client = createClient(CONFIG.supabase.url, CONFIG.supabase.key);
                console.log('Supabase initialized via createClient');
                this.isAvailable = true;
                return this.client;
            }
            
            console.warn('Supabase SDK not available. Using local storage only.');
            this.isAvailable = false;
            return null;
            
        } catch (error) {
            console.error('Supabase init error:', error);
            this.isAvailable = false;
            return null;
        }
    }
    
    static getClient() {
        return this.client;
    }
    
    static isSupabaseReady() {
        return this.isAvailable && this.client !== null;
    }
    
    static async saveUserSettings(data) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Supabase not available');
            }
            
            const client = this.getClient();
            const { error } = await client
                .from('user_settings')
                .upsert(data, { onConflict: 'username' });
                
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('Save to Supabase failed:', error);
            throw error;
        }
    }
}

// ========== CLIPBOARD MANAGER ==========
class ClipboardManager {
    constructor() {
        this.linkInput = DOM.get('link');
        this.copyButton = DOM.get('CopyLink');
        this.init();
    }
    
    init() {
        if (!this.linkInput || !this.copyButton) return;
        
        const username = DOM.getUsername();
        if (username) {
            this.linkInput.value = `https://alphertech.github.io/greenqash.com/ref/${encodeURIComponent(username)}`;
        }
        
        this.copyButton.addEventListener('click', () => this.handleCopy());
        this.linkInput.addEventListener('click', () => this.linkInput.select());
    }
    
    async handleCopy() {
        try {
            const success = await Utils.copyToClipboard(this.linkInput.value);
            
            if (success) {
                this.copyButton.textContent = 'Copied!';
                this.copyButton.classList.add('copied');
                Utils.showNotification('Link copied!');
                
                setTimeout(() => {
                    this.copyButton.textContent = 'Copy Link';
                    this.copyButton.classList.remove('copied');
                }, 2000);
            } else {
                Utils.showNotification('Failed to copy', 'error');
            }
        } catch (error) {
            console.error('Copy failed:', error);
            Utils.showNotification('Failed to copy', 'error');
        }
    }
}

// ========== SETTINGS MANAGER ==========
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
        
        if (!data.username) errors.push('Username required');
        if (!data.email) errors.push('Email required');
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    async saveSettings() {
        const formData = this.getFormData();
        const validation = this.validate(formData);
        
        if (!validation.isValid) {
            alert(validation.errors.join('\n'));
            return;
        }
        
        try {
            // Try Supabase first if available
            if (SupabaseService.isSupabaseReady()) {
                await SupabaseService.saveUserSettings(formData);
                Utils.showNotification('Saved to database!');
            } else {
                localStorage.setItem('userSettings', JSON.stringify(formData));
                Utils.showNotification('Saved locally');
            }
        } catch (error) {
            console.error('Save failed:', error);
            // Always fallback to localStorage
            localStorage.setItem('userSettings', JSON.stringify(formData));
            Utils.showNotification('Saved locally (database unavailable)');
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('userSettings');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            for (const [key, element] of Object.entries(this.elements)) {
                if (element && data[key] && key !== 'saveButton') {
                    element.value = data[key];
                }
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
    }
}

// ========== MAIN APP ==========
class GreenQashApp {
    constructor() {
        this.clipboardManager = null;
        this.settingsManager = null;
        this.supabaseStatus = 'pending';
    }
    
    async initialize() {
        console.log('App initializing');
        
        // Initialize core features immediately
        Utils.greetUser();
        this.clipboardManager = new ClipboardManager();
        this.settingsManager = new SettingsManager();
        
        // Initialize Supabase in background (non-blocking)
        this.initializeSupabaseAsync();
    }
    
    async initializeSupabaseAsync() {
        try {
            console.log('Starting Supabase initialization...');
            await SupabaseService.initialize();
            
            if (SupabaseService.isSupabaseReady()) {
                this.supabaseStatus = 'ready';
                console.log('✅ Supabase ready');
            } else {
                this.supabaseStatus = 'failed';
                console.log('⚠️ Supabase not available, using localStorage');
            }
        } catch (error) {
            this.supabaseStatus = 'error';
            console.warn('Supabase init failed:', error);
        }
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new GreenQashApp();
        await app.initialize();
    } catch (error) {
        console.error('App init failed:', error);
        Utils.showNotification('App failed to load', 'error');
    }
});

// Make key available globally for debugging
window.GREENQASH_KEY = CONFIG.supabase.key ? 'Key is set' : 'Key is missing';