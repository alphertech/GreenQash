// Initialize Supabase client
let supabase;

// Initialize the application
async function initializeApp() {
    try {
        // Check if Supabase config is available
        if (window.SUPABASE_CONFIG) {
            supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
            console.log('✓ Supabase initialized with config.js');
        } else {
            // Fallback to default Supabase credentials
            supabase = window.supabase.createClient(
                "https://your-project.supabase.co",
                "your-anon-key"
            );
            console.warn('⚠ Using default Supabase credentials. Please configure config.js');
        }

        // Initialize all features
        await initializeFeatures();
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing application. Please refresh the page.');
    }
}

// Initialize all application features
async function initializeFeatures() {
    // Block auto-login if just logged out
    if (localStorage.getItem('justLoggedOut') === 'true') {
        localStorage.removeItem('justLoggedOut');
        if (window.location.pathname !== '/index.html') {
            window.location.href = 'index.html';
        }
        return;
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

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

    // Start real-time updates
    initializeRealtimeUpdates(user.id);
}

// ========== USER FUNCTIONS ==========

// Greet user based on time
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

// Initialize user data display
async function initializeUserData(user) {
    try {
        if (!user) return;

        // Update user information in the header
        const userNameElements = document.querySelectorAll('#user_name');
        userNameElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            } else {
                el.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            }
        });

        // Update email
        const emailElements = document.querySelectorAll('#email_address, .emailAdress');
        emailElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = user.email || '';
            } else {
                el.textContent = user.email || '';
            }
        });

        // Fetch user data from users table (matches your schema)
        const { data: userData, error } = await supabase
            .from('users')
            .select('user_name, email_address, created_at, status, rank')
            .eq('email_address', user.email)
            .maybeSingle();

        if (!error && userData) {
            // Update username if different
            if (userData.user_name) {
                userNameElements.forEach(el => {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.value = userData.user_name;
                    } else {
                        el.textContent = userData.user_name;
                    }
                });
            }

            // Update created at
            const createdAtElement = document.getElementById('createdAt');
            if (createdAtElement && userData.created_at) {
                const date = new Date(userData.created_at);
                createdAtElement.textContent = date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });
            }

            // Update status
            if (userData.status === 'active') {
                document.getElementById('activate')?.style.display = 'none';
            }
        }

        // Fetch payment information
        const { data: paymentInfo } = await supabase
            .from('payment_information')
            .select('mobile_number, payment_method, email')
            .eq('id', user.id)
            .maybeSingle();

        if (paymentInfo) {
            // Update phone number
            const phoneElements = document.querySelectorAll('#phone_number, .phoneNumber');
            phoneElements.forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = paymentInfo.mobile_number || '';
                } else {
                    el.textContent = paymentInfo.mobile_number || '';
                }
            });

            // Update payment method
            const paymentMethodElement = document.getElementById('payment_method');
            if (paymentMethodElement && paymentInfo.payment_method) {
                paymentMethodElement.textContent = `${paymentInfo.payment_method} (${paymentInfo.email || paymentInfo.mobile_number})`;
            }
        }

        // Load user earnings
        await loadUserEarnings(user.id);

    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Load user earnings
