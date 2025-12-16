// ========== GITHUB PAGES HASH ROUTER ==========

class GitHubPagesRouter {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.notFoundRoute = null;
        this.middlewares = [];
        
        // Bind methods
        this.navigate = this.navigate.bind(this);
        this.handleHashChange = this.handleHashChange.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', this.handleHashChange);
        
        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', this.handleHashChange);
        
        // Handle initial load
        window.addEventListener('DOMContentLoaded', () => {
            this.handleInitialRoute();
        });
        
        // Fallback for direct script inclusion
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.handleInitialRoute(), 0);
        }
    }
    
    // Register a route
    route(path, component, options = {}) {
        // Normalize path for GitHub Pages
        const normalizedPath = this.normalizePath(path);
        
        this.routes[normalizedPath] = {
            component,
            template: options.template,
            title: options.title || 'SkyLink',
            requireAuth: options.requireAuth || false,
            onEnter: options.onEnter,
            onLeave: options.onLeave,
            meta: options.meta || {}
        };
        
        return this; // For chaining
    }
    
    // Set 404 route
    setNotFound(component) {
        this.notFoundRoute = component;
        return this;
    }
    
    // Add middleware
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }
    
    // Navigate to a route
    navigate(path, options = {}) {
        const { replace = false, state = {} } = options;
        const normalizedPath = this.normalizePath(path);
        
        // Update URL
        if (replace) {
            window.location.replace(`#${normalizedPath}`);
        } else {
            window.location.hash = normalizedPath;
        }
        
        // Store state
        if (Object.keys(state).length > 0) {
            window.history.replaceState(state, '', window.location.href);
        }
        
        return this;
    }
    
    // Get current path
    getCurrentPath() {
        const hash = window.location.hash.substring(1);
        return hash || '/';
    }
    
    // Parse path parameters
    parseParams(routePath, currentPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const currentParts = currentPath.split('/');
        
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = currentParts[i] || null;
            }
        }
        
        return params;
    }
    
    // Match route
    matchRoute(path) {
        const cleanPath = path.replace(/\/$/, '') || '/';
        
        // Check exact matches first
        if (this.routes[cleanPath]) {
            return {
                route: this.routes[cleanPath],
                params: {},
                matchedPath: cleanPath
            };
        }
        
        // Check dynamic routes
        for (const routePath in this.routes) {
            const routeRegex = this.pathToRegex(routePath);
            const match = cleanPath.match(routeRegex);
            
            if (match) {
                const params = this.parseParams(routePath, cleanPath);
                return {
                    route: this.routes[routePath],
                    params,
                    matchedPath: routePath
                };
            }
        }
        
        return null;
    }
    
    // Convert path to regex
    pathToRegex(path) {
        const pattern = path
            .replace(/\/$/, '')
            .replace(/:(\w+)/g, '([^/]+)')
            .replace(/\*/g, '.*');
        
        return new RegExp(`^${pattern}$`);
    }
    
    // Handle hash change
    async handleHashChange(e) {
        const path = this.getCurrentPath();
        await this.resolveRoute(path);
    }
    
    // Handle initial route
    async handleInitialRoute() {
        const path = this.getCurrentPath();
        await this.resolveRoute(path);
    }
    
    // Resolve route
    async resolveRoute(path) {
        try {
            // Call leave hook for current route
            if (this.currentRoute && this.currentRoute.onLeave) {
                await this.currentRoute.onLeave();
            }
            
            // Find matching route
            const match = this.matchRoute(path);
            
            if (!match && this.notFoundRoute) {
                await this.renderNotFound();
                return;
            }
            
            if (!match) {
                console.warn(`No route found for: ${path}`);
                return;
            }
            
            // Apply middlewares
            for (const middleware of this.middlewares) {
                const shouldContinue = await middleware(match.route, match.params, path);
                if (shouldContinue === false) {
                    return; // Middleware blocked navigation
                }
            }
            
            // Check authentication if required
            if (match.route.requireAuth) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    this.navigate('/login');
                    return;
                }
            }
            
            // Call enter hook
            if (match.route.onEnter) {
                await match.route.onEnter(match.params);
            }
            
            // Update current route
            this.currentRoute = match.route;
            
            // Update page title
            document.title = match.route.title;
            
            // Render component
            await this.renderRoute(match);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Log route change
            console.log(`🔀 Route changed to: ${path}`);
            
        } catch (error) {
            console.error('Route resolution error:', error);
            await this.renderError(error);
        }
    }
    
    // Render route
    async renderRoute(match) {
        const { route, params } = match;
        const appContainer = document.getElementById('app');
        
        if (!appContainer) {
            console.error('App container not found');
            return;
        }
        
        // Show loading state
        appContainer.innerHTML = `
            <div class="route-loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        
        try {
            let content;
            
            if (typeof route.component === 'function') {
                // Component is a function
                content = await route.component(params);
            } else if (route.template) {
                // Use template
                content = route.template;
            } else if (typeof route.component === 'string') {
                // Component is HTML string
                content = route.component;
            } else {
                throw new Error('Invalid route component');
            }
            
            // Render content
            appContainer.innerHTML = content;
            
            // Initialize any scripts in the content
            this.initDynamicContent(appContainer);
            
        } catch (error) {
            throw error;
        }
    }
    
    // Render 404 page
    async renderNotFound() {
        const appContainer = document.getElementById('app');
        
        if (typeof this.notFoundRoute === 'function') {
            appContainer.innerHTML = await this.notFoundRoute();
        } else {
            appContainer.innerHTML = this.notFoundRoute || `
                <div class="not-found">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <button onclick="router.navigate('/')">Go Home</button>
                </div>
            `;
        }
        
        document.title = '404 - Page Not Found';
    }
    
    // Render error page
    async renderError(error) {
        const appContainer = document.getElementById('app');
        
        appContainer.innerHTML = `
            <div class="error-page">
                <h1>Something went wrong</h1>
                <p>${error.message}</p>
                <button onclick="router.navigate('/')">Go Home</button>
                <button onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        
        document.title = 'Error';
    }
    
    // Initialize dynamic content (event listeners, etc.)
    initDynamicContent(container) {
        // Initialize all buttons with data-navigate attribute
        const navButtons = container.querySelectorAll('[data-navigate]');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const path = button.getAttribute('data-navigate');
                this.navigate(path);
            });
        });
        
        // Initialize forms with data-action
        const forms = container.querySelectorAll('form[data-action]');
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const action = form.getAttribute('data-action');
                // Handle form submission
                // You can add your form handling logic here
            });
        });
        
        // Dispatch custom event for component initialization
        const event = new CustomEvent('route-rendered', {
            detail: { container }
        });
        document.dispatchEvent(event);
    }
    
    // Normalize path for GitHub Pages
    normalizePath(path) {
        // Ensure path starts with /
        let normalized = path.startsWith('/') ? path : `/${path}`;
        
        // Remove trailing slash (except for root)
        if (normalized !== '/' && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        
        // Clean up double slashes
        normalized = normalized.replace(/\/\/+/g, '/');
        
        return normalized;
    }
    
    // Go back
    back() {
        window.history.back();
    }
    
    // Go forward
    forward() {
        window.history.forward();
    }
    
    // Get query parameters
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        
        return result;
    }
    
    // Update query parameters without reloading
    updateQueryParams(newParams, options = {}) {
        const currentParams = this.getQueryParams();
        const mergedParams = { ...currentParams, ...newParams };
        
        // Remove null/undefined params
        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === null || mergedParams[key] === undefined) {
                delete mergedParams[key];
            }
        });
        
        const queryString = new URLSearchParams(mergedParams).toString();
        const hash = window.location.hash;
        const newUrl = queryString ? `?${queryString}${hash}` : hash;
        
        if (options.replace) {
            window.history.replaceState({}, '', newUrl);
        } else {
            window.history.pushState({}, '', newUrl);
        }
    }
}

