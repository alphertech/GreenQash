// Admin Posting System JavaScript

class AdminPostingSystem {
    constructor() {
        this.currentUser = 'admin';
        this.content = JSON.parse(localStorage.getItem('skylink_content')) || [];
        this.settings = JSON.parse(localStorage.getItem('skylink_admin_settings')) || {};
        this.currentTab = 'dashboard';
        this.selectedItems = new Set();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('Admin Posting System Initializing...');
        
        // Check if user is admin
        if (!this.checkAdminAccess()) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Setup all components
        this.setupNavigation();
        this.setupForms();
        this.setupContentManagement();
        this.setupAnalytics();
        this.setupSettings();
        this.setupModals();
        this.setupEventListeners();
        
        // Load initial data
        this.loadDashboardData();
        this.loadContentTable();
        
        console.log('Admin Posting System Initialized');
        
        // Auto-save every 30 seconds
        setInterval(() => this.autoSave(), 30000);
    }
    
    checkAdminAccess() {
        // Check localStorage for admin user
        const user = localStorage.getItem('skylink_user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.role === 'admin' || userData.role === 'superadmin';
            } catch (e) {
                console.error('Error parsing user data:', e);
                return false;
            }
        }
        return false;
    }
    
    setupNavigation() {
        console.log('Setting up navigation...');
        
        // Navigation links
        const navLinks = {
            'dashboard-link': 'dashboard',
            'create-post-link': 'create-post',
            'manage-content-link': 'manage-content',
            'analytics-link': 'analytics',
            'settings-link': 'settings'
        };
        
        Object.entries(navLinks).forEach(([id, target]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection(target);
                });
            }
        });
        
        // Back to dashboard button
        const backBtn = document.getElementById('back-to-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'dashboard.html';
            });
        }
        
        // Quick actions
        const quickCreateVideo = document.getElementById('quick-create-video');
        if (quickCreateVideo) {
            quickCreateVideo.addEventListener('click', () => {
                this.showSection('create-post');
                const videoTab = document.querySelector('[data-tab="video-tab"]');
                if (videoTab) videoTab.click();
            });
        }
        
        const quickCreateTrivia = document.getElementById('quick-create-trivia');
        if (quickCreateTrivia) {
            quickCreateTrivia.addEventListener('click', () => {
                this.showSection('create-post');
                const triviaTab = document.querySelector('[data-tab="trivia-tab"]');
                if (triviaTab) triviaTab.click();
            });
        }
        
        const quickSchedule = document.getElementById('quick-schedule');
        if (quickSchedule) {
            quickSchedule.addEventListener('click', () => {
                this.showSection('create-post');
                const publishOption = document.querySelector('input[name="publish-option"][value="schedule"]');
                if (publishOption) publishOption.click();
            });
        }
    }
    
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentTab = section;
            
            // Update nav active state
            document.querySelectorAll('.admin-nav a').forEach(link => {
                link.classList.remove('active');
            });
            const navLink = document.getElementById(`${section}-link`);
            if (navLink) navLink.classList.add('active');
            
            // Load section-specific data
            switch(section) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'manage-content':
                    this.loadContentTable();
                    break;
                case 'analytics':
                    this.loadAnalytics();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
            }
        }
    }
    
    setupForms() {
        console.log('Setting up forms...');
        
        // Video form
        const videoForm = document.getElementById('video-post-form');
        if (videoForm) {
            videoForm.addEventListener('submit', (e) => this.handleVideoSubmit(e));
        }
        
        // Fetch metadata button
        const fetchBtn = document.getElementById('fetch-metadata-btn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.fetchVideoMetadata());
        }
        
        // Video platform change
        const videoPlatform = document.getElementById('video-platform');
        if (videoPlatform) {
            videoPlatform.addEventListener('change', () => this.updateVideoForm());
        }
        
        // Publish options
        document.querySelectorAll('input[name="publish-option"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const schedulePicker = document.getElementById('schedule-picker');
                if (schedulePicker) {
                    schedulePicker.style.display = e.target.value === 'schedule' ? 'block' : 'none';
                }
            });
        });
        
        // Trivia form
        const triviaForm = document.getElementById('trivia-post-form');
        if (triviaForm) {
            triviaForm.addEventListener('submit', (e) => this.handleTriviaSubmit(e));
        }
        
        // Text form
        const textForm = document.getElementById('text-post-form');
        if (textForm) {
            textForm.addEventListener('submit', (e) => this.handleTextSubmit(e));
        }
        
        // Rich text editor
        document.querySelectorAll('.rich-text-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                document.execCommand(command, false, null);
            });
        });
        
        // Image dropzone
        const dropzone = document.getElementById('image-dropzone');
        if (dropzone) {
            dropzone.addEventListener('click', () => {
                document.getElementById('text-image').click();
            });
            
            const textImage = document.getElementById('text-image');
            if (textImage) {
                textImage.addEventListener('change', (e) => {
                    this.handleImageUpload(e.target.files[0]);
                });
            }
            
            // Drag and drop
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleImageUpload(file);
                }
            });
        }
        
        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveAsDraft());
        }
        
        // Refresh preview
        const refreshPreview = document.getElementById('refresh-preview');
        if (refreshPreview) {
            refreshPreview.addEventListener('click', () => this.updatePreview());
        }
    }
    
    setupContentManagement() {
        console.log('Setting up content management...');
        
        // Filters
        const applyFilters = document.getElementById('apply-filters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.loadContentTable());
        }
        
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.content-table input[type="checkbox"]:not(#select-all)');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    if (checkbox.dataset.id) {
                        if (e.target.checked) {
                            this.selectedItems.add(checkbox.dataset.id);
                        } else {
                            this.selectedItems.delete(checkbox.dataset.id);
                        }
                    }
                });
                this.updateSelectedCount();
            });
        }
        
        // Bulk actions
        const bulkActionsBtn = document.getElementById('bulk-actions-btn');
        if (bulkActionsBtn) {
            bulkActionsBtn.addEventListener('click', () => {
                if (this.selectedItems.size > 0) {
                    this.showModal('bulk-actions-modal');
                } else {
                    this.showNotification('Please select items first', 'error');
                }
            });
        }
        
        const confirmBulkAction = document.getElementById('confirm-bulk-action');
        if (confirmBulkAction) {
            confirmBulkAction.addEventListener('click', () => {
                const action = document.getElementById('bulk-action').value;
                if (action) {
                    this.performBulkAction(action);
                }
            });
        }
        
        // Pagination
        const prevPage = document.getElementById('prev-page');
        if (prevPage) {
            prevPage.addEventListener('click', () => this.previousPage());
        }
        
        const nextPage = document.getElementById('next-page');
        if (nextPage) {
            nextPage.addEventListener('click', () => this.nextPage());
        }
        
        // Export
        const exportBtn = document.getElementById('export-content-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportContent());
        }
    }
    
    setupAnalytics() {
        const refreshAnalytics = document.getElementById('refresh-analytics');
        if (refreshAnalytics) {
            refreshAnalytics.addEventListener('click', () => this.loadAnalytics());
        }
        
        const analyticsPeriod = document.getElementById('analytics-period');
        if (analyticsPeriod) {
            analyticsPeriod.addEventListener('change', () => this.loadAnalytics());
        }
    }
    
    setupSettings() {
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        const backupContent = document.getElementById('backup-content');
        if (backupContent) {
            backupContent.addEventListener('click', () => this.backupContent());
        }
        
        const exportAllContent = document.getElementById('export-all-content');
        if (exportAllContent) {
            exportAllContent.addEventListener('click', () => this.exportAllContent());
        }
    }
    
    setupModals() {
        // Close buttons
        document.querySelectorAll('.modal-close, .close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });
        
        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = btn.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
        
        // Form changes trigger preview updates
        const forms = ['video-post-form', 'trivia-post-form', 'text-post-form'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('input', () => this.updatePreview());
                form.addEventListener('change', () => this.updatePreview());
            }
        });
    }
    
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        
        // Show tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId)?.classList.add('active');
        
        // Refresh preview
        this.updatePreview();
    }
    
    async fetchVideoMetadata() {
        const url = document.getElementById('video-url').value;
        const platform = document.getElementById('video-platform').value;
        
        if (!url || !platform) {
            this.showNotification('Please enter a URL and select a platform', 'error');
            return;
        }
        
        this.showNotification('Fetching video metadata...', 'info');
        
        // Simulate API call delay
        setTimeout(() => {
            try {
                let metadata;
                
                if (platform === 'youtube') {
                    metadata = this.generateYouTubeMetadata(url);
                } else if (platform === 'tiktok') {
                    metadata = this.generateTikTokMetadata(url);
                } else {
                    metadata = this.generateGenericMetadata(url);
                }
                
                // Populate form fields
                if (metadata.title) {
                    document.getElementById('video-title').value = metadata.title;
                }
                if (metadata.description) {
                    document.getElementById('video-description').value = metadata.description;
                }
                if (metadata.duration) {
                    document.getElementById('video-duration').value = metadata.duration;
                }
                if (metadata.thumbnail) {
                    this.showThumbnail(metadata.thumbnail);
                }
                
                this.showNotification('Video metadata fetched successfully!', 'success');
                this.updatePreview();
                
            } catch (error) {
                console.error('Error fetching metadata:', error);
                this.showNotification('Could not fetch metadata. Please enter manually.', 'error');
            }
        }, 1500);
    }
    
    generateYouTubeMetadata(url) {
        return {
            title: 'Demo YouTube Video - Learn How to Earn Money Online',
            description: 'Watch this amazing tutorial video to learn how you can earn money by completing simple tasks. Like, share, and subscribe for more content!',
            duration: 120,
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        };
    }
    
    generateTikTokMetadata(url) {
        return {
            title: 'Trending TikTok Dance Challenge',
            description: 'Join the latest dance challenge! Watch, like, and follow to earn rewards. #dance #challenge #tiktok',
            duration: 60,
            thumbnail: 'https://via.placeholder.com/600x400/000000/FFFFFF?text=TikTok+Video'
        };
    }
    
    generateGenericMetadata(url) {
        return {
            title: 'Social Media Video Content',
            description: 'Engaging video content for social media platforms. Watch and earn rewards!',
            duration: 90,
            thumbnail: 'https://via.placeholder.com/600x400/2ecc71/FFFFFF?text=Video+Thumbnail'
        };
    }
    
    showThumbnail(url) {
        const placeholder = document.getElementById('preview-placeholder');
        const thumbnail = document.getElementById('thumbnail-preview');
        
        if (placeholder) placeholder.style.display = 'none';
        if (thumbnail) {
            thumbnail.src = url;
            thumbnail.style.display = 'block';
            thumbnail.classList.add('active');
        }
    }
    
    updateVideoForm() {
        const platform = document.getElementById('video-platform').value;
        const urlField = document.getElementById('video-url');
        
        if (!urlField) return;
        
        if (platform === 'youtube') {
            urlField.placeholder = 'https://youtube.com/watch?v=... or https://youtu.be/...';
        } else if (platform === 'tiktok') {
            urlField.placeholder = 'https://tiktok.com/@username/video/...';
        } else if (platform === 'instagram') {
            urlField.placeholder = 'https://instagram.com/reel/...';
        } else {
            urlField.placeholder = 'Enter video URL';
        }
    }
    
    handleVideoSubmit(e) {
        e.preventDefault();
        
        const platform = document.getElementById('video-platform').value;
        const url = document.getElementById('video-url').value;
        const title = document.getElementById('video-title').value;
        const reward = parseInt(document.getElementById('video-reward').value) || 250;
        const description = document.getElementById('video-description').value;
        const sponsor = document.getElementById('video-sponsor').value;
        const category = document.getElementById('video-category').value;
        const duration = parseInt(document.getElementById('video-duration').value) || 60;
        const tags = document.getElementById('video-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        const publishOption = document.querySelector('input[name="publish-option"]:checked');
        let scheduledDate = null;
        let status = 'published';
        
        if (publishOption && publishOption.value === 'schedule') {
            const date = document.getElementById('schedule-date').value;
            const time = document.getElementById('schedule-time').value;
            if (date && time) {
                scheduledDate = new Date(`${date}T${time}`).toISOString();
                status = 'scheduled';
            }
        }
        
        const videoData = {
            id: this.generateId(),
            type: 'video',
            platform: platform,
            url: url,
            title: title,
            description: description,
            reward: reward,
            sponsor: sponsor || null,
            category: category,
            duration: duration,
            tags: tags,
            status: status,
            scheduledDate: scheduledDate,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser,
            views: 0,
            completions: 0,
            earnings: 0
        };
        
        this.content.push(videoData);
        this.saveContent();
        
        this.showNotification(`Video post "${title}" created successfully!`, 'success');
        
        // Reset form
        e.target.reset();
        const placeholder = document.getElementById('preview-placeholder');
        const thumbnail = document.getElementById('thumbnail-preview');
        if (placeholder) placeholder.style.display = 'block';
        if (thumbnail) thumbnail.style.display = 'none';
        
        // Update dashboard
        this.loadDashboardData();
        this.updatePreview();
    }
    
    handleTriviaSubmit(e) {
        e.preventDefault();
        
        const question = document.getElementById('trivia-question').value;
        const options = [];
        
        // Collect options
        for (let i = 1; i <= 4; i++) {
            const optionInput = document.querySelector(`input[data-option="${i}"]`);
            if (optionInput && optionInput.value) {
                const isCorrect = document.querySelector(`input[name="correct-answer"][value="${i}"]`).checked;
                options.push({
                    id: i,
                    text: optionInput.value,
                    isCorrect: isCorrect
                });
            }
        }
        
        const reward = parseInt(document.getElementById('trivia-reward').value) || 400;
        const category = document.getElementById('trivia-category').value;
        const explanation = document.getElementById('trivia-explanation').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        
        const triviaData = {
            id: this.generateId(),
            type: 'trivia',
            question: question,
            options: options,
            reward: reward,
            category: category,
            explanation: explanation,
            difficulty: difficulty,
            status: 'published',
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser,
            attempts: 0,
            correctAnswers: 0,
            earnings: 0
        };
        
        this.content.push(triviaData);
        this.saveContent();
        
        this.showNotification(`Trivia question created successfully!`, 'success');
        
        // Reset form
        e.target.reset();
        document.querySelector('input[name="correct-answer"][value="1"]').checked = true;
        
        // Update dashboard
        this.loadDashboardData();
        this.updatePreview();
    }
    
    async handleImageUpload(file) {
        if (!file) return;
        
        const dropzone = document.getElementById('image-dropzone');
        const progressBar = document.getElementById('upload-progress');
        const progressFill = progressBar?.querySelector('.progress-fill');
        
        if (!dropzone) return;
        
        // Show progress bar
        if (progressBar) progressBar.style.display = 'block';
        
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (progressFill) progressFill.style.width = `${i}%`;
        }
        
        // Create object URL for preview
        const imageUrl = URL.createObjectURL(file);
        
        // Update dropzone with preview
        dropzone.innerHTML = `
            <img src="${imageUrl}" style="max-width: 100%; max-height: 200px; border-radius: 4px;" alt="Preview">
            <p style="margin-top: 1rem;">${file.name} (${Math.round(file.size / 1024)} KB)</p>
        `;
        
        if (progressBar) progressBar.style.display = 'none';
        this.showNotification('Image uploaded successfully!', 'success');
    }
    
    handleTextSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('text-title').value;
        const content = document.getElementById('text-content').innerHTML;
        const type = document.getElementById('text-type').value;
        const reward = parseInt(document.getElementById('text-reward').value) || 0;
        
        const textData = {
            id: this.generateId(),
            type: 'text',
            title: title,
            content: content,
            postType: type,
            reward: reward,
            status: 'published',
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser,
            views: 0,
            earnings: 0
        };
        
        this.content.push(textData);
        this.saveContent();
        
        this.showNotification(`Text post "${title}" created successfully!`, 'success');
        
        // Reset form
        e.target.reset();
        const textContent = document.getElementById('text-content');
        if (textContent) textContent.innerHTML = '<p>Type your post content here...</p>';
        
        const dropzone = document.getElementById('image-dropzone');
        if (dropzone) {
            dropzone.innerHTML = `
                <p><i class="fas fa-cloud-upload-alt"></i></p>
                <p>Drag & drop an image here, or click to browse</p>
            `;
        }
        
        // Update dashboard
        this.loadDashboardData();
        this.updatePreview();
    }
    
    saveAsDraft() {
        const currentTab = document.querySelector('.tab-btn.active');
        if (!currentTab) return;
        
        const tabId = currentTab.getAttribute('data-tab');
        let draftData = {
            id: this.generateId(),
            type: tabId.replace('-tab', ''),
            status: 'draft',
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser
        };
        
        // Collect form data based on current tab
        if (tabId === 'video-tab') {
            draftData = {
                ...draftData,
                title: document.getElementById('video-title').value || 'Untitled Video',
                platform: document.getElementById('video-platform').value,
                url: document.getElementById('video-url').value
            };
        } else if (tabId === 'trivia-tab') {
            draftData = {
                ...draftData,
                question: document.getElementById('trivia-question').value || 'Untitled Question'
            };
        } else if (tabId === 'text-tab') {
            draftData = {
                ...draftData,
                title: document.getElementById('text-title').value || 'Untitled Post'
            };
        }
        
        this.content.push(draftData);
        this.saveContent();
        
        this.showNotification('Post saved as draft!', 'success');
        this.loadDashboardData();
    }
    
    updatePreview() {
        const currentTab = document.querySelector('.tab-btn.active');
        if (!currentTab) return;
        
        const tabId = currentTab.getAttribute('data-tab');
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) return;
        
        if (tabId === 'video-tab') {
            const title = document.getElementById('video-title')?.value || 'Video Title';
            const description = document.getElementById('video-description')?.value || 'Video description will appear here...';
            const reward = document.getElementById('video-reward')?.value || '250';
            const platform = document.getElementById('video-platform')?.value || 'youtube';
            
            let platformIcon = 'fas fa-video';
            let platformClass = '';
            let platformName = 'Video';
            
            if (platform === 'youtube') {
                platformIcon = 'fab fa-youtube';
                platformClass = 'platform-youtube';
                platformName = 'YouTube';
            } else if (platform === 'tiktok') {
                platformIcon = 'fab fa-tiktok';
                platformClass = 'platform-tiktok';
                platformName = 'TikTok';
            } else if (platform === 'instagram') {
                platformIcon = 'fab fa-instagram';
                platformClass = 'platform-instagram';
                platformName = 'Instagram';
            }
            
            previewContent.innerHTML = `
                <div class="preview-video">
                    <img src="https://via.placeholder.com/600x400/2ecc71/FFFFFF?text=Video+Preview" 
                         alt="Video Preview" 
                         class="preview-thumbnail">
                </div>
                <h4>${this.escapeHtml(title)}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
                    <span class="platform-tag ${platformClass}">
                        <i class="${platformIcon}"></i> ${platformName}
                    </span>
                    <span style="color: var(--primary-color); font-weight: bold;">
                        Reward: UGX ${reward}
                    </span>
                </div>
                <p>${this.escapeHtml(description)}</p>
                <div style="margin-top: 1rem; padding: 1rem; background-color: #f8f9fa; border-radius: 6px;">
                    <p style="margin: 0; font-size: 0.9rem; color: var(--gray-color);">
                        <i class="fas fa-info-circle"></i> 
                        Users will watch this video and earn UGX ${reward}
                    </p>
                </div>
            `;
            
        } else if (tabId === 'trivia-tab') {
            const question = document.getElementById('trivia-question')?.value || 'Trivia question will appear here?';
            const reward = document.getElementById('trivia-reward')?.value || '400';
            const options = [];
            
            for (let i = 1; i <= 4; i++) {
                const optionInput = document.querySelector(`input[data-option="${i}"]`);
                if (optionInput && optionInput.value) {
                    const isCorrect = document.querySelector(`input[name="correct-answer"][value="${i}"]`)?.checked || false;
                    options.push({
                        text: optionInput.value,
                        isCorrect: isCorrect
                    });
                }
            }
            
            let optionsHtml = '';
            options.forEach((option, index) => {
                const letter = String.fromCharCode(65 + index);
                optionsHtml += `
                    <div style="padding: 0.8rem; margin: 0.5rem 0; background-color: ${option.isCorrect ? 'rgba(46, 204, 113, 0.1)' : '#f8f9fa'}; 
                                border-radius: 6px; border: 1px solid ${option.isCorrect ? 'var(--primary-color)' : '#eee'};">
                        <strong>${letter}.</strong> ${this.escapeHtml(option.text)}
                        ${option.isCorrect ? ' <i class="fas fa-check" style="color: var(--primary-color);"></i>' : ''}
                    </div>
                `;
            });
            
            previewContent.innerHTML = `
                <div style="padding: 1.5rem; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 1rem;">Daily Trivia Challenge</h4>
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 1.1rem; margin-bottom: 1rem;">${this.escapeHtml(question)}</p>
                        <div style="margin-bottom: 1.5rem;">
                            ${optionsHtml || '<p style="color: #95a5a6; font-style: italic;">Options will appear here...</p>'}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--primary-color); font-weight: bold;">
                            Reward: UGX ${reward}
                        </span>
                        <span style="font-size: 0.9rem; color: var(--gray-color);">
                            <i class="fas fa-question-circle"></i> Choose the correct answer
                        </span>
                    </div>
                </div>
            `;
            
        } else if (tabId === 'text-tab') {
            const title = document.getElementById('text-title')?.value || 'Post Title';
            const content = document.getElementById('text-content')?.innerHTML || '<p>Post content will appear here...</p>';
            const reward = document.getElementById('text-reward')?.value || '100';
            
            previewContent.innerHTML = `
                <div style="padding: 1.5rem; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 1rem;">${this.escapeHtml(title)}</h4>
                    <div style="margin-bottom: 1.5rem; line-height: 1.6;">
                        ${content}
                    </div>
                    <div style="padding-top: 1rem; border-top: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--primary-color); font-weight: bold;">
                                Reading Reward: UGX ${reward}
                            </span>
                            <button style="padding: 0.5rem 1rem; background-color: var(--primary-color); 
                                      color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Mark as Read
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    loadContentTable(page = 1, pageSize = 10) {
        const filters = this.getFilters();
        let filteredContent = this.content.filter(item => {
            // Platform filter
            if (filters.platform) {
                if (item.type === 'video' && item.platform !== filters.platform) return false;
                if (item.type !== 'video' && item.type !== filters.platform) return false;
            }
            
            // Status filter
            if (filters.status && item.status !== filters.status) {
                return false;
            }
            
            // Category filter
            if (filters.category && item.category !== filters.category) {
                return false;
            }
            
            // Date filter
            if (filters.date) {
                const itemDate = new Date(item.createdAt).toDateString();
                const filterDate = new Date(filters.date).toDateString();
                if (itemDate !== filterDate) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort by date (newest first)
        filteredContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = filteredContent.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageContent = filteredContent.slice(start, end);
        
        const tableBody = document.getElementById('content-table-body');
        if (!tableBody) return;
        
        if (pageContent.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>No content found matching your filters</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = pageContent.map(item => this.createContentRow(item)).join('');
            
            // Add event listeners to row checkboxes
            tableBody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const id = e.target.dataset.id;
                    if (e.target.checked) {
                        this.selectedItems.add(id);
                    } else {
                        this.selectedItems.delete(id);
                        const selectAll = document.getElementById('select-all');
                        if (selectAll) selectAll.checked = false;
                    }
                    this.updateSelectedCount();
                });
            });
            
            // Add event listeners to action buttons
            tableBody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    const id = row?.dataset.id;
                    if (id) this.editContent(id);
                });
            });
            
            tableBody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    const id = row?.dataset.id;
                    if (id && confirm('Are you sure you want to delete this content?')) {
                        this.deleteContent(id);
                    }
                });
            });
            
            tableBody.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    const id = row?.dataset.id;
                    if (id) this.viewContent(id);
                });
            });
        }
        
        // Update pagination info
        const showingCount = document.getElementById('showing-count');
        const totalCount = document.getElementById('total-count');
        const currentPage = document.getElementById('current-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (showingCount) showingCount.textContent = `${start + 1}-${Math.min(end, total)}`;
        if (totalCount) totalCount.textContent = total;
        if (currentPage) currentPage.textContent = page;
        if (prevPageBtn) prevPageBtn.disabled = page <= 1;
        if (nextPageBtn) nextPageBtn.disabled = page >= totalPages;
    }
    
    createContentRow(item) {
        let platformInfo = '';
        let thumbnail = '';
        let reward = '';
        let title = item.title || item.question || 'Untitled';
        
        if (item.type === 'video') {
            platformInfo = `
                <span class="platform-tag platform-${item.platform}">
                    <i class="fab fa-${item.platform}"></i> ${item.platform}
                </span>
            `;
            thumbnail = `<img src="https://via.placeholder.com/60x40/2ecc71/FFFFFF?text=Video" class="thumbnail-preview">`;
            reward = `UGX ${item.reward || 0}`;
        } else if (item.type === 'trivia') {
            platformInfo = '<span style="color: var(--info-color);"><i class="fas fa-question-circle"></i> Trivia</span>';
            thumbnail = `<img src="https://via.placeholder.com/60x40/3498db/FFFFFF?text=Trivia" class="thumbnail-preview">`;
            reward = `UGX ${item.reward || 0}`;
        } else if (item.type === 'text') {
            platformInfo = '<span style="color: var(--warning-color);"><i class="fas fa-file-alt"></i> Text</span>';
            thumbnail = `<img src="https://via.placeholder.com/60x40/f39c12/FFFFFF?text=Post" class="thumbnail-preview">`;
            reward = `UGX ${item.reward || 0}`;
        }
        
        const statusClass = `status-${item.status}`;
        const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        
        const date = new Date(item.createdAt);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" data-id="${item.id}">
                </td>
                <td>
                    <div style="display: flex; align-items: center;">
                        ${thumbnail}
                        <div>
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">${this.escapeHtml(title.substring(0, 50))}${title.length > 50 ? '...' : ''}</div>
                            <div style="font-size: 0.85rem; color: var(--gray-color);">
                                ${item.description ? this.escapeHtml(item.description.substring(0, 50)) + '...' : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${platformInfo}</td>
                <td>${item.category || 'General'}</td>
                <td>${reward}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formattedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getFilters() {
        return {
            platform: document.getElementById('filter-platform')?.value || '',
            status: document.getElementById('filter-status')?.value || '',
            category: document.getElementById('filter-category')?.value || '',
            date: document.getElementById('filter-date')?.value || ''
        };
    }
    
    clearFilters() {
        const filterPlatform = document.getElementById('filter-platform');
        const filterStatus = document.getElementById('filter-status');
        const filterCategory = document.getElementById('filter-category');
        const filterDate = document.getElementById('filter-date');
        
        if (filterPlatform) filterPlatform.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterCategory) filterCategory.value = '';
        if (filterDate) filterDate.value = '';
        
        this.loadContentTable();
    }
    
    updateSelectedCount() {
        const selectedCount = document.getElementById('selected-count');
        if (selectedCount) {
            selectedCount.textContent = this.selectedItems.size;
        }
    }
    
    performBulkAction(action) {
        const selectedIds = Array.from(this.selectedItems);
        
        selectedIds.forEach(id => {
            const index = this.content.findIndex(item => item.id === id);
            if (index !== -1) {
                if (action === 'delete') {
                    this.content.splice(index, 1);
                } else {
                    this.content[index].status = action;
                }
            }
        });
        
        this.saveContent();
        this.loadContentTable();
        this.selectedItems.clear();
        this.updateSelectedCount();
        this.hideModal('bulk-actions-modal');
        
        this.showNotification(`Bulk action "${action}" completed on ${selectedIds.length} items`, 'success');
    }
    
    editContent(id) {
        const content = this.content.find(item => item.id === id);
        if (!content) return;
        
        let modalContent = '';
        
        if (content.type === 'video') {
            modalContent = `
                <h4>Edit Video Post</h4>
                <form id="edit-video-form">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" class="form-control" value="${this.escapeHtml(content.title || '')}" id="edit-video-title">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control" rows="3" id="edit-video-description">${this.escapeHtml(content.description || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Reward (UGX)</label>
                        <input type="number" class="form-control" value="${content.reward || 250}" id="edit-video-reward">
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `;
        } else if (content.type === 'trivia') {
            modalContent = `
                <h4>Edit Trivia Question</h4>
                <form id="edit-trivia-form">
                    <div class="form-group">
                        <label>Question</label>
                        <textarea class="form-control" rows="2" id="edit-trivia-question">${this.escapeHtml(content.question || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Reward (UGX)</label>
                        <input type="number" class="form-control" value="${content.reward || 400}" id="edit-trivia-reward">
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `;
        }
        
        const editModalBody = document.getElementById('edit-modal-body');
        if (editModalBody) {
            editModalBody.innerHTML = modalContent;
            this.showModal('edit-content-modal');
            
            // Handle form submission
            const form = document.getElementById('edit-video-form') || document.getElementById('edit-trivia-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveContentEdit(id, form);
                });
            }
        }
    }
    
    saveContentEdit(id, form) {
        const index = this.content.findIndex(item => item.id === id);
        if (index === -1) return;
        
        const content = this.content[index];
        
        if (content.type === 'video') {
            content.title = form.querySelector('#edit-video-title').value;
            content.description = form.querySelector('#edit-video-description').value;
            content.reward = parseInt(form.querySelector('#edit-video-reward').value);
        } else if (content.type === 'trivia') {
            content.question = form.querySelector('#edit-trivia-question').value;
            content.reward = parseInt(form.querySelector('#edit-trivia-reward').value);
        }
        
        this.saveContent();
        this.loadContentTable();
        this.hideModal('edit-content-modal');
        this.showNotification('Content updated successfully!', 'success');
    }
    
    deleteContent(id) {
        const index = this.content.findIndex(item => item.id === id);
        if (index !== -1) {
            this.content.splice(index, 1);
            this.saveContent();
            this.loadContentTable();
            this.loadDashboardData();
            this.showNotification('Content deleted successfully!', 'success');
        }
    }
    
    viewContent(id) {
        const content = this.content.find(item => item.id === id);
        if (!content) return;
        
        alert(`Viewing: ${content.title || content.question}\n\nType: ${content.type}\nStatus: ${content.status}\nCreated: ${new Date(content.createdAt).toLocaleString()}`);
    }
    
    previousPage() {
        const currentPage = parseInt(document.getElementById('current-page')?.textContent || '1');
        if (currentPage > 1) {
            this.loadContentTable(currentPage - 1);
        }
    }
    
    nextPage() {
        const currentPage = parseInt(document.getElementById('current-page')?.textContent || '1');
        const total = parseInt(document.getElementById('total-count')?.textContent || '0');
        const pageSize = 10;
        const totalPages = Math.ceil(total / pageSize);
        
        if (currentPage < totalPages) {
            this.loadContentTable(currentPage + 1);
        }
    }
    
    exportContent() {
        const dataStr = JSON.stringify(this.content, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `skylink-content-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Content exported successfully!', 'success');
    }
    
    loadAnalytics() {
        const period = parseInt(document.getElementById('analytics-period')?.value || '7');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        // Filter content by period
        const periodContent = this.content.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= startDate && itemDate <= endDate;
        });
        
        // Calculate statistics
        const stats = {
            totalPosts: periodContent.length,
            videoPosts: periodContent.filter(item => item.type === 'video').length,
            triviaPosts: periodContent.filter(item => item.type === 'trivia').length,
            textPosts: periodContent.filter(item => item.type === 'text').length,
            published: periodContent.filter(item => item.status === 'published').length,
            scheduled: periodContent.filter(item => item.status === 'scheduled').length,
            draft: periodContent.filter(item => item.status === 'draft').length
        };
        
        // Update charts
        this.updateCharts(stats, periodContent);
        
        // Update top content list
        this.updateTopContentList(periodContent);
    }
    
    updateCharts(stats, content) {
        // Performance chart
        const performanceCtx = document.getElementById('performance-chart')?.getContext('2d');
        if (performanceCtx && window.Chart) {
            // Destroy existing chart if it exists
            if (this.performanceChart) {
                this.performanceChart.destroy();
            }
            
            const labels = [];
            const data = [];
            
            // Generate last N days labels
            const period = parseInt(document.getElementById('analytics-period')?.value || '7');
            for (let i = period - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                
                // Count posts for this day
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dayCount = content.filter(item => {
                    const itemDate = new Date(item.createdAt);
                    return itemDate >= dayStart && itemDate <= dayEnd;
                }).length;
                
                data.push(dayCount);
            }
            
            this.performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Posts per Day',
                        data: data,
                        borderColor: 'rgb(46, 204, 113)',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Platform chart
        const platformCtx = document.getElementById('platform-chart')?.getContext('2d');
        if (platformCtx && window.Chart) {
            // Destroy existing chart if it exists
            if (this.platformChart) {
                this.platformChart.destroy();
            }
            
            const videoContent = content.filter(item => item.type === 'video');
            const platformCounts = {
                youtube: videoContent.filter(item => item.platform === 'youtube').length,
                tiktok: videoContent.filter(item => item.platform === 'tiktok').length,
                instagram: videoContent.filter(item => item.platform === 'instagram').length,
                facebook: videoContent.filter(item => item.platform === 'facebook').length,
                trivia: content.filter(item => item.type === 'trivia').length,
                text: content.filter(item => item.type === 'text').length
            };
            
            this.platformChart = new Chart(platformCtx, {
                type: 'doughnut',
                data: {
                    labels: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Trivia', 'Text'],
                    datasets: [{
                        data: [
                            platformCounts.youtube,
                            platformCounts.tiktok,
                            platformCounts.instagram,
                            platformCounts.facebook,
                            platformCounts.trivia,
                            platformCounts.text
                        ],
                        backgroundColor: [
                            '#FF0000', // YouTube red
                            '#000000', // TikTok black
                            '#E1306C', // Instagram pink
                            '#4267B2', // Facebook blue
                            '#3498DB', // Trivia blue
                            '#F39C12'  // Text orange
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
        
        // Engagement chart (simplified for demo)
        const engagementCtx = document.getElementById('engagement-chart')?.getContext('2d');
        if (engagementCtx && window.Chart) {
            // Destroy existing chart if it exists
            if (this.engagementChart) {
                this.engagementChart.destroy();
            }
            
            this.engagementChart = new Chart(engagementCtx, {
                type: 'bar',
                data: {
                    labels: ['Views', 'Completions', 'Attempts', 'Earnings'],
                    datasets: [{
                        label: 'Engagement Metrics',
                        data: [
                            content.reduce((sum, item) => sum + (item.views || 0), 0),
                            content.reduce((sum, item) => sum + (item.completions || 0), 0),
                            content.reduce((sum, item) => sum + (item.attempts || 0), 0),
                            content.reduce((sum, item) => sum + (item.earnings || 0), 0)
                        ],
                        backgroundColor: [
                            'rgba(46, 204, 113, 0.7)',
                            'rgba(52, 152, 219, 0.7)',
                            'rgba(155, 89, 182, 0.7)',
                            'rgba(241, 196, 15, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    updateTopContentList(content) {
        const listContainer = document.getElementById('top-content-list');
        if (!listContainer) return;
        
        // Sort by views or attempts
        const sortedContent = [...content].sort((a, b) => {
            const aEngagement = (a.views || a.attempts || 0);
            const bEngagement = (b.views || b.attempts || 0);
            return bEngagement - aEngagement;
        }).slice(0, 5);
        
        if (sortedContent.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No data available</p>
                </div>
            `;
        } else {
            listContainer.innerHTML = sortedContent.map((item, index) => {
                let icon = 'fas fa-file-alt';
                let color = 'var(--warning-color)';
                let engagement = '';
                
                if (item.type === 'video') {
                    icon = 'fas fa-video';
                    color = 'var(--danger-color)';
                    engagement = `${item.views || 0} views`;
                } else if (item.type === 'trivia') {
                    icon = 'fas fa-question-circle';
                    color = 'var(--info-color)';
                    engagement = `${item.attempts || 0} attempts`;
                } else if (item.type === 'text') {
                    icon = 'fas fa-file-alt';
                    color = 'var(--warning-color)';
                    engagement = `${item.views || 0} views`;
                }
                
                return `
                    <div style="padding: 0.8rem; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 30px; height: 30px; border-radius: 6px; background-color: ${color}; 
                                    display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="${icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; font-size: 0.9rem; margin-bottom: 0.25rem;">
                                ${item.title || item.question || 'Untitled'}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--gray-color);">
                                ${item.type} • ${engagement} • UGX ${item.reward || 0}
                            </div>
                        </div>
                        <div style="font-weight: bold; color: var(--primary-color);">
                            #${index + 1}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    loadSettings() {
        // Load settings from localStorage
        const settings = this.settings;
        
        // Populate form fields
        if (settings.youtubeApiKey) {
            const youtubeApiKey = document.getElementById('youtube-api-key');
            if (youtubeApiKey) youtubeApiKey.value = settings.youtubeApiKey;
        }
        
        if (settings.defaultRewards) {
            const youtubeReward = document.getElementById('default-youtube-reward');
            const tiktokReward = document.getElementById('default-tiktok-reward');
            const triviaReward = document.getElementById('default-trivia-reward');
            
            if (youtubeReward && settings.defaultRewards.youtube) {
                youtubeReward.value = settings.defaultRewards.youtube;
            }
            if (tiktokReward && settings.defaultRewards.tiktok) {
                tiktokReward.value = settings.defaultRewards.tiktok;
            }
            if (triviaReward && settings.defaultRewards.trivia) {
                triviaReward.value = settings.defaultRewards.trivia;
            }
        }
        
        // Checkboxes
        const autoApprove = document.getElementById('auto-approve-posts');
        const notifyNewPosts = document.getElementById('notify-new-posts');
        const requireApproval = document.getElementById('require-approval');
        
        if (autoApprove && settings.autoApprovePosts !== undefined) {
            autoApprove.checked = settings.autoApprovePosts;
        }
        if (notifyNewPosts && settings.notifyNewPosts !== undefined) {
            notifyNewPosts.checked = settings.notifyNewPosts;
        }
        if (requireApproval && settings.requireApproval !== undefined) {
            requireApproval.checked = settings.requireApproval;
        }
        
        // Banned words
        const bannedWords = document.getElementById('banned-words');
        if (bannedWords && settings.bannedWords) {
            bannedWords.value = settings.bannedWords.join('\n');
        }
    }
    
    saveSettings() {
        const settings = {
            youtubeApiKey: document.getElementById('youtube-api-key')?.value || '',
            defaultRewards: {
                youtube: parseInt(document.getElementById('default-youtube-reward')?.value) || 250,
                tiktok: parseInt(document.getElementById('default-tiktok-reward')?.value) || 250,
                trivia: parseInt(document.getElementById('default-trivia-reward')?.value) || 400
            },
            autoApprovePosts: document.getElementById('auto-approve-posts')?.checked || false,
            notifyNewPosts: document.getElementById('notify-new-posts')?.checked || false,
            requireApproval: document.getElementById('require-approval')?.checked || false,
            bannedWords: document.getElementById('banned-words')?.value.split('\n').filter(word => word.trim()) || []
        };
        
        this.settings = settings;
        localStorage.setItem('skylink_admin_settings', JSON.stringify(settings));
        
        this.showNotification('Settings saved successfully!', 'success');
    }
    
    backupContent() {
        // Create backup
        const backup = {
            timestamp: new Date().toISOString(),
            content: this.content,
            settings: this.settings
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `skylink-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Backup created successfully!', 'success');
    }
    
    exportAllContent() {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalItems: this.content.length,
                version: '1.0'
            },
            content: this.content,
            analytics: this.generateAnalyticsReport()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `skylink-full-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Full export completed!', 'success');
    }
    
    generateAnalyticsReport() {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentContent = this.content.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= thirtyDaysAgo && itemDate <= now;
        });
        
        return {
            period: 'last-30-days',
            totalPosts: recentContent.length,
            byType: {
                video: recentContent.filter(item => item.type === 'video').length,
                trivia: recentContent.filter(item => item.type === 'trivia').length,
                text: recentContent.filter(item => item.type === 'text').length
            },
            byPlatform: {
                youtube: recentContent.filter(item => item.platform === 'youtube').length,
                tiktok: recentContent.filter(item => item.platform === 'tiktok').length,
                instagram: recentContent.filter(item => item.platform === 'instagram').length,
                facebook: recentContent.filter(item => item.platform === 'facebook').length
            },
            byStatus: {
                published: recentContent.filter(item => item.status === 'published').length,
                scheduled: recentContent.filter(item => item.status === 'scheduled').length,
                draft: recentContent.filter(item => item.status === 'draft').length
            }
        };
    }
    
    loadDashboardData() {
        const totalPosts = this.content.length;
        const publishedPosts = this.content.filter(item => item.status === 'published').length;
        const scheduledPosts = this.content.filter(item => item.status === 'scheduled').length;
        const draftPosts = this.content.filter(item => item.status === 'draft').length;
        
        const youtubeCount = this.content.filter(item => item.platform === 'youtube').length;
        const tiktokCount = this.content.filter(item => item.platform === 'tiktok').length;
        const instagramCount = this.content.filter(item => item.platform === 'instagram').length;
        const triviaCount = this.content.filter(item => item.type === 'trivia').length;
        
        // Update dashboard stats
        const totalPostsEl = document.getElementById('total-posts');
        const publishedPostsEl = document.getElementById('published-posts');
        const scheduledPostsEl = document.getElementById('scheduled-posts');
        const draftPostsEl = document.getElementById('draft-posts');
        const youtubeCountEl = document.getElementById('youtube-count');
        const tiktokCountEl = document.getElementById('tiktok-count');
        const instagramCountEl = document.getElementById('instagram-count');
        const triviaCountEl = document.getElementById('trivia-count');
        
        if (totalPostsEl) totalPostsEl.textContent = totalPosts;
        if (publishedPostsEl) publishedPostsEl.textContent = publishedPosts;
        if (scheduledPostsEl) scheduledPostsEl.textContent = scheduledPosts;
        if (draftPostsEl) draftPostsEl.textContent = draftPosts;
        if (youtubeCountEl) youtubeCountEl.textContent = youtubeCount;
        if (tiktokCountEl) tiktokCountEl.textContent = tiktokCount;
        if (instagramCountEl) instagramCountEl.textContent = instagramCount;
        if (triviaCountEl) triviaCountEl.textContent = triviaCount;
        
        // Update recent activity
        this.updateRecentActivity();
    }
    
    updateRecentActivity() {
        const recentActivity = document.getElementById('recent-activity-list');
        if (!recentActivity) return;
        
        const recentContent = [...this.content]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        if (recentContent.length === 0) {
            recentActivity.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                </div>
            `;
        } else {
            recentActivity.innerHTML = recentContent.map(item => {
                let icon = 'fas fa-file-alt';
                let color = 'var(--warning-color)';
                let typeText = 'Text Post';
                
                if (item.type === 'video') {
                    icon = 'fas fa-video';
                    color = 'var(--danger-color)';
                    typeText = `${item.platform} Video`;
                } else if (item.type === 'trivia') {
                    icon = 'fas fa-question-circle';
                    color = 'var(--info-color)';
                    typeText = 'Trivia Question';
                }
                
                const date = new Date(item.createdAt);
                const timeAgo = this.getTimeAgo(date);
                
                return `
                    <div style="padding: 0.8rem; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background-color: ${color}; 
                                    display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="${icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; font-size: 0.9rem;">
                                ${item.title || item.question || 'Untitled'}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--gray-color);">
                                ${typeText} • ${timeAgo}
                            </div>
                        </div>
                        <span class="status-badge status-${item.status}">
                            ${item.status}
                        </span>
                    </div>
                `;
            }).join('');
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        const icon = notification?.querySelector('i');
        
        if (notification && messageEl) {
            // Update content
            messageEl.textContent = message;
            
            // Update styling based on type
            notification.className = 'notification';
            notification.classList.add(`notification-${type}`);
            notification.classList.add('active');
            
            // Update icon
            if (icon) {
                if (type === 'success') {
                    icon.className = 'fas fa-check-circle';
                } else if (type === 'error') {
                    icon.className = 'fas fa-exclamation-circle';
                } else if (type === 'info') {
                    icon.className = 'fas fa-info-circle';
                }
            }
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove('active');
            }, 3000);
        }
    }
    
    saveContent() {
        localStorage.setItem('skylink_content', JSON.stringify(this.content));
    }
    
    autoSave() {
        this.saveContent();
        console.log('Auto-saved content');
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
    window.adminPostingSystem = new AdminPostingSystem();
});