// dashboard-core.js - SIMPLIFIED VERSION (No API dependency)
(function() {
    console.log('Dashboard core starting...');
    
    let currentUser = null;
    let userProfile = null;
    let earningsData = null;
    
    // Wait for everything to be ready
    function initDashboard() {
        console.log('Initializing dashboard...');
        
        // Check if we have Supabase
        if (!window.supabase) {
            console.log('Waiting for Supabase...');
            setTimeout(initDashboard, 500);
            return;
        }
        
        // Get current user
        window.supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error) {
                console.error('Error getting user:', error);
                return;
            }
            
            if (!user) {
                console.log('No user found, redirecting to login...');
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = user;
            console.log('User authenticated:', user.email);
            
            // Load user data
            loadUserData();
            
        }).catch(error => {
            console.error('Auth error:', error);
        });
    }
    
    async function loadUserData() {
        try {
            console.log('Loading user data...');
            
            // Load user profile
            const { data: profile, error: profileError } = await window.supabase
                .from('users')
                .select('*')
                .eq('email_address', currentUser.email)
                .maybeSingle();
            
            if (profileError) {
                console.error('Error loading profile:', profileError);
            }
            
            userProfile = profile;
            
            // Load earnings
            const { data: earnings, error: earningsError } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (earningsError) {
                console.error('Error loading earnings:', earningsError);
            }
            
            earningsData = earnings;
            
            console.log('Data loaded:', { userProfile, earningsData });
            
            // Update UI
            updateUI();
            
            // Setup event listeners
            setupEventListeners();
            
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('Error loading data. Please refresh.', 'error');
        }
    }
    
    function updateUI() {
        console.log('Updating UI...');
        
        // Update username
        const username = getUsername();
        document.querySelectorAll('#user_name').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = username;
            } else {
                el.textContent = username;
            }
        });
        
        // Update email
        const email = currentUser.email || '';
        document.querySelectorAll('#email_address, .emailAdress').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = email;
            } else {
                el.textContent = email;
            }
        });
        
        // Update greeting
        updateGreeting();
        
        // Update earnings
        if (earningsData) {
            updateEarnings();
        }
        
        // Update referral link
        updateReferralLink();
    }
    
    function getUsername() {
        if (userProfile?.user_name) return userProfile.user_name;
        if (currentUser.user_metadata?.full_name) return currentUser.user_metadata.full_name;
        if (currentUser.email) return currentUser.email.split('@')[0];
        return 'User';
    }
    
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 16) greeting = "Good Afternoon";
        else greeting = "Good Evening";
        
        const greetingElement = document.getElementById("greetings");
        if (greetingElement) {
            greetingElement.textContent = greeting + "! ";
        }
    }
    
    function updateEarnings() {
        const stats = {
            'youtube': earningsData.youtube || 0,
            'tiktok': earningsData.tiktok || 0,
            'trivia': earningsData.trivia || 0,
            'refferal': earningsData.refferal || 0,
            'bonus': earningsData.bonus || 0,
            'total_income': earningsData.all_time_earn || 0,
            'withdrawn': earningsData.total_withdrawn || 0,
            'walletQash': (earningsData.all_time_earn || 0) - (earningsData.total_withdrawn || 0)
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = typeof value === 'number' ? 
                    value.toLocaleString('en-US') : value;
            }
        });
    }
    
    function updateReferralLink() {
        const linkInput = document.getElementById('link');
        if (linkInput && currentUser) {
            const referralLink = `${window.location.origin}/ref/${currentUser.id}`;
            linkInput.value = referralLink;
            
            // Setup copy button
            const copyBtn = document.getElementById('CopyLink');
            if (copyBtn) {
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(referralLink);
                        
                        // Show notification
                        const notification = document.getElementById('notification');
                        if (notification) {
                            notification.classList.add('show');
                            setTimeout(() => notification.classList.remove('show'), 2000);
                        }
                        
                        // Visual feedback
                        copyBtn.textContent = 'Copied!';
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy Link';
                            copyBtn.classList.remove('copied');
                        }, 2000);
                        
                    } catch (err) {
                        console.error('Copy failed:', err);
                        showMessage('Failed to copy link', 'error');
                    }
                });
            }
        }
    }
    
    function setupEventListeners() {
        // Task claim buttons
        setupTaskClaims();
        
        // Settings save
        document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
        
        // Withdrawal form
        document.getElementById('withdrawalForm')?.addEventListener('submit', handleWithdrawal);
        
        // Trivia form
        document.getElementById('quizForm')?.addEventListener('submit', handleTrivia);
    }
    
    function setupTaskClaims() {
        document.getElementById('claim')?.addEventListener('click', () => handleTaskClaim('tiktok'));
        document.getElementById('claimYoutube')?.addEventListener('click', () => handleTaskClaim('youtube'));
    }
    
    async function handleTaskClaim(taskType) {
        if (!currentUser) {
            showMessage('Please login first', 'error');
            return;
        }
        
        const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (!button) return;
        
        try {
            button.disabled = true;
            button.textContent = 'Processing...';
            
            // Check cooldown
            const storageKey = `nextClaim_${taskType}_${currentUser.id}`;
            const nextClaimTime = localStorage.getItem(storageKey);
            
            if (nextClaimTime && Date.now() < Number(nextClaimTime)) {
                const remaining = Number(nextClaimTime) - Date.now();
                const hours = Math.ceil(remaining / (1000 * 60 * 60));
                showMessage(`Please wait ${hours} hours before claiming again`, 'warning');
                button.disabled = false;
                button.textContent = 'Claim Reward';
                return;
            }
            
            const rewardAmount = 1000;
            
            // Get current earnings or create default
            let currentEarnings = earningsData;
            if (!currentEarnings) {
                currentEarnings = {
                    id: currentUser.id,
                    youtube: 0,
                    tiktok: 0,
                    trivia: 0,
                    refferal: 0,
                    bonus: 0,
                    all_time_earn: 0,
                    total_withdrawn: 0
                };
            }
            
            // Calculate new values
            const currentValue = currentEarnings[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const newTotal = (currentEarnings.all_time_earn || 0) + rewardAmount;
            
            // Update earnings in database
            const { error } = await window.supabase
                .from('earnings')
                .upsert({
                    id: currentUser.id,
                    [taskType]: newValue,
                    all_time_earn: newTotal
                }, {
                    onConflict: 'id'
                });
            
            if (error) throw error;
            
            // Update local data
            earningsData = {
                ...earningsData,
                [taskType]: newValue,
                all_time_earn: newTotal
            };
            
            // Update UI
            updateEarnings();
            
            // Set cooldown (48 hours)
            const nextClaim = Date.now() + (48 * 60 * 60 * 1000);
            localStorage.setItem(storageKey, nextClaim.toString());
            
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showMessage(`Successfully claimed UGX ${rewardAmount}!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            button.disabled = false;
            button.textContent = 'Claim Reward';
            showMessage('Error claiming reward: ' + error.message, 'error');
        }
    }
    
    async function saveSettings() {
        if (!currentUser) {
            showMessage('Please login first', 'error');
            return;
        }
        
        const username = document.querySelector('#settings-section #user_name')?.value;
        const email = document.querySelector('#settings-section #email_address')?.value;
        const phone = document.querySelector('#settings-section #phone_number')?.value;
        
        if (!username || !email) {
            showMessage('Username and email are required', 'error');
            return;
        }
        
        try {
            // Update users table
            const { error: userError } = await window.supabase
                .from('users')
                .upsert({
                    uuid: currentUser.id,
                    user_name: username,
                    email_address: email
                }, {
                    onConflict: 'uuid'
                });
            
            if (userError) throw userError;
            
            // Update payment info
            const { error: paymentError } = await window.supabase
                .from('payment_information')
                .upsert({
                    id: currentUser.id,
                    mobile_number: phone,
                    email: email
                }, {
                    onConflict: 'id'
                });
            
            if (paymentError) throw paymentError;
            
            showMessage('Settings saved successfully!', 'success');
            
            // Reload data
            await loadUserData();
            
        } catch (error) {
            console.error('Save settings error:', error);
            showMessage('Error saving settings: ' + error.message, 'error');
        }
    }
    
    async function handleWithdrawal(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showMessage('Please login first', 'error');
            return;
        }
        
        const amount = parseFloat(e.target.querySelector('input[type="number"]').value);
        const paymentMethod = e.target.querySelector('select').value;
        const accountDetails = document.getElementById('account_number')?.value;
        
        // Validation
        if (!amount || amount < 59000) {
            showMessage('Minimum withdrawal is UGX 59,000', 'warning');
            return;
        }
        
        if (!accountDetails) {
            showMessage('Please enter account details', 'warning');
            return;
        }
        
        const available = (earningsData?.all_time_earn || 0) - (earningsData?.total_withdrawn || 0);
        
        if (amount > available) {
            showMessage(`Insufficient balance. Available: UGX ${available.toLocaleString()}`, 'error');
            return;
        }
        
        try {
            // Create withdrawal request
            const { error } = await window.supabase
                .from('withdrawal_requests')
                .insert({
                    id: currentUser.id,
                    amount: amount,
                    payment_method: paymentMethod,
                    phone_number: accountDetails,
                    email: currentUser.email,
                    status: 'pending'
                });
            
            if (error) throw error;
            
            // Update total withdrawn
            const newTotalWithdrawn = (earningsData?.total_withdrawn || 0) + amount;
            
            await window.supabase
                .from('earnings')
                .update({ total_withdrawn: newTotalWithdrawn })
                .eq('id', currentUser.id);
            
            // Update local data
            if (earningsData) {
                earningsData.total_withdrawn = newTotalWithdrawn;
            }
            
            // Update UI
            updateEarnings();
            e.target.reset();
            
            showMessage(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showMessage('Error processing withdrawal: ' + error.message, 'error');
        }
    }
    
    async function handleTrivia(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showMessage('Please login first', 'error');
            return;
        }
        
        // Check if already submitted today
        const lastTriviaKey = `lastTrivia_${currentUser.id}`;
        const lastTrivia = localStorage.getItem(lastTriviaKey);
        const today = new Date().toDateString();
        
        if (lastTrivia === today) {
            showMessage('You have already completed trivia today', 'warning');
            return;
        }
        
        // Calculate score
        const correctAnswers = {
            q1: 'c',
            q2: 'b', 
            q3: 'c',
            q4: 'b',
            q5: 'b'
        };
        
        let score = 0;
        Object.keys(correctAnswers).forEach(q => {
            const selected = document.querySelector(`input[name="${q}"]:checked`);
            if (selected && selected.value === correctAnswers[q]) {
                score++;
            }
        });
        
        // Calculate earnings
        const amountEarned = score >= 3 ? 1500 : score * 300;
        
        try {
            // Get current earnings
            let currentEarnings = earningsData;
            if (!currentEarnings) {
                currentEarnings = {
                    id: currentUser.id,
                    trivia: 0,
                    all_time_earn: 0
                };
            }
            
            const newTriviaValue = (currentEarnings.trivia || 0) + amountEarned;
            const newTotal = (currentEarnings.all_time_earn || 0) + amountEarned;
            
            // Update database
            const { error } = await window.supabase
                .from('earnings')
                .upsert({
                    id: currentUser.id,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                }, {
                    onConflict: 'id'
                });
            
            if (error) throw error;
            
            // Update local data
            earningsData = {
                ...earningsData,
                trivia: newTriviaValue,
                all_time_earn: newTotal
            };
            
            // Update UI
            updateEarnings();
            
            // Mark as completed for today
            localStorage.setItem(lastTriviaKey, today);
            
            // Disable form
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Completed Today';
            }
            
            showMessage(`Trivia completed! You earned UGX ${amountEarned}`, 'success');
            
        } catch (error) {
            console.error('Trivia error:', error);
            showMessage('Error saving trivia results: ' + error.message, 'error');
        }
    }
    
    function showMessage(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Start initialization
    setTimeout(initDashboard, 1000);
})();