// ========== ROUTER SETUP & CONFIGURATION ==========

// Create router instance
const router = new GitHubPagesRouter();

// Middleware example
router.use(async (route, params, path) => {
    console.log(`Middleware: Navigating to ${path}`);
    
    // Example: Track page views
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_path: path,
            page_title: route.title
        });
    }
    
    return true; // Continue navigation
});

// Route definitions
function defineRoutes() {
    // Home page
    router.route('/', async () => {
        return `
            <div class="home-page">
                <h1>Welcome to SkyLink</h1>
                <p>Start earning today with our referral program!</p>
                <a href="#/dashboard" data-navigate="/dashboard" class="btn">Go to Dashboard</a>
            </div>
        `;
    }, {
        title: 'SkyLink - Home',
        onEnter: () => {
            console.log('Entering home page');
        }
    });
    
    // Dashboard
    router.route('/dashboard', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return '<p>Loading...</p>';
        }
        
        return `
            <div class="dashboard">
                <h1>Dashboard</h1>
                <div class="stats">
                    <div class="stat-card">
                        <h3>Total Earnings</h3>
                        <p>$0.00</p>
                    </div>
                    <div class="stat-card">
                        <h3>Referrals</h3>
                        <p id="referralCount">0</p>
                    </div>
                </div>
                <div class="referral-section">
                    <h2>Your Referral Link</h2>
                    <div class="referral-link-container">
                        <input type="text" id="referralLink" readonly>
                        <button onclick="copyReferralLink()">Copy</button>
                    </div>
                    <div class="social-sharing" id="socialSharing"></div>
                </div>
            </div>
        `;
    }, {
        title: 'Dashboard - SkyLink',
        requireAuth: true,
        onEnter: async () => {
            // Initialize referral system
            if (window.ReferralSystem) {
                await window.ReferralSystem.updateReferralLink();
            }
        }
    });
    
    // Referral page
    router.route('/ref/:userId/:userName?', async (params) => {
        const { userId, userName } = params;
        
        // Track referral click
        if (window.ReferralSystem) {
            window.ReferralSystem.trackClick(userId, userName || 'Anonymous');
        }
        
        return `
            <div class="referral-landing">
                <h1>Welcome!</h1>
                <p>You were invited by ${userName || 'a friend'}</p>
                <p>Sign up to get your bonus!</p>
                <a href="#/register" data-navigate="/register" class="btn btn-primary">Join Now</a>
                <p class="terms">By joining, you agree to our Terms of Service</p>
            </div>
        `;
    }, {
        title: 'Referral Invitation - SkyLink',
        onEnter: (params) => {
            console.log('Referral link accessed:', params);
        }
    });
    
    // Registration page
    router.route('/register', async () => {
        return `
            <div class="register-page">
                <h1>Create Account</h1>
                <form id="registerForm">
                    <div id="referral-message" style="display: none;"></div>
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Password" required>
                    <input type="text" placeholder="Username" required>
                    <button type="submit">Sign Up</button>
                </form>
                <p>Already have an account? <a href="#/login" data-navigate="/login">Log In</a></p>
            </div>
        `;
    }, {
        title: 'Register - SkyLink',
        onEnter: async () => {
            // Handle referral registration
            if (window.ReferralSystem) {
                await window.ReferralSystem.handleRegistration();
            }
        }
    });
    
    // Login page
    router.route('/login', async () => {
        return `
            <div class="login-page">
                <h1>Login</h1>
                <form id="loginForm">
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Password" required>
                    <button type="submit">Log In</button>
                </form>
                <p>Don't have an account? <a href="#/register" data-navigate="/register">Sign Up</a></p>
            </div>
        `;
    }, {
        title: 'Login - SkyLink'
    });
    
    // Settings page
    router.route('/settings', async () => {
        return `
            <div class="settings-page">
                <h1>Settings</h1>
                <div class="settings-section">
                    <h3>Account Settings</h3>
                    <!-- Settings form -->
                </div>
            </div>
        `;
    }, {
        title: 'Settings - SkyLink',
        requireAuth: true
    });
    
    // 404 page
    router.setNotFound(async () => {
        return `
            <div class="not-found-page">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist or has been moved.</p>
                <a href="#/" data-navigate="/" class="btn">Go to Homepage</a>
            </div>
        `;
    });
}

