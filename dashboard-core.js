// dashboard-core.js - UPDATED FOR YOUR SCHEMA
(function() {
    console.log('Dashboard core starting...');
    
    let currentUser = null;
    let userProfile = null;
    let earningsData = null;
    let userId = null; // This will be the BIGINT ID from users table
    
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
            console.log('Auth user found:', user.email, 'UUID:', user.id);
            
            // Load user data
            loadUserData(user);
            
        }).catch(error => {
            console.error('Auth error:', error);
        });
    }
    
    async function loadUserData(authUser) {
        try {
            console.log('Loading user data for:', authUser.email);
            
            // STEP 1: Get user profile from users table using email or UUID
            const { data: profile, error: profileError } = await window.supabase
                .from('users')
                .select('*')
                .or(`email_address.eq.${authUser.email},uuid.eq.${authUser.id}`)
                .maybeSingle();
            
            if (profileError) {
                console.error('Error loading profile:', profileError);
                showMessage('Error loading user profile', 'error');
                return;
            }
            
            if (!profile) {
                console.error('User not found in users table');
                showMessage('User profile not found in database', 'error');
                return;
            }
            
            userProfile = profile;
            userId = profile.id; // This is the BIGINT ID we need for other tables
            console.log('User profile loaded. ID:', userId, 'Username:', profile.user_name);
            
            // STEP 2: Get earnings data using the BIGINT id
            const { data: earnings, error: earningsError } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (earningsError) {
                console.error('Error loading earnings:', earningsError);
                // Don't show error - user might not have earnings record yet
            }
            
            earningsData = earnings;
            console.log('Earnings data:', earningsData);
            
            // STEP 3: Get payment information
            const { data: paymentInfo, error: paymentError } = await window.supabase
                .from('payment_information')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (paymentError) {
                console.error('Error loading payment info:', paymentError);
            }
            
            // Store all data globally
            window.userData = {
                profile: userProfile,
                earnings: earningsData,
                payment: paymentInfo,
                authUser: authUser
            };
            
            console.log('All data loaded:', window.userData);
            
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
        console.log('Updating UI with loaded data...');
        
        // 1. Update username everywhere
        updateUsername();
        
        // 2. Update email
        updateEmail();
        
        // 3. Update earnings/stats
        updateEarningsStats();
        
        // 4. Update referral link
        updateReferralLink();
        
        // 5. Update profile section
        updateProfileSection();
        
        // 6. Update greeting
        updateGreeting();
    }
    
    function updateUsername() {
        // Get username from database or auth
        let username = 'User';
        
        if (userProfile?.user_name) {
            username = userProfile.user_name;
        } else if (currentUser?.user_metadata?.full_name) {
            username = currentUser.user_metadata.full_name;
        } else if (currentUser?.email) {
            username = currentUser.email.split('@')[0];
        }
        
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
    }
    
    function updateEmail() {
        const email = currentUser?.email || userProfile?.email_address || '';
        
        document.querySelectorAll('#email_address, .emailAdress').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = email;
            } else {
                element.textContent = email;
            }
        });
    }
    
    function updateEarningsStats() {
        if (!earningsData) {
            console.log('No earnings data to display, showing zeros');
            
            // Show zeros if no earnings data
            const defaultStats = {
                'youtube': 0,
                'tiktok': 0,
                'trivia': 0,
                'refferal': 0,
                'bonus': 5000, // Default bonus from your schema
                'total_income': userProfile?.total_income || 0,
                'withdrawn': 0,
                'walletQash': userProfile?.total_income || 0
            };
            
            updateStatElements(defaultStats);
            return;
        }
        
        console.log('Updating earnings stats with data:', earningsData);
        
        // Calculate available balance
        const allTimeEarn = earningsData.all_time_earn || userProfile?.total_income || 0;
        const totalWithdrawn = earningsData.total_withdrawn || 0;
        const availableBalance = allTimeEarn - totalWithdrawn;
        
        const stats = {
            'youtube': earningsData.youtube || 0,
            'tiktok': earningsData.tiktok || 0,
            'trivia': earningsData.trivia || 0,
            'refferal': earningsData.refferal || 0,
            'bonus': earningsData.bonus || 5000, // Default 5000 from schema
            'total_income': allTimeEarn,
            'withdrawn': totalWithdrawn,
            'walletQash': availableBalance
        };
        
        updateStatElements(stats);
    }
    
    function updateStatElements(stats) {
        Object.entries(stats).forEach(([elementId, value]) => {
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
            if (element && stats.total_income !== undefined) {
                element.textContent = stats.total_income.toLocaleString('en-US');
            }
        });
    }
    
    function updateReferralLink() {
        const linkInput = document.getElementById('link');
        if (linkInput && currentUser) {
            const referralLink = `${window.location.origin}/ref/${currentUser.id}/${user_name}`;
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
                        showMessage('Failed to copy link', 'error');
                    }
                });
            }
        }
    }
    
    function updateProfileSection() {
        console.log('Updating profile section...');
        
        // Update username in profile section
        const username = userProfile?.user_name || 
                        currentUser?.user_metadata?.full_name || 
                        currentUser?.email?.split('@')[0] || 'User';
        
        document.querySelectorAll('#profile-section #user_name, .profile-username').forEach(element => {
            element.textContent = username;
        });
        
        // Update email in profile
        const email = currentUser?.email || userProfile?.email_address || '';
        document.querySelectorAll('.profile-email, #profile-section .emailAdress').forEach(element => {
            element.textContent = email;
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
        
        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement && userProfile?.status) {
            statusElement.textContent = userProfile.status;
            statusElement.className = `status-${userProfile.status.toLowerCase().replace(' ', '-')}`;
        }
        
        // Update rank
        const rankElement = document.getElementById('rank');
        if (rankElement && userProfile?.rank) {
            rankElement.textContent = userProfile.rank;
        }
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
    
    function setupEventListeners() {
        console.log('Setting up event listeners for user ID:', userId);
        
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
        if (!userId || !currentUser) {
            showMessage('User data not loaded. Please refresh.', 'error');
            return;
        }
        
        const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (!button) return;
        
        try {
            button.disabled = true;
            button.textContent = 'Processing...';
            
            // Check cooldown
            const storageKey = `nextClaim_${taskType}_${userId}`;
            const nextClaimTime = localStorage.getItem(storageKey);
            
            if (nextClaimTime && Date.now() < Number(nextClaimTime)) {
                const remaining = Number(nextClaimTime) - Date.now();
                const hours = Math.ceil(remaining / (1000 * 60 * 60));
                showMessage(`Please wait ${hours} hours before claiming again`, 'warning');
                button.disabled = false;
                button.textContent = 'Claim Reward';
                return;
            }
            
            const rewardAmount = 500;
            
            // Get current earnings or create new record
            let currentEarnings = earningsData;
            if (!currentEarnings) {
                // Create new earnings record
                currentEarnings = {
                    id: userId,
                    youtube: 0,
                    tiktok: 0,
                    trivia: 0,
                    refferal: 0,
                    bonus: 5000,
                    all_time_earn: 0,
                    total_withdrawn: 0
                };
            }
            
            // Calculate new values
            const currentValue = currentEarnings[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const currentTotal = currentEarnings.all_time_earn || userProfile?.total_income || 0;
            const newTotal = currentTotal + rewardAmount;
            
            console.log(`Updating ${taskType}: ${currentValue} → ${newValue}, Total: ${currentTotal} → ${newTotal}`);
            
            // Update earnings table
            const updateData = {
                id: userId,
                [taskType]: newValue,
                all_time_earn: newTotal
            };
            
            // Include other fields to avoid null values
            if (currentEarnings.tiktok !== undefined) updateData.tiktok = currentEarnings.tiktok;
            if (currentEarnings.youtube !== undefined) updateData.youtube = currentEarnings.youtube;
            if (currentEarnings.trivia !== undefined) updateData.trivia = currentEarnings.trivia;
            if (currentEarnings.refferal !== undefined) updateData.refferal = currentEarnings.refferal;
            if (currentEarnings.bonus !== undefined) updateData.bonus = currentEarnings.bonus;
            if (currentEarnings.total_withdrawn !== undefined) updateData.total_withdrawn = currentEarnings.total_withdrawn;
            
            const { error } = await window.supabase
                .from('earnings')
                .upsert(updateData, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.error('Database update error:', error);
                
                // If error is about missing record, try insert instead
                if (error.code === '23503' || error.message.includes('foreign key')) {
                    console.log('Trying to insert new earnings record...');
                    
                    const newEarnings = {
                        id: userId,
                        [taskType]: rewardAmount,
                        all_time_earn: rewardAmount,
                        tiktok: taskType === 'tiktok' ? rewardAmount : 0,
                        youtube: taskType === 'youtube' ? rewardAmount : 0,
                        trivia: 0,
                        refferal: 0,
                        bonus: 5000,
                        total_withdrawn: 0
                    };
                    
                    const { error: insertError } = await window.supabase
                        .from('earnings')
                        .insert(newEarnings);
                    
                    if (insertError) throw insertError;
                    
                    earningsData = newEarnings;
                } else {
                    throw error;
                }
            } else {
                // Update local data
                earningsData = {
                    ...earningsData,
                    [taskType]: newValue,
                    all_time_earn: newTotal
                };
            }
            
            // Update users table total_income
            await window.supabase
                .from('users')
                .update({ total_income: newTotal })
                .eq('id', userId);
            
            // Update userProfile
            if (userProfile) {
                userProfile.total_income = newTotal;
            }
            
            // Update UI
            updateEarningsStats();
            
            // Set cooldown (48 hours)
            const nextClaim = Date.now() + (48 * 60 * 60 * 1000);
            localStorage.setItem(storageKey, nextClaim.toString());
            
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showMessage(`Successfully claimed UGX ${rewardAmount} from ${taskType} task!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            button.disabled = false;
            button.textContent = 'Claim Reward';
            showMessage('Error claiming reward: ' + error.message, 'error');
        }
    }
    
    function setupSettingsSave() {
        const saveBtn = document.getElementById('saveSettings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', async () => {
            if (!userId) {
                showMessage('User data not loaded', 'error');
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
                    .update({
                        user_name: username,
                        email_address: email
                    })
                    .eq('id', userId);
                
                if (userError) throw userError;
                
                // Update payment info
                if (phone) {
                    const { error: paymentError } = await window.supabase
                        .from('payment_information')
                        .upsert({
                            id: userId,
                            mobile_number: phone,
                            email: email
                        }, {
                            onConflict: 'id'
                        });
                    
                    if (paymentError) throw paymentError;
                }
                
                // Update auth email if changed
                if (email !== currentUser.email) {
                    const { error: authError } = await window.supabase.auth.updateUser({
                        email: email
                    });
                    
                    if (authError) throw authError;
                    
                    // Update local user object
                    currentUser.email = email;
                }
                
                // Update userProfile
                if (userProfile) {
                    userProfile.user_name = username;
                    userProfile.email_address = email;
                }
                
                // Update UI
                updateUsername();
                updateEmail();
                
                showMessage('Settings saved successfully!', 'success');
                
            } catch (error) {
                console.error('Save settings error:', error);
                showMessage('Error saving settings: ' + error.message, 'error');
            }
        });
    }
    
  function setupWithdrawalForm() {
    const form = document.getElementById('withdrawalForm');
    if (!form) return;
    
    // FIX: First ensure the select has correct options
    const walletSelect = form.querySelector('.form-group:nth-child(2) select');
    if (walletSelect) {
        // Check if options show numbers instead of text
        const hasNumberOptions = Array.from(walletSelect.options).some(option => 
            !isNaN(parseInt(option.textContent.trim())) && option.textContent.trim() !== ''
        );
        
        if (hasNumberOptions) {
            console.log('FIXING: Options show numbers instead of text. Restoring correct options...');
            
            // Clear and restore correct options
            walletSelect.innerHTML = '';
            
            const correctOptions = [
                { id: 'bonus', text: 'Bonus' },
                { id: 'trivia', text: 'Trivia' },
                { id: 'youtube', text: 'Youtube' },
                { id: 'tiktok', text: 'TikTok' },
                { id: 'referral', text: 'Refferals' }
            ];
            
            correctOptions.forEach(opt => {
                const option = document.createElement('option');
                option.id = opt.id;
                option.value = opt.id;
                option.textContent = opt.text;
                walletSelect.appendChild(option);
            });
        }
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userId) {
            showMessage('User data not loaded', 'error');
            return;
        }
        
        // Get form values
        const amountInput = form.querySelector('input[type="number"]');
        const amount = parseFloat(amountInput.value);
        
        // Get wallet select
        const walletSelect = form.querySelector('.form-group:nth-child(2) select');
        if (!walletSelect) {
            showMessage('Wallet selection not found', 'error');
            return;
        }
        
        // DOUBLE CHECK: Ensure options are correct before proceeding
        const selectedOption = walletSelect.options[walletSelect.selectedIndex];
        const walletId = selectedOption.id || selectedOption.value;
        
        // If walletId is a number (like 8000, 56000), we need to get the real wallet type
        let actualWalletId = walletId;
        if (!isNaN(parseInt(walletId))) {
            // This means the option was showing a number instead of proper text
            // We need to determine which wallet this number represents
            console.log('WARNING: Option ID is a number:', walletId);
            
            // Try to match the number to a wallet based on current balances
            if (earningsData) {
                if (earningsData.bonus == walletId) actualWalletId = 'bonus';
                else if (earningsData.trivia == walletId) actualWalletId = 'trivia';
                else if (earningsData.youtube == walletId) actualWalletId = 'youtube';
                else if (earningsData.tiktok == walletId) actualWalletId = 'tiktok';
                else if (earningsData.refferal == walletId) actualWalletId = 'referral';
                else {
                    showMessage('Cannot determine wallet type. Please refresh and try again.', 'error');
                    return;
                }
            } else {
                showMessage('Cannot determine wallet type. Please refresh and try again.', 'error');
                return;
            }
        }
        
        const paymentMethodSelect = form.querySelector('.form-group:nth-child(3) select');
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
        
        const accountDetails = document.getElementById('account_number')?.value;
        
        // Validation
        if (!amount || amount < 59000) {
            showMessage('Minimum withdrawal amount is UGX 59,000', 'warning');
            return;
        }
        
        if (!accountDetails) {
            showMessage('Please enter account details', 'warning');
            return;
        }
        
        if (!actualWalletId) {
            showMessage('Please select a wallet', 'error');
            return;
        }
        
        // Map option IDs to database column names
        const columnMap = {
            'bonus': 'bonus',
            'trivia': 'trivia',
            'youtube': 'youtube',
            'tiktok': 'tiktok',
            'referral': 'refferal'
        };
        
        const dbColumn = columnMap[actualWalletId];
        
        if (!dbColumn) {
            showMessage('Invalid wallet selection', 'error');
            return;
        }
        
        try {
            // 1. Get current balance
            const { data: earnings, error: fetchError } = await window.supabase
                .from('earnings')
                .select(`id, ${dbColumn}, all_time_earn, total_withdrawn`)
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            if (!earnings) throw new Error('No earnings data found');
            
            const currentBalance = earnings[dbColumn] || 0;
            const allTimeEarn = earnings.all_time_earn || 0;
            const totalWithdrawn = earnings.total_withdrawn || 0;
            
            // 2. Validate balance
            if (amount > currentBalance) {
                showMessage(`Insufficient balance. Available: UGX ${currentBalance.toLocaleString()}`, 'error');
                return;
            }
            
            // Check if wallet has minimum balance
            if (currentBalance < 59000) {
                showMessage(`Minimum withdrawal is UGX 59,000. Your wallet has UGX ${currentBalance.toLocaleString()}`, 'warning');
                return;
            }
            
            // 3. Calculate new values
            const newBalance = currentBalance - amount;
            const newAllTimeEarn = allTimeEarn - amount;
            const newTotalWithdrawn = totalWithdrawn + amount;
            
            // 4. Update earnings table
            const { error: updateEarningsError } = await window.supabase
                .from('earnings')
                .update({
                    [dbColumn]: newBalance,
                    all_time_earn: newAllTimeEarn,
                    total_withdrawn: newTotalWithdrawn
                })
                .eq('id', userId);
            
            if (updateEarningsError) throw updateEarningsError;
            
            // 5. Update users table total_income
            const { error: updateUserError } = await window.supabase
                .from('users')
                .update({ total_income: newAllTimeEarn })
                .eq('id', userId);
            
            if (updateUserError) {
                console.warn('Users table update failed:', updateUserError);
            }
            
            // 6. Create withdrawal request
            const phoneNumber = parseInt(accountDetails) || 0;
            const { error: withdrawalError } = await window.supabase
                .from('withdrawal_requests')
                .insert({
                    id: userId,
                    amount: amount,
                    payment_method: paymentMethod,
                    phone_number: phoneNumber,
                    email: currentUser?.email || '',
                    status: 'pending',
                    wallet_type: dbColumn // Store the database column name
                });
            
            if (withdrawalError) throw withdrawalError;
            
            // 7. Update local data
            if (earningsData) {
                earningsData[dbColumn] = newBalance;
                earningsData.all_time_earn = newAllTimeEarn;
                earningsData.total_withdrawn = newTotalWithdrawn;
            }
            
            if (userProfile) {
                userProfile.total_income = newAllTimeEarn;
            }
            
            // 8. Update UI and reset form
            if (typeof updateEarningsStats === 'function') {
                updateEarningsStats();
            }
            
            form.reset();
            showMessage(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    });
}
// Add this function to your initDashboard or setupEventListeners
function protectWithdrawalForm() {
    const form = document.getElementById('withdrawalForm');
    if (!form) return;
    
    const walletSelect = form.querySelector('.form-group:nth-child(2) select');
    if (!walletSelect) return;
    
    // Store original options
    const originalOptions = [
        { id: 'bonus', text: 'Bonus' },
        { id: 'trivia', text: 'Trivia' },
        { id: 'youtube', text: 'Youtube' },
        { id: 'tiktok', text: 'TikTok' },
        { id: 'referral', text: 'Refferals' }
    ];
    
    // Monitor for changes
    const observer = new MutationObserver(() => {
        const currentOptions = Array.from(walletSelect.options);
        const hasNumbers = currentOptions.some(opt => !isNaN(parseInt(opt.textContent.trim())));
        
        if (hasNumbers) {
            console.log('Blocking attempt to change options to numbers');
            walletSelect.innerHTML = '';
            originalOptions.forEach(opt => {
                const option = document.createElement('option');
                option.id = opt.id;
                option.value = opt.id;
                option.textContent = opt.text;
                walletSelect.appendChild(option);
            });
        }
    });
    
    observer.observe(walletSelect, { childList: true, subtree: true });
    }
    function setupEventListeners() {
    console.log('Setting up event listeners for user ID:', userId);
    
    setupTaskClaims();
    setupSettingsSave();
    setupWithdrawalForm();
    protectWithdrawalForm(); // ADD THIS LINE
    setupExportButton();
    setupRefreshButtons();
    setupTriviaForm();
    setupActivation();
}
    function setupExportButton() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', () => {
            if (!earningsData) {
                showMessage('No data to export', 'warning');
                return;
            }
            
            const data = {
                user: {
                    name: userProfile?.user_name || 'User',
                    email: currentUser.email,
                    joined: userProfile?.created_at || new Date().toISOString(),
                    status: userProfile?.status,
                    rank: userProfile?.rank
                },
                earnings: earningsData,
                totalIncome: userProfile?.total_income || 0,
                exportedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `greenqash-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showMessage('Data exported successfully!', 'success');
        });
    }
    
    function setupRefreshButtons() {
        document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.textContent = 'Refreshing...';
                btn.disabled = true;
                
                // Reload all data
                await loadUserData(currentUser);
                
                setTimeout(() => {
                    btn.textContent = btn.id.includes('tiktok') ? 'Refresh Tasks' : 
                                     btn.id.includes('youtube') ? 'Refresh Tasks' : 'Refresh';
                    btn.disabled = false;
                    showMessage('Data refreshed!', 'success');
                }, 1000);
            });
        });
    }
    
    function setupTriviaForm() {
        const form = document.getElementById('quizForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!userId) {
                showMessage('User data not loaded', 'error');
                return;
            }
            
            // Check if already submitted today
            const lastTriviaKey = `lastTrivia_${userId}`;
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
                // Get current earnings or create new
                let currentEarnings = earningsData;
                if (!currentEarnings) {
                    currentEarnings = {
                        id: userId,
                        trivia: 0,
                        all_time_earn: userProfile?.total_income || 0
                    };
                }
                
                const newTriviaValue = (currentEarnings.trivia || 0) + amountEarned;
                const newTotal = (currentEarnings.all_time_earn || userProfile?.total_income || 0) + amountEarned;
                
                // Update database
                const updateData = {
                    id: userId,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                };
                
                // Include other fields
                if (currentEarnings.tiktok !== undefined) updateData.tiktok = currentEarnings.tiktok;
                if (currentEarnings.youtube !== undefined) updateData.youtube = currentEarnings.youtube;
                if (currentEarnings.refferal !== undefined) updateData.refferal = currentEarnings.refferal;
                if (currentEarnings.bonus !== undefined) updateData.bonus = currentEarnings.bonus;
                if (currentEarnings.total_withdrawn !== undefined) updateData.total_withdrawn = currentEarnings.total_withdrawn;
                
                const { error } = await window.supabase
                    .from('earnings')
                    .upsert(updateData, {
                        onConflict: 'id'
                    });
                
                if (error) throw error;
                
                // Update users table
                await window.supabase
                    .from('users')
                    .update({ total_income: newTotal })
                    .eq('id', userId);
                
                // Update local data
                earningsData = {
                    ...earningsData,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                };
                
                // Update userProfile
                if (userProfile) {
                    userProfile.total_income = newTotal;
                }
                
                // Update UI
                updateEarningsStats();
                
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
        });
    }
    
    function setupActivation() {
        const how2activate = document.getElementById("how2a");
        const activateBtn = document.getElementById("activate");
        
        if (how2activate) {
            how2activate.addEventListener("click", () => {
                const username = userProfile?.user_name || 
                                currentUser?.user_metadata?.full_name || 
                                currentUser?.email?.split('@')[0] || 'user';
                
                const activationMess = document.getElementById("activationMess");
                if (activationMess) {
                    activationMess.innerHTML = `
                        <h3>Account Activation</h3>
                        <p><strong>Username:</strong> ${username}</p>
                        <p><strong>Amount:</strong> UGX 20,000</p>
                        <p>After payment, click "Activate Account" below to verify.</p>
                    `;
                }
                
                if (activateBtn) {
                    activateBtn.style.display = "block";
                }
            });
        }
        
        if (activateBtn) {
            activateBtn.addEventListener("click", async function() {
                if (!userId) {
                    showMessage('User data not loaded', 'error');
                    return;
                }
                
                try {
                    this.disabled = true;
                    this.textContent = "Processing...";
                    
                    // Update user status
                    const { error } = await window.supabase
                        .from('users')
                        .update({ 
                            status: 'active',
                            rank: 'user'
                        })
                        .eq('id', userId);
                    
                    if (error) throw error;
                    
                    // Update local profile
                    if (userProfile) {
                        userProfile.status = 'active';
                        userProfile.rank = 'activated_user';
                    }
                    
                    this.textContent = "Account Activated!";
                    this.style.background = "rgba(0, 255, 153, 0.3)";
                    
                    showMessage('Account activated successfully!', 'success');
                    
                } catch (error) {
                    console.error('Activation error:', error);
                    this.disabled = false;
                    this.textContent = "Activate Account";
                    showMessage('Error activating account: ' + error.message, 'error');
                }
            });
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


    //ACTIVITY MONITORING SYSTEM
    // ========== GUARANTEED WORKING ACTIVITY TRACKER ==========
// Add this to greenqash.js - IT WILL WORK

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeActivitySystem, 1000);
});