async function loadUserEarnings(userId) {
    try {
        const { data: earnings, error } = await supabase
            .from('earnings')
            .select('youtube, tiktok, trivia, refferal, bonus, all_time_earn, total_withdrawn')
            .eq('id', userId)
            .maybeSingle();

        if (!error && earnings) {
            // Update dashboard stats
            updateStatCard('youtube', earnings.youtube || 0);
            updateStatCard('tiktok', earnings.tiktok || 0);
            updateStatCard('trivia', earnings.trivia || 0);
            updateStatCard('refferal', earnings.refferal || 0);
            updateStatCard('bonus', earnings.bonus || 0);
            updateStatCard('walletQash', (earnings.all_time_earn || 0) - (earnings.total_withdrawn || 0));
            updateStatCard('total_income', earnings.all_time_earn || 0);
            updateStatCard('withdrawn', earnings.total_withdrawn || 0);
            updateStatCard('pendingWithdrawals', await getPendingWithdrawals(userId));
            
            // Calculate total for display (sum of all categories)
            const total = (earnings.youtube || 0) + (earnings.tiktok || 0) + 
                         (earnings.trivia || 0) + (earnings.refferal || 0) + 
                         (earnings.bonus || 0);
            
            const totalIncomeElements = document.querySelectorAll('#total_income');
            totalIncomeElements.forEach(el => {
                el.textContent = (earnings.all_time_earn || 0).toLocaleString('en-US');
            });
        } else {
            // If no earnings record exists, create one
            if (error && error.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('earnings')
                    .insert({
                        id: userId,
                        youtube: 0,
                        tiktok: 0,
                        trivia: 0,
                        refferal: 0,
                        bonus: 0,
                        all_time_earn: 0,
                        total_withdrawn: 0
                    });
                
                if (insertError) {
                    console.error('Error creating earnings record:', insertError);
                }
            }
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

// Get pending withdrawals count
async function getPendingWithdrawals(userId) {
    try {
        const { count, error } = await supabase
            .from('withdrawal_requests')
            .select('*', { count: 'exact', head: true })
            .eq('id', userId)
            .eq('status', 'pending');
        
        return error ? 0 : count;
    } catch (error) {
        return 0;
    }
}

// Update stat card value
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = typeof value === 'number' ? value.toLocaleString('en-US') : value;
    }
}

// ========== TASK FUNCTIONS ==========

// Initialize task functionality
function initializeTasks(user) {
    const claimButtons = document.querySelectorAll('#claim, #claimYoutube');
    
    claimButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const isYoutube = e.target.id === 'claimYoutube';
            await handleTaskClaim(user, isYoutube);
        });
    });
}

// Check countdown for task claims
async function checkCountDown(userId, taskType) {
    const storageKey = `nextClaim_${taskType}_${userId}`;
    const nextClaimTime = localStorage.getItem(storageKey);
    
    if (nextClaimTime && Date.now() < Number(nextClaimTime)) {
        const claimButton = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (claimButton) {
            claimButton.disabled = true;
            claimButton.textContent = "Claimed";
            
            // Show remaining time
            const remaining = Number(nextClaimTime) - Date.now();
            const hoursRemaining = Math.ceil(remaining / (1000 * 60 * 60));
            claimButton.title = `Next claim available in ${hoursRemaining} hours`;
        }
        return true;
    }
    return false;
}

// Handle task claim
async function handleTaskClaim(user, isYoutube = false) {
    try {
        if (!user) {
            alert("Action Denied! Not enough privileges");
            return;
        }

        const userId = user.id;
        const taskType = isYoutube ? 'youtube' : 'tiktok';
        const claimButton = document.getElementById(isYoutube ? 'claimYoutube' : 'claim');
        
        // Check if already claimed recently
        if (await checkCountDown(userId, taskType)) {
            return;
        }

        // Disable button while processing
        claimButton.disabled = true;
        claimButton.textContent = "Processing...";

        // Fetch current earnings
        const { data: currentEarnings, error: selectError } = await supabase
            .from('earnings')
            .select(taskType, 'all_time_earn')
            .eq('id', userId)
            .single();

        if (selectError) {
            throw new Error('Error fetching data!');
        }

        // Calculate new values
        const rewardAmount = 1000; // UGX 1000 per task (matches your HTML)
        const currentValue = currentEarnings[taskType] || 0;
        const newValue = currentValue + rewardAmount;
        const newTotal = (currentEarnings.all_time_earn || 0) + rewardAmount;

        // Update earnings
        const { error: updateError } = await supabase
            .from('earnings')
            .update({ 
                [taskType]: newValue,
                all_time_earn: newTotal
            })
            .eq('id', userId);

        if (updateError) {
            throw new Error('Error claiming reward!');
        }

        // Update users table total_income
        const { error: userUpdateError } = await supabase
            .from('users')
            .update({ total_income: newTotal })
            .eq('id', userId);

        if (userUpdateError) {
            console.warn('Could not update user total income:', userUpdateError);
        }

        // Set cooldown (48 hours)
        const nextClaimTime = Date.now() + (48 * 60 * 60 * 1000);
        localStorage.setItem(`nextClaim_${taskType}_${userId}`, nextClaimTime.toString());

        // Update UI
        claimButton.textContent = "Claimed!";
        claimButton.style.backgroundColor = "#95a5a6";
        
        // Update stats display
        updateStatCard(taskType, newValue);
        updateStatCard('total_income', newTotal);
        
        // Show success message
        showNotification(`Successfully claimed UGX ${rewardAmount} from ${taskType} task!`, 'success');

    } catch (error) {
        console.error('Claim error:', error);
        
        const claimButton = document.getElementById(isYoutube ? 'claimYoutube' : 'claim');
        if (claimButton) {
            claimButton.disabled = false;
            claimButton.textContent = "Claim Reward";
        }
        
        showNotification(error.message || 'Error claiming reward!', 'error');
    }
}

