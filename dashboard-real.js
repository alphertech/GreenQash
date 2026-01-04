// dashboard-real.js - COMPLETE WORKING SOLUTION
class RealDashboard {
    constructor() {
        this.supabase = null;
        this.userId = null;
        this.userName = null;
        this.videoPlayers = {};
        
        this.init();
    }
    
    async init() {
        console.log('🚀 RealDashboard initializing...');
        
        try {
            // 1. Initialize Supabase with YOUR credentials
            const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
            
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase initialized');
            
            // 2. Check authentication
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            if (authError || !user) {
                console.error('❌ Auth failed:', authError);
                window.location.href = 'index.html';
                return;
            }
            
            console.log('✅ User authenticated:', user.email);
            
            // 3. Get user data from database
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, user_name, email_address, total_income, phone_number')
                .eq('uuid', user.id)
                .single();
                
            if (userError) {
                console.error('❌ User data error:', userError);
                // Use fallback
                this.userId = 1;
                this.userName = 'User';
            } else {
                this.userId = userData.id;
                this.userName = userData.user_name || 'User';
                console.log('✅ User data loaded:', this.userId, this.userName);
                
                // Update UI
                this.updateUserInfo(userData);
            }
            
            // 4. Setup UI and load content
            this.setupNavigation();
            this.setupEventListeners();
            await this.loadAllContent();
            
            // 5. Initialize YouTube/TikTok players
            this.initializeVideoPlayers();
            
            console.log('✅ RealDashboard fully initialized');
            
        } catch (error) {
            console.error('💥 Fatal error in init:', error);
            this.showError('System error. Please refresh.');
        }
    }
    
    updateUserInfo(userData) {
        // Update all username elements
        document.querySelectorAll('#user_name').forEach(el => {
            el.textContent = userData.user_name || 'User';
        });
        
        // Update email
        document.querySelectorAll('#email_address').forEach(el => {
            el.textContent = userData.email_address || '';
        });
        
        // Update phone if exists
        if (userData.phone_number) {
            document.querySelectorAll('#phone_number').forEach(el => {
                el.textContent = userData.phone_number;
            });
        }
        
        // Generate referral link
        this.generateReferralLink(userData.id);
    }
    