function initializeActivitySystem() {
    console.log('🚀 Initializing activity system...');
    
    // Create the activity tracker object
    window.ActivityTracker = {
        // Record an activity
        record: function(task, activity, amount = 0, status = 'Completed') {
            console.log('📝 Recording:', task);
            
            // Create activity
            const newActivity = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                task: task,
                activity: activity,
                amount: amount,
                status: status
            };
            
            // Save to localStorage
            this.saveActivity(newActivity);
            
            // Update display
            this.displayActivity(newActivity);
            
            return newActivity;
        },
        
        // Save activity to localStorage
        saveActivity: function(activity) {
            try {
                // Get existing activities
                let activities = [];
                const stored = localStorage.getItem('userActivities');
                if (stored) {
                    activities = JSON.parse(stored);
                    if (!Array.isArray(activities)) activities = [];
                }
                
                // Add new activity
                activities.unshift(activity);
                
                // Limit to 100 activities max
                if (activities.length > 100) {
                    activities = activities.slice(0, 100);
                }
                
                // Save back
                localStorage.setItem('userActivities', JSON.stringify(activities));
                console.log('💾 Saved to localStorage');
                
            } catch (error) {
                console.error('Error saving activity:', error);
            }
        },
        
        // Display an activity in the table
        displayActivity: function(activity) {
            const tbody = document.getElementById('recent-activity-tbody');
            if (!tbody) {
                console.error('Table body not found! Looking for #recent-activity-tbody');
                this.findAndUpdateTable();
                return;
            }
            
            // Remove "no activities" message if present
            if (tbody.innerHTML.includes('No recent activities')) {
                tbody.innerHTML = '';
            }
            
            // Create row
            const row = this.createTableRow(activity);
            
            // Insert at top
            if (tbody.firstChild) {
                tbody.insertBefore(row, tbody.firstChild);
            } else {
                tbody.appendChild(row);
            }
            
            console.log('✅ Displayed in table');
        },
        
        // Create table row HTML
        createTableRow: function(activity) {
            const row = document.createElement('tr');
            
            // Format time
            const time = new Date(activity.timestamp);
            const timeString = time.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Format amount
            let amountText = 'UGX 0';
            if (activity.amount > 0) {
                amountText = `UGX ${activity.amount.toLocaleString()}`;
            } else if (activity.amount < 0) {
                amountText = `-UGX ${Math.abs(activity.amount).toLocaleString()}`;
            }
            
            // Status class
            let statusClass = 'status-completed';
            if (activity.status === 'Paid') statusClass = 'status-active';
            if (activity.status === 'Pending') statusClass = 'status-pending';
            if (activity.status === 'Saved') statusClass = 'status-saved';
            
            row.innerHTML = `
                <td>${timeString}</td>
                <td>${activity.task}</td>
                <td>${activity.activity}</td>
                <td>${amountText}</td>
                <td><span class="${statusClass}">${activity.status}</span></td>
            `;
            
            return row;
        },
        
        // Load and display all activities
        loadAllActivities: function() {
            console.log('📂 Loading activities from storage...');
            
            try {
                const stored = localStorage.getItem('userActivities');
                if (!stored) {
                    console.log('No activities in storage');
                    return;
                }
                
                const activities = JSON.parse(stored);
                if (!Array.isArray(activities)) {
                    console.error('Invalid activities data');
                    return;
                }
                
                console.log(`Found ${activities.length} activities`);
                this.displayAllActivities(activities);
                
            } catch (error) {
                console.error('Error loading activities:', error);
            }
        },
        
        // Display all activities in table
        displayAllActivities: function(activities) {
            const tbody = this.findTableBody();
            if (!tbody) return;
            
            // Clear table
            tbody.innerHTML = '';
            
            if (activities.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">No recent activities. Complete tasks to earn!</td>
                    </tr>
                `;
                return;
            }
            
            // Add each activity
            activities.forEach(activity => {
                const row = this.createTableRow(activity);
                tbody.appendChild(row);
            });
            
            console.log(`✅ Displayed ${activities.length} activities`);
        },
        
        // Find the table body (multiple attempts)
        findTableBody: function() {
            // Try different selectors
            const selectors = [
                '#recent-activity tbody',
                '#recent-activity-tbody',
                '.admin-section.active #recent-activity tbody',
                'table#recent-activity tbody'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('Found table with selector:', selector);
                    return element;
                }
            }
            
            console.error('Could not find activity table!');
            return null;
        },
        
        // Find and update table
        findAndUpdateTable: function() {
            const tbody = this.findTableBody();
            if (tbody) {
                // Force reload all activities
                this.loadAllActivities();
            }
        },
        
        // Clean up old activities
        cleanup: function() {
            try {
                const stored = localStorage.getItem('userActivities');
                if (!stored) return;
                
                const activities = JSON.parse(stored);
                if (!Array.isArray(activities)) return;
                
                const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
                const filtered = activities.filter(activity => {
                    const activityTime = new Date(activity.timestamp).getTime();
                    return activityTime > twentyFourHoursAgo;
                });
                
                if (filtered.length < activities.length) {
                    localStorage.setItem('userActivities', JSON.stringify(filtered));
                    console.log(`🧹 Cleaned up ${activities.length - filtered.length} old activities`);
                    this.displayAllActivities(filtered);
                }
                
            } catch (error) {
                console.error('Error cleaning up:', error);
            }
        },
        
        // Set up event listeners
        setupEventListeners: function() {
            console.log('🔧 Setting up event listeners...');
            
            // Track TikTok claim
            this.setupClickListener('claim', 'TikTok Task', 'Watched TikTok video', 1000, 'Paid');
            
            // Track YouTube claim
            this.setupClickListener('claimYoutube', 'YouTube Task', 'Watched YouTube video', 1000, 'Paid');
            
            // Track withdrawal
            this.setupFormListener('withdrawalForm', 'Withdrawal Request', 'Requested funds withdrawal', -1, 'Pending');
            
            // Track trivia
            this.setupFormListener('quizForm', 'Trivia Quiz', 'Completed daily trivia', 1500, 'Paid');
            
            // Track settings save
            const saveBtn = document.getElementById('saveSettings');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.record('Account Settings', 'Updated account information', 0, 'Saved');
                });
            }
            
            // Track activation
            const activateBtn = document.getElementById('activate');
            if (activateBtn) {
                activateBtn.addEventListener('click', function() {
                    setTimeout(() => {
                        if (this.disabled || this.textContent.includes('Activated')) {
                            window.ActivityTracker.record('Account Activation', 'Activated account', -20000, 'Completed');
                        }
                    }, 1000);
                });
            }
            
            // Track referral copy
            const copyBtn = document.getElementById('CopyLink');
            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    setTimeout(() => {
                        if (this.textContent.includes('Copied')) {
                            window.ActivityTracker.record('Referral', 'Copied referral link', 0, 'Completed');
                        }
                    }, 100);
                });
            }
            
            console.log('✅ Event listeners setup complete');
        },
        
        // Helper: Setup click listener for claim buttons
        setupClickListener: function(buttonId, task, activity, amount, status) {
            const button = document.getElementById(buttonId);
            if (!button) {
                console.log(`Button #${buttonId} not found`);
                return;
            }
            
            button.addEventListener('click', function() {
                setTimeout(() => {
                    if (this.disabled || this.textContent.includes('Claimed')) {
                        window.ActivityTracker.record(task, activity, amount, status);
                    }
                }, 300);
            });
            
            console.log(`✅ Listener added to #${buttonId}`);
        },
        
        // Helper: Setup form listener
        setupFormListener: function(formId, task, activity, amount, status) {
            const form = document.getElementById(formId);
            if (!form) {
                console.log(`Form #${formId} not found`);
                return;
            }
            
            form.addEventListener('submit', function(e) {
                // Get amount from form if needed
                let finalAmount = amount;
                if (formId === 'withdrawalForm') {
                    const amountInput = this.querySelector('input[type="number"]');
                    if (amountInput) {
                        finalAmount = -parseFloat(amountInput.value);
                    }
                }
                
                setTimeout(() => {
                    window.ActivityTracker.record(task, activity, finalAmount, status);
                }, 500);
            });
            
            console.log(`✅ Listener added to #${formId}`);
        },
        
        // Initialize everything
        init: function() {
            console.log('🎯 ActivityTracker INIT');
            
            // Clean up old activities
            this.cleanup();
            
            // Load existing activities
            this.loadAllActivities();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup cleanup interval
            setInterval(() => this.cleanup(), 60 * 60 * 1000);
            
            console.log('✅ ActivityTracker ready!');
        }
    };
    
    // Initialize the tracker
    window.ActivityTracker.init();
    
    // Add test function
    window.testActivity = function() {
        window.ActivityTracker.record(
            'Test Task',
            'Testing the activity system',
            5000,
            'Paid'
        );
        alert('✅ Test activity added! Check the Recent Activity table.');
    };
    
    window.clearActivities = function() {
        localStorage.removeItem('userActivities');
        window.ActivityTracker.loadAllActivities();
        alert('🧹 All activities cleared!');
    };
    
    window.showActivities = function() {
        const stored = localStorage.getItem('userActivities');
        console.log('Stored activities:', stored ? JSON.parse(stored) : 'None');
    };
}

