// greenqash.js - FIXED VERSION (no syntax errors)
console.log('Loading greenqash.js...');

// Block auto-login if just logged out
if (localStorage.getItem('justLoggedOut') === 'true') {
    localStorage.removeItem('justLoggedOut');
    if (!window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Simple initialization function
    function initializeDashboard() {
        try {
            // Initialize greeting
            initializeGreeting();
            
            // Initialize navigation
            initializeNavigation();
            
            // Initialize tasks
            initializeTasks();
            
            // Initialize trivia
            initializeTrivia();
            
            // Initialize activation
            initializeActivation();
            
            // Initialize copy link
            initializeCopyLink();
            
            // Initialize chat
            initializeChat();
            
            // Initialize settings
            initializeSettings();
            
            // Initialize withdrawal
            initializeWithdrawal();
            
            // Initialize refresh buttons
            initializeRefreshButtons();
            
            // Initialize export button
            initializeExportButton();
            
            console.log('✓ Dashboard initialized');
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
        }
    }
    
    // Greeting function
    function initializeGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) {
            greeting = "Good Morning";
        } else if (hour < 16) {
            greeting = "Good Afternoon";
        } else {
            greeting = "Good Evening";
        }
        
        const greetingElement = document.getElementById("greetings");
        if (greetingElement) {
            greetingElement.textContent = greeting + "! ";
        }
    }
    
    // Navigation function
    function initializeNavigation() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sideMenu = document.getElementById('sideMenu');
        const overlay = document.querySelector('.overlay') || createOverlay();
        const menuItems = document.querySelectorAll('menu a[data-section]');
        const sections = document.querySelectorAll('.admin-section');
        
        // Create overlay if it doesn't exist
        function createOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: none;
                z-index: 998;
            `;
            document.body.appendChild(overlay);
            return overlay;
        }
        
        // Toggle mobile menu
        if (hamburgerBtn && sideMenu) {
            hamburgerBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                sideMenu.classList.toggle('active');
                overlay.style.display = sideMenu.classList.contains('active') ? 'block' : 'none';
                hamburgerBtn.classList.toggle('active');
            });
            
            // Close menu when clicking overlay
            overlay.addEventListener('click', function() {
                sideMenu.classList.remove('active');
                overlay.style.display = 'none';
                hamburgerBtn.classList.remove('active');
            });
        }
        
        // Set active section
        function setActiveSection(sectionId) {
            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const targetSection = document.getElementById(sectionId + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Update active menu item
            menuItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === sectionId) {
                    item.classList.add('active');
                }
            });
            
            // Close mobile menu if open
            if (sideMenu && sideMenu.classList.contains('active')) {
                sideMenu.classList.remove('active');
                overlay.style.display = 'none';
                if (hamburgerBtn) hamburgerBtn.classList.remove('active');
            }
        }
        
        // Navigation click handler
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                
                // Handle logout separately
                if (this.id === 'logout') {
                    handleLogout();
                    return;
                }
                
                setActiveSection(sectionId);
            });
        });
        
        // Logout handler
        function handleLogout() {
            localStorage.setItem('justLoggedOut', 'true');
            
            // Try to sign out from Supabase
            if (window.supabase && window.supabase.auth) {
                window.supabase.auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            } else {
                window.location.href = 'index.html';
            }
        }
        
        // Set default active section
        if (!document.querySelector('.admin-section.active')) {
            setActiveSection('dashboard');
        }
    }
    
    // Tasks function
    function initializeTasks() {
        // TikTok claim buttons
        document.querySelectorAll('#claim').forEach(btn => {
            btn.addEventListener('click', function() {
                handleTaskClaim(this, 'tiktok');
            });
        });
        
        // YouTube claim buttons
        document.querySelectorAll('#claimYoutube').forEach(btn => {
            btn.addEventListener('click', function() {
                handleTaskClaim(this, 'youtube');
            });
        });
    }
    
    // Handle task claim
    function handleTaskClaim(button, taskType) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Processing...';
        
        // Simulate API call
        setTimeout(() => {
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            // Show notification
            showSimpleNotification(`Successfully claimed UGX 1000 from ${taskType} task!`, 'success');
            
            // Re-enable after 5 seconds for demo
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 5000);
        }, 1500);
    }
    
    // Trivia function
    function initializeTrivia() {
        const quizForm = document.getElementById('quizForm');
        if (!quizForm) return;
        
        quizForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // Calculate score
            const correctAnswers = { q1: "c", q2: "b", q3: "c", q4: "b", q5: "b" };
            let score = 0;
            
            Object.keys(correctAnswers).forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                if (selected && selected.value === correctAnswers[q]) {
                    score++;
                }
            });
            
            // Simulate API call
            setTimeout(() => {
                const amountEarned = score >= 3 ? 1500 : score * 300;
                
                submitBtn.textContent = 'Submitted';
                submitBtn.style.backgroundColor = '#95a5a6';
                
                showSimpleNotification(
                    `You scored ${score}/5. You earned UGX ${amountEarned}!`,
                    'success'
                );
            }, 1500);
        });
    }
    
    // Activation function
    function initializeActivation() {
        const how2activate = document.getElementById('how2a');
        const activateBtn = document.getElementById('activate');
        const helpBtn = document.getElementById('helpbtn');
        
        if (how2activate) {
            how2activate.addEventListener('click', function() {
                const activationMess = document.getElementById('activationMess');
                if (!activationMess) return;
                
                const username = document.querySelector('#user_name')?.textContent || 'user';
                
                activationMess.innerHTML = `
                    <h3>MTN Mobile Money</h3>
                    <p>1. Dial *165#</p>
                    <p>2. Select Option 3 (Pay Bill)</p>
                    <p>3. Enter Business Number: 000000</p>
                    <p>4. Enter Amount: 20000</p>
                    <p>5. Enter Reference: ${username}</p>
                    <p>6. Confirm transaction</p>
                    <hr>
                    <h3>Airtel Money</h3>
                    <p>1. Dial *165#</p>
                    <p>2. Select Option 3 (Pay Bill)</p>
                    <p>3. Enter Business Number: 000000</p>
                    <p>4. Enter Amount: 20000</p>
                    <p>5. Enter Reference: ${username}</p>
                    <p>6. Confirm transaction</p>
                    <hr>
                    <p style="font-weight:bold;color:green">
                        After payment, click "Activate Account" to verify
                    </p>
                `;
                
                if (activateBtn) {
                    activateBtn.style.display = 'block';
                }
            });
        }
        
        if (activateBtn) {
            activateBtn.addEventListener('click', function() {
                this.disabled = true;
                this.textContent = 'Processing...';
                
                setTimeout(() => {
                    this.textContent = 'Account Activated!';
                    this.style.backgroundColor = 'rgba(0, 255, 153, 0.3)';
                    
                    showSimpleNotification('Account activated successfully!', 'success');
                }, 1500);
            });
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', function() {
                alert("Please contact support at admin@greenqash.com for assistance.");
            });
        }
    }
    
    // Copy link function
    function initializeCopyLink() {
        const copyBtn = document.getElementById('CopyLink');
        const linkInput = document.getElementById('link');
        
        if (copyBtn && linkInput) {
            copyBtn.addEventListener('click', function() {
                // Generate referral link
                const userId = localStorage.getItem('userId') || 'user123';
                const referralLink = `${window.location.origin}/ref/${userId}`;
                linkInput.value = referralLink;
                
                // Copy to clipboard
                linkInput.select();
                linkInput.setSelectionRange(0, 99999);
                
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    // Show visual feedback
                    this.textContent = 'Copied!';
                    this.classList.add('copied');
                    
                    // Show notification
                    const notification = document.getElementById('notification');
                    if (notification) {
                        notification.classList.add('show');
                        setTimeout(() => notification.classList.remove('show'), 2000);
                    }
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        this.textContent = 'Copy Link';
                        this.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
            });
        }
    }
    
    
    // Settings function
    function initializeSettings() {
        const saveBtn = document.getElementById('saveSettings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', function() {
            showSimpleNotification('Settings saved successfully!', 'success');
        });
    }
    
    // Withdrawal function
    function initializeWithdrawal() {
        const form = document.getElementById('withdrawalForm');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = parseFloat(this.querySelector('input[type="number"]').value);
            
            // Validation
            if (!amount || amount < 59000) {
                showSimpleNotification('Minimum withdrawal is UGX 59,000', 'error');
                return;
            }
            
            showSimpleNotification(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            this.reset();
        });
    }
    
    // Refresh buttons function
    function initializeRefreshButtons() {
        document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(btn => {
            btn.addEventListener('click', function() {
                const originalText = this.textContent;
                this.disabled = true;
                this.textContent = 'Refreshing...';
                
                setTimeout(() => {
                    this.disabled = false;
                    this.textContent = originalText;
                    showSimpleNotification('Content refreshed!', 'success');
                }, 1500);
            });
        });
    }
    
    // Export button function
    function initializeExportButton() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', function() {
            showSimpleNotification('Data exported successfully!', 'success');
        });
    }
    
    // Helper function for notifications
    function showSimpleNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.simple-notif').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `simple-notif ${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#2ecc71' : 
                             type === 'error' ? '#e74c3c' : 
                             type === 'warning' ? '#f39c12' : '#3498db'};
                color: white;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Initialize everything
    initializeDashboard();
    
    console.log('✓ greenqash.js loaded successfully');
});