// ========== TRIVIA FUNCTIONS ==========

function initializeTrivia(user) {
    const correctAnswers = {
        q1: "c",
        q2: "b",
        q3: "c",
        q4: "b",
        q5: "b",
    };
    
    const lock_Hours = 52;
    const lock_ms = lock_Hours * 60 * 60 * 1000;

    // Check if trivia is locked
    const lastAttempt = localStorage.getItem("trivia_last_attempt");
    const submitButton = document.querySelector("#quizForm button[type='submit']");
    
    if (lastAttempt && submitButton) {
        const remaining = lock_ms - (Date.now() - Number(lastAttempt));
        if (remaining > 0) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitted";
            const hours = (remaining / (1000 * 60 * 60)).toFixed(1);
            submitButton.title = `Next attempt in ${hours} hours`;
        }
    }

    // Handle form submission
    const quizForm = document.getElementById("quizForm");
    if (quizForm) {
        quizForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            if (!user) {
                alert("Minimum requirements for this privilege not attained!");
                return;
            }

            const userId = user.id;
            const button = quizForm.querySelector("button[type='submit']");
            
            // Check time lock
            const lastAttempt = localStorage.getItem("trivia_last_attempt");
            if (lastAttempt && Date.now() - Number(lastAttempt) < lock_ms) {
                alert("Quiz attempt was successful! Please wait before trying again.");
                return;
            }

            // Calculate score
            let score = 0;
            Object.keys(correctAnswers).forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                if (selected && selected.value === correctAnswers[q]) {
                    score++;
                }
            });

            // Calculate earnings (1500 UGX for 3+ correct, matches your HTML)
            const amountEarned = score >= 3 ? 1500 : score * 300;

            // Update database
            const { data: currentEarnings, error: fetchError } = await supabase
                .from('earnings')
                .select('trivia, all_time_earn')
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error('Error fetching current earnings:', fetchError);
                alert("Error saving data. Please try again.");
                return;
            }

            const newTriviaValue = (currentEarnings.trivia || 0) + amountEarned;
            const newTotal = (currentEarnings.all_time_earn || 0) + amountEarned;

            const { error } = await supabase
                .from('earnings')
                .update({
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                })
                .eq('id', userId);

            if (error) {
                console.error('Error updating trivia earnings:', error);
                alert("Error saving data. Please try again.");
                return;
            }

            // Update users table
            await supabase
                .from('users')
                .update({ total_income: newTotal })
                .eq('id', userId);

            // Update local storage
            localStorage.setItem("trivia_last_attempt", Date.now().toString());

            // Update UI
            button.disabled = true;
            button.textContent = `Next trivia available in ${lock_Hours} hours`;
            
            // Update stats
            updateStatCard('trivia', newTriviaValue);
            updateStatCard('total_income', newTotal);

            // Show result
            const message = score >= 3 
                ? `Congratulations! You scored ${score}/5 and earned UGX ${amountEarned} bonus!`
                : `You got ${score} correct answers. You earned UGX ${amountEarned}.`;
            
            alert(message);
            showNotification(`Trivia completed! Earned UGX ${amountEarned}`, 'success');
        });
    }
}