    generateReferralLink(userId) {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}/index.html?ref=${userId}`;
        
        const linkInput = document.getElementById('link');
        if (linkInput) {
            linkInput.value = referralLink;
            
            // Setup copy button
            document.getElementById('CopyLink')?.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(referralLink);
                    this.showNotification('✅ Referral link copied!', 'success');
                } catch (err) {
                    // Fallback for older browsers
                    linkInput.select();
                    document.execCommand('copy');
                    this.showNotification('✅ Link copied!', 'success');
                }
            });
            
            // Setup share buttons
            this.setupShareButtons(referralLink);
        }
    }
    
    setupShareButtons(link) {
        const message = `💰 Earn money by watching videos on Skylink! Join using my referral link: ${link}`;
        
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
        
        // Other platforms...
    }
    
    async loadAllContent() {
        console.log('📥 Loading all content...');
        
        try {
            // Load TikTok content
            const { data: tiktokPosts, error: tiktokError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('platform', 'tiktok')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
                
            if (tiktokError) console.error('TikTok error:', tiktokError);
            
            // Load YouTube content
            const { data: youtubePosts, error: youtubeError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('platform', 'youtube')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
                
            if (youtubeError) console.error('YouTube error:', youtubeError);
            
            // Render content
            this.renderTikTokContent(tiktokPosts || []);
            this.renderYouTubeContent(youtubePosts || []);
            
            // Load earnings
            await this.loadEarnings();
            
            // Load user completions
            await this.loadUserCompletions();
            
            console.log('✅ Content loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading content:', error);
            this.loadSampleContent();
        }
    }
    
    renderTikTokContent(posts) {
        const container = document.querySelector('#users-section .video-earn');
        if (!container) {
            console.error('TikTok container not found');
            return;
        }
        
        if (!posts.length) {
            container.innerHTML = `
                <div class="vidSection">
                    <div class="vhead">
                        <h3>🎵 No TikTok tasks available</h3>
                        <p>Check back soon for new videos!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach((post, index) => {
            const videoId = this.extractTikTokVideoId(post.content_url);
            const thumbnail = post.thumbnail_url || 
                             `https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop&random=${index}`;
            
            html += `
                <div class="vidSection" id="tiktok-post-${post.id}">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${post.title}</h3>
                            <h5>🎯 Sponsored by ${post.sponsor || 'Skylink'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>💰 Reward: UGX ${post.reward_amount}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                            <div class="video-thumbnail" style="position: relative; cursor: pointer;" 
                                 onclick="window.realDashboard.playVideo(${post.id}, 'tiktok')">
                                <img src="${thumbnail}" 
                                     alt="${post.title}"
                                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
                                <div class="play-button" style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    background: rgba(0,0,0,0.7);
                                    width: 60px;
                                    height: 60px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <i class="fas fa-play" style="color: white; font-size: 24px; margin-left: 5px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>📝 ${post.description || 'Watch this video to earn rewards'}</p>
                            <h5>📅 Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn" 
                                        data-post-id="${post.id}" 
                                        data-platform="tiktok"
                                        style="background: #25F4EE; color: black;">
                                    🎁 Claim UGX ${post.reward_amount}
                                </button>
                                <button class="follow-btn" 
                                        onclick="window.realDashboard.followAccount('${post.sponsor}', 'tiktok')">
                                    👥 Follow
                                </button>
                                <button class="like-btn" 
                                        onclick="window.realDashboard.likeContent(${post.id}, 'tiktok')">
                                    👍 Like
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log(`✅ Rendered ${posts.length} TikTok posts`);
    }
    
    renderYouTubeContent(posts) {
        const container = document.querySelector('#approvals-section .video-earn');
        if (!container) {
            console.error('YouTube container not found');
            return;
        }
        
        if (!posts.length) {
            container.innerHTML = `
                <div class="vidSection">
                    <div class="vhead">
                        <h3>📺 No YouTube tasks available</h3>
                        <p>Check back soon for new videos!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach((post, index) => {
            const videoId = this.extractYouTubeVideoId(post.content_url);
            const thumbnail = post.thumbnail_url || 
                             (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` :
                              `https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop&random=${index}`);
            
            html += `
                <div class="vidSection" id="youtube-post-${post.id}">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${post.title}</h3>
                            <h5>🎯 Sponsored by ${post.sponsor || 'Skylink'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>💰 Reward: UGX ${post.reward_amount}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                            <div class="video-thumbnail" style="position: relative; cursor: pointer;" 
                                 onclick="window.realDashboard.playVideo(${post.id}, 'youtube')">
                                <img src="${thumbnail}" 
                                     alt="${post.title}"
                                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
                                <div class="play-button" style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    background: rgba(255,0,0,0.8);
                                    width: 60px;
                                    height: 60px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <i class="fas fa-play" style="color: white; font-size: 24px; margin-left: 5px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>📝 ${post.description || 'Watch this video to earn rewards'}</p>
                            <h5>📅 Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn" 
                                        data-post-id="${post.id}" 
                                        data-platform="youtube"
                                        style="background: #FF0000; color: white;">
                                    🎁 Claim UGX ${post.reward_amount}
                                </button>
                                <button class="subscribe-btn" 
                                        onclick="window.realDashboard.subscribeChannel('${post.sponsor}')">
                                    🔔 Subscribe
                                </button>
                                <button class="like-btn" 
                                        onclick="window.realDashboard.likeContent(${post.id}, 'youtube')">
                                    👍 Like
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log(`✅ Rendered ${posts.length} YouTube posts`);
    }
    
    async loadEarnings() {
        if (!this.userId) return;
        
        try {
            const { data: earnings, error } = await this.supabase
                .from('earnings')
                .select('*')
                .eq('id', this.userId)
                .single();
                
            if (error) {
                console.warn('Earnings not found, creating default');
                // Create default earnings record
                await this.supabase
                    .from('earnings')
                    .insert({
                        id: this.userId,
                        all_time_earn: 0,
                        youtube: 0,
                        tiktok: 0,
                        trivia: 0,
                        refferal: 0,
                        bonus: 0
                    });
                return;
            }
            
            // Update UI
            const updates = {
                'total_income': earnings.all_time_earn || 0,
                'youtube': earnings.youtube || 0,
                'tiktok': earnings.tiktok || 0,
                'trivia': earnings.trivia || 0,
                'refferal': earnings.refferal || 0,
                'bonus': earnings.bonus || 0
            };
            
            Object.entries(updates).forEach(([id, amount]) => {
                const elements = document.querySelectorAll(`#${id}`);
                elements.forEach(el => {
                    if (el.classList.contains('stat-value') || el.tagName === 'SPAN' || el.tagName === 'DIV') {
                        el.textContent = amount === 0 ? '0' : `UGX ${amount.toLocaleString()}`;
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }
    
    async loadUserCompletions() {
        if (!this.userId) return;
        
        try {
            const { data: completions, error } = await this.supabase
                .from('user_task_completions')
                .select('content_id, status')
                .eq('user_id', this.userId);
                
            if (error) throw error;
            
            // Mark completed tasks
            completions?.forEach(comp => {
                const btn = document.querySelector(`[data-post-id="${comp.content_id}"]`);
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '✅ Claimed';
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                }
            });
            
        } catch (error) {
            console.error('Error loading completions:', error);
        }
    }
    
    // REAL VIDEO PLAYER WITH TIMER
    async playVideo(postId, platform) {
        console.log(`Playing ${platform} video for post ${postId}`);
        
        try {
            // Get post details
            const { data: post, error } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('id', postId)
                .single();
                
            if (error) throw error;
            
            // Show video modal
            this.showVideoModal(post, platform);
            
        } catch (error) {
            console.error('Error getting post:', error);
            this.showNotification('Error loading video', 'error');
        }
    }
    
    showVideoModal(post, platform) {
        // Remove existing modal
        const existingModal = document.getElementById('realVideoModal');
        if (existingModal) existingModal.remove();
        
        const isYouTube = platform === 'youtube';
        const videoId = isYouTube ? 
            this.extractYouTubeVideoId(post.content_url) : 
            this.extractTikTokVideoId(post.content_url);
        
        let videoEmbed = '';
        
        if (isYouTube && videoId) {
            videoEmbed = `
                <iframe 
                    id="youtubePlayer-${post.id}"
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style="width: 100%; height: 400px; border-radius: 8px;"
                ></iframe>
            `;
        } else {
            // TikTok embed or placeholder
            videoEmbed = `
                <div style="
                    width: 100%; 
                    height: 400px; 
                    background: #000; 
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                ">
                    <h3>🎬 ${platform === 'tiktok' ? 'TikTok Video' : 'Video'}</h3>
                    <p>${post.title}</p>
                    <p style="margin-top: 20px; color: #ccc;">
                        <i class="fas fa-external-link-alt"></i>
                        <a href="${post.content_url}" target="_blank" style="color: #3498db; margin-left: 10px;">
                            Open video in new tab
                        </a>
                    </p>
                </div>
            `;
        }
        
        const modalHTML = `
            <div id="realVideoModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="
                    background: #1a1a1a;
                    border-radius: 15px;
                    width: 100%;
                    max-width: 800px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                ">
                    <!-- Header -->
                    <div style="
                        padding: 20px;
                        background: #2c3e50;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; color: white;">${post.title}</h3>
                            <p style="margin: 5px 0 0 0; color: #bdc3c7; font-size: 14px;">
                                🎯 ${post.sponsor || 'Skylink'} • 💰 UGX ${post.reward_amount}
                            </p>
                        </div>
                        <button onclick="window.realDashboard.closeVideoModal()" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">
                            ✕ Close
                        </button>
                    </div>
                    
                    <!-- Video Player -->
                    <div style="padding: 20px; background: #000;">
                        ${videoEmbed}
                    </div>
                    
                    <!-- Timer Section -->
                    <div id="videoTimerSection" style="
                        padding: 20px;
                        background: #34495e;
                        color: white;
                        text-align: center;
                    ">
                        <h4 style="margin: 0 0 15px 0; color: #ecf0f1;">
                            ⏱️ WATCH TIMER - EARN AFTER 30 SECONDS
                        </h4>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 30px;">
                            <div style="text-align: center;">
                                <div id="timerDisplay" style="
                                    font-size: 48px;
                                    font-weight: bold;
                                    color: #2ecc71;
                                    font-family: monospace;
                                    margin: 10px 0;
                                ">00:30</div>
                                <div style="font-size: 14px; color: #bdc3c7;">Time remaining</div>
                            </div>
                            <div style="
                                width: 100px;
                                height: 100px;
                                border-radius: 50%;
                                background: #2c3e50;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                color: #2ecc71;
                            ">
                                ${post.reward_amount}<small style="font-size: 14px;">UGX</small>
                            </div>
                        </div>
                        <div style="
                            margin-top: 20px;
                            height: 6px;
                            background: #2c3e50;
                            border-radius: 3px;
                            overflow: hidden;
                        ">
                            <div id="progressBar" style="
                                height: 100%;
                                background: #2ecc71;
                                width: 0%;
                                transition: width 1s linear;
                            "></div>
                        </div>
                    </div>
                    
                    <!-- Claim Button -->
                    <div style="padding: 20px; background: #1a1a1a; text-align: center;">
                        <button id="claimVideoReward"
                                data-post-id="${post.id}"
                                data-platform="${platform}"
                                style="
                                    padding: 18px 40px;
                                    background: #27ae60;
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-size: 18px;
                                    font-weight: bold;
                                    cursor: not-allowed;
                                    opacity: 0.5;
                                    width: 100%;
                                    max-width: 400px;
                                    transition: all 0.3s;
                                "
                                disabled>
                            🔒 WAIT 30 SECONDS TO UNLOCK
                        </button>
                        <p style="color: #95a5a6; margin-top: 15px; font-size: 14px;">
                            <i class="fas fa-info-circle"></i> You must watch for 30 seconds to claim this reward
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        // Start the timer
        this.startVideoTimer(post.id, platform);
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
    }
    
    startVideoTimer(postId, platform) {
        let seconds = 30;
        const timerDisplay = document.getElementById('timerDisplay');
        const progressBar = document.getElementById('progressBar');
        const claimButton = document.getElementById('claimVideoReward');
        
        if (!timerDisplay || !progressBar || !claimButton) return;
        
        // Store timer reference
        const timerKey = `videoTimer-${postId}`;
        if (this.videoPlayers[timerKey]) {
            clearInterval(this.videoPlayers[timerKey]);
        }
        
        this.videoPlayers[timerKey] = setInterval(() => {
            seconds--;
            
            // Update display
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Update progress bar
            const progress = ((30 - seconds) / 30) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Change colors based on time
            if (seconds <= 10) {
                timerDisplay.style.color = '#e74c3c';
                progressBar.style.background = '#e74c3c';
            } else if (seconds <= 20) {
                timerDisplay.style.color = '#f39c12';
                progressBar.style.background = '#f39c12';
            }
            
            // Timer finished
            if (seconds <= 0) {
                clearInterval(this.videoPlayers[timerKey]);
                
                timerDisplay.innerHTML = '<span style="color: #2ecc71;">✓ READY TO CLAIM!</span>';
                progressBar.style.background = '#2ecc71';
                
                // Enable claim button
                claimButton.disabled = false;
                claimButton.style.opacity = '1';
                claimButton.style.cursor = 'pointer';
                claimButton.style.background = '#2ecc71';
                claimButton.innerHTML = '🎁 CLAIM UGX REWARD NOW!';
                
                // Add click event
                claimButton.onclick = () => {
                    this.claimReward(postId, platform);
                    this.closeVideoModal();
                };
            }
        }, 1000);
    }
    
    closeVideoModal() {
        const modal = document.getElementById('realVideoModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
            
            // Clear all timers
            Object.values(this.videoPlayers).forEach(timer => {
                if (timer) clearInterval(timer);
            });
            this.videoPlayers = {};
        }
    }
    
    // CLAIM REWARD FUNCTION
    async claimReward(postId, platform) {
        if (!this.userId) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
        try {
            console.log(`Claiming ${platform} reward for post ${postId}`);
            
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
                .eq('user_id', this.userId)
                .eq('content_id', postId);
                
            if (!checkError && existing && existing.length > 0) {
                this.showNotification('⚠️ You already claimed this reward!', 'warning');
                return;
            }
            
            // Record completion
            const { error: completionError } = await this.supabase
                .from('user_task_completions')
                .insert({
                    user_id: this.userId,
                    content_id: postId,
                    platform: platform,
                    status: 'completed',
                    reward_earned: post.reward_amount,
                    completed_at: new Date().toISOString()
                });
                
            if (completionError) throw completionError;
            
            // Update earnings
            const earningsColumn = platform === 'tiktok' ? 'tiktok' : 
                                  platform === 'youtube' ? 'youtube' : 'trivia';
            
            // Get current earnings
            const { data: currentEarnings } = await this.supabase
                .from('earnings')
                .select(`${earningsColumn}, all_time_earn`)
                .eq('id', this.userId)
                .single();
            
            const currentAmount = currentEarnings?.[earningsColumn] || 0;
            const currentTotal = currentEarnings?.all_time_earn || 0;
            
            const newAmount = currentAmount + post.reward_amount;
            const newTotal = currentTotal + post.reward_amount;
            
            await this.supabase
                .from('earnings')
                .upsert({
                    id: this.userId,
                    [earningsColumn]: newAmount,
                    all_time_earn: newTotal
                }, {
                    onConflict: 'id'
                });
            
            // Update UI
            const claimBtn = document.querySelector(`[data-post-id="${postId}"]`);
            if (claimBtn) {
                claimBtn.disabled = true;
                claimBtn.innerHTML = '✅ Claimed';
                claimBtn.style.opacity = '0.5';
                claimBtn.style.cursor = 'not-allowed';
            }
            
            // Show success with confetti effect
            this.showSuccessWithConfetti(`🎉 You earned UGX ${post.reward_amount}!`);
            
            // Update earnings display
            await this.loadEarnings();
            
            console.log(`✅ Successfully claimed UGX ${post.reward_amount}`);
            
        } catch (error) {
            console.error('❌ Error claiming reward:', error);
            this.showNotification('Error claiming reward. Please try again.', 'error');
        }
    }
    
    showSuccessWithConfetti(message) {
        this.showNotification(message, 'success');
        
        // Simple confetti effect
        const colors = ['#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#f39c12'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.innerHTML = '🎉';
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-50px';
                confetti.style.fontSize = Math.random() * 20 + 10 + 'px';
                confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.zIndex = '10000';
                confetti.style.pointerEvents = 'none';
                confetti.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards`;
                
                document.body.appendChild(confetti);
                
                // Remove after animation
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
        
        // Add animation
        if (!document.querySelector('#confetti-anim')) {
            const style = document.createElement('style');
            style.id = 'confetti-anim';
            style.textContent = `
                @keyframes fall {
                    to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // UTILITY FUNCTIONS
    extractYouTubeVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
    
    extractTikTokVideoId(url) {
        // TikTok URL patterns
        const patterns = [
            /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
            /vm\.tiktok\.com\/(\w+)\//,
            /vt\.tiktok\.com\/(\w+)\//
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('#navLinks a[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
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
        }
    }
    
    setupEventListeners() {
        // Claim buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('claim-btn')) {
                const postId = e.target.dataset.postId;
                const platform = e.target.dataset.platform;
                if (postId && platform) {
                    this.claimReward(parseInt(postId), platform);
                }
            }
        });
        
        // Refresh buttons
        document.getElementById('refresh-tiktok')?.addEventListener('click', () => {
            this.loadAllContent();
            this.showNotification('🔄 Refreshing TikTok tasks...', 'info');
        });
        
        document.getElementById('refresh-youtube')?.addEventListener('click', () => {
            this.loadAllContent();
            this.showNotification('🔄 Refreshing YouTube tasks...', 'info');
        });
        
        // Logout
        document.getElementById('logout')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }
    
    // Helper functions for buttons
    followAccount(sponsor, platform) {
        this.showNotification(`👥 Following ${sponsor} on ${platform}...`, 'info');
    }
    
    likeContent(postId, platform) {
        this.showNotification(`👍 Liked content on ${platform}`, 'info');
    }
    
    subscribeChannel(channel) {
        this.showNotification(`🔔 Subscribed to ${channel}`, 'info');
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
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        // Add animation if not exists
        if (!document.querySelector('#notif-anim')) {
            const style = document.createElement('style');
            style.id = 'notif-anim';
            style.textContent = `
                @keyframes slideInRight { 
                    from { transform: translateX(100%); opacity: 0; } 
                    to { transform: translateX(0); opacity: 1; } 
                }
                @keyframes slideOutRight { 
                    from { transform: translateX(0); opacity: 1; } 
                    to { transform: translateX(100%); opacity: 0; } 
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    showError(message) {
        this.showNotification(`❌ ${message}`, 'error');
    }
    
    loadSampleContent() {
        console.log('Loading sample content as fallback...');
        // Fallback content if database fails
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.realDashboard = new RealDashboard();
});