// Configuration
const SUPABASE_CONFIG = {
    url: window.SUPABASE_CONFIG?.url || 'https://kwghulqonljulmvlcfnz.supabase.co',
    key: window.SUPABASE_CONFIG?.key || '',
    apiBase: window.API_BASE_URL || window.SUPABASE_CONFIG?.apiBase || ''
};

// Utility Functions
const Utils = {
    // Fixed: greetings to users with proper Date usage
    greetUser: () => {
        const hour = new Date().getHours();
        let message = "";
        
        if (hour < 12) {
            message = "Good Morning";
        } else if (hour < 16) {
            message = "Good Afternoon";
        } else {
            message = "Good Evening";
        }
        
        const greetingsElement = document.getElementById("greetings");
        if (greetingsElement) {
            greetingsElement.innerText = message;
        }
    },

    getUsername: () => {
        const usernameElem = document.getElementById('username00');
        if (!usernameElem) return '';
        
        return usernameElem.tagName === 'INPUT' 
            ? usernameElem.value.trim() 
            : usernameElem.textContent.trim();
    },

    showNotification: (element, message, duration = 2000) => {
        if (!element) return;
        
        element.textContent = message;
        element.classList.add('show');
        
        setTimeout(() => {
            element.classList.remove('show');
        }, duration);
    }
};

// Clipboard Manager
class ClipboardManager {
    constructor(inputElement, buttonElement, notificationElement) {
        this.input = inputElement;
        this.button = buttonElement;
        this.notification = notificationElement;
    }

    async copyToClipboard() {
        if (!this.input || !this.button) return false;
        
        try {
            this.input.focus();
            this.input.select();
            this.input.setSelectionRange(0, 99999);
            
            let copied = false;
            
            // Modern Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(this.input.value);
                copied = true;
            } else {
                // Fallback
                copied = document.execCommand('copy');
            }
            
            if (copied) {
                this.handleCopySuccess();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Copy failed:', error);
            this.handleCopyError();
            return false;
        }
    }

    handleCopySuccess() {
        this.button.textContent = 'Copied!';
        this.button.classList.add('copied');
        
        Utils.showNotification(this.notification, 'Link copied successfully!');
        
        setTimeout(() => {
            this.button.textContent = 'Copy Link';
            this.button.classList.remove('copied');
        }, 2000);
    }

    handleCopyError() {
        if (this.notification) {
            Utils.showNotification(this.notification, 'Failed to copy link');
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.elements = this.getFormElements();
    }

    getFormElements() {
        return {
            username: document.getElementById('username00'),
            email: document.getElementById('emailAdress'),
            phone: document.getElementById('phoneNumber'),
            paymentMethod: document.getElementById('payMeth'),
            notificationPref: document.getElementById('notificationPref'),
            saveButton: document.getElementById('saveSettings')
        };
    }

    getUserData() {
        return {
            username: this.elements.username?.value?.trim() || '',
            email: this.elements.email?.value?.trim() || '',
            phone: this.elements.phone?.value?.trim() || '',
            paymentMethod: this.elements.paymentMethod?.value?.trim() || '',
            notificationPref: this.elements.notificationPref?.value?.trim() || ''
        };
    }

    validateUserData(data) {
        if (!data.username || !data.email) {
            alert('Username and email are required');
            return false;
        }
        
        // Add more validation as needed
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Please enter a valid email address');
            return false;
        }
        
        return true;
    }

    async saveToDatabase(data) {
        if (!this.supabase) return false;
        
        try {
            const { error } = await this.supabase
                .from('user_settings')
                .upsert(data);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Database save error:', error);
            return false;
        }
    }

    saveToLocalStorage(data) {
        try {
            localStorage.setItem('userSettings', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('LocalStorage save error:', error);
            return false;
        }
    }

    async saveSettings() {
        if (!this.elements.saveButton) return;
        
        const userData = this.getUserData();
        
        if (!this.validateUserData(userData)) {
            return;
        }
        
        let success = false;
        let message = '';
        
        if (this.supabase) {
            success = await this.saveToDatabase(userData);
            message = success ? 'Settings saved successfully!' : 'Failed to save settings to database';
        } else {
            success = this.saveToLocalStorage(userData);
            message = success ? 'Settings saved locally!' : 'Failed to save settings locally';
        }
        
        alert(message);
    }

    loadSettings() {
        if (this.supabase) {
            // Load from database - implement based on your schema
            // Example: await this.loadFromDatabase();
        } else {
            // Load from localStorage
            try {
                const saved = localStorage.getItem('userSettings');
                if (saved) {
                    const data = JSON.parse(saved);
                    
                    if (this.elements.username && data.username) this.elements.username.value = data.username;
                    if (this.elements.email && data.email) this.elements.email.value = data.email;
                    if (this.elements.phone && data.phone) this.elements.phone.value = data.phone;
                    if (this.elements.paymentMethod && data.paymentMethod) this.elements.paymentMethod.value = data.paymentMethod;
                    if (this.elements.notificationPref && data.notificationPref) this.elements.notificationPref.value = data.notificationPref;
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }

    initialize() {
        if (this.elements.saveButton) {
            this.elements.saveButton.addEventListener('click', () => this.saveSettings());
        }
        this.loadSettings();
    }
}

// Supabase Client Initialization
function initializeSupabase() {
    if (window.supabase?.createClient) {
        return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    } else if (typeof createClient === 'function') {
        return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    }
    
    console.warn('Supabase client not available');
    return null;
}

// Main Application
class GreenQashApp {
    constructor() {
        this.supabase = null;
        this.clipboardManager = null;
        this.settingsManager = null;
    }

    initializeReferralLink() {
        const linkInput = document.getElementById('link');
        const copyButton = document.getElementById('CopyLink');
        const notification = document.getElementById('notification');
        
        if (!linkInput || !copyButton) {
            console.debug('Referral link elements not found');
            return;
        }
        
        const username = Utils.getUsername();
        if (username && linkInput) {
            linkInput.value = `https://alphertech.github.io/greenqash.com/ref/${encodeURIComponent(username)}`;
        }
        
        // Initialize clipboard manager
        this.clipboardManager = new ClipboardManager(linkInput, copyButton, notification);
        
        // Set up event listeners
        copyButton.addEventListener('click', () => this.clipboardManager.copyToClipboard());
        
        linkInput.addEventListener('click', function() {
            this.select();
        });
    }

    initialize() {
        console.log('GreenQash application loaded');
        
        // Initialize greeting
        Utils.greetUser();
        
        // Initialize Supabase
        this.supabase = initializeSupabase();
        
        // Initialize referral link functionality
        this.initializeReferralLink();
        
        // Initialize settings manager
        this.settingsManager = new SettingsManager(this.supabase);
        this.settingsManager.initialize();
    }
}

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    const app = new GreenQashApp();
    app.initialize();
});