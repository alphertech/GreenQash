// dashboard-core.js - COMPLETE WORKING VERSION
(function() {
    console.log('Dashboard core starting...');
    
    let currentUser = null;
    let userProfile = null;
    let earningsData = null;
    let paymentInfo = null;
    
    // Wait for everything to be ready
    function initDashboard() {
        console.log('Initializing dashboard...');
        
        // Check if we have the required globals
        if (!window.supabase) {
            console.error('Supabase not available');
            setTimeout(initDashboard, 100);
            return;
        }
        
        // Get user from auth
        window.supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.log('No user found in auth');
                return;
            }
            
            currentUser = user;
            console.log('User found:', user.email);
            
            // Load all data
            loadAllData();
            
        }).catch(error => {
            console.error('Error getting user:', error);
        });
    }
    
    async function loadAllData() {
        try {
            console.log('Loading all user data...');
            
            // Load all data in parallel
            const [profile, earnings, payment, activities] = await Promise.all([
                loadUserProfile(),
                loadEarnings(),
                loadPaymentInfo(),
                loadRecentActivities()
            ]);
            
            userProfile = profile;
            earningsData = earnings;
            paymentInfo = payment;
            
            console.log('Data loaded:', {
                profile: userProfile,
                earnings: earningsData,
                payment: paymentInfo
            });
            
            // Update all UI elements
            updateAllUI();
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup real-time updates
            setupRealtimeUpdates();
            
        } catch (error) {
            console.error('Error loading all data:', error);
            showNotification('Error loading dashboard data', 'error');
        }
    }
    
    async function loadUserProfile() {
        try {
            console.log('Loading user profile...');
            
            // Try to find user by email in users table
            const { data, error } = await window.supabase
                .from('users')
                .select('*')
                .eq('email_address', currentUser.email)
                .maybeSingle();
            
            if (error) {
                console.error('Error loading profile:', error);
                
                // If user doesn't exist in users table, create them
                if (error.code === 'PGRST116') {
                    console.log('Creating new user profile...');
                    return await createUserProfile();
                }
                
                return null;
            }
            
            console.log('User profile loaded:', data);
            return data;
            
        } catch (error) {
            console.error('Exception loading profile:', error);
            return null;
        }
    }
    
    async function createUserProfile() {
        try {
            const newUser = {
                uuid: currentUser.id,
                user_name: currentUser.user_metadata?.full_name || 
                          currentUser.email?.split('@')[0] || 'User',
                email_address: currentUser.email,
                status: 'pending',
                rank: 'user',
                total_income: 0,
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await window.supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating profile:', error);
                return newUser; // Return the local object
            }
            
            return data;
            
        } catch (error) {
            console.error('Exception creating profile:', error);
            return null;
        }
    }
    
    async function loadEarnings() {
        try {
            console.log('Loading earnings...');
            
            const { data, error } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (error) {
                console.error('Error loading earnings:', error);
                
                // Create default earnings if not exists
                if (error.code === 'PGRST116') {
                    console.log('Creating default earnings...');
                    return await createDefaultEarnings();
                }
                
                return null;
            }
            
            console.log('Earnings loaded:', data);
            return data;
            
        } catch (error) {
            console.error('Exception loading earnings:', error);
            return null;
        }
    }
    
    async function createDefaultEarnings() {
        try {
            const defaultEarnings = {
                id: currentUser.id,
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
                .insert(defaultEarnings)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating earnings:', error);
                return defaultEarnings;
            }
            
            return data;
            
        } catch (error) {
            console.error('Exception creating earnings:', error);
            return null;
        }
    }
    
    async function loadPaymentInfo() {
        try {
            console.log('Loading payment info...');
            
            const { data, error } = await window.supabase
                .from('payment_information')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (error) {
                console.error('Error loading payment info:', error);
                return null;
            }
            
            console.log('Payment info loaded:', data);
            return data;
            
        } catch (error) {
            console.error('Exception loading payment info:', error);
            return null;
        }
    }
    
    async function loadRecentActivities() {
        try {
            // This would come from an activities table
            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }
    
    function updateAllUI() {
        console.log('Updating all UI elements...');
        
        // 1. Update user information
        updateUserInfo();
        
        // 2. Update earnings/stats
        updateEarningsStats();
        
        // 3. Update referral link
        updateReferralLink();
        
        // 4. Update profile section
        updateProfileSection();
        
        // 5. Update settings section
        updateSettingsSection();
        
        console.log('UI update complete');
    }
    
    function updateUserInfo() {
        console.log('Updating user info...');
        
        // Get username from database or auth
        const username = userProfile?.user_name || 
                        currentUser.user_metadata?.full_name || 
                        currentUser.email?.split('@')[0] || 'User';
        
        console.log('Setting username to:', username);
        
        // Update ALL username elements
        document.querySelectorAll('#user_name').forEach((element, index) => {
            console.log(`Updating user_name element ${index}:`, element.tagName);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = username;
            } else {
                element.textContent = username;
            }
        });
        
        // Update email elements
        const email = currentUser.email || '';
        document.querySelectorAll('#email_address, .emailAdress').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = email;
            } else {
                element.textContent = email;
            }
        });
        
        // Update greeting
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 16) greeting = "Good Afternoon";
        else greeting = "Good Evening";
        
        const greetingElement = document.getElementById("greetings");
        if (greetingElement) {
            greetingElement.textContent = greeting + "! ";
        }
        
        // Update user status/rank if available
        if (userProfile) {
            const statusElement = document.getElementById('status');
            const rankElement = document.getElementById('rank');
            
            if (statusElement && userProfile.status) {
                statusElement.textContent = userProfile.status;
            }
            
            if (rankElement && userProfile.rank) {
                rankElement.textContent = userProfile.rank;
            }
        }
    }
    
    function updateEarningsStats() {
        if (!earningsData) {
            console.log('No earnings data to display');
            return;
        }
        
        console.log('Updating earnings stats:', earningsData);
        
        // Map of element IDs to data properties
        const statMap = {
            'youtube': earningsData.youtube || 0,
            'tiktok': earningsData.tiktok || 0,
            'trivia': earningsData.trivia || 0,
            'refferal': earningsData.refferal || 0,
            'bonus': earningsData.bonus || 0,
            'total_income': earningsData.all_time_earn || 0,
            'withdrawn': earningsData.total_withdrawn || 0,
            'walletQash': (earningsData.all_time_earn || 0) - (earningsData.total_withdrawn || 0)
        };
        
        // Update each stat
        Object.entries(statMap).forEach(([elementId, value]) => {
            const elements = document.querySelectorAll(`#${elementId}`);
            
            elements.forEach(element => {
                if (element) {
                    element.textContent = typeof value === 'number' ? 
                        value.toLocaleString('en-US') : value;
                    console.log(`Updated ${elementId}: ${value}`);
                }
            });
        });
        
        // Also update total income in profile section
        document.querySelectorAll('#totalCash, #total_income').forEach(element => {
            if (element) {
                element.textContent = (earningsData.all_time_earn || 0).toLocaleString('en-US');
            }
        });
    }
    
    function updateReferralLink() {
        const linkInput = document.getElementById('link');
        if (linkInput && currentUser) {
            const referralLink = `${window.location.origin}/ref/${currentUser.id}`;
            linkInput.value = referralLink;
            
            console.log('Referral link set:', referralLink);
            
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
                        
                        console.log('Link copied to clipboard');
                        
                    } catch (err) {
                        console.error('Copy failed:', err);
                        showNotification('Failed to copy link', 'error');
                    }
                });
            }
        }
    }
    
    function updateProfileSection() {
        console.log('Updating profile section...');
        
        // Update username in profile section (again for safety)
        const username = userProfile?.user_name || 
                        currentUser.user_metadata?.full_name || 
                        currentUser.email?.split('@')[0] || 'User';
        
        document.querySelectorAll('#profile-section #user_name, .profile-username').forEach(element => {
            element.textContent = username;
        });
        
        // Update email in profile
        const email = currentUser.email || '';
        document.querySelectorAll('.profile-email, #profile-section .emailAdress').forEach(element => {
            element.textContent = email;
        });
        
        // Update phone in profile
        const phone = paymentInfo?.mobile_number || 'Not set';
        document.querySelectorAll('.profile-phone, #profile-section .phoneNumber').forEach(element => {
            element.textContent = phone;
        });
        
        // Update created at date
        const createdAtElement = document.getElementById('createdAt');
        if (createdAtElement && userProfile?.created_at) {
            const date = new Date(userProfile.created_at);
            createdAtElement.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }
        
        // Update payment method
        const paymentMethodElement = document.getElementById('payment_method');
        if (paymentMethodElement && paymentInfo) {
            let methodText = 'Not set';
            if (paymentInfo.payment_method && paymentInfo.email) {
                methodText = `${paymentInfo.payment_method} (${paymentInfo.email})`;
            } else if (paymentInfo.payment_method) {
                methodText = paymentInfo.payment_method;
            } else if (paymentInfo.email) {
                methodText = `Email: ${paymentInfo.email}`;
            }
            paymentMethodElement.textContent = methodText;
        }
    }
    
    function updateSettingsSection() {
        console.log('Updating settings section...');
        
        // Populate settings form with current data
        const usernameInput = document.querySelector('#settings-section #user_name');
        const emailInput = document.querySelector('#settings-section #email_address');
        const phoneInput = document.querySelector('#settings-section #phone_number');
        
        if (usernameInput) {
            usernameInput.value = userProfile?.user_name || 
                                 currentUser.user_metadata?.full_name || 
                                 currentUser.email?.split('@')[0] || '';
        }
        
        if (emailInput) {
            emailInput.value = currentUser.email || '';
        }
        
        if (phoneInput) {
            phoneInput.value = paymentInfo?.mobile_number || '';
        }
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Task claim buttons
        setupTaskClaims();
        
        // Settings save
        setupSettingsSave();
        
        // Withdrawal form
        setupWithdrawalForm();
        
        // Export button
        setupExportButton();
        
        // Refresh buttons
        setupRefreshButtons();
        
        // Trivia form
        setupTriviaForm();
        
        // Activation
        setupActivation();
    }
    
    function setupTaskClaims() {
        // TikTok claim
        const tiktokClaim = document.getElementById('claim');
        if (tiktokClaim) {
            tiktokClaim.addEventListener('click', () => handleTaskClaim('tiktok'));
        }
        
        // YouTube claim
        const youtubeClaim = document.getElementById('claimYoutube');
        if (youtubeClaim) {
            youtubeClaim.addEventListener('click', () => handleTaskClaim('youtube'));
        }
    }
    
    async function handleTaskClaim(taskType) {
        if (!currentUser || !earningsData) {
            showNotification('Please wait for data to load', 'warning');
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
                showNotification(`Please wait ${hours} hours before claiming again`, 'warning');
                button.disabled = false;
                button.textContent = 'Claim Reward';
                return;
            }
            
            const rewardAmount = 1000;
            const currentValue = earningsData[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const newTotal = (earningsData.all_time_earn || 0) + rewardAmount;
            
            // Update database
            const { error } = await window.supabase
                .from('earnings')
                .update({
                    [taskType]: newValue,
                    all_time_earn: newTotal
                })
                .eq('id', currentUser.id);
            
            if (error) throw error;
            
            // Update users table
            await window.supabase
                .from('users')
                .update({ total_income: newTotal })
                .eq('id', currentUser.id);
            
            // Update local data
            earningsData[taskType] = newValue;
            earningsData.all_time_earn = newTotal;
            
            // Update UI
            updateEarningsStats();
            
            // Set cooldown (48 hours)
            const nextClaim = Date.now() + (48 * 60 * 60 * 1000);
            localStorage.setItem(storageKey, nextClaim.toString());
            
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showNotification(`Successfully claimed UGX ${rewardAmount} from ${taskType} task!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            button.disabled = false;
            button.textContent = 'Claim Reward';
            showNotification('Error claiming reward: ' + error.message, 'error');
        }
    }
    
    function setupSettingsSave() {
        const saveBtn = document.getElementById('saveSettings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', async () => {
            try {
                const username = document.querySelector('#settings-section #user_name')?.value;
                const email = document.querySelector('#settings-section #email_address')?.value;
                const phone = document.querySelector('#settings-section #phone_number')?.value;
                
                if (!username || !email) {
                    showNotification('Username and email are required', 'error');
                    return;
                }
                
                // Update users table
                const { error: userError } = await window.supabase
                    .from('users')
                    .update({
                        user_name: username,
                        email_address: email
                    })
                    .eq('id', currentUser.id);
                
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
                
                // Update auth email if changed
                if (email !== currentUser.email) {
                    const { error: authError } = await window.supabase.auth.updateUser({
                        email: email
                    });
                    
                    if (authError) throw authError;
                    
                    // Update local user object
                    currentUser.email = email;
                }
                
                // Reload data to reflect changes
                await loadAllData();
                
                showNotification('Settings saved successfully!', 'success');
                
            } catch (error) {
                console.error('Save settings error:', error);
                showNotification('Error saving settings: ' + error.message, 'error');
            }
        });
    }
    
    function setupWithdrawalForm() {
        const form = document.getElementById('withdrawalForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser || !earningsData) {
                showNotification('Please wait for data to load', 'warning');
                return;
            }
            
            const amountInput = form.querySelector('input[type="number"]');
            const amount = parseFloat(amountInput.value);
            const paymentMethod = form.querySelector('select').value;
            const accountDetails = document.getElementById('account_number')?.value;
            
            // Validation
            if (!amount || amount < 59000) {
                showNotification('Minimum withdrawal is UGX 59,000', 'warning');
                return;
            }
            
            if (!accountDetails) {
                showNotification('Please enter account details', 'warning');
                return;
            }
            
            const available = (earningsData.all_time_earn || 0) - (earningsData.total_withdrawn || 0);
            
            if (amount > available) {
                showNotification(`Insufficient balance. Available: UGX ${available.toLocaleString()}`, 'error');
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
                const newTotalWithdrawn = (earningsData.total_withdrawn || 0) + amount;
                
                await window.supabase
                    .from('earnings')
                    .update({ total_withdrawn: newTotalWithdrawn })
                    .eq('id', currentUser.id);
                
                // Update local data
                earningsData.total_withdrawn = newTotalWithdrawn;
                
                // Update UI
                updateEarningsStats();
                form.reset();
                
                showNotification(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
                
            } catch (error) {
                console.error('Withdrawal error:', error);
                showNotification('Error processing withdrawal: ' + error.message, 'error');
            }
        });
    }
    
    function setupExportButton() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', () => {
            if (!earningsData) {
                showNotification('No data to export', 'warning');
                return;
            }
            
            const data = {
                user: {
                    name: userProfile?.user_name || 'User',
                    email: currentUser.email,
                    joined: userProfile?.created_at || new Date().toISOString()
                },
                earnings: earningsData,
                exportedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `skylink-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('Data exported successfully!', 'success');
        });
    }
    
    function setupRefreshButtons() {
        document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.textContent = 'Refreshing...';
                btn.disabled = true;
                
                // Reload all data
                await loadAllData();
                
                setTimeout(() => {
                    btn.textContent = btn.id.includes('tiktok') ? 'Refresh Tasks' : 
                                     btn.id.includes('youtube') ? 'Refresh Tasks' : 'Refresh';
                    btn.disabled = false;
                    showNotification('Data refreshed!', 'success');
                }, 1000);
            });
        });
    }
    
    function setupTriviaForm() {
        const form = document.getElementById('quizForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser || !earningsData) {
                showNotification('Please wait for data to load', 'warning');
                return;
            }
            
            // Check if already submitted today
            const lastTriviaKey = `lastTrivia_${currentUser.id}`;
            const lastTrivia = localStorage.getItem(lastTriviaKey);
            const today = new Date().toDateString();
            
            if (lastTrivia === today) {
                showNotification('You have already completed trivia today', 'warning');
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
                // Update earnings
                const newTriviaValue = (earningsData.trivia || 0) + amountEarned;
                const newTotal = (earningsData.all_time_earn || 0) + amountEarned;
                
                const { error } = await window.supabase
                    .from('earnings')
                    .update({
                        trivia: newTriviaValue,
                        all_time_earn: newTotal
                    })
                    .eq('id', currentUser.id);
                
                if (error) throw error;
                
                // Update users table
                await window.supabase
                    .from('users')
                    .update({ total_income: newTotal })
                    .eq('id', currentUser.id);
                
                // Update local data
                earningsData.trivia = newTriviaValue;
                earningsData.all_time_earn = newTotal;
                
                // Update UI
                updateEarningsStats();
                
                // Mark as completed for today
                localStorage.setItem(lastTriviaKey, today);
                
                // Disable form
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Completed Today';
                }
                
                showNotification(`Trivia completed! You earned UGX ${amountEarned}`, 'success');
                
            } catch (error) {
                console.error('Trivia error:', error);
                showNotification('Error saving trivia results', 'error');
            }
        });
    }
    
    function setupActivation() {
        const how2activate = document.getElementById("how2a");
        const activateBtn = document.getElementById("activate");
        
        if (how2activate) {
            how2activate.addEventListener("click", () => {
                const username = userProfile?.user_name || 
                                currentUser.user_metadata?.full_name || 
                                currentUser.email?.split('@')[0] || 'user';
                
                const activationMess = document.getElementById("activationMess");
                if (activationMess) {
                    activationMess.innerHTML = `
                        <h3>Activation Instructions</h3>
                        <p>Username: <strong>${username}</strong></p>
                        <p>Amount: UGX 20,000</p>
                        <p>After payment, click "Activate Account" below</p>
                    `;
                }
                
                if (activateBtn) {
                    activateBtn.style.display = "block";
                }
            });
        }
        
        if (activateBtn) {
            activateBtn.addEventListener("click", async function() {
                try {
                    this.disabled = true;
                    this.textContent = "Processing...";
                    
                    // Update user status
                    const { error } = await window.supabase
                        .from('users')
                        .update({ 
                            status: 'active',
                            rank: 'activated_user'
                        })
                        .eq('id', currentUser.id);
                    
                    if (error) throw error;
                    
                    // Reload profile
                    userProfile = await loadUserProfile();
                    updateAllUI();
                    
                    this.textContent = "Account Activated!";
                    this.style.background = "rgba(0, 255, 153, 0.3)";
                    
                    showNotification('Account activated successfully!', 'success');
                    
                } catch (error) {
                    console.error('Activation error:', error);
                    this.disabled = false;
                    this.textContent = "Activate Account";
                    showNotification('Error activating account', 'error');
                }
            });
        }
    }
    
    function setupRealtimeUpdates() {
        // Subscribe to earnings updates
        const channel = window.supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'earnings',
                    filter: `id=eq.${currentUser.id}`
                },
                async (payload) => {
                    console.log('Earnings updated:', payload);
                    
                    // Reload earnings
                    const earnings = await loadEarnings();
                    if (earnings) {
                        earningsData = earnings;
                        updateEarningsStats();
                    }
                }
            )
            .subscribe();
        
        // Cleanup
        window.addEventListener('beforeunload', () => {
            if (channel) {
                window.supabase.removeChannel(channel);
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        document.querySelectorAll('.custom-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
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
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .status-active {
            background-color: #2ecc71;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        
        .status-pending {
            background-color: #f39c12;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
    
    // Start initialization
    setTimeout(initDashboard, 500);
    
})();