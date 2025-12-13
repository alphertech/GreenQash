// init-supabase.js - FIXED VERSION
(function() {
    console.log('Starting application initialization...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        setTimeout(init, 100);
    }
    
    function init() {
        console.log('DOM ready, initializing Supabase...');
        loadSupabase();
    }
    
    // Function to try loading Supabase from multiple sources
    function loadSupabase() {
        console.log('Attempting to load Supabase...');
        
        const sources = [
            {
                name: 'CDN (Primary)',
                url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js',
                timeout: 5000
            },
            {
                name: 'Local',
                url: 'supabase-local.js',
                timeout: 3000
            }
        ];
        
        function trySource(index) {
            if (index >= sources.length) {
                // All sources failed
                console.error('All Supabase sources failed');
                showError('Failed to load required libraries. Please check your internet connection.');
                return;
            }
            
            const source = sources[index];
            console.log(`Trying source: ${source.name}`);
            
            const script = document.createElement('script');
            script.src = source.url;
            
            const timeoutId = setTimeout(() => {
                console.log(`Source ${source.name} timed out`);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                trySource(index + 1);
            }, source.timeout);
            
            script.onload = function() {
                clearTimeout(timeoutId);
                console.log(`Successfully loaded from ${source.name}`);
                
                // Check if supabase object is available
                setTimeout(() => {
                    if (typeof supabase === 'undefined') {
                        console.error('Supabase loaded but not defined');
                        trySource(index + 1);
                        return;
                    }
                    
                    // Success! Load config
                    loadConfig();
                }, 100);
            };
            
            script.onerror = function() {
                clearTimeout(timeoutId);
                console.log(`Failed to load from ${source.name}`);
                trySource(index + 1);
            };
            
            document.head.appendChild(script);
        }
        
        // Start with first source
        trySource(0);
    }
    
    function loadConfig() {
        console.log('Loading configuration...');
        
        // First try to load from config.js
        const configScript = document.createElement('script');
        configScript.src = 'config.js';
        
        configScript.onload = function() {
            console.log('Configuration loaded from config.js');
            
            // Check if config exists
            if (!window.SUPABASE_CONFIG) {
                console.warn('No SUPABASE_CONFIG found, using defaults');
                window.SUPABASE_CONFIG = getDefaultConfig();
            }
            
            initializeSupabaseClient();
        };
        
        configScript.onerror = function() {
            console.warn('config.js not found, using defaults');
            window.SUPABASE_CONFIG = getDefaultConfig();
            initializeSupabaseClient();
        };
        
        document.head.appendChild(configScript);
    }
    
    function getDefaultConfig() {
        return {
            url: 'https://kwghulqonljulmvlcfnz.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM',
            apiBase: ''
        };
    }
    
    function initializeSupabaseClient() {
        console.log('Initializing Supabase client...');
        
        try {
            // Create Supabase client
            window.supabase = supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );
            
            console.log('✓ Supabase client initialized successfully');
            
            // Load auth middleware
            setTimeout(loadAuthMiddleware, 100);
            
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            showError('Application initialization failed: ' + error.message);
        }
    }
    
    function loadAuthMiddleware() {
        console.log('Loading auth middleware...');
        
        const script = document.createElement('script');
        script.src = 'auth-middleware.js';
        
        script.onload = function() {
            console.log('✓ Auth middleware loaded');
        };
        
        script.onerror = function() {
            console.error('Failed to load auth middleware');
            showError('Critical error: Authentication system failed to load.');
        };
        
        document.head.appendChild(script);
    }
    
    function showError(message) {
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.id = 'app-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 15px;
            background: #e74c3c;
            color: white;
            text-align: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        errorDiv.innerHTML = `
            ${message}
            <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px; background: white; color: #e74c3c; border: none; border-radius: 3px; cursor: pointer;">
                Refresh
            </button>
        `;
        
        // Ensure document.body exists
        if (document.body) {
            document.body.appendChild(errorDiv);
        } else {
            // Wait for body to be available
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(errorDiv);
            });
        }
    }
})();