// dashboard-core.js
// Main dashboard functionality

(function() {
    console.log('Dashboard core starting...');
    
    // Wait for user to be available
    function initDashboard() {
        if (!window.currentUser || !window.supabase) {
            console.log('Waiting for user data...');
            setTimeout(initDashboard, 100);
            return;
        }
        
        console.log('Initializing dashboard for:', window.currentUser.email);
        
        // Start data loading
        loadUserData();
    }
    
    async function loadUserData() {
        try {
            const user = window.currentUser;
            
            console.log('Loading user data for:', user.id);
            
            // Load multiple data sources in parallel
            const [userData, earningsData, paymentData] = await Promise.all([
                loadFromTable('users', 'email_address', user.email),
                loadFromTable('earnings', 'id', user.id),
                loadFromTable('payment_information', 'id', user.id)
            ]);
            
            console.log('Data loaded:', { userData, earningsData, paymentData });
            
            // Update UI
            updateUserInfo(userData, paymentData);
            updateEarnings(earningsData);
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup real-time updates
            setupRealtimeUpdates();
            
        } catch (error) {
            console.error('Error loading user data:', error);
            showNotification('Error loading dashboard data. Please refresh.', 'error');
        }
    }
    
    async function loadFromTable(tableName, column, value) {
        try {
            const { data, error } = await window.supabase
                .from(tableName)
                .select('*')
                .eq(column, value)
                .maybeSingle();
            
            if (error) {
                console.error(`Error loading ${tableName}:`, error);
                
                // If no earnings record exists, create it
                if (tableName === 'earnings' && error.code === 'PGRST116') {
                    console.log('Creating default earnings record...');
                    return await createDefaultEarnings();
                }
                
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error(`Exception loading ${tableName}:`, error);
            return null;
        }
    }
    
    async function createDefaultEarnings() {
        try {
            const user = window.currentUser;
            
            const defaultData = {
                id: user.id,
                youtube: 0,
                tiktok: 0,
                trivia: 0,
                refferal: 0,
                bonus: 0,
                all_time_earn: 0,
                total_withdrawn: 0
            };
            
            const { data, error } = await window.supabase
                .from('earnings')
                .insert(defaultData)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating earnings:', error);
                return defaultData;
            }
            
            return data;
            
        } catch (error) {
            console.error('Exception creating earnings:', error);
            return null;
        }
    }
    
    function updateUserInfo(userData, paymentData) {
        // Update username
        const username = userData?.user_name || 
                        window.currentUser.user_metadata?.full_name || 
                        window.currentUser.email?.split('@')[0] || 'User';
        
        document.querySelectorAll('#user_name').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = username;
            } else {
                el.textContent = username;
            }
        });
        
        // Update email
        document.querySelectorAll('#email_address, .emailAdress').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = window.currentUser.email || '';
            } else {
                el.textContent = window.currentUser.email || '';
            }
        });
        
        // Update phone
        const phone = paymentData?.mobile_number || 'Not set';
        document.querySelectorAll('#phone_number, .phoneNumber').forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = phone;
            } else {
                el.textContent = phone;
            }
        });
    }
    
    function updateEarnings(earningsData) {
        if (!earningsData) {
            console.log('No earnings data to display');
            return;
        }
        
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
    
    function setupEventListeners() {
        // Task claim buttons
        setupTaskClaims();
        
        // Settings save
        document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
        
        // Withdrawal form
        document.getElementById('withdrawalForm')?.addEventListener('submit', handleWithdrawal);
        
        // Export button
        document.getElementById('export-data')?.addEventListener('click', exportData);
    }
    
    function setupTaskClaims() {
        document.getElementById('claim')?.addEventListener('click', () => handleTaskClaim('tiktok'));
        document.getElementById('claimYoutube')?.addEventListener('click', () => handleTaskClaim('youtube'));
    }
    
    async function handleTaskClaim(taskType) {
        try {
            const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
            if (!button) return;
            
            // Disable button
            button.disabled = true;
            button.textContent = 'Processing...';
            
            // Reward amount
            const rewardAmount = 1000;
            
            // Get current earnings
            const { data: currentEarnings } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', window.currentUser.id)
                .single();
            
            // Calculate new values
            const currentTaskEarnings = currentEarnings[taskType] || 0;
            const newTaskEarnings = currentTaskEarnings + rewardAmount;
            const newTotal = (currentEarnings.all_time_earn || 0) + rewardAmount;
            
            // Update database
            const { error } = await window.supabase
                .from('earnings')
                .update({
                    [taskType]: newTaskEarnings,
                    all_time_earn: newTotal
                })
                .eq('id', window.currentUser.id);
            
            if (error) throw error;
            
            // Update UI
            document.getElementById(taskType).textContent = newTaskEarnings.toLocaleString();
            document.getElementById('total_income').textContent = newTotal.toLocaleString();
            
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showNotification(`Successfully claimed UGX ${rewardAmount}!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            showNotification('Error claiming reward. Please try again.', 'error');
            
            // Re-enable button
            const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
            if (button) {
                button.disabled = false;
                button.textContent = 'Claim Reward';
            }
        }
    }
    
    async function saveSettings() {
        try {
            const email = document.getElementById('email_address')?.value;
            const phone = document.getElementById('phone_number')?.value;
            const username = document.getElementById('user_name')?.value;
            
            if (!email) {
                showNotification('Email is required', 'error');
                return;
            }
            
            // Update user profile
            const { error } = await window.supabase
                .from('users')
                .update({
                    user_name: username,
                    email_address: email
                })
                .eq('email_address', window.currentUser.email);
            
            if (error) throw error;
            
            showNotification('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Save settings error:', error);
            showNotification('Error saving settings: ' + error.message, 'error');
        }
    }
    
    async function handleWithdrawal(e) {
        e.preventDefault();
        
        try {
            const amountInput = e.target.querySelector('input[type="number"]');
            const amount = parseFloat(amountInput.value);
            
            if (amount < 59000) {
                showNotification('Minimum withdrawal is UGX 59,000', 'warning');
                return;
            }
            
            // Get current balance
            const { data: earnings } = await window.supabase
                .from('earnings')
                .select('all_time_earn, total_withdrawn')
                .eq('id', window.currentUser.id)
                .single();
            
            const available = (earnings.all_time_earn || 0) - (earnings.total_withdrawn || 0);
            
            if (amount > available) {
                showNotification(`Insufficient balance. Available: UGX ${available.toLocaleString()}`, 'error');
                return;
            }
            
            // Create withdrawal request
            const { error } = await window.supabase
                .from('withdrawal_requests')
                .insert({
                    id: window.currentUser.id,
                    amount: amount,
                    payment_method: 'MTN Mobile Money',
                    phone_number: document.getElementById('account_number')?.value || '',
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
            
            // Update UI
            document.getElementById('withdrawn').textContent = newTotalWithdrawn.toLocaleString();
            document.getElementById('walletQash').textContent = (available - amount).toLocaleString();
            
            e.target.reset();
            
            showNotification(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showNotification('Error processing withdrawal', 'error');
        }
    }
    
    function exportData() {
        // Simple export functionality
        const data = {
            exportedAt: new Date().toISOString(),
            message: "Export functionality will be implemented"
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard-export.json';
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Data export started', 'success');
    }
    
    function setupRealtimeUpdates() {
        // Subscribe to earnings changes
        const channel = window.supabase
            .channel('earnings-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'earnings',
                    filter: `id=eq.${window.currentUser.id}`
                },
                async () => {
                    console.log('Earnings updated, refreshing...');
                    // Reload earnings data
                    const { data } = await window.supabase
                        .from('earnings')
                        .select('*')
                        .eq('id', window.currentUser.id)
                        .single();
                    
                    if (data) {
                        updateEarnings(data);
                    }
                }
            )
            .subscribe();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            window.supabase.removeChannel(channel);
        });
    }
    
    function showNotification(message, type = 'info') {
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
    
    // Start dashboard initialization
    initDashboard();
})();