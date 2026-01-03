// This will load content from admin panel

(function() {
    'use strict';
    console.log('Dashboard Content Loader starting...');
    class DashboardContentLoader {
        constructor() {
            this.supabase = null;
            this._supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
            this._supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
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
                // If a client is already exposed as window.supabase (from CDN or fallback), prefer it
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    try {
                        return window.supabase.createClient(supabaseUrl, supabaseKey);
                    } catch (e) {
                        console.warn('window.supabase exists but createClient call failed', e);
                    }
                }

                // If window.supabase is a client instance (has .from), reuse it
                if (window.supabase && typeof window.supabase.from === 'function') {
                    return window.supabase;
                }

                // Try dynamic import of the library
                try {
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                    return createClient(supabaseUrl, supabaseKey);
                } catch (impErr) {
                    console.warn('Dynamic import failed, will poll for window.supabase as fallback', impErr);
                }

                // Poll for a short period to allow a local fallback script to load
                const maxRetries = 6;
                for (let i = 0; i < maxRetries; i++) {
                    if (window.supabase && (typeof window.supabase.createClient === 'function' || typeof window.supabase.from === 'function')) {
                        if (typeof window.supabase.createClient === 'function') return window.supabase.createClient(supabaseUrl, supabaseKey);
                        return window.supabase;
                    }
                    await new Promise(r => setTimeout(r, 500));
                }

                throw new Error('Supabase client not available (CDN blocked and local fallback did not initialize in time)');
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                return null;
            }
        }
        async loadTasks() {
            try {
                // Prefer live DB results; `contents` is the source of tasks
                let tasks = null;
                if (this.supabase) {
                    try {
                        const { data, error } = await this.supabase
                            .from('contents')
                            .select('*')
                            .order('created_at', { ascending: false })
                            .limit(2000);
                        if (!error && data) tasks = this.mapContentsToTasks(data || []);
                        else console.warn('Supabase client returned error:', error);
                    } catch (err) {
                        console.warn('Supabase client fetch failed, will try REST fallback', err);
                    }
                }

                // If no client or client failed, use REST API endpoint directly (no library required)
                if (!tasks) {
                    try {
                        const data = await this.fetchContentsViaREST();
                        tasks = this.mapContentsToTasks(data || []);
                    } catch (err) {
                        console.warn('REST fetch for contents failed:', err);
                    }
                }

                if (tasks && tasks.length > 0) {
                    try { localStorage.setItem('dashboard_tasks', JSON.stringify(tasks)); } catch (e) {}
                    return this.renderTasks(tasks);
                }

                // Fallback to cached tasks if DB unavailable
                const localTasks = localStorage.getItem('dashboard_tasks');
                if (localTasks) {
                    this.renderTasks(JSON.parse(localTasks));
                    return;
                }

                this.showDefaultTasks();
            } catch (error) {
                console.log('Error loading tasks:', error.message);
                this.showDefaultTasks();
            }
        }

        renderTasks(tasks) {
            // Update visual count immediately
            try { this.updateTaskCount(Array.isArray(tasks) ? tasks.length : 0); } catch (e) {}

            const tiktokSection = document.querySelector('#users-section .video-earn') || document.querySelector('#tiktok-section .video-earn') || document.querySelector('.tiktok-tasks');
            const youtubeSection = document.querySelector('#approvals-section .video-earn') || document.querySelector('#youtube-section .video-earn') || document.querySelector('.youtube-tasks');
            
            if (!tiktokSection || !youtubeSection) return;

            // Clear existing content
            tiktokSection.innerHTML = '';
            youtubeSection.innerHTML = '';

            // Normalize platform and render into appropriate containers
            tasks = (tasks || []).map(t => ({ ...t, platform: this.normalizePlatform(t.platform || ''), raw: t.raw || t }));

            // Ensure a generic fallback container exists
            let genericSection = document.querySelector('.other-tasks');
            if (!genericSection) {
                genericSection = document.createElement('div');
                genericSection.className = 'other-tasks';
                try { youtubeSection.parentNode.insertBefore(genericSection, youtubeSection.nextSibling); } catch (e) { document.body.appendChild(genericSection); }
            }

            tasks.forEach(task => {
                const html = this.createTaskHTML(task);
                if (task.platform === 'tiktok') {
                    tiktokSection.innerHTML += html;
                } else if (task.platform === 'youtube') {
                    youtubeSection.innerHTML += html;
                } else {
                    genericSection.innerHTML += html;
                }
            });

            // Add claim and view listeners after render
            this.addClaimButtonListeners();

            // Ensure badge reflects current number
            try { this.updateTaskCount(tasks.length); } catch (e) {}
        }

        createTaskHTML(task) {
            const platform = (task.platform || '').toString();
            const platformName = platform === 'tiktok' ? 'TikTok' : (platform === 'youtube' ? 'YouTube' : (platform || 'Other'));
            const platformIcon = platform === 'tiktok' ? 'fab fa-tiktok' : (platform === 'youtube' ? 'fab fa-youtube' : 'fas fa-broadcast-tower');
            const platformColor = platform === 'tiktok' ? '#25F4EE' : (platform === 'youtube' ? '#FF0000' : '#777');

            const src = Object.assign({}, task.raw || {}, task || {});
            const videoUrl = (this.getField(src, ['video_url', 'content_url', 'url', 'link', 'video_link']) || '') + '';
            let thumbnail = this.getField(src, ['thumbnail_url', 'thumbnail', 'thumb', 'image_url', 'image', 'cover']) || '';
            const idVal = this.getField(src, ['id', 'task_id', 'content_id', 'post_id']) || task.id || '';
            const rewardVal = this.getField(src, ['reward_amount', 'reward', 'amount']) || task.reward_amount || 0;

            try {
                if (!thumbnail && videoUrl) {
                    const vid = this.extractYouTubeID(videoUrl);
                    if (vid) thumbnail = `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`;
                }
            } catch (e) { thumbnail = thumbnail || ''; }

            if (!thumbnail) thumbnail = 'https://via.placeholder.com/600x400?text=' + encodeURIComponent(platformName + ' Video');

            return `
                <div class="vidSection">
                    <div class="vhead">
                        <div class="leftInfo">
                            <h3>${task.title || 'Untitled'}</h3>
                            <h5>Sponsored by ${task.sponsor || 'Partner'}</h5>
                        </div>
                        <div class="rightInfo">
                            <h6>Reward: UGX ${rewardVal}</h6>
                        </div>
                    </div>
                    <div class="body">
                        <div class="post">
                               <img src="${thumbnail}" 
                                   alt="${task.title || ''}" style="width: 100%; border-radius: 8px;" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=Image+Unavailable'">
                        </div>
                    </div>
                    <div class="vfoot">
                        <div class="vdetails">
                            <p>${task.description || 'Complete this task to earn your reward.'}</p>
                            <h5>Posted: ${new Date(task.created_at).toLocaleDateString()}</h5>
                            <div class="buttons">
                                <button class="claim-btn-${platform}" data-task-id="${idVal}" data-amount="${rewardVal}" data-video-url="${videoUrl || ''}" data-watch-seconds="${task.watch_seconds || 30}">
                                    <i class="${platformIcon}" style="color: ${platformColor};"></i> Claim ${platformName}
                                </button>
                                <button class="view-btn" data-video-url="${videoUrl || ''}" data-thumbnail="${thumbnail}">
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

        // Map `contents` table rows into the task object shape used by the renderer
        mapContentsToTasks(rows) {
            if (!Array.isArray(rows)) return [];
            return rows.map(r => {
                const video_url = this.getField(r, ['video_url', 'content_url', 'url', 'link', 'video_link', 'video']) || '';
                const thumbnail_url = this.getField(r, ['thumbnail_url', 'thumbnail', 'thumb', 'image_url', 'image', 'cover']) || '';
                let platform = this.getField(r, ['platform', 'type', 'source']) || '';
                const title = this.getField(r, ['title', 'name', 'headline']) || r.title || 'Untitled';
                const sponsor = this.getField(r, ['sponsor', 'brand']) || r.sponsor || '';
                const reward_amount = this.getField(r, ['reward_amount', 'reward', 'amount']) || r.reward_amount || 0;
                const description = this.getField(r, ['description', 'desc', 'body']) || r.description || '';
                const created_at = this.getField(r, ['created_at', 'created']) || r.created_at || new Date().toISOString();
                const follow_url = this.getField(r, ['follow_url', 'follow', 'follow_link']) || r.follow_url || video_url || '';
                const watch_seconds = parseInt(this.getField(r, ['watch_seconds', 'watch_time', 'required_seconds']) || r.watch_seconds || 30, 10);
                const id = this.getField(r, ['id', 'content_id', 'post_id']) || r.id || '';

                // If platform not provided, infer from video_url
                let normalized = this.normalizePlatform(platform || '');
                if (!normalized || normalized === 'other') {
                    const lowerUrl = (video_url || '').toString().toLowerCase();
                    if (/tiktok\.com|vm\.tiktok\.com|tiktok:|tikTok/i.test(lowerUrl)) normalized = 'tiktok';
                    else if (/youtube\.com|youtu\.be|youtube:/i.test(lowerUrl)) normalized = 'youtube';
                }

                return {
                    id,
                    platform: normalized,
                    title,
                    sponsor,
                    reward_amount,
                    description,
                    created_at,
                    thumbnail_url,
                    video_url,
                    follow_url,
                    watch_seconds,
                    raw: r
                };
            });
        }

        // Fetch contents directly via Supabase REST (PostgREST) API - avoids needing the client library
        async fetchContentsViaREST() {
            const url = `${this._supabaseUrl}/rest/v1/contents?select=*&order=created_at.desc&limit=2000`;
            const res = await fetch(url, {
                headers: {
                    apikey: this._supabaseKey,
                    Authorization: `Bearer ${this._supabaseKey}`
                }
            });
            if (!res.ok) throw new Error(`REST fetch failed: ${res.status} ${res.statusText}`);
            return res.json();
        }

        async fetchTriviaViaREST() {
            const url = `${this._supabaseUrl}/rest/v1/dashboard_trivia?select=*&eq=is_active.true&order=created_at.desc&limit=5`;
            const res = await fetch(url, {
                headers: {
                    apikey: this._supabaseKey,
                    Authorization: `Bearer ${this._supabaseKey}`
                }
            });
            if (!res.ok) throw new Error(`REST fetch failed: ${res.status} ${res.statusText}`);
            return res.json();
        }

        addClaimButtonListeners() {
            // Attach to any button with class like 'claim-btn-<platform>'
            document.querySelectorAll('[class*="claim-btn-"]').forEach(btn => {
                btn.removeEventListener('click', btn._claimHandler);
                const handler = (e) => {
                    const el = e.currentTarget;
                    const taskId = el.dataset.taskId;
                    const amount = el.dataset.amount;
                    const videoUrl = el.dataset.videoUrl || '';
                    const watchSeconds = parseInt(el.dataset.watchSeconds || el.dataset.watchSeconds || '30', 10);
                    if (videoUrl) {
                        if (/youtube\.com|youtu\.be/.test(videoUrl)) {
                            this.showVideoModal({ id: taskId, amount, video_url: videoUrl, watch_seconds: watchSeconds, embed: 'youtube' });
                        } else if (/\.mp4$|video\//i.test(videoUrl)) {
                            this.showVideoModal({ id: taskId, amount, video_url: videoUrl, watch_seconds: watchSeconds, embed: 'video' });
                        } else if (/tiktok\.com/.test(videoUrl)) {
                            window.open(videoUrl, '_blank');
                            this.showNotification && this.showNotification('Opened TikTok in new tab. Click claim when done.', 'info');
                        } else {
                            window.open(videoUrl || '#', '_blank');
                            this.showNotification && this.showNotification('Opened content in new tab. Click claim when done.', 'info');
                        }
                    } else {
                        this.claimTask(taskId, amount);
                    }
                };
                btn.addEventListener('click', handler);
                btn._claimHandler = handler;
            });
        }

        updateTaskCount(n) {
            try {
                const el = document.getElementById('task-count');
                if (el) el.textContent = String(n || 0);
            } catch (e) {}
        }

        // Extract YouTube video ID robustly from common URL formats
        // Returns null if no valid id found
        extractYouTubeID(url) {
            if (!url || typeof url !== 'string') return null;
            const patterns = [
                /(?:v=)([A-Za-z0-9_-]{11})/, // watch?v=
                /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/, // youtu.be/
                /(?:embed\/)([A-Za-z0-9_-]{11})/ // /embed/
            ];
            for (const re of patterns) {
                const m = url.match(re);
                if (m && m[1]) return m[1];
            }
            return null;
        }

        // Helper to get first existing field from object
        getField(obj, keys) {
            if (!obj || !keys) return null;
            for (const k of keys) {
                if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
            }
            return null;
        }

        normalizePlatform(p) {
            if (!p) return 'other';
            const s = p.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (s.includes('youtube') || s === 'yt') return 'youtube';
            if (s.includes('tiktok') || s.includes('tik') || s.includes('tt')) return 'tiktok';
            return 'other';
        }

        async claimTask(taskId, amount) {
            try {
                const amt = Number(amount) || 0;
                if (typeof this.showNotification === 'function') {
                    this.showNotification(`Task claimed! You earned UGX ${amt}.`, 'success');
                } else {
                    // Fallback UX for environments without showNotification
                    alert(`Task claimed! You earned UGX ${amt}.`);
                }
                // Record claim locally for now. Persisting to the backend can be
                // implemented later if desired (REST or Supabase client).
                console.log('claimTask:', { taskId, amount: amt });
                return { success: true, taskId, amount: amt };
            } catch (err) {
                console.error('Error in claimTask:', err);
                return { success: false, error: err };
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

                let trivia = null;
                if (this.supabase) {
                    try {
                        const { data, error } = await this.supabase
                            .from('dashboard_trivia')
                            .select('*')
                            .eq('is_active', true)
                            .order('created_at', { ascending: false })
                            .limit(5);
                        if (!error && data && data.length > 0) trivia = data;
                    } catch (err) {
                        console.warn('Supabase trivia fetch failed, will try REST fallback', err);
                    }
                }

                if (!trivia) {
                    try {
                        trivia = await this.fetchTriviaViaREST();
                    } catch (err) {
                        console.warn('REST fetch for trivia failed:', err);
                    }
                }

                if (trivia && trivia.length > 0) {
                    try { localStorage.setItem('dashboard_trivia', JSON.stringify(trivia)); } catch (e) {}
                    this.renderTrivia(trivia);
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

        // Create and show a video modal which enforces watch_seconds before enabling claim
        showVideoModal(task) {
            // Ensure a single modal exists
            let modal = document.getElementById('taskVideoModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'taskVideoModal';
                modal.className = 'modal-overlay';
                modal.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;';
                modal.innerHTML = `
                    <div class="modal" id="taskVideoCard" style="background:#fff;border-radius:8px;max-width:900px;width:95%;max-height:90%;overflow:auto;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <h3 style="margin:0">Watch Video to Claim</h3>
                            <button id="videoModalClose" style="background:none;border:none;font-size:20px;cursor:pointer">&times;</button>
                        </div>
                        <div class="modal-body" id="taskVideoBody" style="text-align:center;">
                            <!-- content inserted dynamically -->
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('#videoModalClose').addEventListener('click', () => this._cleanupVideoModal());
            }

            const overlay = modal;
            overlay.style.display = 'flex';
            const body = modal.querySelector('#taskVideoBody');
            if (!body) return;

            // Prepare UI depending on embed type
            const required = parseInt(task.watch_seconds || task.duration_seconds || 30, 10) || 30;
            body.innerHTML = `
                <div id="taskVideoHost" style="max-width:100%;">
                </div>
                <div style="margin-top:10px;display:flex;gap:8px;align-items:center;justify-content:center;">
                    <button id="claimAfterWatch" disabled class="btn">Claim Reward</button>
                    <div id="watchTimer">Remain: <span id="watchRemain">${required}</span>s</div>
                </div>
            `;

            const host = body.querySelector('#taskVideoHost');
            const claimBtn = modal.querySelector('#claimAfterWatch');
            const watchRemainEl = modal.querySelector('#watchRemain');

            // cleanup any previous state
            this._cleanupVideoModal();

            // Handler to finalize claim
            const finalizeClaim = async () => {
                try {
                    claimBtn.disabled = true;
                    await this.claimTask(task.id || task.task_id || null, task.amount || task.reward_amount || 0);
                    this._cleanupVideoModal();
                } catch (e) {
                    console.error('claim failed', e);
                    claimBtn.disabled = false;
                }
            };

            // mp4/html5 video
            if ((task.embed === 'video' || /\.mp4$|video\//i.test(task.video_url || ''))) {
                const v = document.createElement('video');
                v.id = 'taskVideoPlayer';
                v.controls = true;
                v.preload = 'auto';
                v.style.maxWidth = '100%';
                v.src = task.video_url;
                host.appendChild(v);

                let requiredSeconds = required;
                watchRemainEl.textContent = requiredSeconds;
                claimBtn.disabled = true;

                const onTime = () => {
                    const watched = Math.floor(v.currentTime || 0);
                    const remain = Math.max(requiredSeconds - watched, 0);
                    watchRemainEl.textContent = remain;
                    if (watched >= requiredSeconds) claimBtn.disabled = false;
                };

                v.addEventListener('timeupdate', onTime);
                claimBtn.addEventListener('click', finalizeClaim, { once: true });

                this._videoModalState = { type: 'video', player: v, onTime, finalizeClaim, overlay };
                v.play().catch(()=>{});
                return;
            }

            // YouTube iframe fallback (no API) – use elapsed timer since iframe added
            const ytId = this.extractYouTubeID(task.video_url || '');
            if (ytId) {
                const iframe = document.createElement('iframe');
                iframe.width = '800'; iframe.height = '450';
                iframe.src = `https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1`;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.setAttribute('frameborder','0');
                iframe.style.maxWidth = '100%';
                host.appendChild(iframe);

                let elapsed = 0;
                watchRemainEl.textContent = required;
                claimBtn.disabled = true;
                this._videoModalState = { type: 'iframe', iframe, overlay };

                this._videoModalState._timer = setInterval(() => {
                    elapsed++;
                    const remain = Math.max(required - elapsed, 0);
                    watchRemainEl.textContent = remain;
                    if (elapsed >= required) {
                        claimBtn.disabled = false;
                        clearInterval(this._videoModalState._timer);
                    }
                }, 1000);

                claimBtn.addEventListener('click', finalizeClaim, { once: true });
                return;
            }

            // Fallback: open new tab and allow manual claim
            host.innerHTML = `<p>Content cannot be embedded. <a href="${task.video_url || '#'}" target="_blank">Open in new tab</a></p>`;
            claimBtn.disabled = false;
            claimBtn.addEventListener('click', finalizeClaim, { once: true });
            this._videoModalState = { type: 'link', overlay };
        }

        _cleanupVideoModal() {
            const s = this._videoModalState;
            if (!s) return;
            try {
                if (s.type === 'video' && s.player) {
                    try { s.player.pause(); } catch(e){}
                    try { s.player.removeEventListener('timeupdate', s.onTime); } catch(e){}
                }
                if (s.type === 'iframe' && s._timer) {
                    try { clearInterval(s._timer); } catch(e){}
                }
                if (s.overlay) s.overlay.style.display = 'none';
            } catch (e) { console.warn('Error cleaning video modal', e); }
            this._videoModalState = null;
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