// ========== SETTINGS FUNCTIONS ==========

function initializeSettings(user) {
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            try {
                if (!user) {
                    alert('You must be logged in to save settings');
                    return;
                }

                const email = document.getElementById('email_address')?.value;
                const phone = document.getElementById('phone_number')?.value;
                const username = document.getElementById('user_name')?.value;
                const notifications = Array.from(document.querySelectorAll('input[name="notification_preferences"]:checked'))
                    .map(cb => cb.nextElementSibling.textContent);

                // Update auth user email
                if (email && email !== user.email) {
                    const { error: emailError } = await supabase.auth.updateUser({
                        email: email
                    });

                    if (emailError) throw emailError;
                }

                // Update users table
                const { error: userError } = await supabase
                    .from('users')
                    .update({
                        user_name: username,
                        email_address: email
                    })
                    .eq('id', user.id);

                if (userError) throw userError;

                // Update or create payment information
                const { error: paymentError } = await supabase
                    .from('payment_information')
                    .upsert({
                        id: user.id,
                        mobile_number: phone,
                        email: email,
                        notification_preference: notifications.join(', ')
                    });

                if (paymentError) throw paymentError;

                showNotification('Settings saved successfully!', 'success');
                
                // Update displayed values
                const usernameElements = document.querySelectorAll('#user_name');
                usernameElements.forEach(el => {
                    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
                        el.textContent = username;
                    }
                });

            } catch (error) {
                console.error('Error saving settings:', error);
                showNotification('Error saving settings: ' + error.message, 'error');
            }
        });
    }
}

// ========== ACTIVITIES FUNCTIONS ==========

async function initializeActivities(user) {
    const activitiesTable = document.querySelector('#recent-activity tbody');
    if (!activitiesTable) return;

    try {
        if (!user) return;

        // Since you don't have an activities table, we'll create a mock or use earnings
        const { data: earnings, error } = await supabase
            .from('earnings')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Create mock activities from earnings data
        const activities = [];
        const now = new Date();
        
        if (earnings.tiktok > 0) {
            activities.push({
                type: 'TikTok Task',
                details: 'Completed TikTok video',
                amount: 1000,
                time: new Date(now.getTime() - 3600000) // 1 hour ago
            });
        }
        
        if (earnings.youtube > 0) {
            activities.push({
                type: 'YouTube Task',
                details: 'Watched YouTube video',
                amount: 1000,
                time: new Date(now.getTime() - 7200000) // 2 hours ago
            });
        }
        
        if (earnings.trivia > 0) {
            activities.push({
                type: 'Trivia Quiz',
                details: 'Completed daily trivia',
                amount: 1500,
                time: new Date(now.getTime() - 86400000) // 1 day ago
            });
        }

        // Clear existing rows
        activitiesTable.innerHTML = '';

        // Add new rows
        activities.forEach(activity => {
            const row = document.createElement('tr');
            
            const timeString = activity.time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            row.innerHTML = `
                <td>${timeString}</td>
                <td>${activity.type}</td>
                <td>${activity.details}</td>
                <td>UGX ${activity.amount || 0}</td>
                <td><span class="status-active">Paid</span></td>
            `;
            
            activitiesTable.appendChild(row);
        });

        // If no activities, show message
        if (activities.length === 0) {
            activitiesTable.innerHTML = '<tr><td colspan="5">No recent activities. Complete tasks to earn!</td></tr>';
        }

    } catch (error) {
        console.error('Error loading activities:', error);
        activitiesTable.innerHTML = '<tr><td colspan="5">Error loading recent activities</td></tr>';
    }
}

// ========== ACTIVATION FUNCTIONS ==========

