// This will load content from admin panel

(function() {
    'use strict';
    console.log('Dashboard Content Loader starting...');
    class DashboardContentLoader {
        constructor() {
            this.supabase = null;
            this.init();
        }
        async init() {
            // Initialize Supabase
            this.supabase = await this.initSupabase();
            // Load content
            await this.loadTasks();
            await this.loadTrivia();
            console.log('Dashboard content loaded');
        }
        async initSupabase() {
            try {
                // Use same credentials as admin
                const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
                // If a Supabase client is already exposed (window.supabase), prefer to reuse it.
                if (window.supabase) {
                    // If window.supabase is the library (has createClient), create a fresh client
                    if (typeof window.supabase.createClient === 'function') {
                        return window.supabase.createClient(supabaseUrl, supabaseKey);
                    }

                    // If window.supabase is already a client instance (has .from), reuse it
                    if (typeof window.supabase.from === 'function') {
                        return window.supabase;
                    }
                }

                // Fallback: dynamic import of the library and create client
                try {
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                    return createClient(supabaseUrl, supabaseKey);
                } catch (impErr) {
                    console.warn('Dynamic import failed, attempting to use global supabase if present', impErr);
                    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
                    throw impErr;
                }
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                return null;
            }
        }
        async loadTasks() {
            try {
                const localTasks = localStorage.getItem('dashboard_tasks');
                if (localTasks) {
                    this.renderTasks(JSON.parse(localTasks));
                    return;
                }

                // Try to load from database system
                if (this.supabase) {
                    const { data, error } = await this.supabase
                        .from('dashboard_tasks')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (!error && data && data.length > 0) {
                        this.renderTasks(data);
                    } else {
                        // Show default tasks
                        this.showDefaultTasks();
                    }
                } else {
                    this.showDefaultTasks();
                }
            } catch (error) {
                console.log('Error loading tasks:', error.message);
                this.showDefaultTasks();
            }
        }

        renderTasks(tasks) {
            const tiktokSection = document.querySelector('#users-section .video-earn');
            const youtubeSection = document.querySelector('#approvals-section .video-earn');
            
            if (!tiktokSection || !youtubeSection) return;

            // Clear existing content
            tiktokSection.innerHTML = '';
            youtubeSection.innerHTML = '';

            // Separate TikTok and YouTube tasks
            const tiktokTasks = tasks.filter(t => t.platform === 'tiktok');
            const youtubeTasks = tasks.filter(t => t.platform === 'youtube');

            // Render TikTok tasks
            tiktokTasks.forEach(task => {
                tiktokSection.innerHTML += this.createTaskHTML(task);
            });

            // Render YouTube tasks
            youtubeTasks.forEach(task => {
                youtubeSection.innerHTML += this.createTaskHTML(task);
            });

            // Add claim button listeners
            this.addClaimButtonListeners();
        }

        createTaskHTML(task) {
            const platform = task.platform;
            const platformName = platform === 'tiktok' ? 'TikTok' : 'YouTube';
            const platformIcon = platform === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-youtube';
            const platformColor = platform === 'tiktok' ? '#25F4EE' : '#FF0000';
            
            return `
                <div class="vidSection">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${task.title}</h3>
                            <h5>Sponsored by ${task.sponsor || 'Partner'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>Reward: UGX ${task.reward_amount}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                            <img src="${task.thumbnail_url || 'https://via.placeholder.com/600x400?text=' + platformName + '+Video'}" 
                                 alt="${task.title}" style="width: 100%; border-radius: 8px;">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${task.description || 'Complete this task to earn your reward.'}</p>
                            <h5>Posted: ${new Date(task.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn-${platform}" data-task-id="${task.id}" data-amount="${task.reward_amount}" data-video-url="${task.video_url || ''}" data-watch-seconds="${task.watch_seconds || 30}">
                                    <i class="${platformIcon}" style="color: ${platformColor};"></i> Claim ${platformName}
                                </button>
                                <button class="view-btn" data-video-url="${task.video_url || ''}">
                                    <i class="fas fa-external-link-alt"></i> View Content
                                </button>
                                ${platform === 'tiktok' ? `<button class="follow-btn" data-follow-url="${task.follow_url || task.video_url || ''}">Follow on TikTok</button>` : ''}
                                ${platform === 'youtube' ? `<button class="subscribe-btn" data-subscribe-url="${task.follow_url || task.video_url || ''}">Subscribe</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        showDefaultTasks() {
            // Default tasks if none are loaded
            const defaultTasks = [
                {
                    id: 1,
                    platform: 'tiktok',
                    title: 'Like this TikTok video',
                    sponsor: 'Nike',
                    reward_amount: 250,
                    description: 'Like this video and stay for at least 30 seconds to earn your reward.',
                    thumbnail_url: 'https://via.placeholder.com/600x400?text=TikTok+Video',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    platform: 'youtube',
                    title: 'Watch this YouTube video',
                    sponsor: 'Coca-Cola',
                    reward_amount: 250,
                    description: 'Watch this video for at least 1 minute and like it to earn your reward.',
                    thumbnail_url: 'https://via.placeholder.com/600x400?text=YouTube+Video',
                    created_at: new Date().toISOString()
                }
            ];

            this.renderTasks(defaultTasks);
        }

        addClaimButtonListeners() {
            document.querySelectorAll('.claim-btn-tiktok, .claim-btn-youtube').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const el = e.currentTarget;
                    const taskId = el.dataset.taskId;
                    const amount = el.dataset.amount;
                    const videoUrl = el.dataset.videoUrl || '';
                    const watchSeconds = parseInt(el.dataset.watchSeconds || '30', 10);

                    // If there's a video url, show a video modal and require watch time before allowing claim
                    if (videoUrl) {
                        this.showVideoModal({ id: taskId, amount, video_url: videoUrl, watch_seconds: watchSeconds });
                    } else {
                        this.claimTask(taskId, amount);
                    }
                });
            });

            // View content buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.currentTarget.dataset.videoUrl || '';
                    if (url) window.open(url, '_blank');
                });
            });

            // Follow / Subscribe buttons
            document.querySelectorAll('.follow-btn, .subscribe-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const followUrl = e.currentTarget.dataset.followUrl || e.currentTarget.dataset.subscribeUrl || '';
                    if (!followUrl) {
                        this.showNotification('No URL available', 'error');
                        return;
                    }
                    window.open(followUrl, '_blank');
                    e.currentTarget.disabled = true;
                    e.currentTarget.textContent = e.currentTarget.classList.contains('follow-btn') ? 'Followed' : 'Subscribed';
                });
            });
        }

        // Create and show a video modal which enforces watch_seconds before enabling claim
        showVideoModal(task) {
            // Ensure a single modal exists
            let modal = document.getElementById('taskVideoModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'taskVideoModal';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal" id="taskVideoCard">
                        <div class="modal-header"><h3 class="modal-title">Watch Video to Claim</h3><button class="modal-close" id="videoModalClose">&times;</button></div>
                        <div class="modal-body" style="text-align:center;">
                            <video id="taskVideoPlayer" width="640" height="360" controls preload="auto" style="max-width:100%;"></video>
                            <div style="margin-top:10px;">
                                <button id="claimAfterWatch" class="btn btn-primary" disabled>Claim Reward</button>
                                <div id="watchTimer" style="margin-top:8px; color:#666; font-size:0.9rem;">Remain: <span id="watchRemain">0</span>s</div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Close handler
                modal.querySelector('#videoModalClose').addEventListener('click', () => {
                    this._cleanupVideoModal();
                });
            }

            // Populate and show
            const player = document.getElementById('taskVideoPlayer');
            const claimBtn = document.getElementById('claimAfterWatch');
            const watchRemainEl = document.getElementById('watchRemain');

            if (!player || !claimBtn || !watchRemainEl) return;

            player.src = task.video_url;
            player.currentTime = 0;
            player.play().catch(() => {});

            // Show modal overlay/card
            const overlay = modal;
            overlay.style.display = 'flex';
            const card = document.getElementById('taskVideoCard');
            if (card) card.style.display = 'block';

            // Timer logic
            let required = parseInt(task.watch_seconds || 30, 10);
            let watched = 0;
            watchRemainEl.textContent = required;
            claimBtn.disabled = true;

            // Use timeupdate event for accuracy
            function onTimeUpdate() {
                watched = Math.floor(player.currentTime);
                const remain = Math.max(required - watched, 0);
                watchRemainEl.textContent = remain;
                if (watched >= required) {
                    claimBtn.disabled = false;
                }
            }

            player.addEventListener('timeupdate', onTimeUpdate);

            // Claim handler
            const onClaim = async () => {
                claimBtn.disabled = true;
                try {
                    await this.claimTask(task.id, task.amount);
                    this._cleanupVideoModal();
                } catch (e) {
                    console.error('claim after watch failed', e);
                    claimBtn.disabled = false;
                }
            };

            claimBtn.addEventListener('click', onClaim, { once: true });

            // store for cleanup
            this._videoModalState = { player, onTimeUpdate, onClaim, overlay };
        }

        _cleanupVideoModal() {
            const state = this._videoModalState;
            if (!state) return;
            try {
                const { player, onTimeUpdate, onClaim, overlay } = state;
                if (player) {
                    player.pause();
                    player.removeEventListener('timeupdate', onTimeUpdate);
                    player.src = '';
                }
                const claimBtn = document.getElementById('claimAfterWatch');
                if (claimBtn) claimBtn.removeEventListener('click', onClaim);
                if (overlay) overlay.style.display = 'none';
            } catch (e) {
                console.warn('Error cleaning video modal', e);
            }
            this._videoModalState = null;
        }

        async claimTask(taskId, amount) {
            // Minimal implementation: simulate awarding and store locally
            try {
                console.log(`Claiming task ${taskId} amount ${amount}`);
                // In a real setup, call your backend or supabase RPC to credit the user
                // Example (pseudo): await this.supabase.from('user_earnings').insert({ user_id: currentUser.id, task_id: taskId, amount })
                this.showNotification(`Task claimed! You earned UGX ${amount}.`, 'success');

                // Mark task as claimed in UI (simple visual disable)
                const btns = document.querySelectorAll(`[data-task-id='${taskId}']`);
                btns.forEach(b => { b.disabled = true; b.textContent = 'Claimed'; });
                return true;
            } catch (err) {
                console.error('claimTask error', err);
                this.showNotification('Failed to claim task: ' + (err.message || err), 'error');
                throw err;
            }
        }

        async loadTrivia() {
            try {
                // Check for trivia in localStorage
                const localTrivia = localStorage.getItem('dashboard_trivia');
                if (localTrivia) {
                    this.renderTrivia(JSON.parse(localTrivia));
                    return;
                }

                // Try to load from database
                if (this.supabase) {
                    const { data, error } = await this.supabase
                        .from('dashboard_trivia')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (!error && data && data.length > 0) {
                        this.renderTrivia(data);
                    } else {
                        this.showDefaultTrivia();
                    }
                } else {
                    this.showDefaultTrivia();
                }
            } catch (error) {
                console.log('Error loading trivia:', error.message);
                this.showDefaultTrivia();
            }
        }

        renderTrivia(questions) {
            const quizForm = document.getElementById('quizForm');
            if (!quizForm) return;

            // Clear existing questions (keep first 5 default ones or replace all)
            const existingQuestions = quizForm.querySelectorAll('.question');
            if (existingQuestions.length > 0) {
                // Replace questions starting from the first one
                questions.slice(0, Math.min(5, questions.length)).forEach((q, index) => {
                    if (existingQuestions[index]) {
                        existingQuestions[index].innerHTML = this.createTriviaHTML(q, index + 1);
                    }
                });
            }
        }

        createTriviaHTML(question, number) {
            const options = question.options || {};
            
            let optionsHTML = '';
            Object.entries(options).forEach(([key, value]) => {
                optionsHTML += `
                    <label><input type="radio" name="q${number}" value="${key}"> ${value}</label>
                `;
            });

            return `
                <p>${number}. ${question.question}</p>
                <div class="options">
                    ${optionsHTML}
                </div>
            `;
        }

        showDefaultTrivia() {
            // Default trivia questions are already in the HTML
            console.log('Using default trivia questions');
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        window.dashboardContentLoader = new DashboardContentLoader();
    });

})();