// ========== APPLICATION SETUP ==========

// Initialize the application
async function initApp() {
    console.log('🚀 Initializing SkyLink Application...');
    
    // Define routes
    defineRoutes();
    
    // Initialize Supabase
    await initSupabase();
    
    // Initialize referral system
    if (window.ReferralSystem) {
        window.ReferralSystem.initialize();
    }
    
    // Setup event listeners
    setupGlobalEventListeners();
    
    // Handle GitHub Pages redirect
    handleGitHubPagesRedirect();
    
    console.log('✅ Application initialized');
}

// Initialize Supabase
async function initSupabase() {
    // Your Supabase initialization code here
    if (typeof supabase === 'undefined') {
        console.error('Supabase not loaded');
        return;
    }
    
    // Setup auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
            // Redirect to dashboard
            router.navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
            // Redirect to home
            router.navigate('/');
        }
    });
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Global click handler for navigation
    document.addEventListener('click', (e) => {
        // Handle links with href starting with #
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            const path = href.substring(1); // Remove #
            router.navigate(path);
        }
        
        // Handle buttons with data-action
        if (e.target.matches('[data-action]')) {
            const action = e.target.getAttribute('data-action');
            handleGlobalAction(action, e.target);
        }
    });
    
    // Global form handler
    document.addEventListener('submit', (e) => {
        if (e.target.matches('form')) {
            e.preventDefault();
            handleFormSubmit(e.target);
        }
    });
}

// Handle GitHub Pages redirect
function handleGitHubPagesRedirect() {
    // Check if we need to redirect from 404
    if (sessionStorage.redirect) {
        const redirectPath = sessionStorage.redirect;
        delete sessionStorage.redirect;
        router.navigate(redirectPath, { replace: true });
    }
}

// ========== GLOBAL ACTION HANDLERS ==========

function handleGlobalAction(action, element) {
    switch (action) {
        case 'logout':
            handleLogout();
            break;
        case 'back':
            router.back();
            break;
        case 'refresh':
            window.location.reload();
            break;
        case 'copy-referral':
            copyReferralLink();
            break;
        // Add more actions as needed
    }
}

async function handleLogout() {
    try {
        await supabase.auth.signOut();
        router.navigate('/');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    if (linkInput) {
        linkInput.select();
        document.execCommand('copy');
        showNotification('Link copied!');
    }
}

function showNotification(message, type = 'success') {
    // Your notification implementation
    console.log(message);
}

// ========== START THE APPLICATION ==========

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Make router globally available
window.router = router;