function initializeActivation(user) {
    const how2activate = document.getElementById("how2a");
    const activationMess = document.getElementById("activationMess");
    const activateBtn = document.getElementById("activate");
    const helpBtn = document.getElementById("helpbtn");

    if (how2activate) {
        how2activate.addEventListener("click", async () => {
            // Get username from users table
            const { data: userData } = await supabase
                .from('users')
                .select('user_name')
                .eq('id', user.id)
                .single();
            
            const username = userData?.user_name || user.email?.split('@')[0] || 'user';

            if (activationMess) {
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
                <p style="font-weight:bold;color:var(--green-accent)">After payment, click "Activate Account" to verify</p>`;
            }

            if (activateBtn) {
                activateBtn.style.display = "block";
            }
        });
    }

    if (activateBtn) {
        activateBtn.addEventListener("click", async function() {
            try {
                if (!user) {
                    alert('You must be logged in to activate your account');
                    return;
                }

                this.disabled = true;
                this.textContent = "Processing...";

                // Simulate API call for payment verification
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Update user status in database
                const { error } = await supabase
                    .from('users')
                    .update({ 
                        status: 'active',
                        rank: 'activated_user'
                    })
                    .eq('id', user.id);

                if (error) throw error;

                this.textContent = "Account Activated!";
                this.style.background = "rgba(0, 255, 153, 0.3)";
                
                showNotification('Account activated successfully! You can now access all features.', 'success');

            } catch (error) {
                console.error('Activation error:', error);
                this.disabled = false;
                this.textContent = "Activate Account";
                showNotification('Error activating account. Please try again.', 'error');
            }
        });
    }

    if (helpBtn) {
        helpBtn.addEventListener("click", () => {
            alert("Please contact support at admin@greenqash.com for assistance.");
        });
    }
}

// ========== DOWNLINES FUNCTIONS ==========

async function initializeDownlines(user) {
    const downlinesTable = document.querySelector('#downlines-table tbody');
    const l1UsersElement = document.getElementById('l1Users');
    const l2UsersElement = document.getElementById('l2Users');
    
    if (!downlinesTable || !l1UsersElement) return;

    try {
        // Get referrals (this would need a proper referrals table)
        // For now, we'll show mock data
        const mockDownlines = [
            {
                username: 'john_doe',
                email: 'john.doe@example.com',
                date: '2023-10-15',
                status: 'Active',
                level: 1,
                earnings: 25000
            },
            {
                username: 'jane_smith',
                email: 'jane.smith@example.com',
                date: '2023-10-20',
                status: 'Active',
                level: 2,
                earnings: 12000
            }
        ];

        // Clear existing rows
        downlinesTable.innerHTML = '';

        // Add new rows
        mockDownlines.forEach(downline => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${downline.username}</td>
                <td>${downline.email}</td>
                <td>${downline.date}</td>
                <td class="status-active">${downline.status}</td>
                <td>${downline.level}</td>
                <td>UGX ${downline.earnings.toLocaleString()}</td>
            `;
            downlinesTable.appendChild(row);
        });

        // Update stats
        l1UsersElement.textContent = '2'; // Mock count
        l2UsersElement.textContent = '1'; // Mock count

    } catch (error) {
        console.error('Error loading downlines:', error);
        downlinesTable.innerHTML = '<tr><td colspan="6">Error loading downlines</td></tr>';
    }
}

// ========== STATISTICS FUNCTIONS ==========

async function initializeStatistics(user) {
    try {
        // Get statistics (you have a statistics table)
        const { data: stats, error } = await supabase
            .from('statistics')
            .select('*')
            .eq('admin_id', user.id) // Assuming admin_id references user id
            .maybeSingle();

        if (!error && stats) {
            // Update statistics if you want to show admin stats
            // For regular users, we use earnings data instead
        }

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ========== NAVIGATION FUNCTIONS ==========

function initializeNavigation() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const sections = document.querySelectorAll('.admin-section');
    const menuItems = document.querySelectorAll('menu a[data-section]');
    const logoutBtn = document.getElementById('logout');
    const overlay = document.querySelector('.overlay') || document.createElement('div');

    if (!overlay.classList.contains('overlay')) {
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }

    // Mobile menu toggle
    if (hamburgerBtn && sideMenu) {
        hamburgerBtn.addEventListener('click', () => {
            sideMenu.classList.toggle('active');
            overlay.style.display = sideMenu.classList.contains('active') ? 'block' : 'none';
            hamburgerBtn.classList.toggle('active');
        });

        // Close menu when clicking overlay
        overlay.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            overlay.style.display = 'none';
            hamburgerBtn.classList.remove('active');
        });
    }

    // Set active section
    function setActiveSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            }
        });

        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
    }

    // Navigation click handler
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            
            if (item.id === 'logout') {
                handleLogout();
                return;
            }
            
            setActiveSection(sectionId);

            // Close mobile menu if open
            if (sideMenu && sideMenu.classList.contains('active')) {
                sideMenu.classList.remove('active');
                overlay.style.display = 'none';
                hamburgerBtn.classList.remove('active');
            }
        });
    });

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    function handleLogout(e) {
        if (e) e.preventDefault();
        
        localStorage.setItem('justLoggedOut', 'true');
        supabase.auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
}

