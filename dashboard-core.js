// dashboard-core.js
// Main dashboard functionality - data fetching and display

class DashboardCore {
    constructor() {
        this.supabase = window.supabaseClient;
        this.user = window.currentUser;
        this.earningsData = null;
        this.userProfile = null;
        this.paymentInfo = null;
        
        this.init();
    }
    
    async init() {
        if (!this.supabase || !this.user) {
            console.error('DashboardCore: Missing Supabase client or user');
            return;
        }
        
        console.log('DashboardCore initializing for user:', this.user.email);
        
        // Load all data
        await this.loadAllData();
        
        // Initialize UI components
        this.initUI();
        
        // Setup real-time updates
        this.setupRealtimeUpdates();
    }
    
    async loadAllData() {
        try {
            console.log('Loading dashboard data...');
            
            // Load data in parallel
            const [earnings, profile, payment, activities] = await Promise.all([
                this.loadEarnings(),
                this.loadUserProfile(),
                this.loadPaymentInfo(),
                this.loadRecentActivities()
            ]);
            
            this.earningsData = earnings;
            this.userProfile = profile;
            this.paymentInfo = payment;
            
            console.log('Data loaded successfully');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        }
    }
    
    async loadEarnings() {
        try {
            const { data, error } = await this.supabase
                .from('earnings')
                .select('*')
                .eq('id', this.user.id)
                .single();
            
            if (error) {
                // If no earnings record exists, create one
                if (error.code === 'PGRST116') {
                    console.log('Creating new earnings record...');
                    
                    const defaultEarnings = {
                        id: this.user.id,
                        youtube: 0,
                        tiktok: 0,
                        trivia: 0,
                        refferal: 0,
                        bonus: 0,
                        all_time_earn: 0,
                        total_withdrawn: 0
                    };
                    
                    const { data: newData, error: insertError } = await this.supabase
                        .from('earnings')
                        .insert(defaultEarnings)
                        .select()
                        .single();
                    
                    if (insertError) throw insertError;
                    return newData;
                }
                throw error;
            }
            
            return data;
            
        } catch (error) {
            console.error('Error loading earnings:', error);
            return null;
        }
    }
    
    async loadUserProfile() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email_address', this.user.email)
                .maybeSingle();
            
            if (error) {
                console.error('Error loading user profile:', error);
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }
    
    async loadPaymentInfo() {
        try {
            const { data, error } = await this.supabase
                .from('payment_information')
                .select('*')
                .eq('id', this.user.id)
                .maybeSingle();
            
            if (error) {
                console.error('Error loading payment info:', error);
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error('Error loading payment info:', error);
            return null;
        }
    }
    
    async loadRecentActivities() {
        try {
            // You would need an activities table for this
            // For now, return mock data or empty array
            return [];
            
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }
    
    initUI() {
        console.log('Initializing UI...');
        
        // Update user info
        this.updateUserInfo();
        
        // Update earnings stats
        this.updateEarningsStats();
        
        // Update referral link
        this.updateReferralLink();
        
        // Initialize event listeners
        this.initEventListeners();
        
        console.log('UI initialized');
    }
    
    updateUserInfo() {
        // Update username
        const usernameElements = document.querySelectorAll('#user_name');
        const username = this.userProfile?.user_name || 
                        this.user.user_metadata?.full_name || 
                        this.user.email?.split('@')[0] || 'User';
        
        usernameElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = username;
            } else {
                el.textContent = username;
            }
        });
        
