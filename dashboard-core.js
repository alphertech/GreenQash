// dashboard-core.js - SIMPLE WORKING VERSION
(function() {
    console.log('Dashboard core starting...');
    
    // Wait a bit for everything to initialize
    setTimeout(initDashboard, 500);
    
    async function initDashboard() {
        console.log('Initializing dashboard...');
        
        // Check if Supabase is available
        if (!window.supabase) {
            console.error('Supabase not available yet, waiting...');
            setTimeout(initDashboard, 500);
            return;
        }
        
        try {
            // Get current user
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error || !user) {
                console.error('No authenticated user:', error);
                window.location.href = 'index.html';
                return;
            }
            
            console.log('User found:', user.email);
            window.currentUser = user;
            
            // Load user data
            await loadUserData(user);
            
            // Setup UI
            setupUI();
            
            console.log('✓ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Dashboard init error:', error);
            showMessage('Error loading dashboard. Please refresh.', 'error');
        }
    }
    
    async function loadUserData(user) {
        console.log('Loading user data...');
        
        try {
            // Try to get user profile from database
            const { data: userData, error: userError } = await window.supabase
                .from('users')
                .select('*')
                .eq('email_address', user.email)
                .maybeSingle();
            
            if (userError) {
                console.error('Error loading user profile:', userError);
            }
            
            // Try to get earnings
            const { data: earningsData, error: earningsError } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            
            if (earningsError) {
                console.error('Error loading earnings:', earningsError);
            }
            
            // Store data globally
            window.userData = userData || {};
            window.earningsData = earningsData || {
                youtube: 0,
                tiktok: 0,
                trivia: 0,
                refferal: 0,
                bonus: 0,
                all_time_earn: 0,
                total_withdrawn: 0
            };
            
            console.log('User data loaded:', {
                profile: window.userData,
                earnings: window.earningsData
            });
            
        } catch (error) {
            console.error('Error in loadUserData:', error);
            // Use default data
            window.userData = {};
            window.earningsData = {
                youtube: 0,
                tiktok: 0,
                trivia: 0,
                refferal: 0,
                bonus: 0,
                all_time_earn: 0,
                total_withdrawn: 0
            };
        }
    }
    
    function setupUI() {
        console.log('Setting up UI...');
        
        // Update username everywhere
        updateUsername();
        
        // Update email
        updateEmail();
        
        // Update earnings/stats
        updateStats();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    function updateUsername() {
        const user = window.currentUser;
        const userData = window.userData;
        
        let username = 'User';
        if (userData.user_name) username = userData.user_name;
        else if (user.user_metadata?.full_name) username = user.user_metadata.full_name;
        else if (user.email) username = user.email.split('@')[0];
        
        console.log('Setting username to:', username);
        
        // Update all username elements
        document.querySelectorAll('#user_name').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = username;
            } else {
                el.textContent = username;
            }
        });
    }
    
    function updateEmail() {
        const email = window.currentUser.email || '';
        
        document.querySelectorAll('#email_address, .emailAdress').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = email;
            } else {
                el.textContent = email;
            }
        });
    }
    
    function updateStats() {
        const earnings = window.earningsData;
        
        if (!earnings) {
            console.log('No earnings data to display');
            return;
        }
        
        // Update all stat elements
        const stats = {
            'youtube': earnings.youtube || 0,
            'tiktok': earnings.tiktok || 0,
            'trivia': earnings.trivia || 0,
            'refferal': earnings.refferal || 0,
            'bonus': earnings.bonus || 0,
            'total_income': earnings.all_time_earn || 0,
            'withdrawn': earnings.total_withdrawn || 0,
            'walletQash': (earnings.all_time_earn || 0) - (earnings.total_withdrawn || 0)
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = typeof value === 'number' ? 
                    value.toLocaleString('en-US') : value;
            }
        });
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Task claims
        setupTaskClaims();
        
        // Settings save
        document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
        
        // Withdrawal form
        document.getElementById('withdrawalForm')?.addEventListener('submit', handleWithdrawal);
        
        // Trivia form
        document.getElementById('quizForm')?.addEventListener('submit', handleTrivia);
    }
    
    function setupTaskClaims() {
        // TikTok claim
        const tiktokBtn = document.getElementById('claim');
        if (tiktokBtn) {
            tiktokBtn.addEventListener('click', () => handleTaskClaim('tiktok'));
        }
        
        // YouTube claim
        const youtubeBtn = document.getElementById('claimYoutube');
        if (youtubeBtn) {
            youtubeBtn.addEventListener('click', () => handleTaskClaim('youtube'));
        }
    }
    
    async function handleTaskClaim(taskType) {
        console.log('Claiming task:', taskType);
        
        const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (!button) return;
        
        try {
            button.disabled = true;
            button.textContent = 'Processing...';
            
            const rewardAmount = 1000;
            const earnings = window.earningsData;
            
            // Calculate new values
            const currentValue = earnings[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const newTotal = (earnings.all_time_earn || 0) + rewardAmount;
            
            // Update database
            const { error } = await window.supabase
                .from('earnings')
                .upsert({
                    id: window.currentUser.id,
                    [taskType]: newValue,
                    all_time_earn: newTotal
                }, {
                    onConflict: 'id'
                });
            
            if (error) throw error;
            
            // Update local data
            earnings[taskType] = newValue;
            earnings.all_time_earn = newTotal;
            
            // Update UI
            updateStats();
            
            // Visual feedback
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showMessage(`Successfully claimed UGX ${rewardAmount}!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            button.disabled = false;
            button.textContent = 'Claim Reward';
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    async function saveSettings() {
        console.log('Saving settings...');
        
        const username = document.querySelector('#settings-section #user_name')?.value;
        const email = document.querySelector('#settings-section #email_address')?.value;
        const phone = document.querySelector('#settings-section #phone_number')?.value;
        
        if (!username || !email) {
            showMessage('Username and email are required', 'error');
            return;
        }
        
        try {
            // Update users table
            const { error } = await window.supabase
                .from('users')
                .upsert({
                    uuid: window.currentUser.id,
                    user_name: username,
                    email_address: email
                }, {
                    onConflict: 'uuid'
                });
            
            if (error) throw error;
            
            showMessage('Settings saved successfully!', 'success');
            
            // Update UI
            updateUsername();
            
        } catch (error) {
            console.error('Save settings error:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    async function handleWithdrawal(e) {
        e.preventDefault();
        
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
        
        const earnings = window.earningsData;
        const available = (earnings.all_time_earn || 0) - (earnings.total_withdrawn || 0);
        
        if (amount > available) {
            showMessage(`Insufficient balance. Available: UGX ${available.toLocaleString()}`, 'error');
            return;
        }
        
        try {
            // Create withdrawal request
            const { error } = await window.supabase
                .from('withdrawal_requests')
                .insert({
                    id: window.currentUser.id,
                    amount: amount,
                    payment_method: paymentMethod,
                    phone_number: accountDetails,
                    email: window.currentUser.email,
                    status: 'pending'
                });
            
            if (error) throw error;
            
            // Update total withdrawn
            const newTotalWithdrawn = (earnings.total_withdrawn || 0) + amount;
            
            await window.supabase
                .from('earnings')
                .update({ total_withdrawn: newTotalWithdrawn })
                .eq('id', window.currentUser.id);
            
            // Update local data
            earnings.total_withdrawn = newTotalWithdrawn;
            
            // Update UI
            updateStats();
            e.target.reset();
            
            showMessage(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    async function handleTrivia(e) {
        e.preventDefault();
        
        // Calculate score
        const correctAnswers = { q1: 'c', q2: 'b', q3: 'c', q4: 'b', q5: 'b' };
        let score = 0;
        
        Object.keys(correctAnswers).forEach(q => {
            const selected = document.querySelector(`input[name="${q}"]:checked`);
            if (selected && selected.value === correctAnswers[q]) {
                score++;
            }
        });
        
        const amountEarned = score >= 3 ? 1500 : score * 300;
        
        try {
            const earnings = window.earningsData;
            const newTriviaValue = (earnings.trivia || 0) + amountEarned;
            const newTotal = (earnings.all_time_earn || 0) + amountEarned;
            
            // Update database
            const { error } = await window.supabase
                .from('earnings')
                .upsert({
                    id: window.currentUser.id,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                }, {
                    onConflict: 'id'
                });
            
            if (error) throw error;
            
            // Update local data
            earnings.trivia = newTriviaValue;
            earnings.all_time_earn = newTotal;
            
            // Update UI
            updateStats();
            
            // Disable form
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Completed Today';
            }
            
            showMessage(`Trivia completed! You earned UGX ${amountEarned}`, 'success');
            
        } catch (error) {
            console.error('Trivia error:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    }
    
    function showMessage(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
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
})();