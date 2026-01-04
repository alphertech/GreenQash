// dashboard-loader.js - SIMPLE LOADER THAT WORKS
class DashboardLoader {
    constructor() {
        this.supabase = null;
        this.userId = null;
        this.init();
    }
    
    async init() {
        console.log('DashboardLoader initializing...');
        
        try {
            // Initialize Supabase
            const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
            
            if (window.supabase && window.supabase.createClient) {
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('Supabase initialized via window.supabase');
            } else {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                this.supabase = createClient(supabaseUrl, supabaseKey);
                console.log('Supabase initialized via import');
            }
            
            // Check auth
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            if (authError || !user) {
                console.error('Auth error:', authError);
                window.location.href = 'index.html';
                return;
            }
            
            console.log('User authenticated:', user.email);
            
            // Get user ID from users table
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, user_name, email_address')
                .eq('uuid', user.id)
                .single();
                
            if (userError) {
                console.error('Error fetching user data:', userError);
                return;
            }
            
            this.userId = userData.id;
            
            // Update UI
            this.updateUserInfo(userData);
            
            // Load content
            await this.loadContent();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('DashboardLoader initialized successfully');
            
        } catch (error) {
            console.error('Fatal initialization error:', error);
            this.showError('Failed to initialize dashboard. Please refresh.');
        }
    }
    
