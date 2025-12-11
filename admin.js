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
    
    if (activateBtn) {
        activateBtn.addEventListener("click", function() {
            this.disabled = true;
            this.textContent = "Processing...";
            
            // Simulate activation process
            setTimeout(() => {
                this.textContent = "Account Activated!";
                this.style.background = "rgba(0, 255, 153, 0.3)";
                
                if (activationMess) {
                    activationMess.innerHTML += `
                    <p style="color: var(--green-main); font-weight: bold; margin-top: 15px;">
                        Account activated successfully! You can now access all features.
                    </p>`;
                }
            }, 1500);
        });
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
    
    // Mobile menu toggle - already handled in HTML inline script, but let's ensure it works
    if (hamburgerBtn && sideMenu && overlay) {
        hamburgerBtn.addEventListener('click', function() {
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
            if (overlay) overlay.style.display = 'none';
            if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        }
    }
    
    // Navigation click handler
    navLinks.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Special handling for logout
            if (this.id === 'logout') {
                return; // Already handled above
            }
            
            setActiveSection(sectionId);
        });
    });
    
    // Set default active section
    setActiveSection('dashboard');
    
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
    
    // Chat functionality
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (chatForm && chatInput && chatMessages) {
        // Add initial greeting
        addMessage('FarmBoy', 'Hello! I\'m FarmBoy, your AI assistant. How can I help you today?', 'bot');
        
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            
            if (message) {
                // Add user message
                addMessage('You', message, 'user');
                chatInput.value = '';
                
                // Simulate bot response after delay
                setTimeout(() => {
                    const responses = [
                        'I understand your question. Let me help you with that.',
                        'Thanks for your message! How else can I assist?',
                        'That\'s a great question! Let me think about the best way to help.',
                        'I\'m here to help you with any questions about the platform!',
                        'Would you like me to explain any feature in more detail?'
                    ];
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    addMessage('FarmBoy', randomResponse, 'bot');
                }, 1000);
            }
        });
        
        function addMessage(sender, text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.style.marginBottom = '10px';
            messageDiv.style.padding = '8px 12px';
            messageDiv.style.borderRadius = '10px';
            messageDiv.style.maxWidth = '80%';
            messageDiv.style.wordWrap = 'break-word';
            
            if (type === 'user') {
                messageDiv.style.backgroundColor = '#e3f2fd';
                messageDiv.style.marginLeft = 'auto';
                messageDiv.style.textAlign = 'right';
            } else {
                messageDiv.style.backgroundColor = '#f5f5f5';
                messageDiv.style.marginRight = 'auto';
            }
            
            messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
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