// ========== DIRECT TABLE MANIPULATION ==========
// Add this as a failsafe - it will FORCE activities to appear

function forceActivityToTable() {
    console.log('⚡ FORCE: Adding activity directly to table');
    
    // Find the table
    const tables = document.querySelectorAll('table');
    let activityTable = null;
    
    tables.forEach(table => {
        if (table.innerHTML.includes('Recent Activity') || table.id === 'recent-activity') {
            activityTable = table;
        }
    });
    
    if (!activityTable) {
        console.error('No activity table found!');
        return;
    }
    
    // Get or create tbody
    let tbody = activityTable.querySelector('tbody');
    if (!tbody) {
        tbody = document.createElement('tbody');
        activityTable.appendChild(tbody);
    }
    
    // Create test row
    const row = document.createElement('tr');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    row.innerHTML = `
        <td>${timeString}</td>
        <td>FORCE TEST</td>
        <td>Manual table injection</td>
        <td>UGX 10,000</td>
        <td><span class="status-active">Paid</span></td>
    `;
    
    // Add to table
    if (tbody.firstChild) {
        tbody.insertBefore(row, tbody.firstChild);
    } else {
        tbody.appendChild(row);
    }
    
    console.log('✅ FORCE: Activity added directly to table');
    alert('✅ Activity FORCE added to table!');
}

