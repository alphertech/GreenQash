// auth-middleware.js
// Handles authentication and redirects

(function() {
    console.log('Auth middleware starting...');
    
    // Wait for Supabase to be available
    function waitForSupabase(callback, maxAttempts = 30, interval = 100) {
        let attempts = 0;
        
        function check() {
            attempts++;
            
            if (window.supabase) {
                console.log('Supabase found after', attempts, 'attempts');
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, interval);
            } else {
                console.error('Supabase not found after max attempts');
                showError('Application initialization failed. Please refresh.');
                // Try to redirect to login after delay
                setTimeout(() => {
                    const isLoginPage = window.location.pathname.includes('index.html') || 
                                       window.location.pathname === '/' || 
                                       window.location.pathname === '/index.html';
                    
                    if (!isLoginPage) {
                        window.location.href = 'index.html';
                    }
                }, 2000);
            }
        }
        
        check();
    }
    
    waitForSupabase(async function() {
        try {
            console.log('Checking authentication...');
            
            // Get current session
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.error('Session error:', error);
                handleUnauthenticated();
                return;
            }
            
            console.log('Session check completed:', session ? 'Authenticated' : 'Not authenticated');
            
            if (!session) {
                console.log('No session found');
                handleUnauthenticated();
                return;
            }
            
            // User is authenticated
            console.log('User authenticated:', session.user.email);
            
            // Store user globally
            window.currentUser = session.user;
            
            // Setup auth state change listener
            setupAuthListener();
            
            // Load dashboard
            loadDashboard();
            
        } catch (error) {
            console.error('Auth check error:', error);
            handleUnauthenticated();
        }
    });
    
    function handleUnauthenticated() {
        console.log('Handling unauthenticated user...');
        
        // Check if we're on login page
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname === '/' || 
                           window.location.pathname === '/index.html' ||
                           window.location.pathname.includes('login');
        
        // Check if we're on a public page (like landing page)
        const isPublicPage = window.location.pathname.includes('landing') || 
                            window.location.pathname.includes('about') ||
                            window.location.pathname.includes('faq');
        
        if (!isLoginPage && !isPublicPage) {
            console.log('Redirecting to login...');
            
            // Add a small delay to ensure any UI updates complete
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            console.log('User is on public page, no redirect needed');
        }
    }
    
    function setupAuthListener() {
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    console.log('User signed in');
                    // If we're on login page, redirect to dashboard
                    if (window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '/index.html') {
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    }
                    break;
                    
                case 'SIGNED_OUT':
                    console.log('User signed out');
                    // Clear any stored data
                    localStorage.removeItem('supabase.auth.token');
                    localStorage.removeItem('supabase.auth.refresh');
                    
                    // Set logout flag
                    localStorage.setItem('justLoggedOut', 'true');
                    
                    // Redirect to login unless already there
                    if (!window.location.pathname.includes('index.html') && 
                        !window.location.pathname === '/' && 
                        !window.location.pathname === '/index.html') {
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 500);
                    }
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
    
    function loadDashboard() {
        console.log('Loading dashboard components...');
        
        // Load scripts in correct order
        const scripts = [
            'admin.js',          // Navigation
            'dashboard-core.js', // Main functionality
            'dfb.js'             // Chatbot
        ];
        
        // Load each script sequentially
        function loadScript(index) {
            if (index >= scripts.length) {
                console.log('All dashboard scripts loaded');
                return;
            }
            
            const script = document.createElement('script');
            script.src = scripts[index];
            script.async = false;
            
            script.onload = function() {
                console.log('Loaded:', scripts[index]);
                loadScript(index + 1);
            };
            
            script.onerror = function() {
                console.error('Failed to load:', scripts[index]);
                loadScript(index + 1); // Continue with next script
            };
            
            document.head.appendChild(script);
        }
        
        // Start loading scripts
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
            background-color: #e74c3c;
            color: white;
            text-align: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
})();