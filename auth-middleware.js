// auth-middleware.js - SIMPLIFIED VERSION
(function() {
    console.log('Auth middleware starting...');
    
    // Simple check for required globals
    if (!window.supabase) {
        console.error('Supabase not available');
        showAuthError('Application not properly initialized. Please refresh.');
        return;
    }
    
    async function checkAuth() {
        try {
            console.log('Checking authentication status...');
            
            // Get current session
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.error('Session error:', error);
                handleNoSession();
                return;
            }
            
            if (!session) {
                console.log('No active session found');
                handleNoSession();
                return;
            }
            
            // We have a valid session
            console.log('User authenticated:', session.user.email);
            window.currentUser = session.user;
            
            // Setup auth listener
            setupAuthListener();
            
            // Load dashboard
            loadDashboard();
            
        } catch (error) {
            console.error('Auth check error:', error);
            handleNoSession();
        }
    }
    
    function handleNoSession() {
        console.log('Handling unauthenticated user...');
        
        // Check current page
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || 
                           currentPage === '/' || 
                           currentPage === '/index.html';
        
        // If not on login page and not a public page, redirect
        if (!isLoginPage) {
            console.log('Redirecting to login page...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            console.log('Already on login page');
        }
    }
    
    function setupAuthListener() {
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    // If on login page, redirect to dashboard
                    if (window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/') {
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 500);
                    }
                    break;
                    
                case 'SIGNED_OUT':
                    // Clear user data
                    delete window.currentUser;
                    
                    // Redirect to login if not already there
                    if (!window.location.pathname.includes('index.html') && 
                        window.location.pathname !== '/') {
                        localStorage.setItem('justLoggedOut', 'true');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 500);
                    }
                    break;
            }
        });
    }
    
    function loadDashboard() {
        console.log('Loading dashboard components...');
        
        // Load essential scripts
        const scripts = [
            { src: 'admin.js', name: 'Navigation' },
            { src: 'dashboard-core.js', name: 'Dashboard Core' },
            { src: 'dfb.js', name: 'Chatbot' }
        ];
        
        function loadNextScript(index) {
            if (index >= scripts.length) {
                console.log('All dashboard scripts loaded');
                return;
            }
            
            const scriptInfo = scripts[index];
            console.log(`Loading ${scriptInfo.name}...`);
            
            const script = document.createElement('script');
            script.src = scriptInfo.src;
            script.async = false;
            
            script.onload = function() {
                console.log(`✓ ${scriptInfo.name} loaded`);
                loadNextScript(index + 1);
            };
            
            script.onerror = function() {
                console.error(`✗ Failed to load ${scriptInfo.name}`);
                // Continue with next script even if this one fails
                loadNextScript(index + 1);
            };
            
            document.head.appendChild(script);
        }
        
        // Start loading scripts
        loadNextScript(0);
    }
    
    function showAuthError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 90%;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => errorDiv.remove(), 500);
        }, 5000);
    }
    
    // Start auth check
    checkAuth();
    
})();