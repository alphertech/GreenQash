// init-supabase.js - UPDATED WITH FALLBACKS
(function() {
    console.log('Starting application initialization...');
    
    // Show loading state
    showLoading('Initializing application...');
    
    // Function to try loading Supabase from multiple sources
    function loadSupabase() {
        console.log('Attempting to load Supabase...');
        
        const sources = [
            {
                name: 'CDN (Primary)',
                url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js',
                timeout: 10000 // 10 seconds
            },
            {
                name: 'CDN (Backup)',
                url: 'https://unpkg.com/@supabase/supabase-js@2',
                timeout: 10000
            },
            {
                name: 'Local',
                url: 'supabase-local.js',
                timeout: 5000
            }
        ];
        
        function trySource(index) {
            if (index >= sources.length) {
                // All sources failed
                console.error('All Supabase sources failed');
                showError('Failed to load required libraries. Please check your internet connection and try again.');
                return;
            }
            
            const source = sources[index];
            console.log(`Trying source ${index + 1}: ${source.name}`);
            
            const script = document.createElement('script');
            script.src = source.url;
            script.async = false;
            
            const timeoutId = setTimeout(() => {
                console.log(`Source ${source.name} timed out`);
                document.head.removeChild(script);
                trySource(index + 1);
            }, source.timeout);
            
            script.onload = function() {
                clearTimeout(timeoutId);
                console.log(`Successfully loaded from ${source.name}`);
                
                // Check if supabase object is available
                if (typeof supabase === 'undefined') {
                    console.error('Supabase loaded but not defined');
                    trySource(index + 1);
                    return;
                }
                
                // Success! Load config
                loadConfig();
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
        updateLoading('Loading configuration...');
        
        const script = document.createElement('script');
        script.src = 'config.js';
        script.async = false;
        
        script.onload = function() {
            console.log('Configuration loaded');
            
            // Check if config exists
            if (!window.SUPABASE_CONFIG) {
                console.warn('No SUPABASE_CONFIG found, using defaults');
                window.SUPABASE_CONFIG = getDefaultConfig();
            }
            
            initializeSupabaseClient();
        };
        
        script.onerror = function() {
            console.warn('config.js not found, using defaults');
            window.SUPABASE_CONFIG = getDefaultConfig();
            initializeSupabaseClient();
        };
        
        document.head.appendChild(script);
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
        updateLoading('Initializing Supabase client...');
        
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
            
            console.log('Supabase client initialized successfully');
            
            // Load auth middleware
            loadAuthMiddleware();
            
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            showError('Application initialization failed: ' + error.message);
        }
    }
    
    function loadAuthMiddleware() {
        console.log('Loading auth middleware...');
        updateLoading('Loading authentication...');
        
        const script = document.createElement('script');
        script.src = 'auth-middleware.js';
        script.async = false;
        
        script.onload = function() {
            console.log('Auth middleware loaded');
            hideLoading();
        };
        
        script.onerror = function() {
            console.error('Failed to load auth middleware');
            showError('Critical error: Authentication system failed to load.');
        };
        
        document.head.appendChild(script);
    }
    
    function showLoading(message) {
        // Remove any existing loading overlay
        const existing = document.getElementById('app-loading');
        if (existing) existing.remove();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'app-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        loadingDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">SkyLink</div>
                <div style="margin-bottom: 30px; font-size: 14px; opacity: 0.9;">Loading your dashboard...</div>
                <div id="loading-message" style="margin-bottom: 20px; min-height: 20px;">${message}</div>
                <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 30px; font-size: 12px; opacity: 0.7;" id="loading-hint">Please wait while we set up your dashboard</div>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingDiv);
    }
    
    function updateLoading(message) {
        const messageEl = document.getElementById('loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
    
    function hideLoading() {
        const loading = document.getElementById('app-loading');
        if (loading) {
            loading.style.transition = 'opacity 0.5s ease';
            loading.style.opacity = '0';
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 500);
        }
    }
    
    function showError(message) {
        hideLoading();
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'app-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        errorDiv.innerHTML = `
            <div style="max-width: 500px; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <div style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2 style="color: #2c3e50; margin-bottom: 15px;">Application Error</h2>
                <p style="color: #7f8c8d; margin-bottom: 25px; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="retry-btn" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 500;">Retry</button>
                    <button id="home-btn" style="padding: 12px 24px; background: #ecf0f1; color: #2c3e50; border: none; border-radius: 5px; cursor: pointer; font-weight: 500;">Go Home</button>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #95a5a6;">
                    <p>If this problem persists, please:</p>
                    <ul style="text-align: left; padding-left: 20px; margin-top: 10px;">
                        <li>Check your internet connection</li>
                        <li>Disable ad-blockers for this site</li>
                        <li>Clear your browser cache</li>
                        <li>Contact support if needed</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Add event listeners
        document.getElementById('retry-btn').addEventListener('click', function() {
            errorDiv.remove();
            loadSupabase();
        });
        
        document.getElementById('home-btn').addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Start the loading process
    loadSupabase();
    
})();