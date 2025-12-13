// auth-middleware.js
// This file handles authentication state and redirects before loading dashboard

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth middleware loading...');
    
    // Initialize Supabase
    let supabase;
    
    try {
        // Check if Supabase config is available
        if (window.SUPABASE_CONFIG) {
            supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
            console.log('✓ Supabase initialized from config.js');
        } else {
            // Fallback to hardcoded credentials (should be in config.js)
            supabase = window.supabase.createClient(
                "https://kwghulqonljulmvlcfnz.supabase.co",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM"
            );
            console.warn('⚠ Using fallback Supabase credentials');
        }
        
        // Check authentication state
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            redirectToLogin();
            return;
        }
        
        if (!session) {
            console.log('No active session found');
            redirectToLogin();
            return;
        }
        
        // User is authenticated
        console.log('User authenticated:', session.user.email);
        
        // Store supabase client globally for other scripts
        window.supabaseClient = supabase;
        window.currentUser = session.user;
        
        // Load dashboard scripts in correct order
        loadDashboardScripts();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        redirectToLogin();
    }
});

function redirectToLogin() {
    // Check if we're already on login page
    const isLoginPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '/index.html';
    
    if (!isLoginPage) {
        console.log('Redirecting to login page...');
        window.location.href = 'index.html';
    }
}

function loadDashboardScripts() {
    console.log('Loading dashboard scripts...');
    
    // Load scripts in the correct order
    const scripts = [
        'dfb.js',           // Chatbot
        'admin.js',         // Navigation
        'dashboard-core.js' // Main dashboard functionality (see below)
    ];
    
    // Create and load scripts dynamically
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
        console.log(`✓ Loaded: ${src}`);
    });
}

// Handle auth state changes
function setupAuthListeners(supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        switch (event) {
            case 'SIGNED_IN':
                console.log('User signed in:', session.user.email);
                window.location.reload();
                break;
                
            case 'SIGNED_OUT':
                console.log('User signed out');
                localStorage.setItem('justLoggedOut', 'true');
                window.location.href = 'index.html';
                break;
                
            case 'TOKEN_REFRESHED':
                console.log('Token refreshed');
                break;
                
            case 'USER_UPDATED':
                console.log('User updated');
                break;
        }
    });
}

// Export for debugging
window.authMiddleware = {
    checkAuth: async () => {
        const supabase = window.supabaseClient;
        if (!supabase) return false;
        
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },
    getCurrentUser: () => window.currentUser,
    signOut: async () => {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    }
};