// config.js - Ensure this exists
window.SUPABASE_CONFIG = {
    url: 'https://kwghulqonljulmvlcfnz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM',
    apiBase: ''
};

console.log('Configuration loaded:', window.SUPABASE_CONFIG.url ? '✓' : '✗');

// Admin Configuration
const ADMIN_CONFIG = {
    // Admin credentials (in production, use proper authentication)
    adminUsers: [
        {
            username: 'SKY ADMINISTRATOR',
            password: 'peronmsst', 
            role: 'superadmin',
            email: 'alphetech@gmail.com'
        },
    ],
    
    // Content categories
    categories: [
        'entertainment',
        'education',
        'gaming',
        'music',
        'sports',
        'lifestyle',
        'technology',
        'news'
    ],
    
    // Platforms
    platforms: [
        'youtube',
        'tiktok',
    ],
    
    // Default rewards
    defaultRewards: {
        youtube: 250,
        tiktok: 250,
        trivia: 200,
    },
    
    // API endpoints (if using server)
    apiEndpoints: {
        content: '/api/content',
        analytics: '/api/analytics',
        upload: '/api/upload'
    },
    
    // Feature flags
    features: {
        videoProcessing: true,
        autoFetchMetadata: true,
        bulkOperations: true,
        scheduling: true,
        analytics: true
    }
};

// Check if user is admin
function isAdmin() {
    const user = localStorage.getItem('skylink_user');
    if (!user) return false;
    
    try {
        const userData = JSON.parse(user);
        return userData.role === 'admin' || userData.role === 'superadmin';
    } catch (e) {
        return false;
    }
}

// Redirect to login if not admin
if (!isAdmin() && window.location.pathname.includes('admin-posting')) {
    window.location.href = 'dashboard.html';
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ADMIN_CONFIG, isAdmin };
}