// api-client.js - Frontend API service
class ApiClient {
    constructor() {
        this.baseURL = window.API_BASE_URL || 'http://localhost:3000/api';
        this.supabase = window.supabase;
        this.cache = new Map();
    }
    
    async getAuthHeader() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (!session || !session.access_token) {
                throw new Error('No authentication token found');
            }
            
            return {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            };
        } catch (error) {
            console.error('Auth header error:', error);
            throw error;
        }
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${endpoint}:${JSON.stringify(options.body || {})}`;
        
        // Check cache for GET requests
        if (options.method === 'GET' && this.cache.has(cacheKey)) {
            console.log('Cache hit for:', endpoint);
            return this.cache.get(cacheKey);
        }
        
        try {
            const headers = await this.getAuthHeader();
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ 
                    error: `HTTP ${response.status}` 
                }));
                throw new Error(error.error || `Request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache GET responses
            if (options.method === 'GET') {
                this.cache.set(cacheKey, data);
                // Clear cache after 5 minutes
                setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
            }
            
            return data;
            
        } catch (error) {
            console.error(`API request failed ${endpoint}:`, error);
            
            // If it's an auth error, redirect to login
            if (error.message.includes('401') || error.message.includes('No authentication')) {
                console.log('Auth error, redirecting to login...');
                localStorage.setItem('justLoggedOut', 'true');
                window.location.href = 'index.html';
            }
            
            throw error;
        }
    }
    
    // User Profile
    async getUserProfile() {
        return this.request('/user/profile', { method: 'GET' });
    }
    
    async updateUserProfile(data) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // Tasks
    async claimTask(taskType) {
        return this.request('/tasks/claim', {
            method: 'POST',
            body: JSON.stringify({ taskType })
        });
    }
    
    // Trivia
    async submitTrivia(answers) {
        return this.request('/trivia/submit', {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    }
    
    // Withdrawals
    async requestWithdrawal(data) {
        return this.request('/withdrawals/request', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Activities
    async getActivities() {
        return this.request('/user/activities', { method: 'GET' });
    }
    
    // Referrals
    async getReferrals() {
        return this.request('/user/referrals', { method: 'GET' });
    }
    
    // Account Activation
    async activateAccount() {
        return this.request('/user/activate', { method: 'POST' });
    }
    
    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            return { status: 'offline', error: error.message };
        }
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }
}

// Create global instance
window.apiClient = new ApiClient();