// init-supabase.js - SIMPLE WORKING VERSION
(function() {
    console.log('🚀 Starting GreenQash...');
    
    // Wait for DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM ready, initializing...');
        initSupabase();
    });
    
    function initSupabase() {
        console.log('Initializing Supabase...');
        
        // Create script element
        const script = document.createElement('script');
        
        // Use THIS working CDN URL (confirmed working):
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/supabase.min.js';
        
        script.onload = function() {
            console.log('✓ Supabase loaded successfully');
            initializeApp();
        };
        
        script.onerror = function(e) {
            console.error('✗ Failed to load Supabase:', e);
            
            // Try alternative URL
            console.log('Trying alternative URL...');
            const altScript = document.createElement('script');
            altScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
            
            altScript.onload = function() {
                console.log('✓ Supabase loaded from alternative URL');
                initializeApp();
            };
            
            altScript.onerror = function() {
                console.error('✗ All CDNs failed');
                showError(`
                    <h3>⚠️ Network Issue Detected</h3>
                    <p>Unable to load required libraries. This could be due to:</p>
                    <ul>
                        <li>Internet connection problem</li>
                        <li>Firewall blocking CDN</li>
                        <li>Ad blocker interfering</li>
                    </ul>
                    <p><strong>Quick fix:</strong> Try refreshing the page or check your internet connection.</p>
                    <button onclick="location.reload()">🔄 Refresh Now</button>
                `);
            };
            
            document.head.appendChild(altScript);
        };
        
        document.head.appendChild(script);
    }
    
    function initializeApp() {
        console.log('Creating Supabase client...');
        
        // ALWAYS use these hardcoded values (no config.js dependency)
        const SUPABASE_URL = 'https://kwghulqonljulmvlcfnz.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
        
        try {
            // Create Supabase client
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            
            console.log('✓ Supabase client created');
            console.log('URL:', SUPABASE_URL);
            
            // Check if user is logged in
            checkAuth();
            
        } catch (error) {
            console.error('Error creating Supabase client:', error);
            showError('Failed to initialize database connection: ' + error.message);
        }
    }
    
    async function checkAuth() {
        try {
            console.log('Checking authentication...');
            
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.error('Auth error:', error);
                // Still continue, might be first visit
            }
            
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath === '/index.html';
            
            if (session) {
                console.log('✓ User authenticated:', session.user.email);
                window.currentUser = session.user;
                
                if (isLoginPage) {
                    // Already logged in, go to dashboard
                    console.log('Redirecting to dashboard...');
                    window.location.href = 'dashboard.html';
                    return;
                }
            } else {
                console.log('No active session found');
                
                if (!isLoginPage && !currentPath.includes('index.html')) {
                    // Not logged in and not on login page
                    console.log('Redirecting to login...');
                    window.location.href = 'index.html';
                    return;
                }
            }
            
            // Load appropriate page scripts
            if (isLoginPage) {
                loadLoginScripts();
            } else {
                loadDashboardScripts();
            }
            
        } catch (error) {
            console.error('Auth check failed:', error);
            
            // Still try to load the page
            if (window.location.pathname.includes('dashboard.html')) {
                loadDashboardScripts();
            }
        }
    }
    
    function loadLoginScripts() {
        console.log('Loading login scripts...');
        
        // Load login.js if exists
        const script = document.createElement('script');
        script.src = 'login.js';
        script.onerror = function() {
            console.log('login.js not found, continuing without it');
        };
        document.head.appendChild(script);
    }
    
    function loadDashboardScripts() {
        console.log('Loading dashboard scripts...');
        
        // Load scripts in order
        const scripts = [
            'admin.js',          // Navigation first
            'dashboard-core.js', // Main functionality
            'dfb.js'             // Chatbot last
        ];
        
        function loadScript(index) {
            if (index >= scripts.length) {
                console.log('✓ All dashboard scripts loaded');
                return;
            }
            
            const script = document.createElement('script');
            script.src = scripts[index];
            
            script.onload = function() {
                console.log('✓ Loaded:', scripts[index]);
                loadScript(index + 1);
            };
            
            script.onerror = function() {
                console.warn('⚠ Failed to load:', scripts[index]);
                loadScript(index + 1); // Continue anyway
            };
            
            document.head.appendChild(script);
        }
        
        loadScript(0);
    }
    
    function showError(message) {
        const errorDiv = document.createElement('div');
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
        `;
        errorDiv.innerHTML = message;
        
        document.body.appendChild(errorDiv);
    }
    
    // If DOM already loaded, run immediately
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        initSupabase();
    }
})();