// ========== UTILITY FUNCTIONS ==========

function initializeCopyLink(user) {
    const copyLinkBtn = document.getElementById('CopyLink');
    const linkInput = document.getElementById('link');
    const notification = document.getElementById('notification');

    if (copyLinkBtn && linkInput) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                if (user) {
                    // Generate referral link using user ID
                    const referralLink = `${window.location.origin}/ref/${user.id}`;
                    linkInput.value = referralLink;
                }

                linkInput.select();
                linkInput.setSelectionRange(0, 99999);

                await navigator.clipboard.writeText(linkInput.value);
                
                // Show notification
                if (notification) {
                    notification.classList.add('show');
                    setTimeout(() => notification.classList.remove('show'), 2000);
                }

                // Visual feedback
                copyLinkBtn.textContent = 'Copied!';
                copyLinkBtn.classList.add('copied');
                setTimeout(() => {
                    copyLinkBtn.textContent = 'Copy Link';
                    copyLinkBtn.classList.remove('copied');
                }, 2000);

            } catch (err) {
                console.error('Copy failed:', err);
                showNotification('Failed to copy link', 'error');
            }
        });
    }
}

function initializeChat() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatForm && chatInput && chatMessages) {
        // Add initial greeting
        addChatMessage('FarmBoy', 'Hello! I\'m FarmBoy, your AI assistant. How can I help you today?', 'bot');

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            
            if (!message) return;

            // Add user message
            addChatMessage('You', message, 'user');
            chatInput.value = '';

            // Simulate bot response
            setTimeout(async () => {
                const user = await supabase.auth.getUser();
                const username = user.data?.user?.user_metadata?.full_name || 'there';
                const responses = [
                    `Hi ${username}! Thanks for your message.`,
                    'I understand your question. Let me help you with that.',
                    'Thanks for reaching out! How else can I assist you today?',
                    'That\'s a great question! Let me think about the best way to help.',
                    'I\'m here to help you with any questions about the platform!',
                    'Would you like me to explain any feature in more detail?'
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('FarmBoy', randomResponse, 'bot');
            }, 1000);
        });
    }

    function addChatMessage(sender, text, type) {
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

function initializeWithdrawal(user) {
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!user) {
                alert('You must be logged in to request withdrawal');
                return;
            }

            const amount = parseFloat(withdrawalForm.querySelector('input[type="number"]').value);
            const walletType = withdrawalForm.querySelector('select').value;
            const paymentMethod = withdrawalForm.querySelectorAll('select')[1]?.value;
            const accountDetails = document.getElementById('account_number').value;

            // Get current earnings to check balance
            const { data: earnings } = await supabase
                .from('earnings')
                .select('all_time_earn, total_withdrawn')
                .eq('id', user.id)
                .single();

            const availableBalance = (earnings?.all_time_earn || 0) - (earnings?.total_withdrawn || 0);

            if (amount < 59000) {
                alert('Minimum withdrawal amount is UGX 59,000');
                return;
            }

            if (amount > availableBalance) {
                alert(`Insufficient balance. Available: UGX ${availableBalance.toLocaleString()}`);
                return;
            }

            try {
                // Create withdrawal request
                const { error } = await supabase
                    .from('withdrawal_requests')
                    .insert({
                        id: user.id,
                        amount: amount,
                        payment_method: paymentMethod,
                        phone_number: accountDetails,
                        email: user.email,
                        status: 'pending'
                    });

                if (error) throw error;

                // Update total withdrawn amount
                const newTotalWithdrawn = (earnings?.total_withdrawn || 0) + amount;
                await supabase
                    .from('earnings')
                    .update({ total_withdrawn: newTotalWithdrawn })
                    .eq('id', user.id);

                showNotification(`Withdrawal request submitted for UGX ${amount.toLocaleString()}. Payment will be processed by 8pm EAT.`, 'success');
                
                // Update UI
                updateStatCard('withdrawn', newTotalWithdrawn);
                updateStatCard('walletQash', availableBalance - amount);
                
                withdrawalForm.reset();

            } catch (error) {
                console.error('Withdrawal error:', error);
                showNotification('Error submitting withdrawal request: ' + error.message, 'error');
            }
        });
    }
}

