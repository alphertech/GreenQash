// dashboard-content.js - Add this to dashboard.html
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
                
                return window.supabase.createClient(supabaseUrl, supabaseKey);
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                return null;
            }
        }

        async loadTasks() {
            try {
                // Check for tasks in localStorage first (from admin sync)
                const localTasks = localStorage.getItem('dashboard_tasks');
                if (localTasks) {
                    this.renderTasks(JSON.parse(localTasks));
                    return;
                }

                // Try to load from database
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
                                <button class="claim-btn-${platform}" data-task-id="${task.id}" data-amount="${task.reward_amount}">
                                    <i class="${platformIcon}" style="color: ${platformColor};"></i> Claim ${platformName}
                                </button>
                                <button class="view-btn" onclick="window.open('${task.video_url || '#'}', '_blank')">
                                    <i class="fas fa-external-link-alt"></i> View Content
                                </button>
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
                    const taskId = e.currentTarget.dataset.taskId;
                    const amount = e.currentTarget.dataset.amount;
                    this.claimTask(taskId, amount);
                });
            });
        }

        claimTask(taskId, amount) {
            alert(`Task claimed! You earned UGX ${amount}. This would be added to your balance in a real system.`);
            // In production, this would call an API to update user earnings
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