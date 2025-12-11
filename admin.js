// Block auto-login if just logged out
if (localStorage.getItem('justLoggedOut') === 'true') {
    localStorage.removeItem('justLoggedOut');
    if (window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Activation functionality
    const how2activate = document.getElementById("how2a");
    const activationMess = document.getElementById("activationMess");
    const activateBtn = document.getElementById("activate");
    
    if (how2activate) {
        how2activate.addEventListener("click", function() {
            const username = document.getElementById("user_name")?.textContent || "user";
            
            if (activationMess) {
                activationMess.innerHTML = `
                <h3>MTN Mobile Money</h3>
                <p>1. Dial *165#</p>
                <p>2. Select Option 3 (Pay Bill)</p>
                <p>3. Enter Business Number: 000000</p>
                <p>4. Enter Amount: 18000</p>
                <p>5. Enter Reference: ${username}</p>
                <p>6. Confirm transaction</p>
                <hr>
                <h3>Airtel Money</h3>
                <p>1. Dial *165#</p>
                <p>2. Select Option 3 (Pay Bill)</p>
                <p>3. Enter Business Number: 000000</p>
                <p>4. Enter Amount: 18000</p>
                <p>5. Enter Reference: ${username}</p>
                <p>6. Confirm transaction</p>
                <hr>
                <p style="font-weight:bold;color:var(--green-accent)">After payment, click "Activate Account" to verify</p>`;
            }
            
            if (activateBtn) {
                activateBtn.style.display = "block";
            }
        });
    }
    
    // Updated activation function - checks database status continuously
if (activateBtn) {
    let statusCheckInterval = null;
    
    activateBtn.addEventListener("click", async function() {
        // Get current user from Supabase auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            alert("You must be logged in to submit an activation request");
            return;
        }
        
        // Check current status in users table
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('status, user_name')
            .eq('email_address', user.email)
            .single();
        
        if (fetchError) {
            console.error("Error fetching user status:", fetchError);
            alert("Error checking account status. Please try again.");
            return;
        }
        
        // If already active, show message and disable button
        if (userData && userData.status === 'active') {
            this.disabled = true;
            this.textContent = "Already Activated";
            this.style.background = "rgba(0, 255, 153, 0.3)";
            
            if (activationMess) {
                activationMess.innerHTML = `
                    <p style="color: var(--green-main); font-weight: bold; margin-top: 15px;">
                        ✅ Your account is already activated!
                    </p>
                    <p style="color: #666; margin-top: 10px; font-size: 0.9rem;">
                        You have full access to all platform features.
                    </p>`;
            }
            return;
        }
        
        // If pending activation, show pending status and start checking
        if (userData && userData.status === 'pending') {
            showPendingStatus(user.email, userData.user_name);
            return;
        }
        
        // If not active, submit activation request
        this.disabled = true;
        this.textContent = "Submitting Request...";
        
        try {
            // Get username for reference
            const username = userData?.user_name || user.email.split('@')[0];
            
            // Submit activation request (set status to pending)
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    status: 'pending',
                    activation_requested_at: new Date().toISOString()
                })
                .eq('email_address', user.email);
            
            if (updateError) {
                throw updateError;
            }
            
            // Simulate request submission delay
            setTimeout(async () => {
                this.textContent = "Request Submitted";
                this.style.background = "rgba(255, 193, 7, 0.3)";
                
                // Show payment instructions with username as reference
                if (activationMess) {
                    activationMess.innerHTML = `
                        <div style="margin-top: 15px;">
                            <p style="color: #ff9800; font-weight: bold; font-size: 1.1rem;">
                                ⏳ Activation Request Submitted
                            </p>
                            
                            <div style="background: #fff8e1; border: 2px solid #ffd54f; 
                                        border-radius: 8px; padding: 15px; margin-top: 15px;">
                                <p style="color: #ff6f00; font-weight: bold; margin: 0 0 10px 0;">
                                    💳 Payment Instructions:
                                </p>
                                <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Amount:</strong> UGX 20,000
                                </p>
                                <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Reference:</strong> ${username}
                                </p>
                                <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Business No:</strong> 000000
                                </p>
                                <p style="color: #5d4037; margin: 5px 0 0 0; font-size: 0.85rem;">
                                    <em>After payment, admin will verify and activate your account</em>
                                </p>
                            </div>
                            
                            <div style="background: #e3f2fd; border: 1px solid #bbdefb; 
                                        border-radius: 5px; padding: 10px; margin-top: 15px;">
                                <p style="color: #1565c0; margin: 0 0 8px 0; font-size: 0.9rem;">
                                    <strong>📋 Request Status:</strong> 
                                    <span style="color: #ff9800; font-weight: bold;">PENDING PAYMENT VERIFICATION</span>
                                </p>
                                <p style="color: #1565c0; margin: 5px 0 0 0; font-size: 0.85rem;">
                                    <strong>⏳ Process:</strong> Admin will verify payment within 24 hours
                                </p>
                            </div>
                            
                            <p style="color: #666; margin-top: 15px; font-size: 0.9rem;">
                                <strong>Note:</strong> This page will automatically update when your 
                                account is activated. You can also refresh the page to check status.
                            </p>
                        </div>`;
                }
                
                // Start checking for status updates
                startStatusChecking(user.email, username);
                
            }, 1500);
            
        } catch (error) {
            console.error("Activation request error:", error);
            this.disabled = false;
            this.textContent = "Activate Account";
            this.style.background = "";
            
            if (activationMess) {
                activationMess.innerHTML += `
                    <p style="color: #dc3545; font-weight: bold; margin-top: 15px;">
                        ❌ Request failed. Please try again or contact support.
                    </p>`;
            }
        }
    });
    
    // Function to show pending status
    async function showPendingStatus(email, username) {
        activateBtn.disabled = true;
        activateBtn.textContent = "Pending Approval";
        activateBtn.style.background = "rgba(255, 193, 7, 0.3)";
        
        if (activationMess) {
            activationMess.innerHTML = `
                <div style="margin-top: 15px;">
                    <p style="color: #ff9800; font-weight: bold; font-size: 1.1rem;">
                        ⏳ Activation Pending
                    </p>
                    
                    <div style="background: #fff8e1; border: 2px solid #ffd54f; 
                                border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <p style="color: #ff6f00; font-weight: bold; margin: 0 0 10px 0;">
                            💳 Payment Verification:
                        </p>
                        <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                            <strong>Amount:</strong> UGX 20,000
                        </p>
                        <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                            <strong>Reference:</strong> ${username || 'Your Username'}
                        </p>
                        <p style="color: #5d4037; margin: 5px 0; font-size: 0.9rem;">
                            <strong>Business No:</strong> 000000
                        </p>
                    </div>
                    
                    <div style="background: #e3f2fd; border: 1px solid #bbdefb; 
                                border-radius: 5px; padding: 10px; margin-top: 15px;">
                        <p style="color: #1565c0; margin: 0 0 8px 0; font-size: 0.9rem;">
                            <strong>📋 Current Status:</strong> 
                            <span style="color: #ff9800; font-weight: bold;">AWAITING PAYMENT VERIFICATION</span>
                        </p>
                        <p style="color: #1565c0; margin: 5px 0 0 0; font-size: 0.85rem;">
                            <strong>⏳ Next Step:</strong> Admin is verifying your payment
                        </p>
                    </div>
                    
                    <p style="color: #666; margin-top: 15px; font-size: 0.9rem;">
                        <strong>Note:</strong> This page will automatically update when your 
                        account is activated. Status is checked every 30 seconds.
                    </p>
                </div>`;
        }
        
        // Start checking for status updates
        startStatusChecking(email, username);
    }
    
    // Function to start checking status periodically
    function startStatusChecking(email, username) {
        // Clear any existing interval
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        
        // Check status immediately
        checkStatusUpdate(email, username);
        
        // Then check every 30 seconds
        statusCheckInterval = setInterval(() => {
            checkStatusUpdate(email, username);
        }, 30000); // 30 seconds
        
        // Also check when user focuses the tab
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkStatusUpdate(email, username);
            }
        });
    }
    
    // Function to check for status updates
    async function checkStatusUpdate(email, username) {
        try {
            const { data: userData, error } = await supabase
                .from('users')
                .select('status')
                .eq('email_address', email)
                .single();
            
            if (error) {
                console.error("Error checking status update:", error);
                return;
            }
            
            if (userData && userData.status === 'active') {
                // Account is now active!
                clearInterval(statusCheckInterval);
                
                activateBtn.disabled = true;
                activateBtn.textContent = "✅ Activated!";
                activateBtn.style.background = "rgba(0, 255, 153, 0.3)";
                
                if (activationMess) {
                    activationMess.innerHTML = `
                        <div style="margin-top: 15px;">
                            <p style="color: var(--green-main); font-weight: bold; font-size: 1.2rem;">
                                🎉 Account Activated Successfully!
                            </p>
                            
                            <div style="background: #d4edda; border: 2px solid #c3e6cb; 
                                        border-radius: 8px; padding: 15px; margin-top: 15px;">
                                <p style="color: #155724; font-weight: bold; margin: 0 0 10px 0;">
                                    ✅ Payment Verified & Account Activated
                                </p>
                                <p style="color: #155724; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Username:</strong> ${username}
                                </p>
                                <p style="color: #155724; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACTIVE</span>
                                </p>
                                <p style="color: #155724; margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Activated On:</strong> ${new Date().toLocaleDateString()}
                                </p>
                            </div>
                            
                            <p style="color: #666; margin-top: 15px; font-size: 0.9rem;">
                                <strong>Welcome to GreenQash!</strong> You now have full access to all features:
                                TikTok tasks, YouTube tasks, Trivia, Referrals, and Withdrawals.
                            </p>
                            
                            <button onclick="location.reload()" 
                                    style="background: #28a745; color: white; border: none; 
                                           padding: 10px 20px; border-radius: 5px; 
                                           margin-top: 10px; cursor: pointer; font-weight: bold;">
                                🚀 Start Earning Now!
                            </button>
                        </div>`;
                }
                
                // Refresh page after 3 seconds to show updated features
                setTimeout(() => {
                    location.reload();
                }, 3000);
            }
            // If still pending, do nothing (continue showing pending status)
            
        } catch (error) {
            console.error("Status check error:", error);
        }
    }
    
    // Check initial status on page load
    async function checkInitialStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: userData } = await supabase
            .from('users')
            .select('status, user_name')
            .eq('email_address', user.email)
            .single();
        
        if (userData) {
            if (userData.status === 'active') {
                activateBtn.disabled = true;
                activateBtn.textContent = "✅ Activated";
                activateBtn.style.background = "rgba(0, 255, 153, 0.3)";
                
                if (activationMess) {
                    activationMess.innerHTML = `
                        <p style="color: var(--green-main); font-weight: bold; margin-top: 15px;">
                            ✅ Your account is already activated!
                        </p>`;
                }
                
                if (how2activate) {
                    how2activate.style.display = "none";
                }
            } else if (userData.status === 'pending') {
                showPendingStatus(user.email, userData.user_name);
            }
        }
    }
    
    // Run status check on page load
    checkInitialStatus();
}
    
    // Help button
    const helpBtn = document.getElementById("helpbtn");
    if (helpBtn) {
        helpBtn.addEventListener("click", function() {
            alert("Please contact support at admin@greenqash.com for assistance.");
        });
    }
    
    // DOM Elements for navigation
    const navLinks = document.querySelectorAll('menu a[data-section]');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const sections = document.querySelectorAll('.admin-section');
    const logoutBtn = document.getElementById('logout');
    const overlay = document.querySelector('.overlay');
    
    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.setItem('justLoggedOut', 'true');
            window.location.href = 'index.html';
        });
    }
    
    // Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements for navigation
    const navLinks = document.querySelectorAll('menu a[data-section]');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const sections = document.querySelectorAll('.admin-section');
    const overlay = document.querySelector('.overlay') || createOverlay();
    
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
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 999;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    // Mobile menu toggle
    if (hamburgerBtn && sideMenu) {
        // Remove any existing event listeners by cloning and replacing
        const newHamburgerBtn = hamburgerBtn.cloneNode(true);
        hamburgerBtn.parentNode.replaceChild(newHamburgerBtn, hamburgerBtn);
        
        const newSideMenu = sideMenu.cloneNode(true);
        sideMenu.parentNode.replaceChild(newSideMenu, sideMenu);
        
        // Get fresh references
        const freshHamburgerBtn = document.getElementById('hamburgerBtn');
        const freshSideMenu = document.getElementById('sideMenu');
        
        // Add click event to hamburger button
        freshHamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            freshSideMenu.classList.toggle('active');
            overlay.style.display = freshSideMenu.classList.contains('active') ? 'block' : 'none';
            freshHamburgerBtn.classList.toggle('active');
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', function() {
            freshSideMenu.classList.remove('active');
            overlay.style.display = 'none';
            freshHamburgerBtn.classList.remove('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (freshSideMenu.classList.contains('active') &&
                !freshSideMenu.contains(e.target) &&
                !freshHamburgerBtn.contains(e.target)) {
                freshSideMenu.classList.remove('active');
                overlay.style.display = 'none';
                freshHamburgerBtn.classList.remove('active');
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && freshSideMenu.classList.contains('active')) {
                freshSideMenu.classList.remove('active');
                overlay.style.display = 'none';
                freshHamburgerBtn.classList.remove('active');
            }
        });
    }
    
    // Set active section
    function setActiveSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update active menu item
        navLinks.forEach(item => {
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
    navLinks.forEach(item => {
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
    
    // Set default active section
    if (!document.querySelector('.admin-section.active')) {
        setActiveSection('dashboard');
    }
});
    // Copy link functionality
    const copyLinkBtn = document.getElementById('CopyLink');
    const linkInput = document.getElementById('link');
    const notification = document.getElementById('notification');
    
    if (copyLinkBtn && linkInput) {
        copyLinkBtn.addEventListener('click', function() {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    // Show notification
                    if (notification) {
                        notification.classList.add('show');
                        setTimeout(() => {
                            notification.classList.remove('show');
                        }, 2000);
                    }
                    
                    // Visual feedback on button
                    this.textContent = 'Copied!';
                    this.classList.add('copied');
                    setTimeout(() => {
                        this.textContent = 'Copy Link';
                        this.classList.remove('copied');
                    }, 2000);
                });
            } catch (err) {
                // Fallback for older browsers
                document.execCommand('copy');
                
                // Show notification
                if (notification) {
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 2000);
                }
                
                // Visual feedback on button
                this.textContent = 'Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = 'Copy Link';
                    this.classList.remove('copied');
                }, 2000);
            }
        });
    }
    
    // Quiz form submission
    const quizForm = document.getElementById('quizForm');
    if (quizForm) {
        quizForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const correctAnswers = {
                q1: 'c',
                q2: 'b',
                q3: 'c',
                q4: 'b',
                q5: 'b'
            };
            
            let score = 0;
            const totalQuestions = Object.keys(correctAnswers).length;
            
            // Check answers
            for (let question in correctAnswers) {
                const selected = this.querySelector(`input[name="${question}"]:checked`);
                if (selected && selected.value === correctAnswers[question]) {
                    score++;
                }
            }
            
            // Show result
            alert(`You scored ${score} out of ${totalQuestions}. ${score >= 3 ? 'Congratulations! You earned UGX 1500!' : 'Try again tomorrow!'}`);
        });
    }
    
    // Withdrawal form submission
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = this.querySelector('input[type="number"]').value;
            const method = this.querySelector('select').value;
            
            alert(`Withdrawal request submitted for UGX ${amount} via ${method}. Payment will be processed by 8pm EAT today.`);
            this.reset();
        });
    }
    
    // Settings form submission
    const settingsForm = document.getElementById('settings-form');
    const saveSettingsBtn = document.getElementById('saveSettings');
    
    if (saveSettingsBtn && settingsForm) {
        saveSettingsBtn.addEventListener('click', function() {
            const email = document.getElementById('email_address')?.value;
            const phone = document.getElementById('phone_number')?.value;
            
            alert('Settings saved successfully!');
            // Here you would typically send data to server
        });
    }
       
    // Task claim buttons
    document.querySelectorAll('#claim, #claimYoutube').forEach(button => {
        button.addEventListener('click', function() {
            const reward = this.closest('.vidSection').querySelector('h6').textContent.replace('Reward: ', '');
            alert(`Claimed ${reward}! Funds will be added to your account.`);
            this.disabled = true;
            this.textContent = 'Claimed';
            this.style.backgroundColor = '#95a5a6';
        });
    });
    
    // Refresh buttons
    document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(button => {
        button.addEventListener('click', function() {
            this.textContent = 'Refreshing...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = 'Refresh Tasks';
                this.disabled = false;
                alert('Content refreshed!');
            }, 1500);
        });
    });
    
    // Export data button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Data exported successfully! A CSV file will be downloaded.');
        });
    }
});