// init-supabase.js
// Loads Supabase client and makes it available globally

(function() {
    console.log('Loading Supabase client...');
    
    // First, load Supabase from CDN
    const supabaseScript = document.createElement('script');
    supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js';
    supabaseScript.async = false;
    
    supabaseScript.onload = function() {
        console.log('Supabase JS loaded');
        
        // Now load config
        const configScript = document.createElement('script');
        configScript.src = 'config.js';
        configScript.async = false;
        
        configScript.onload = function() {
            console.log('Config loaded');
            initializeSupabase();
        };
        
        configScript.onerror = function() {
            console.warn('config.js not found, using defaults');
            window.SUPABASE_CONFIG = {
                url: 'https://kwghulqonljulmvlcfnz.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM'
            };
            initializeSupabase();
        };
        
        document.head.appendChild(configScript);
    };
    
    supabaseScript.onerror = function() {
        console.error('Failed to load Supabase from CDN');
        showError('Failed to load required libraries. Please refresh the page.');
    };
    
    document.head.appendChild(supabaseScript);
    
    function initializeSupabase() {
        try {
            // Create Supabase client
            window.supabase = supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            
            console.log('Supabase client initialized');
            
            // Now load auth middleware
            loadAuthMiddleware();
            
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            showError('Failed to initialize application. Please refresh.');
        }
    }
    
    function loadAuthMiddleware() {
        const script = document.createElement('script');
        script.src = 'auth-middleware.js';
        script.async = false;
        
        script.onload = function() {
            console.log('Auth middleware loaded');
        };
        
        script.onerror = function() {
            console.error('Failed to load auth middleware');
            showError('Application error. Please contact support.');
        };
        
        document.head.appendChild(script);
    }
    
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 20px;
            background-color: #e74c3c;
            color: white;
            text-align: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
})();