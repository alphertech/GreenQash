// admin.js - UPDATED VERSION

// Block auto-login if just logged out
if (localStorage.getItem('justLoggedOut') === 'true') {
    localStorage.removeItem('justLoggedOut');
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = 'index.html';
    }
}

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard navigation initialized');
    
    // Initialize navigation and section switching
    initializeNavigation();
    initializeMobileMenu();
});

// ==================== NAVIGATION & SECTION SWITCHING ====================
function initializeNavigation() {
    console.log('Setting up section navigation...');
    
    // Get navigation elements
    const navLinks = document.querySelectorAll('menu a[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const logoutBtn = document.getElementById('logout');
    
    // Remove any existing event listeners first
    navLinks.forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // Get fresh references
    const freshNavLinks = document.querySelectorAll('menu a[data-section]');
    
    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.setItem('justLoggedOut', 'true');
            
            // Try to sign out with Supabase if available
            if (window.supabase) {
                window.supabase.auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            } else {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Set active section function
    function setActiveSection(sectionId) {
        console.log('Switching to section:', sectionId);
        
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`Section ${sectionId} is now active`);
        } else {
            console.error(`Section ${sectionId}-section not found`);
        }
        
        // Update active menu item
        freshNavLinks.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Save to localStorage for persistence
        localStorage.setItem('activeSection', sectionId);
        
        // Update URL hash without page reload
        window.history.pushState(null, null, `#${sectionId}`);
        
        // Close mobile menu if open (check if function exists)
        if (typeof window.closeMobileMenu === 'function') {
            window.closeMobileMenu();
        }
    }
    
    // Navigation click handler
    freshNavLinks.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Skip logout button
            if (this.id === 'logout') {
                return;
            }
            
            setActiveSection(sectionId);
        });
    });
    
    // Check URL hash on page load
    function checkUrlHash() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(`${hash}-section`)) {
            setActiveSection(hash);
            return true;
        }
        return false;
    }
    
    // Check for saved active section or URL hash
    if (!checkUrlHash()) {
        const savedSection = localStorage.getItem('activeSection');
        if (savedSection && document.getElementById(`${savedSection}-section`)) {
            setActiveSection(savedSection);
        } else {
            // Set default active section
            setActiveSection('dashboard');
        }
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        checkUrlHash();
    });
}

// ==================== MOBILE MENU FUNCTIONS ====================
function initializeMobileMenu() {
    console.log('Setting up mobile menu...');
    
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    
    // Create overlay for mobile menu
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 999;
        `;
        document.body.appendChild(overlay);
    }
    
    // Remove existing hamburger event listeners by cloning
    if (hamburgerBtn) {
        const newHamburgerBtn = hamburgerBtn.cloneNode(true);
        hamburgerBtn.parentNode.replaceChild(newHamburgerBtn, hamburgerBtn);
    }
    
    // Get fresh references
    const freshHamburgerBtn = document.getElementById('hamburgerBtn');
    const freshSideMenu = document.getElementById('sideMenu');
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        if (freshSideMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
    
    function openMobileMenu() {
        freshSideMenu.classList.add('active');
        overlay.style.display = 'block';
        if (freshHamburgerBtn) freshHamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Define closeMobileMenu globally so other functions can call it
    window.closeMobileMenu = function() {
        freshSideMenu.classList.remove('active');
        overlay.style.display = 'none';
        if (freshHamburgerBtn) freshHamburgerBtn.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    };
    
    // Mobile menu toggle
    if (freshHamburgerBtn && freshSideMenu) {
        freshHamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', closeMobileMenu);
        
        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && 
                freshSideMenu.classList.contains('active') &&
                !freshSideMenu.contains(e.target) &&
                !freshHamburgerBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && freshSideMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        // Close menu when clicking on a nav link (on mobile)
        document.querySelectorAll('menu a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeMobileMenu();
                }
            });
        });
    }
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && freshSideMenu?.classList.contains('active')) {
                closeMobileMenu();
            }
        }, 250);
    });
}

// ==================== UTILITY FUNCTIONS ====================
// Add necessary styles for mobile menu
function addMobileMenuStyles() {
    if (!document.querySelector('#mobile-menu-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-menu-styles';
        style.textContent = `
            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                z-index: 999;
            }
            
            .hamburger {
                display: none;
                flex-direction: column;
                justify-content: space-between;
                width: 30px;
                height: 21px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
                z-index: 1000;
            }
            
            .hamburger span {
                width: 100%;
                height: 3px;
                background: white;
                border-radius: 3px;
                transition: all 0.3s ease;
            }
            
            .hamburger.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .hamburger.active span:nth-child(2) {
                opacity: 0;
            }
            
            .hamburger.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            @media (max-width: 768px) {
                .hamburger {
                    display: flex;
                }
                
                menu {
                    position: fixed;
                    top: 0;
                    left: -250px;
                    width: 250px;
                    height: 100vh;
                    background: var(--dark-color);
                    padding: 20px;
                    transition: left 0.3s ease;
                    z-index: 1000;
                    overflow-y: auto;
                }
                
                menu.active {
                    left: 0;
                }
                
                .admin-content {
                    margin-left: 0;
                }
                
                body.menu-open {
                    overflow: hidden;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize styles
addMobileMenuStyles();

// Export for debugging (optional)
window.dashboardNav = {
    switchSection: function(sectionId) {
        const link = document.querySelector(`a[data-section="${sectionId}"]`);
        if (link) link.click();
    },
    openMenu: function() {
        const btn = document.getElementById('hamburgerBtn');
        if (btn) btn.click();
    },
    closeMenu: window.closeMobileMenu
};

// Add to your existing dashboard.js
document.getElementById('admin-posting-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('skylink_user') || '{}');
    if (user.role === 'admin' || user.role === 'superadmin') {
        window.location.href = 'admin-posting.html';
    } else {
        alert('Access denied. Admin privileges required.');
    }
});