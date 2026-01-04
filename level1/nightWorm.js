// admin-post-creator.js - COMPLETE WORKING SOLUTION
class AdminPostCreator {
    constructor() {
        this.supabase = null;
        this.currentAdminId = null;
        this.init();
    }

    async init() {
        try {
            console.log('AdminPostCreator initializing...');
            
            // Use the existing AdminApp supabase instance
            if (window.AdminApp && window.AdminApp.supabase) {
                this.supabase = window.AdminApp.supabase;
                console.log('Using AdminApp Supabase instance');
            } else {
                // Fallback: create new client
                const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
                
                if (window.supabase && window.supabase.createClient) {
                    this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                } else {
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                    this.supabase = createClient(supabaseUrl, supabaseKey);
                }
                console.log('Created new Supabase client');
            }

            // Get current admin user ID
            await this.getAdminUserId();
            
            // Inject admin buttons
            this.injectAdminButtons();
            
            console.log('AdminPostCreator initialized successfully');
            
        } catch (error) {
            console.error('AdminPostCreator init error:', error);
        }
    }

    async getAdminUserId() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated admin user');
                return;
            }

            // Get admin user ID from users table
            const { data: adminUser, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('uuid', user.id)
                .single();

            if (error) {
                console.error('Error getting admin user:', error);
                return;
            }

            this.currentAdminId = adminUser.id;
            console.log('Admin user ID:', this.currentAdminId);
            
        } catch (error) {
            console.error('Error in getAdminUserId:', error);
        }
    }

    injectAdminButtons() {
        // Inject into Contents section
        const contentsSection = document.getElementById('contents');
        if (!contentsSection) {
            console.error('Contents section not found');
            return;
        }

        const header = contentsSection.querySelector('.section-header');
        if (!header) {
            console.error('Section header not found');
            return;
        }

        // Check if buttons already exist
        if (header.querySelector('.create-post-btn')) {
            return;
        }

        // Create buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'section-actions';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginLeft = '10px';

        // Create TikTok button
        const tiktokBtn = document.createElement('button');
        tiktokBtn.className = 'btn btn-primary create-post-btn';
        tiktokBtn.innerHTML = '<i class="fab fa-tiktok"></i> Create TikTok Post';
        tiktokBtn.onclick = () => this.showCreatePostModal('tiktok');

        // Create YouTube button
        const youtubeBtn = document.createElement('button');
        youtubeBtn.className = 'btn btn-danger create-post-btn';
        youtubeBtn.innerHTML = '<i class="fab fa-youtube"></i> Create YouTube Post';
        youtubeBtn.onclick = () => this.showCreatePostModal('youtube');

        // Create Trivia button
        const triviaBtn = document.createElement('button');
        triviaBtn.className = 'btn btn-success create-post-btn';
        triviaBtn.innerHTML = '<i class="fas fa-question-circle"></i> Create Trivia';
        triviaBtn.onclick = () => this.showCreatePostModal('trivia');

        buttonContainer.appendChild(tiktokBtn);
        buttonContainer.appendChild(youtubeBtn);
        buttonContainer.appendChild(triviaBtn);

        header.appendChild(buttonContainer);
        console.log('Admin buttons injected');
    }

    showCreatePostModal(platform) {
        // Remove existing modal if any
        this.removeExistingModal();

        const modalHTML = this.getModalHTML(platform);
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'adminCreatePostModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);

        // Add CSS animation if not exists
        if (!document.querySelector('#modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        // Setup form submission
        this.setupFormSubmission(platform);
        
        // Setup close button
        document.getElementById('closeAdminModal').onclick = () => this.removeExistingModal();
        
        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.removeExistingModal();
            }
        };

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.removeExistingModal();
            }
        });
    }

    getModalHTML(platform) {
        const platformNames = {
            'tiktok': 'TikTok',
            'youtube': 'YouTube',
            'trivia': 'Trivia'
        };

        const platformIcon = {
            'tiktok': 'fab fa-tiktok',
            'youtube': 'fab fa-youtube',
            'trivia': 'fas fa-question-circle'
        };

        const isTrivia = platform === 'trivia';

        return `
            <div style="
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #2c3e50;
                    color: white;
                    border-radius: 10px 10px 0 0;
                ">
                    <h3 style="margin: 0; font-size: 18px;">
                        <i class="${platformIcon[platform]}" style="margin-right: 10px;"></i>
                        Create ${platformNames[platform]} Post
                    </h3>
                    <button id="closeAdminModal" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: white;
                        line-height: 1;
                    ">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <form id="adminPostForm">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Title *</label>
                            <input type="text" id="postTitle" required 
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Enter post title">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description</label>
                            <textarea id="postDescription" rows="3"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Enter post description"></textarea>
                        </div>
                        
                        ${!isTrivia ? `
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Video URL *</label>
                            <input type="url" id="postVideoUrl" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="https://${platform}.com/...">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Thumbnail URL</label>
                            <input type="url" id="postThumbnail"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="https://example.com/image.jpg">
                        </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Sponsor/Brand</label>
                            <input type="text" id="postSponsor"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Company name">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Reward Amount (UGX) *</label>
                            <input type="number" id="postReward" value="${isTrivia ? '1200' : '250'}" min="1" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        
                        ${isTrivia ? `
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Trivia Questions (JSON) *</label>
                            <textarea id="postRequirements" rows="5" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;"
                                   placeholder='[{"question": "Question 1?", "options": {"a": "Option A", "b": "Option B", "c": "Option C"}, "correct_answer": "a"}]'></textarea>
                            <small style="color: #666; display: block; margin-top: 5px;">
                                Enter valid JSON array of questions. Each question must have "question", "options", and "correct_answer"
                            </small>
                        </div>
                        ` : ''}
                        
                        <button type="submit" style="
                            width: 100%;
                            padding: 15px;
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-size: 16px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">
                            <i class="fas fa-save"></i> Save to Database
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    setupFormSubmission(platform) {
        const form = document.getElementById('adminPostForm');
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.createPost(platform);
        };
    }

    async createPost(platform) {
        try {
            console.log('Creating post for platform:', platform);
            
            // Get form values
            const title = document.getElementById('postTitle').value.trim();
            const description = document.getElementById('postDescription').value.trim();
            const sponsor = document.getElementById('postSponsor').value.trim();
            const reward = parseInt(document.getElementById('postReward').value);
            
            if (!title) {
                this.showNotification('Please enter a title', 'error');
                return;
            }

            if (!reward || reward < 1) {
                this.showNotification('Please enter a valid reward amount', 'error');
                return;
            }

            // Prepare post data
            const postData = {
                platform: platform,
                content_type: platform === 'trivia' ? 'quiz' : 'video',
                title: title,
                description: description || `Complete this ${platform} task to earn UGX ${reward}`,
                sponsor: sponsor || 'Skylink',
                reward_amount: reward,
                is_active: true,
                user_id: this.currentAdminId,
                max_actions: 1000
            };

            // Platform-specific fields
            if (platform !== 'trivia') {
                const videoUrl = document.getElementById('postVideoUrl').value.trim();
                const thumbnail = document.getElementById('postThumbnail').value.trim();
                
                if (!videoUrl) {
                    this.showNotification('Please enter a video URL', 'error');
                    return;
                }
                
                postData.content_url = videoUrl;
                postData.thumbnail_url = thumbnail || `https://via.placeholder.com/600x400?text=${platform}+Task`;
            } else {
                postData.content_url = 'https://skylink.com/trivia';
                postData.thumbnail_url = 'https://via.placeholder.com/600x400?text=Trivia+Quiz';
                
                // Parse trivia questions
                const requirementsText = document.getElementById('postRequirements').value.trim();
                try {
                    const questions = JSON.parse(requirementsText);
                    if (!Array.isArray(questions) || questions.length === 0) {
                        throw new Error('Questions must be a non-empty array');
                    }
                    postData.requirements = questions;
                } catch (error) {
                    this.showNotification(`Invalid JSON format: ${error.message}`, 'error');
                    return;
                }
            }

            console.log('Post data to insert:', postData);

            // INSERT INTO DATABASE
            const { data, error } = await this.supabase
                .from('dashboard_contents')
                .insert([postData])
                .select();

            if (error) {
                console.error('Database insert error:', error);
                this.showNotification(`Database error: ${error.message}`, 'error');
                
                // Try alternative insert without select
                const { error: insertError } = await this.supabase
                    .from('dashboard_contents')
                    .insert([postData]);
                    
                if (insertError) {
                    this.showNotification(`Failed to save: ${insertError.message}`, 'error');
                } else {
                    this.showNotification('Post saved successfully!', 'success');
                    this.removeExistingModal();
                    // Refresh contents table
                    if (typeof window.loadContents === 'function') {
                        window.loadContents();
                    }
                }
                return;
            }

            console.log('Post created successfully:', data);
            this.showNotification(`✅ Post "${title}" saved to database!`, 'success');
            
            // Close modal
            this.removeExistingModal();
            
            // Refresh contents table
            if (typeof window.loadContents === 'function') {
                window.loadContents();
            }

        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    removeExistingModal() {
        const modal = document.getElementById('adminCreatePostModal');
        if (modal) {
            modal.remove();
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Create simple notification
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
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminPostCreator = new AdminPostCreator();
    }, 2000); // Wait for AdminApp to initialize
});