        // Update email
        const emailElements = document.querySelectorAll('#email_address, .emailAdress');
        emailElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = this.user.email || '';
            } else {
                el.textContent = this.user.email || '';
            }
        });
        
        // Update phone
        const phoneElements = document.querySelectorAll('#phone_number, .phoneNumber');
        const phone = this.paymentInfo?.mobile_number || 'Not set';
        phoneElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = phone;
            } else {
                el.textContent = phone;
            }
        });
        
        // Update created at
        const createdAtElement = document.getElementById('createdAt');
        if (createdAtElement && this.userProfile?.created_at) {
            const date = new Date(this.userProfile.created_at);
            createdAtElement.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }
    }
    
    updateEarningsStats() {
        if (!this.earningsData) return;
        
        // Update all stat cards
        const stats = {
            'youtube': this.earningsData.youtube || 0,
            'tiktok': this.earningsData.tiktok || 0,
            'trivia': this.earningsData.trivia || 0,
            'refferal': this.earningsData.refferal || 0,
            'bonus': this.earningsData.bonus || 0,
            'total_income': this.earningsData.all_time_earn || 0,
            'total_withdrawn': this.earningsData.total_withdrawn || 0,
            'walletQash': (this.earningsData.all_time_earn || 0) - (this.earningsData.total_withdrawn || 0)
        };
        
        // Update each stat
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = typeof value === 'number' ? 
                    value.toLocaleString('en-US') : value;
            }
        });
    }
    
    updateReferralLink() {
        const linkInput = document.getElementById('link');
        if (linkInput && this.user) {
            const referralLink = `${window.location.origin}/ref/${this.user.id}`;
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
                        this.showNotification('Failed to copy link', 'error');
                    }
                });
            }
        }
    }
    
    initEventListeners() {
        // Task claim buttons
        this.initTaskClaims();
        
        // Settings save button
        this.initSettingsSave();
        
        // Withdrawal form
        this.initWithdrawalForm();
        
        // Export button
        this.initExportButton();
        
        // Refresh buttons
        this.initRefreshButtons();
    }
    
    initTaskClaims() {
        // TikTok claim
        const tiktokClaim = document.getElementById('claim');
        if (tiktokClaim) {
            tiktokClaim.addEventListener('click', () => this.handleTaskClaim('tiktok'));
        }
        
        // YouTube claim
        const youtubeClaim = document.getElementById('claimYoutube');
        if (youtubeClaim) {
            youtubeClaim.addEventListener('click', () => this.handleTaskClaim('youtube'));
        }
    }
    
    async handleTaskClaim(taskType) {
        if (!this.user || !this.earningsData) return;
        
        // Check cooldown
        const storageKey = `nextClaim_${taskType}_${this.user.id}`;
        const nextClaimTime = localStorage.getItem(storageKey);
        
        if (nextClaimTime && Date.now() < Number(nextClaimTime)) {
            this.showNotification(`Please wait before claiming ${taskType} reward again`, 'warning');
            return;
        }
        
        const claimButton = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (!claimButton) return;
        
        try {
            claimButton.disabled = true;
            claimButton.textContent = 'Processing...';
            
            const rewardAmount = 1000; // UGX 1000 per task
            const currentValue = this.earningsData[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const newTotal = (this.earningsData.all_time_earn || 0) + rewardAmount;
            
            // Update database
            const { error } = await this.supabase
                .from('earnings')
                .update({
                    [taskType]: newValue,
                    all_time_earn: newTotal
                })
                .eq('id', this.user.id);
            
            if (error) throw error;
            
            // Update users table
            await this.supabase
                .from('users')
                .update({ total_income: newTotal })
                .eq('id', this.user.id);
            
            // Set cooldown (48 hours)
            const nextClaim = Date.now() + (48 * 60 * 60 * 1000);
            localStorage.setItem(storageKey, nextClaim.toString());
            
            // Update local data
            this.earningsData[taskType] = newValue;
            this.earningsData.all_time_earn = newTotal;
            
            // Update UI
            this.updateEarningsStats();
            claimButton.textContent = 'Claimed!';
            claimButton.style.backgroundColor = '#95a5a6';
            
            this.showNotification(`Successfully claimed UGX ${rewardAmount} from ${taskType} task!`, 'success');
            
        } catch (error) {
            console.error('Claim error:', error);
            claimButton.disabled = false;
            claimButton.textContent = 'Claim Reward';
            this.showNotification('Error claiming reward. Please try again.', 'error');
        }
    }
    
    initSettingsSave() {
        const saveBtn = document.getElementById('saveSettings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', async () => {
            try {
                const email = document.getElementById('email_address')?.value;
                const phone = document.getElementById('phone_number')?.value;
                const username = document.getElementById('user_name')?.value;
                
                // Update auth user email if changed
                if (email && email !== this.user.email) {
                    const { error } = await this.supabase.auth.updateUser({
                        email: email
                    });
                    
                    if (error) throw error;
                }
                
                // Update users table
                const { error: userError } = await this.supabase
                    .from('users')
                    .update({
                        user_name: username,
                        email_address: email
                    })
                    .eq('id', this.user.id);
                
                if (userError) throw userError;
                
                // Update payment info
                const { error: paymentError } = await this.supabase
                    .from('payment_information')
                    .upsert({
                        id: this.user.id,
                        mobile_number: phone,
                        email: email
                    }, {
                        onConflict: 'id'
                    });
                
                if (paymentError) throw paymentError;
                
                this.showNotification('Settings saved successfully!', 'success');
                
            } catch (error) {
                console.error('Error saving settings:', error);
                this.showNotification('Error saving settings: ' + error.message, 'error');
            }
        });
    }
    
    initWithdrawalForm() {
        const form = document.getElementById('withdrawalForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.user || !this.earningsData) return;
            
            const amount = parseFloat(form.querySelector('input[type="number"]').value);
            const paymentMethod = form.querySelector('select').value;
            const accountDetails = document.getElementById('account_number').value;
            
            // Validate amount
            if (amount < 59000) {
                this.showNotification('Minimum withdrawal amount is UGX 59,000', 'warning');
                return;
            }
            
            const availableBalance = (this.earningsData.all_time_earn || 0) - (this.earningsData.total_withdrawn || 0);
            
            if (amount > availableBalance) {
                this.showNotification(`Insufficient balance. Available: UGX ${availableBalance.toLocaleString()}`, 'error');
                return;
            }
            
            try {
                // Create withdrawal request
                const { error } = await this.supabase
                    .from('withdrawal_requests')
                    .insert({
                        id: this.user.id,
                        amount: amount,
                        payment_method: paymentMethod,
                        phone_number: accountDetails,
                        email: this.user.email,
                        status: 'pending'
                    });
                
                if (error) throw error;
                
                // Update total withdrawn
                const newTotalWithdrawn = (this.earningsData.total_withdrawn || 0) + amount;
                
                await this.supabase
                    .from('earnings')
                    .update({ total_withdrawn: newTotalWithdrawn })
                    .eq('id', this.user.id);
                
                // Update local data
                this.earningsData.total_withdrawn = newTotalWithdrawn;
                
                // Update UI
                this.updateEarningsStats();
                form.reset();
                
                this.showNotification(`Withdrawal request submitted for UGX ${amount.toLocaleString()}.`, 'success');
                
            } catch (error) {
                console.error('Withdrawal error:', error);
                this.showNotification('Error submitting withdrawal request.', 'error');
            }
        });
    }
    
    initExportButton() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', () => {
            if (!this.earningsData) return;
            
            const csvData = [
                ['Category', 'Amount (UGX)'],
                ['YouTube Earnings', this.earningsData.youtube || 0],
                ['TikTok Earnings', this.earningsData.tiktok || 0],
                ['Trivia Earnings', this.earningsData.trivia || 0],
                ['Referral Earnings', this.earningsData.refferal || 0],
                ['Bonus Earnings', this.earningsData.bonus || 0],
                ['Total Earned', this.earningsData.all_time_earn || 0],
                ['Total Withdrawn', this.earningsData.total_withdrawn || 0],
                ['Available Balance', (this.earningsData.all_time_earn || 0) - (this.earningsData.total_withdrawn || 0)]
            ];
            
            const csv = csvData.map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `skylink_earnings_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Earnings data exported!', 'success');
        });
    }
    
    initRefreshButtons() {
        document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.textContent = 'Refreshing...';
                btn.disabled = true;
                
                // Reload data
                await this.loadAllData();
                this.updateEarningsStats();
                
                setTimeout(() => {
                    btn.textContent = btn.id.includes('tiktok') ? 'Refresh Tasks' : 
                                     btn.id.includes('youtube') ? 'Refresh Tasks' : 'Refresh';
                    btn.disabled = false;
                    this.showNotification('Content refreshed!', 'success');
                }, 1000);
            });
        });
    }
    
    setupRealtimeUpdates() {
        // Subscribe to earnings updates
        const earningsChannel = this.supabase
            .channel('earnings_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'earnings',
                    filter: `id=eq.${this.user.id}`
                },
                async () => {
                    console.log('Earnings updated, refreshing...');
                    const earnings = await this.loadEarnings();
                    if (earnings) {
                        this.earningsData = earnings;
                        this.updateEarningsStats();
                    }
                }
            )
            .subscribe();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (earningsChannel) {
                this.supabase.removeChannel(earningsChannel);
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #e74c3c;
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabaseClient && window.currentUser) {
        window.dashboard = new DashboardCore();
    }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);