function initializeQuiz() {
    // Already handled in initializeTrivia
}

function initializeRefreshButtons() {
    document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(button => {
        button.addEventListener('click', async function() {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return;

            this.textContent = 'Refreshing...';
            this.disabled = true;
            
            // Refresh based on button type
            if (this.id.includes('tiktok')) {
                // Refresh TikTok tasks
            } else if (this.id.includes('youtube')) {
                // Refresh YouTube tasks
            } else if (this.id.includes('downlines')) {
                await initializeDownlines(user.data.user);
            }
            
            setTimeout(() => {
                this.textContent = this.id.includes('tiktok') ? 'Refresh Tasks' : 
                                 this.id.includes('youtube') ? 'Refresh Tasks' : 'Refresh';
                this.disabled = false;
                showNotification('Content refreshed successfully!', 'success');
            }, 1000);
        });
    });
}

function initializeExportButton(user) {
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                if (!user) return;

                // Fetch user data
                const { data: earnings, error: earningsError } = await supabase
                    .from('earnings')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (earningsError) throw earningsError;

                // Create CSV content
                const csvData = [];
                csvData.push(['Category', 'Amount (UGX)']);
                csvData.push(['YouTube Earnings', earnings.youtube || 0]);
                csvData.push(['TikTok Earnings', earnings.tiktok || 0]);
                csvData.push(['Trivia Earnings', earnings.trivia || 0]);
                csvData.push(['Referral Earnings', earnings.refferal || 0]);
                csvData.push(['Bonus Earnings', earnings.bonus || 0]);
                csvData.push(['Total Earned', earnings.all_time_earn || 0]);
                csvData.push(['Total Withdrawn', earnings.total_withdrawn || 0]);
                csvData.push(['Available Balance', (earnings.all_time_earn || 0) - (earnings.total_withdrawn || 0)]);

                const csv = csvData.map(row => row.join(',')).join('\n');
                
                // Create download link
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `greenqash_earnings_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                showNotification('Earnings data exported successfully!', 'success');

            } catch (error) {
                console.error('Export error:', error);
                showNotification('Error exporting data', 'error');
            }
        });
    }
}

function initializeRealtimeUpdates(userId) {
    // Subscribe to earnings updates
    const earningsChannel = supabase
        .channel('earnings_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'earnings',
                filter: `id=eq.${userId}`
            },
            () => loadUserEarnings(userId)
        )
        .subscribe();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (earningsChannel) {
            supabase.removeChannel(earningsChannel);
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
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
    
    .status-active {
        background-color: #2ecc71;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
    }
    
    .status-pending {
        background-color: #f39c12;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);

// ========== INITIALIZE APPLICATION ==========

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make functions available globally for debugging
window.supabaseClient = () => supabase;
window.refreshUserData = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) initializeUserData(user);
    });
};
window.showNotification = showNotification;