// Test the force function
setTimeout(() => {
    window.forceActivity = forceActivityToTable;
    console.log('Force function ready. Type: forceActivity()');
}, 2000);

// ========== INTEGRATION WITH YOUR CODE ==========
// In your initializeFeatures function, add this:

async function initializeFeatures() {
    // ... existing code ...
    
    // Initialize features that require authentication
    await Promise.all([
        initializeNavigation(),
        initializeGreeting(),
        initializeUserData(user),
        initializeTasks(user),
        initializeTrivia(user),
        initializeSettings(user),
        initializeActivities(user),
        initializeActivation(user),
        initializeCopyLink(user),
        initializeChat(),
        initializeWithdrawal(user),
        initializeQuiz(),
        initializeRefreshButtons(),
        initializeExportButton(user),
        initializeDownlines(user),
        initializeStatistics(user)
    ]);
    
    // ADD THIS LINE (but ActivityTracker should auto-initialize):
    console.log('Features initialized, ActivityTracker should be running');
    
    // Start real-time updates
    initializeRealtimeUpdates(user.id);
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
        
        .status-active {
            background-color: #2ecc71;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        
        .status-not-active {
            background-color: #e74c3c;
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
         .status-completed {
        background-color: #3498db;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
        }
    
        .status-viewed {
            background-color: #9b59b6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
    
    // Start initialization
    setTimeout(initDashboard, 1000);
})();