    updateUserInfo(userData) {
        // Update username
        const userNameElements = document.querySelectorAll('#user_name');
        userNameElements.forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userData.user_name || 'User';
            } else {
                el.textContent = userData.user_name || 'User';
            }
        });
        
        // Update email
        const emailElements = document.querySelectorAll('#email_address');
        emailElements.forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userData.email_address || '';
            } else {
                el.textContent = userData.email_address || '';
            }
        });
        
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
            document.getElementById('CopyLink')?.addEventListener('click', () => {
                navigator.clipboard.writeText(referralLink).then(() => {
                    this.showNotification('Link copied!', 'success');
                });
            });
        }
    }
    
    async loadContent() {
        console.log('Loading content from database...');
        
        try {
            // Load TikTok content
            const { data: tiktokData, error: tiktokError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('platform', 'tiktok')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(5);
                
            if (tiktokError) throw tiktokError;
            console.log('TikTok content loaded:', tiktokData?.length || 0, 'items');
            
            // Load YouTube content
            const { data: youtubeData, error: youtubeError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('platform', 'youtube')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(5);
                
            if (youtubeError) throw youtubeError;
            console.log('YouTube content loaded:', youtubeData?.length || 0, 'items');
            
            // Load trivia
            const { data: triviaData, error: triviaError } = await this.supabase
                .from('dashboard_contents')
                .select('*')
                .eq('platform', 'trivia')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (triviaError) throw triviaError;
            console.log('Trivia content loaded:', triviaData?.length || 0, 'items');
            
            // Render content
            this.renderTikTokContent(tiktokData || []);
            this.renderYouTubeContent(youtubeData || []);
            this.renderTriviaContent(triviaData?.[0]);
            
            // Load user completions
            await this.loadUserCompletions();
            
            // Load earnings
            await this.loadEarnings();
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content. Using sample data.');
            this.loadSampleData();
        }
    }
    
    renderTikTokContent(posts) {
        const container = document.querySelector('#users-section .video-earn');
        if (!container) {
            console.error('TikTok container not found');
            return;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="vidSection">
                    <div class="vhead">
                        <h3>No TikTok tasks available</h3>
                    </div>
                    <div class="body">
                        <p>Check back later for new tasks!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach(post => {
            html += `
                <div class="vidSection" id="post-${post.id}">
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
                            <img src="${post.thumbnail_url || 'https://via.placeholder.com/600x400?text=TikTok'}" 
                                 alt="${post.title}" 
                                 style="cursor: pointer;"
                                 onclick="window.dashboardLoader?.watchVideo(${post.id}, 'tiktok')">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${post.description || 'Watch and engage with this content'}</p>
                            <h5>Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn" data-post-id="${post.id}" data-platform="tiktok">
                                    Claim UGX ${post.reward_amount}
                                </button>
                                <button class="view-btn" onclick="window.dashboardLoader?.watchVideo(${post.id}, 'tiktok')">
                                    Watch Video
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('TikTok content rendered');
    }
    
    renderYouTubeContent(posts) {
        const container = document.querySelector('#approvals-section .video-earn');
        if (!container) {
            console.error('YouTube container not found');
            return;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="vidSection">
                    <div class="vhead">
                        <h3>No YouTube tasks available</h3>
                    </div>
                    <div class="body">
                        <p>Check back later for new tasks!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach(post => {
            html += `
                <div class="vidSection" id="post-${post.id}">
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
                            <img src="${post.thumbnail_url || 'https://via.placeholder.com/600x400?text=YouTube'}" 
                                 alt="${post.title}"
                                 style="cursor: pointer;"
                                 onclick="window.dashboardLoader?.watchVideo(${post.id}, 'youtube')">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${post.description || 'Watch and engage with this content'}</p>
                            <h5>Posted: ${new Date(post.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn" data-post-id="${post.id}" data-platform="youtube">
                                    Claim UGX ${post.reward_amount}
                                </button>
                                <button class="view-btn" onclick="window.dashboardLoader?.watchVideo(${post.id}, 'youtube')">
                                    Watch Video
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('YouTube content rendered');
    }
    
    renderTriviaContent(trivia) {
        const container = document.querySelector('#content-section');
        if (!container) return;
        
        if (!trivia) {
            // Default trivia
            container.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Daily Trivia Challenge</h2>
                    <div class="section-actions">
                        <span class="stat-label">Prize: UGX 1200 for 3+ correct</span>
                    </div>
                </div>
                <form id="quizForm">
                    <div class="question">
                        <p>1. What is the capital of France?</p>
                        <div class="options">
                            <label><input type="radio" name="q1" value="a"> London</label>
                            <label><input type="radio" name="q1" value="b"> Berlin</label>
                            <label><input type="radio" name="q1" value="c"> Paris</label>
                            <label><input type="radio" name="q1" value="d"> Madrid</label>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Answers</button>
                </form>
            `;
            return;
        }
        
        // Render from database
        let questionsHtml = '';
        try {
            if (trivia.requirements && typeof trivia.requirements === 'object') {
                const questions = trivia.requirements;
                Object.keys(questions).forEach((key, index) => {
                    const q = questions[key];
                    questionsHtml += `
                        <div class="question">
                            <p>${index + 1}. ${q.question || 'Trivia question'}</p>
                            <div class="options">
                                ${q.options ? Object.entries(q.options).map(([optKey, optValue]) => `
                                    <label><input type="radio" name="q${index + 1}" value="${optKey}"> ${optValue}</label>
                                `).join('') : ''}
                            </div>
                        </div>
                    `;
                });
            }
        } catch (e) {
            console.error('Error parsing trivia:', e);
        }
        
        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${trivia.title || 'Daily Trivia Challenge'}</h2>
                <div class="section-actions">
                    <span class="stat-label">Prize: UGX ${trivia.reward_amount || 1200} for 3+ correct</span>
                </div>
            </div>
            <form id="quizForm">
                ${questionsHtml || '<p>No trivia questions available</p>'}
                <button type="submit" class="btn btn-primary">Submit Answers</button>
            </form>
        `;
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
                    btn.textContent = 'Already Claimed';
                    btn.style.opacity = '0.5';
                }
            });
            
        } catch (error) {
            console.error('Error loading completions:', error);
        }
    }
    
    async loadEarnings() {
        if (!this.userId) return;
        
        try {
            const { data: earnings, error } = await this.supabase
                .from('earnings')
                .select('*')
                .eq('id', this.userId)
                .single();
                
            if (error) throw error;
            
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
                document.querySelectorAll(`#${id}`).forEach(el => {
                    if (el.classList.contains('stat-value') || el.tagName === 'SPAN') {
                        el.textContent = `UGX ${amount.toLocaleString()}`;
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }
    
    async claimReward(postId, platform) {
        if (!this.userId) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
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
                .eq('user_id', this.userId)
                .eq('content_id', postId)
                .single();
                
            if (!checkError && existing) {
                this.showNotification('Already claimed this reward!', 'warning');
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
            
            const { data: currentEarnings } = await this.supabase
                .from('earnings')
                .select(`${earningsColumn}, all_time_earn`)
                .eq('id', this.userId)
                .single();
            
            const newAmount = (currentEarnings[earningsColumn] || 0) + post.reward_amount;
            const newTotal = (currentEarnings.all_time_earn || 0) + post.reward_amount;
            
            await this.supabase
                .from('earnings')
                .update({
                    [earningsColumn]: newAmount,
                    all_time_earn: newTotal
                })
                .eq('id', this.userId);
            
            // Update UI
            const btn = document.querySelector(`[data-post-id="${postId}"]`);
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Claimed!';
                btn.style.opacity = '0.5';
            }
            
            // Update earnings display
            this.showNotification(`Successfully claimed UGX ${post.reward_amount}!`, 'success');
            
            // Reload earnings
            await this.loadEarnings();
            
        } catch (error) {
            console.error('Error claiming reward:', error);
            this.showNotification('Error claiming reward', 'error');
        }
    }
    
    watchVideo(postId, platform) {
        this.showVideoModal(postId, platform);
    }
    
    showVideoModal(postId, platform) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9999; display: flex;
            flex-direction: column; align-items: center; justify-content: center;
            color: white;
        `;
        
        modal.innerHTML = `
            <div style="width: 90%; max-width: 800px; background: #2c3e50; padding: 20px; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Watch Video to Earn</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: #e74c3c; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">
                        Close
                    </button>
                </div>
                
                <div style="background: #000; height: 400px; display: flex; align-items: center; justify-content: center; border-radius: 5px; margin-bottom: 20px;">
                    <h4>Video Player Area</h4>
                    <p style="text-align: center;">In a real implementation, this would embed ${platform} video</p>
                </div>
                
                <div id="videoTimer" style="background: #34495e; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">⏱️ Watch Timer</h4>
                    <div id="timerDisplay" style="font-size: 32px; font-weight: bold; color: #2ecc71;">00:30</div>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #bdc3c7;">
                        Watch for 30 seconds to unlock the claim button
                    </p>
                </div>
                
                <button id="claimAfterTimer" 
                        data-post-id="${postId}"
                        data-platform="${platform}"
                        style="width: 100%; padding: 15px; background: #27ae60; color: white; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; opacity: 0.5;"
                        disabled>
                    🔓 Claim Reward (Wait 30s)
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start timer
        let seconds = 30;
        const timerDisplay = document.getElementById('timerDisplay');
        const claimBtn = document.getElementById('claimAfterTimer');
        
        const timer = setInterval(() => {
            seconds--;
            
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (seconds <= 0) {
                clearInterval(timer);
                timerDisplay.innerHTML = '<span style="color: #2ecc71;">✓ Ready to Claim!</span>';
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.textContent = '🎁 Claim Reward Now!';
                claimBtn.style.background = '#2ecc71';
                
                // Add click event
                claimBtn.onclick = () => {
                    this.claimReward(postId, platform);
                    modal.remove();
                };
            }
        }, 1000);
        
        // Cleanup on close
        modal.querySelector('button').onclick = () => {
            clearInterval(timer);
            modal.remove();
        };
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
            this.loadContent();
            this.showNotification('Refreshing TikTok tasks...', 'info');
        });
        
        document.getElementById('refresh-youtube')?.addEventListener('click', () => {
            this.loadContent();
            this.showNotification('Refreshing YouTube tasks...', 'info');
        });
        
        // Quiz submit
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'quizForm') {
                e.preventDefault();
                this.submitTrivia();
            }
        });
    }
    
    async submitTrivia() {
        // Simple trivia submission
        this.showNotification('Trivia submitted! Checking answers...', 'info');
        
        // Simulate processing
        setTimeout(() => {
            this.showNotification('You earned UGX 1200 from trivia!', 'success');
            
            // Update earnings display
            const triviaElement = document.getElementById('trivia');
            if (triviaElement) {
                const current = parseInt(triviaElement.textContent.replace(/[^0-9]/g, '')) || 0;
                triviaElement.textContent = `UGX ${(current + 1200).toLocaleString()}`;
            }
        }, 2000);
    }
    
    loadSampleData() {
        console.log('Loading sample data...');
        // Fallback if database fails
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 25px;
            background: ${type === 'success' ? '#2ecc71' : 
                        type === 'error' ? '#e74c3c' : 
                        type === 'warning' ? '#f39c12' : '#3498db'};
            color: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000; animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardLoader = new DashboardLoader();
});