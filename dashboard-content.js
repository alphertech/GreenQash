// dashboard-content.js - Complete Implementation
class DashboardContentManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.activeTimers = {};
        this.taskCooldowns = {};
        
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase from config
            if (window.supabase && window.supabase.createClient) {
                this.supabase = window.supabase;
            } else if (typeof createSupabaseClient === 'function') {
                this.supabase = createSupabaseClient();
            } else {
                console.error('Supabase not available');
                return;
            }

            // Check auth
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.warn('User not authenticated');
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = user;
            
            // Load user data first
            await this.loadUserData();
            
            // Load content sections
            this.setupEventListeners();
            this.loadDashboardContent();
            
            // Setup navigation
            this.setupNavigation();
            
            // Load initial sections
            this.showSection('dashboard');
            
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async loadUserData() {
        try {
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('uuid', this.currentUser.id)
                .single();

            if (error) throw error;

            // Update UI with user data
            this.updateUserUI(userData);
            
            // Load earnings
            await this.loadEarnings();
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserUI(userData) {
        // Update all user name elements
        document.querySelectorAll('#user_name').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userData.user_name || 'User';
            } else {
                el.textContent = userData.user_name || 'User';
            }
        });

        // Update email
        document.querySelectorAll('#email_address').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userData.email_address || '';
            } else {
                el.textContent = userData.email_address || '';
            }
        });

        // Update phone
        if (userData.phone_number) {
            document.querySelectorAll('#phone_number').forEach(el => {
                el.textContent = userData.phone_number;
            });
        }

        // Update inviter if exists
        if (userData.inviter_id) {
            this.loadInviterInfo(userData.inviter_id);
        }

        // Update referral link
        this.generateReferralLink(userData.id);
    }

    async loadEarnings() {
        try {
            const { data: earnings, error } = await this.supabase
                .from('earnings')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;

            // Update dashboard stats
            this.updateEarningsUI(earnings);
            
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }

    updateEarningsUI(earnings) {
        // Update all earning displays
        const updates = {
            'total_income': earnings.all_time_earn || 0,
            'youtube': earnings.youtube || 0,
            'tiktok': earnings.tiktok || 0,
            'trivia': earnings.trivia || 0,
            'refferal': earnings.refferal || 0,
            'bonus': earnings.bonus || 0
        };

        Object.entries(updates).forEach(([id, amount]) => {
            document.querySelectorAll(`#${id}`).forEach(el => {
                if (el.classList.contains('stat-value')) {
                    el.textContent = `UGX ${amount.toLocaleString()}`;
                } else if (el.tagName === 'SPAN') {
                    el.textContent = `UGX ${amount.toLocaleString()}`;
                }
            });
        });
    }

    generateReferralLink(userId) {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}/index.html?ref=${userId}`;
        
        const linkInput = document.getElementById('link');
        if (linkInput) {
            linkInput.value = referralLink;
            this.setupShareButtons(referralLink);
        }
    }

    setupShareButtons(link) {
        const message = `Join Skylink and start earning money from TikTok and YouTube! Use my referral link: ${link}`;
        
        // WhatsApp
        document.getElementById('shareWhatsApp')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        });

        // Facebook
        document.getElementById('shareFacebook')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
        });

        // Twitter
        document.getElementById('shareTwitter')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`, '_blank');
        });

        // Telegram
        document.getElementById('shareTelegram')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, '_blank');
        });

        // Email
        document.getElementById('shareEmail')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `mailto:?subject=Join%20Skylink&body=${encodeURIComponent(message)}`;
        });

        // SMS
        document.getElementById('shareSMS')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `sms:?body=${encodeURIComponent(message)}`;
        });

        // Copy Link
        document.getElementById('CopyLink')?.addEventListener('click', () => {
            navigator.clipboard.writeText(link).then(() => {
                this.showNotification('Link copied successfully!', 'success');
            });
        });
    }

    async loadDashboardContent() {
        try {
            // Load all active content
            const { data: contents, error } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Render content by platform
            this.renderTikTokContent(contents.filter(c => c.platform === 'tiktok'));
            this.renderYouTubeContent(contents.filter(c => c.platform === 'youtube'));
            this.renderTriviaContent(contents.filter(c => c.platform === 'trivia'));
            
            // Load user completions
            await this.loadUserCompletions();
            
        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    renderTikTokContent(tiktokPosts) {
        const container = document.querySelector('.video-earn');
        if (!container || !tiktokPosts.length) return;

        let html = '';
        
        tiktokPosts.forEach((post, index) => {
            const completed = this.taskCooldowns[post.id] || false;
            
            html += `
                <div class="vidSection" id="tiktok-${post.id}">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${post.title}</h3>
                            <h5>Sponsored by ${post.sponsor || 'Skylink'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>Reward: UGX ${post.reward_amount}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                            <img src="${post.thumbnail_url || 'https://via.placeholder.com/600x400?text=TikTok+Video'}" 
                                 alt="${post.title}" 
                                 onclick="dashboardManager.openVideoModal('${post.content_url}', 'tiktok')">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${post.description || 'Like this video and stay for at least 30 seconds to earn your reward.'}</p>
                            <h5>Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn-tiktok" 
                                        data-post-id="${post.id}"
                                        ${completed ? 'disabled style="opacity:0.5;"' : ''}>
                                    ${completed ? 'Already Claimed' : 'Claim Reward'}
                                </button>
                                <button class="follow_page" onclick="dashboardManager.followAccount('${post.sponsor || 'default'}', 'tiktok')">
                                    Follow
                                </button>
                                <button class="like_content" onclick="dashboardManager.likeContent('${post.id}', 'tiktok')">
                                    Like
                                </button>
                                <button class="view-video" onclick="dashboardManager.openVideoModal('${post.content_url}', 'tiktok')">
                                    View Video
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Insert after TikTok section header
        const tiktokSection = document.querySelector('#users-section .video-earn');
        if (tiktokSection) {
            tiktokSection.innerHTML = html;
        } else {
            const section = document.getElementById('users-section');
            if (section) {
                const existing = section.querySelector('.video-earn');
                if (existing) existing.remove();
                
                const videoEarnDiv = document.createElement('div');
                videoEarnDiv.className = 'video-earn';
                videoEarnDiv.innerHTML = html;
                
                const header = section.querySelector('.section-header');
                if (header) {
                    header.insertAdjacentElement('afterend', videoEarnDiv);
                }
            }
        }
    }

    renderYouTubeContent(youtubePosts) {
        const container = document.querySelector('#approvals-section .video-earn');
        if (!container || !youtubePosts.length) return;

        let html = '';
        
        youtubePosts.forEach((post) => {
            const completed = this.taskCooldowns[post.id] || false;
            
            html += `
                <div class="vidSection" id="youtube-${post.id}">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${post.title}</h3>
                            <h5>Sponsored by ${post.sponsor || 'Skylink'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>Reward: UGX ${post.reward_amount}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                            <img src="${post.thumbnail_url || 'https://via.placeholder.com/600x400?text=YouTube+Video'}" 
                                 alt="${post.title}"
                                 onclick="dashboardManager.openVideoModal('${post.content_url}', 'youtube')">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${post.description || 'Watch this video for at least 1 minute to earn your reward.'}</p>
                            <h5>Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn-youtube" 
                                        data-post-id="${post.id}"
                                        ${completed ? 'disabled style="opacity:0.5;"' : ''}>
                                    ${completed ? 'Already Claimed' : 'Claim Reward'}
                                </button>
                                <button class="subscribe_src_channel" onclick="dashboardManager.subscribeChannel('${post.sponsor || 'default'}')">
                                    Subscribe
                                </button>
                                <button class="like_src_content" onclick="dashboardManager.likeContent('${post.id}', 'youtube')">
                                    Like
                                </button>
                                <button class="view-video" onclick="dashboardManager.openVideoModal('${post.content_url}', 'youtube')">
                                    Watch Video
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        const youtubeSection = document.querySelector('#approvals-section .video-earn');
        if (youtubeSection) {
            youtubeSection.innerHTML = html;
        }
    }

    renderTriviaContent(triviaPosts) {
        const container = document.querySelector('#content-section #quizForm');
        if (!container || !triviaPosts.length) return;

        // Take the first active trivia or create default
        const trivia = triviaPosts[0];
        
        let html = '';
        
        if (trivia.content_type === 'quiz') {
            try {
                const questions = JSON.parse(trivia.requirements || '[]');
                
                questions.forEach((q, index) => {
                    html += `
                        <div class="question">
                            <p>${index + 1}. ${q.question}</p>
                            <div class="options">
                                ${Object.entries(q.options || {}).map(([key, value]) => `
                                    <label><input type="radio" name="q${index + 1}" value="${key}"> ${value}</label>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
                
                html += `
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                        Submit Answers (Reward: UGX ${trivia.reward_amount})
                    </button>
                `;
                
                container.innerHTML = html;
                
                // Update trivia form handler
                container.onsubmit = (e) => {
                    e.preventDefault();
                    this.submitTriviaAnswers(trivia.id, questions);
                };
                
            } catch (error) {
                console.error('Error parsing trivia:', error);
            }
        }
    }

    async loadUserCompletions() {
        try {
            const { data: completions, error } = await this.supabase
                .from('user_task_completions')
                .select('content_id, status, completed_at')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Mark tasks as completed
            completions.forEach(comp => {
                if (comp.status === 'completed' || comp.status === 'claimed') {
                    this.taskCooldowns[comp.content_id] = true;
                    
                    // Update UI
                    const claimBtn = document.querySelector(`[data-post-id="${comp.content_id}"]`);
                    if (claimBtn) {
                        claimBtn.disabled = true;
                        claimBtn.textContent = 'Already Claimed';
                        claimBtn.style.opacity = '0.5';
                    }
                }
            });
            
        } catch (error) {
            console.error('Error loading completions:', error);
        }
    }

    // VIDEO WATCHING WITH TIMER
    openVideoModal(videoUrl, platform) {
        // Parse video ID from URL
        let embedUrl = videoUrl;
        
        if (platform === 'youtube') {
            const videoId = this.extractYouTubeId(videoUrl);
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else if (platform === 'tiktok') {
            // TikTok embed handling
            embedUrl = videoUrl.replace('https://www.tiktok.com/', 'https://www.tiktok.com/embed/');
        }

        const modalHtml = `
            <div class="video-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 9999; display: flex;
                align-items: center; justify-content: center;
            ">
                <div style="position: relative; width: 90%; max-width: 800px;">
                    <button onclick="dashboardManager.closeVideoModal()" style="
                        position: absolute; top: -40px; right: 0; background: #e74c3c;
                        color: white; border: none; padding: 10px 20px; cursor: pointer;
                        border-radius: 5px; z-index: 10000;
                    ">Close</button>
                    
                    <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${embedUrl}" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                                frameborder="0" allowfullscreen allow="autoplay">
                        </iframe>
                    </div>
                    
                    <div id="video-timer" style="
                        background: #2c3e50; color: white; padding: 15px;
                        text-align: center; margin-top: 10px; border-radius: 5px;
                    ">
                        <h4 style="margin: 0 0 10px 0;">Watch Timer</h4>
                        <div id="timer-display" style="font-size: 24px; font-weight: bold;">00:30</div>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">
                            Watch for 30 seconds to unlock reward
                        </p>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = modalHtml;
        modal.id = 'videoModal';
        document.body.appendChild(modal);

        // Start timer
        this.startVideoTimer(30); // 30 seconds minimum
    }

    startVideoTimer(seconds) {
        let timeLeft = seconds;
        const timerDisplay = document.getElementById('timer-display');
        
        const timer = setInterval(() => {
            timeLeft--;
            
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                timerDisplay.innerHTML = '<span style="color: #2ecc71;">✓ Ready to Claim!</span>';
                
                // Enable claim button if exists
                const modal = document.getElementById('videoModal');
                if (modal) {
                    const postId = modal.dataset.postId;
                    if (postId) {
                        this.enableClaimButton(postId);
                    }
                }
            }
        }, 1000);

        // Store timer reference
        this.activeTimers['video'] = timer;
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.remove();
            
            // Clear timer
            if (this.activeTimers['video']) {
                clearInterval(this.activeTimers['video']);
                delete this.activeTimers['video'];
            }
        }
    }

    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    // CLAIM REWARD FUNCTION
    async claimReward(postId, platform) {
        try {
            // Get post details
            const { data: post, error: postError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('id', postId)
                .single();

            if (postError) throw postError;

            // Check if already completed
            const { data: existing, error: checkError } = await this.supabase
                .from('user_task_completions')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('content_id', postId)
                .single();

            if (!checkError && existing) {
                this.showNotification('You have already claimed this reward!', 'warning');
                return;
            }

            // Record completion
            const { error: completionError } = await this.supabase
                .from('user_task_completions')
                .insert({
                    user_id: this.currentUser.id,
                    content_id: postId,
                    platform: platform,
                    status: 'completed',
                    reward_earned: post.reward_amount,
                    completed_at: new Date().toISOString()
                });

            if (completionError) throw completionError;

            // Update user earnings
            const earningsColumn = platform === 'tiktok' ? 'tiktok' : 
                                  platform === 'youtube' ? 'youtube' : 'trivia';
            
            const { data: currentEarnings } = await this.supabase
                .from('earnings')
                .select(earningsColumn, 'all_time_earn')
                .eq('id', this.currentUser.id)
                .single();

            const newAmount = (currentEarnings[earningsColumn] || 0) + post.reward_amount;
            const newTotal = (currentEarnings.all_time_earn || 0) + post.reward_amount;

            await this.supabase
                .from('earnings')
                .update({
                    [earningsColumn]: newAmount,
                    all_time_earn: newTotal
                })
                .eq('id', this.currentUser.id);

            // Update UI
            this.taskCooldowns[postId] = true;
            
            const claimBtn = document.querySelector(`[data-post-id="${postId}"]`);
            if (claimBtn) {
                claimBtn.disabled = true;
                claimBtn.textContent = 'Claimed!';
                claimBtn.style.opacity = '0.5';
            }

            // Update earnings display
            this.updateEarningsDisplay(earningsColumn, newAmount);
            this.updateEarningsDisplay('total_income', newTotal);

            this.showNotification(`Successfully claimed UGX ${post.reward_amount}!`, 'success');

        } catch (error) {
            console.error('Error claiming reward:', error);
            this.showNotification('Error claiming reward. Please try again.', 'error');
        }
    }

    updateEarningsDisplay(type, amount) {
        const element = document.getElementById(type);
        if (element) {
            element.textContent = `UGX ${amount.toLocaleString()}`;
        }
    }

    // TRIVIA SUBMISSION
    async submitTriviaAnswers(triviaId, questions) {
        try {
            let correctCount = 0;
            
            questions.forEach((q, index) => {
                const selected = document.querySelector(`input[name="q${index + 1}"]:checked`);
                if (selected && selected.value === q.correct_answer) {
                    correctCount++;
                }
            });

            // Minimum 3 correct answers to earn reward
            if (correctCount >= 3) {
                // Get trivia post
                const { data: trivia, error } = await this.supabase
                    .from('dashboard_contents')
                    .select('reward_amount')
                    .eq('id', triviaId)
                    .single();

                if (error) throw error;

                // Record completion
                await this.supabase
                    .from('user_task_completions')
                    .insert({
                        user_id: this.currentUser.id,
                        content_id: triviaId,
                        platform: 'trivia',
                        status: 'completed',
                        reward_earned: trivia.reward_amount,
                        completed_at: new Date().toISOString()
                    });

                // Update earnings
                const { data: currentEarnings } = await this.supabase
                    .from('earnings')
                    .select('trivia, all_time_earn')
                    .eq('id', this.currentUser.id)
                    .single();

                const newTrivia = (currentEarnings.trivia || 0) + trivia.reward_amount;
                const newTotal = (currentEarnings.all_time_earn || 0) + trivia.reward_amount;

                await this.supabase
                    .from('earnings')
                    .update({
                        trivia: newTrivia,
                        all_time_earn: newTotal
                    })
                    .eq('id', this.currentUser.id);

                this.updateEarningsDisplay('trivia', newTrivia);
                this.updateEarningsDisplay('total_income', newTotal);

                this.showNotification(`You got ${correctCount}/5 correct! Earned UGX ${trivia.reward_amount}`, 'success');
            } else {
                this.showNotification(`Only ${correctCount}/5 correct. Need 3+ correct answers to earn reward.`, 'warning');
            }

        } catch (error) {
            console.error('Error submitting trivia:', error);
            this.showNotification('Error submitting answers. Please try again.', 'error');
        }
    }

    // EVENT LISTENERS SETUP
    setupEventListeners() {
        // Delegate event handling for dynamically created buttons
        document.addEventListener('click', (e) => {
            // TikTok claim buttons
            if (e.target.classList.contains('claim-btn-tiktok')) {
                const postId = e.target.dataset.postId;
                if (postId && !this.taskCooldowns[postId]) {
                    this.claimReward(postId, 'tiktok');
                }
            }
            
            // YouTube claim buttons
            if (e.target.classList.contains('claim-btn-youtube')) {
                const postId = e.target.dataset.postId;
                if (postId && !this.taskCooldowns[postId]) {
                    this.claimReward(postId, 'youtube');
                }
            }
        });

        // Refresh buttons
        document.getElementById('refresh-tiktok')?.addEventListener('click', () => {
            this.loadDashboardContent();
            this.showNotification('TikTok tasks refreshed!', 'info');
        });

        document.getElementById('refresh-youtube')?.addEventListener('click', () => {
            this.loadDashboardContent();
            this.showNotification('YouTube tasks refreshed!', 'info');
        });

        // Logout
        document.getElementById('logout')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('#navLinks a[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Close mobile menu if open
                const sideMenu = document.getElementById('sideMenu');
                if (sideMenu?.classList.contains('active')) {
                    sideMenu.classList.remove('active');
                    document.querySelector('.overlay').style.display = 'none';
                }
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section-specific data
            switch(sectionName) {
                case 'withdrawals':
                    this.loadDownlines();
                    break;
                case 'stats':
                    this.loadWithdrawalHistory();
                    break;
            }
        }
    }

    async loadDownlines() {
        try {
            const { data: downlines, error } = await this.supabase
                .from('refferals')
                .select(`
                    referred:users!refferals_referred_id_fkey (
                        user_name,
                        email_address,
                        created_at,
                        status
                    )
                `)
                .eq('inviter_id', this.currentUser.id);

            if (error) throw error;

            const tbody = document.querySelector('#downlines-table tbody');
            if (tbody) {
                let html = '';
                
                downlines.forEach(ref => {
                    const user = ref.referred;
                    if (user) {
                        html += `
                            <tr>
                                <td>${user.user_name || 'N/A'}</td>
                                <td>${user.email_address || 'N/A'}</td>
                                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                <td><span class="status-active">${user.status || 'active'}</span></td>
                                <td>Level 1</td>
                                <td>UGX 7,000</td>
                            </tr>
                        `;
                    }
                });
                
                tbody.innerHTML = html || '<tr><td colspan="6">No referrals yet</td></tr>';
                
                // Update summary
                document.getElementById('l1Users').textContent = downlines.length;
                document.getElementById('referral').textContent = `UGX ${(downlines.length * 7000).toLocaleString()}`;
            }
            
        } catch (error) {
            console.error('Error loading downlines:', error);
        }
    }

    async loadWithdrawalHistory() {
        try {
            const { data: withdrawals, error } = await this.supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tbody = document.querySelector('#withdraw_history');
            if (tbody) {
                let html = '<tr><th>Date</th><th>ID</th><th>Amount</th><th>Wallet</th><th>Method</th><th>Status</th></tr>';
                
                withdrawals.forEach(w => {
                    html += `
                        <tr>
                            <td>${new Date(w.created_at).toLocaleDateString()}</td>
                            <td>${w.request_id || 'N/A'}</td>
                            <td>UGX ${w.amount?.toLocaleString() || 0}</td>
                            <td>${w.wallet_type || 'N/A'}</td>
                            <td>${w.payment_method || 'N/A'}</td>
                            <td><span class="status-${w.status}">${w.status}</span></td>
                        </tr>
                    `;
                });
                
                tbody.innerHTML = html;
                
                // Update pending count
                const pending = withdrawals.filter(w => w.status === 'pending').length;
                document.getElementById('pendingWithdrawals').textContent = pending;
            }
            
        } catch (error) {
            console.error('Error loading withdrawals:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#2ecc71' : 
                        type === 'error' ? '#e74c3c' : 
                        type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Helper functions (attach to window for inline onclick)
    followAccount(sponsor, platform) {
        this.showNotification(`Following ${sponsor} on ${platform}...`, 'info');
        // In real implementation, this would open the social media profile
    }

    likeContent(postId, platform) {
        this.showNotification(`Liked content on ${platform}`, 'info');
    }

    subscribeChannel(channel) {
        this.showNotification(`Subscribed to ${channel}`, 'info');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardContentManager();
});

// Make functions available for inline onclick
window.dashboardManager = {
    openVideoModal: function(url, platform) {
        if (window.dashboardManager) {
            window.dashboardManager.openVideoModal(url, platform);
        }
    },
    closeVideoModal: function() {
        if (window.dashboardManager) {
            window.dashboardManager.closeVideoModal();
        }
    },
    followAccount: function(sponsor, platform) {
        if (window.dashboardManager) {
            window.dashboardManager.followAccount(sponsor, platform);
        }
    },
    likeContent: function(postId, platform) {
        if (window.dashboardManager) {
            window.dashboardManager.likeContent(postId, platform);
        }
    },
    subscribeChannel: function(channel) {
        if (window.dashboardManager) {
            window.dashboardManager.subscribeChannel(channel);
        }
    }
};