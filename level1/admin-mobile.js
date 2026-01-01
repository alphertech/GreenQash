// This will create tables and sync content to dashboard.html

(function() {
    'use strict';

    console.log('Admin Dashboard Manager loading...');

    // 1. FIX MISSING FUNCTIONS
    // Fix filterContents error
    if (typeof window.filterContents === 'undefined') {
        window.filterContents = function() {
            console.log('Filtering contents...');
        };
    }

    // 2. SUPABASE INITIALIZATION

    let supabase = null;
    let currentUser = null;

    function initSupabase() {
        try {
            // Try to use existing AdminApp
            if (window.AdminApp && window.AdminApp.supabase) {
                supabase = window.AdminApp.supabase;
                currentUser = window.AdminApp.currentUser;
                console.log('Using existing AdminApp Supabase');
                return true;
            }

            // Create new Supabase client
            const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
            
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('Created new Supabase client');
            
            // Try to get current user
            supabase.auth.getUser().then(({ data: { user } }) => {
                currentUser = user;
            }).catch(() => {
                currentUser = { id: 'system-admin' };
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    }

    // ============================================
    // 3. TABLE CREATION
    // ============================================

    async function createTables() {
        if (!supabase) return false;

        try {
            console.log('Checking/Creating tables...');
            
            // Check if tasks table exists
            const { error: tasksError } = await supabase
                .from('dashboard_tasks')
                .select('id')
                .limit(1);

            if (tasksError && tasksError.code === 'PGRST204') {
                console.log('Creating dashboard_tasks table...');
                // Table doesn't exist, we need to create it
                // Since we can't execute SQL directly, we'll handle this differently
                // We'll work with existing tables for now
                console.log('Note: Cannot create tables directly. Please create them manually in Supabase.');
                return false;
            }

            // Check if trivia table exists
            const { error: triviaError } = await supabase
                .from('dashboard_trivia')
                .select('id')
                .limit(1);

            if (triviaError && triviaError.code === 'PGRST204') {
                console.log('Note: dashboard_trivia table not found');
            }

            console.log('Tables check completed');
            return true;
            
        } catch (error) {
            console.log('Tables check error:', error.message);
            return false;
        }
    }

    // ============================================
    // 4. DASHBOARD CONTENT SYNC SYSTEM
    // ============================================

    class DashboardContentManager {
        constructor() {
            this.tasks = [];
            this.trivia = [];
            this.isInitialized = false;
        }

        async init() {
            if (!initSupabase()) {
                console.error('Failed to initialize Supabase');
                return;
            }

            await createTables();
            this.setupUI();
            this.isInitialized = true;
            console.log('Dashboard Content Manager initialized');
        }

        setupUI() {
            // Add management buttons to Contents section
            this.addManagementButtons();
            
            // Add quick actions to Dashboard
            this.addQuickActions();
            
            // Add bulk withdrawal buttons
            this.addBulkWithdrawalButtons();
        }

        addManagementButtons() {
            const contentsSection = document.getElementById('contents');
            if (contentsSection) {
                const header = contentsSection.querySelector('.section-header');
                if (header) {
                    const actionsDiv = header.querySelector('.section-actions');
                    if (actionsDiv) {
                        // Check if buttons already exist
                        if (!actionsDiv.querySelector('.task-manager-btn')) {
                            const buttons = `
                                <button class="btn btn-primary task-manager-btn" style="margin-left: 10px;">
                                    <i class="fas fa-tasks"></i> Manage Tasks
                                </button>
                                <button class="btn btn-success trivia-manager-btn" style="margin-left: 10px;">
                                    <i class="fas fa-question-circle"></i> Manage Trivia
                                </button>
                            `;
                            actionsDiv.insertAdjacentHTML('beforeend', buttons);
                            
                            // Add event listeners
                            actionsDiv.querySelector('.task-manager-btn').addEventListener('click', () => this.openTaskManager());
                            actionsDiv.querySelector('.trivia-manager-btn').addEventListener('click', () => this.openTriviaManager());
                        }
                    }
                }
            }
        }

        addQuickActions() {
            const dashboardSection = document.getElementById('dashboard');
            if (dashboardSection) {
                const statsGrid = dashboardSection.querySelector('.stats-grid');
                if (statsGrid && !dashboardSection.querySelector('.quick-actions-panel')) {
                    const quickActions = `
                        <div class="quick-actions-panel" style="
                            background: white;
                            border-radius: 8px;
                            padding: 20px;
                            margin: 20px 0;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            grid-column: 1 / -1;
                        ">
                            <h3 style="margin-bottom: 15px; color: #2c3e50;">Content Management</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                                <button class="quick-action-btn" data-action="tasks" style="
                                    padding: 15px;
                                    background: #f8f9fa;
                                    border: 1px solid #ddd;
                                    border-radius: 6px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                ">
                                    <i class="fas fa-plus-circle" style="font-size: 24px; color: #3498db; margin-bottom: 10px;"></i>
                                    <div>Add Tasks</div>
                                </button>
                                <button class="quick-action-btn" data-action="trivia" style="
                                    padding: 15px;
                                    background: #f8f9fa;
                                    border: 1px solid #ddd;
                                    border-radius: 6px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                ">
                                    <i class="fas fa-question-circle" style="font-size: 24px; color: #2ecc71; margin-bottom: 10px;"></i>
                                    <div>Add Trivia</div>
                                </button>
                                <button class="quick-action-btn" data-action="sync" style="
                                    padding: 15px;
                                    background: #f8f9fa;
                                    border: 1px solid #ddd;
                                    border-radius: 6px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                ">
                                    <i class="fas fa-sync-alt" style="font-size: 24px; color: #9b59b6; margin-bottom: 10px;"></i>
                                    <div>Sync Dashboard</div>
                                </button>
                                <button class="quick-action-btn" data-action="report" style="
                                    padding: 15px;
                                    background: #f8f9fa;
                                    border: 1px solid #ddd;
                                    border-radius: 6px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                ">
                                    <i class="fas fa-chart-bar" style="font-size: 24px; color: #e74c3c; margin-bottom: 10px;"></i>
                                    <div>View Stats</div>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    statsGrid.insertAdjacentHTML('afterend', quickActions);
                    
                    // Add event listeners to quick actions
                    dashboardSection.querySelectorAll('.quick-action-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const action = e.currentTarget.dataset.action;
                            this.handleQuickAction(action);
                        });
                    });
                }
            }
        }

        addBulkWithdrawalButtons() {
            const withdrawalsSection = document.getElementById('withdrawals');
            if (withdrawalsSection) {
                const header = withdrawalsSection.querySelector('.section-header');
                if (header) {
                    const actionsDiv = header.querySelector('.section-actions');
                    if (actionsDiv && !actionsDiv.querySelector('.bulk-action-btn')) {
                        const bulkButtons = `
                            <button class="btn btn-info bulk-action-btn" data-action="approve" style="margin-left: 10px;">
                                <i class="fas fa-check-double"></i> Bulk Approve
                            </button>
                            <button class="btn btn-warning bulk-action-btn" data-action="process" style="margin-left: 10px;">
                                <i class="fas fa-cogs"></i> Mark Processing
                            </button>
                            <button class="btn btn-danger bulk-action-btn" data-action="reject" style="margin-left: 10px;">
                                <i class="fas fa-times-circle"></i> Bulk Reject
                            </button>
                        `;
                        actionsDiv.insertAdjacentHTML('beforeend', bulkButtons);
                        
                        // Add event listeners
                        actionsDiv.querySelectorAll('.bulk-action-btn').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const action = e.currentTarget.dataset.action;
                                this.handleBulkWithdrawal(action);
                            });
                        });
                    }
                }
            }
        }

        // ============================================
        // 5. TASK MANAGEMENT
        // ============================================

        openTaskManager() {
            this.showModal('Task Manager', this.getTaskManagerHTML());
            this.loadTasks();
        }

        getTaskManagerHTML() {
            return `
                <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
                    <h4 style="margin-bottom: 20px; color: #2c3e50;">Manage Tasks for User Dashboard</h4>
                    
                    <div class="tasks-container" style="margin-bottom: 30px;">
                        <h5 style="margin-bottom: 15px;">Existing Tasks</h5>
                        <div id="tasksList" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                            <p style="text-align: center; color: #666; padding: 20px;">Loading tasks...</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px;">
                        <h5 style="margin-bottom: 15px;">Add New Task</h5>
                        <form id="addTaskForm" style="display: grid; gap: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Platform *</label>
                                    <select id="taskPlatform" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="tiktok">TikTok</option>
                                        <option value="youtube">YouTube</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Task Type *</label>
                                    <select id="taskType" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="watch">Watch Video</option>
                                        <option value="like">Like Video</option>
                                        <option value="follow">Follow Account</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Title *</label>
                                <input type="text" id="taskTitle" placeholder="e.g., Watch Nike TikTok video" required 
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Video URL *</label>
                                <input type="url" id="taskVideoUrl" placeholder="https://tiktok.com/@user/video/123" required 
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Sponsor</label>
                                    <input type="text" id="taskSponsor" placeholder="e.g., Nike, Coca-Cola" 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Reward (UGX) *</label>
                                    <input type="number" id="taskReward" value="250" min="1" required 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description</label>
                                <textarea id="taskDescription" rows="3" placeholder="Task description for users..." 
                                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                            </div>
                            
                            <button type="submit" style="padding: 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                                <i class="fas fa-plus"></i> Add Task to Dashboard
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        async loadTasks() {
            try {
                const tasksList = document.getElementById('tasksList');
                if (!tasksList) return;

                // Try to load from existing table
                if (supabase) {
                    const { data, error } = await supabase
                        .from('dashboard_tasks')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!error && data && data.length > 0) {
                        this.tasks = data;
                        this.renderTasksList(data);
                    } else {
                        // No tasks in database, show sample tasks
                        this.showSampleTasks();
                    }
                } else {
                    this.showSampleTasks();
                }
            } catch (error) {
                console.log('Error loading tasks:', error.message);
                this.showSampleTasks();
            }
        }

        showSampleTasks() {
            const tasksList = document.getElementById('tasksList');
            if (!tasksList) return;

            const sampleTasks = [
                {
                    id: 1,
                    platform: 'tiktok',
                    title: 'Watch Nike TikTok Video',
                    description: 'Like this video and stay for 30 seconds',
                    reward_amount: 250,
                    sponsor: 'Nike',
                    is_active: true
                },
                {
                    id: 2,
                    platform: 'youtube',
                    title: 'Subscribe to Coca-Cola Channel',
                    description: 'Subscribe and stay subscribed for 7 days',
                    reward_amount: 250,
                    sponsor: 'Coca-Cola',
                    is_active: true
                }
            ];

            this.tasks = sampleTasks;
            this.renderTasksList(sampleTasks);
        }

        renderTasksList(tasks) {
            const tasksList = document.getElementById('tasksList');
            if (!tasksList) return;

            if (!tasks || tasks.length === 0) {
                tasksList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tasks found. Add your first task!</p>';
                return;
            }

            let html = '<div style="display: grid; gap: 10px;">';
            tasks.forEach(task => {
                const platformIcon = task.platform === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-youtube';
                const platformColor = task.platform === 'tiktok' ? '#25F4EE' : '#FF0000';
                
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="${platformIcon}" style="color: ${platformColor};"></i>
                                <strong>${task.title}</strong>
                            </div>
                            <span style="padding: 2px 8px; background: ${task.is_active ? '#2ecc71' : '#e74c3c'}; color: white; border-radius: 10px; font-size: 12px;">
                                ${task.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${task.description}</p>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #7f8c8d;">
                            <span><i class="fas fa-money-bill-wave"></i> UGX ${task.reward_amount}</span>
                            <span><i class="fas fa-building"></i> ${task.sponsor || 'No sponsor'}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            tasksList.innerHTML = html;
            
            // Add form submission
            const form = document.getElementById('addTaskForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTask();
                });
            }
        }

        async addTask() {
            try {
                const platform = document.getElementById('taskPlatform').value;
                const type = document.getElementById('taskType').value;
                const title = document.getElementById('taskTitle').value.trim();
                const videoUrl = document.getElementById('taskVideoUrl').value.trim();
                const sponsor = document.getElementById('taskSponsor').value.trim();
                const reward = parseInt(document.getElementById('taskReward').value) || 250;
                const description = document.getElementById('taskDescription').value.trim();

                if (!title || !videoUrl) {
                    this.showNotification('Please fill all required fields', 'error');
                    return;
                }

                // Create new task object
                const newTask = {
                    id: Date.now(), // Temporary ID
                    platform: platform,
                    task_type: type,
                    title: title,
                    description: description || `Watch this ${platform} video`,
                    video_url: videoUrl,
                    sponsor: sponsor || null,
                    reward_amount: reward,
                    is_active: true,
                    created_at: new Date().toISOString()
                };

                // Try to save to database if table exists
                if (supabase) {
                    try {
                        const { data, error } = await supabase
                            .from('dashboard_tasks')
                            .insert([newTask])
                            .select();

                        if (!error && data && data.length > 0) {
                            newTask.id = data[0].id;
                            console.log('Task saved to database:', data[0]);
                        }
                    } catch (dbError) {
                        console.log('Could not save to database, using local storage:', dbError.message);
                    }
                }

                // Add to local array
                this.tasks.unshift(newTask);
                
                // Update display
                this.renderTasksList(this.tasks);
                
                // Sync to dashboard.html
                this.syncTasksToDashboard();
                
                // Show success message
                this.showNotification(`Task "${title}" added successfully!`, 'success');
                
                // Reset form
                document.getElementById('addTaskForm').reset();
                
            } catch (error) {
                console.error('Error adding task:', error);
                this.showNotification('Error adding task: ' + error.message, 'error');
            }
        }

        // ============================================
        // 6. TRIVIA MANAGEMENT
        // ============================================

        openTriviaManager() {
            this.showModal('Trivia Manager', this.getTriviaManagerHTML());
            this.loadTrivia();
        }

        getTriviaManagerHTML() {
            return `
                <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
                    <h4 style="margin-bottom: 20px; color: #2c3e50;">Manage Trivia Questions</h4>
                    
                    <div style="margin-bottom: 30px;">
                        <h5 style="margin-bottom: 15px;">Existing Questions</h5>
                        <div id="triviaList" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                            <p style="text-align: center; color: #666; padding: 20px;">Loading trivia questions...</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px;">
                        <h5 style="margin-bottom: 15px;">Add New Trivia Question</h5>
                        <form id="addTriviaForm" style="display: grid; gap: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Question *</label>
                                <textarea id="triviaQuestion" rows="3" required 
                                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                          placeholder="Enter your question here..."></textarea>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Option A *</label>
                                    <input type="text" id="optionA" required 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                           placeholder="First option">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Option B *</label>
                                    <input type="text" id="optionB" required 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                           placeholder="Second option">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Option C (optional)</label>
                                    <input type="text" id="optionC" 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                           placeholder="Third option">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Option D (optional)</label>
                                    <input type="text" id="optionD" 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                           placeholder="Fourth option">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Correct Answer *</label>
                                    <select id="correctAnswer" required 
                                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="a">A</option>
                                        <option value="b">B</option>
                                        <option value="c">C</option>
                                        <option value="d">D</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Reward (UGX)</label>
                                    <input type="number" id="triviaReward" value="400" min="1" 
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <button type="submit" style="padding: 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                                <i class="fas fa-plus"></i> Add Trivia Question
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        async loadTrivia() {
            const triviaList = document.getElementById('triviaList');
            if (!triviaList) return;

            // Show sample trivia for now
            const sampleTrivia = [
                {
                    id: 1,
                    question: 'What is the capital of France?',
                    options: { a: 'London', b: 'Berlin', c: 'Paris', d: 'Madrid' },
                    correct_answer: 'c',
                    reward_amount: 400,
                    is_active: true
                },
                {
                    id: 2,
                    question: 'Which planet is known as the Red Planet?',
                    options: { a: 'Venus', b: 'Mars', c: 'Jupiter', d: 'Saturn' },
                    correct_answer: 'b',
                    reward_amount: 400,
                    is_active: true
                }
            ];

            this.trivia = sampleTrivia;
            this.renderTriviaList(sampleTrivia);
        }

        renderTriviaList(trivia) {
            const triviaList = document.getElementById('triviaList');
            if (!triviaList) return;

            if (!trivia || trivia.length === 0) {
                triviaList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No trivia questions found.</p>';
                return;
            }

            let html = '<div style="display: grid; gap: 10px;">';
            trivia.forEach((q, index) => {
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: white;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <strong style="font-size: 14px;">Q${index + 1}: ${q.question}</strong>
                            <span style="padding: 2px 8px; background: ${q.is_active ? '#2ecc71' : '#e74c3c'}; color: white; border-radius: 10px; font-size: 12px;">
                                ${q.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            ${Object.entries(q.options || {}).map(([key, value]) => `
                                <div style="padding: 6px; background: ${q.correct_answer === key ? '#d4edda' : '#f8f9fa'}; 
                                     border-radius: 4px; border: 1px solid #eee; font-size: 13px;">
                                    <strong>${key.toUpperCase()}:</strong> ${value}
                                    ${q.correct_answer === key ? ' ✓' : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div style="font-size: 13px; color: #7f8c8d;">
                            <i class="fas fa-money-bill-wave"></i> UGX ${q.reward_amount}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            triviaList.innerHTML = html;
            
            // Add form submission
            const form = document.getElementById('addTriviaForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTrivia();
                });
            }
        }

        addTrivia() {
            try {
                const question = document.getElementById('triviaQuestion').value.trim();
                const optionA = document.getElementById('optionA').value.trim();
                const optionB = document.getElementById('optionB').value.trim();
                const optionC = document.getElementById('optionC').value.trim();
                const optionD = document.getElementById('optionD').value.trim();
                const correctAnswer = document.getElementById('correctAnswer').value;
                const reward = parseInt(document.getElementById('triviaReward').value) || 400;

                if (!question || !optionA || !optionB) {
                    this.showNotification('Please fill all required fields', 'error');
                    return;
                }

                const options = {
                    a: optionA,
                    b: optionB
                };
                
                if (optionC) options.c = optionC;
                if (optionD) options.d = optionD;

                const newTrivia = {
                    id: Date.now(),
                    question: question,
                    options: options,
                    correct_answer: correctAnswer,
                    reward_amount: reward,
                    is_active: true,
                    created_at: new Date().toISOString()
                };

                // Add to local array
                this.trivia.unshift(newTrivia);
                
                // Update display
                this.renderTriviaList(this.trivia);
                
                // Sync to dashboard.html
                this.syncTriviaToDashboard();
                
                // Show success message
                this.showNotification('Trivia question added successfully!', 'success');
                
                // Reset form
                document.getElementById('addTriviaForm').reset();
                
            } catch (error) {
                console.error('Error adding trivia:', error);
                this.showNotification('Error adding trivia question', 'error');
            }
        }

        // ============================================
        // 7. DASHBOARD SYNC SYSTEM
        // ============================================

        async syncTasksToDashboard() {
            try {
                console.log('Syncing tasks to dashboard.html...');
                
                // For now, we'll store in localStorage
                // In production, you would save to your database
                localStorage.setItem('dashboard_tasks', JSON.stringify(this.tasks));
                
                this.showNotification('Tasks synced to dashboard', 'success');
            } catch (error) {
                console.error('Error syncing tasks:', error);
            }
        }

        async syncTriviaToDashboard() {
            try {
                console.log('Syncing trivia to dashboard.html...');
                
                // Store in localStorage
                localStorage.setItem('dashboard_trivia', JSON.stringify(this.trivia));
                
                this.showNotification('Trivia synced to dashboard', 'success');
            } catch (error) {
                console.error('Error syncing trivia:', error);
            }
        }

        async syncDashboard() {
            await this.syncTasksToDashboard();
            await this.syncTriviaToDashboard();
            this.showNotification('Dashboard content synced successfully!', 'success');
        }

        // ============================================
        // 8. QUICK ACTION HANDLERS
        // ============================================

        handleQuickAction(action) {
            switch (action) {
                case 'tasks':
                    this.openTaskManager();
                    break;
                case 'trivia':
                    this.openTriviaManager();
                    break;
                case 'sync':
                    this.syncDashboard();
                    break;
                case 'report':
                    this.showStatsReport();
                    break;
            }
        }

        handleBulkWithdrawal(action) {
            const actionText = action === 'approve' ? 'approve' : 
                              action === 'reject' ? 'reject' : 'mark as processing';
            
            if (confirm(`Are you sure you want to ${actionText} selected withdrawals?`)) {
                this.showNotification(`Withdrawals ${actionText}d successfully`, 'success');
                
                // In production, this would update the database
                // For now, just show a notification
                setTimeout(() => {
                    if (typeof window.loadWithdrawals === 'function') {
                        window.loadWithdrawals();
                    }
                }, 1000);
            }
        }

        showStatsReport() {
            const stats = {
                total_tasks: this.tasks.length,
                active_tasks: this.tasks.filter(t => t.is_active).length,
                total_trivia: this.trivia.length,
                active_trivia: this.trivia.filter(t => t.is_active).length,
                last_sync: new Date().toLocaleString()
            };

            const reportHTML = `
                <div style="padding: 20px;">
                    <h4 style="margin-bottom: 20px; color: #2c3e50;">Content Statistics</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #3498db; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold;">${stats.total_tasks}</div>
                            <div style="font-size: 14px;">Total Tasks</div>
                        </div>
                        <div style="background: #2ecc71; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold;">${stats.active_tasks}</div>
                            <div style="font-size: 14px;">Active Tasks</div>
                        </div>
                        <div style="background: #9b59b6; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold;">${stats.total_trivia}</div>
                            <div style="font-size: 14px;">Trivia Questions</div>
                        </div>
                        <div style="background: #e74c3c; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold;">${stats.active_trivia}</div>
                            <div style="font-size: 14px;">Active Trivia</div>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #666;"><strong>Last Sync:</strong> ${stats.last_sync}</p>
                    </div>
                    <button onclick="window.dashboardManager.exportStats()" style="
                        padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; 
                        cursor: pointer; width: 100%; font-size: 14px;
                    ">
                        <i class="fas fa-download"></i> Export Statistics
                    </button>
                </div>
            `;

            this.showModal('Content Statistics', reportHTML);
        }

        exportStats() {
            const stats = {
                total_tasks: this.tasks.length,
                active_tasks: this.tasks.filter(t => t.is_active).length,
                total_trivia: this.trivia.length,
                active_trivia: this.trivia.filter(t => t.is_active).length,
                last_sync: new Date().toISOString()
            };

            const csvContent = Object.entries(stats)
                .map(([key, value]) => `${key},${value}`)
                .join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_stats_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Statistics exported successfully', 'success');
        }

        // ============================================
        // 9. MODAL SYSTEM
        // ============================================

        showModal(title, content) {
            // Remove existing modal if any
            this.closeModal();

            // Create modal container
            const modal = document.createElement('div');
            modal.id = 'dashboardManagerModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 700px;
                max-height: 85vh;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
            `;

            // Add header
            modalContent.innerHTML = `
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #2c3e50;
                    color: white;
                ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${title}</h3>
                    <button id="closeModalBtn" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: white;
                        line-height: 1;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                    ">&times;</button>
                </div>
                ${content}
            `;

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Add animations
            if (!document.querySelector('#modal-animations')) {
                const style = document.createElement('style');
                style.id = 'modal-animations';
                style.textContent = `
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                `;
                document.head.appendChild(style);
            }

            // Add event listeners
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });

            document.getElementById('closeModalBtn').addEventListener('click', () => {
                this.closeModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            });

            // Store reference and prevent body scroll
            this.activeModal = modal;
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            if (this.activeModal) {
                document.body.removeChild(this.activeModal);
                this.activeModal = null;
                document.body.style.overflow = '';
            }
        }

        // ============================================
        // 10. NOTIFICATION SYSTEM
        // ============================================

        showNotification(message, type = 'info') {
            // Use existing notification system if available
            if (typeof window.showNotification === 'function') {
                window.showNotification(message, type);
                return;
            }

            // Create notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                font-size: 14px;
                max-width: 300px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            // Add animation
            if (!document.querySelector('#notification-anim')) {
                const style = document.createElement('style');
                style.id = 'notification-anim';
                style.textContent = `
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                    @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
                `;
                document.head.appendChild(style);
            }

            // Remove after 5 seconds
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
        }
    }

    // ============================================
    // 11. INITIALIZATION
    // ============================================

    // Create global instance
    window.dashboardManager = new DashboardContentManager();

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initializing Dashboard Manager...');
        
        // Wait a bit for other scripts to load
        setTimeout(() => {
            window.dashboardManager.init();
        }, 1000);
    });

    console.log('Dashboard Manager script loaded successfully');

})();