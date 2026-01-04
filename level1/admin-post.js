// admin-posts.js - REAL WORKING ADMIN POST CREATOR
class AdminPostCreator {
    constructor() {
        this.supabase = null;
        this.currentAdminId = null;
        this.init();
    }

    async init() {
        console.log('🛠️ AdminPostCreator initializing...');
        
        try {
            // Use existing AdminApp or create new client
            if (window.AdminApp && window.AdminApp.supabase) {
                this.supabase = window.AdminApp.supabase;
                console.log('✅ Using existing AdminApp Supabase');
            } else {
                const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
                
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('✅ Created new Supabase client');
            }
            
            // Get admin user ID
            await this.getAdminUserId();
            
            // Inject create buttons
            setTimeout(() => this.injectCreateButtons(), 1000);
            
            console.log('✅ AdminPostCreator ready');
            
        } catch (error) {
            console.error('❌ AdminPostCreator init error:', error);
        }
    }
    
    async getAdminUserId() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;
            
            const { data: adminUser } = await this.supabase
                .from('users')
                .select('id')
                .eq('uuid', user.id)
                .single();
                
            this.currentAdminId = adminUser?.id || 1;
            
        } catch (error) {
            console.error('Error getting admin ID:', error);
            this.currentAdminId = 1;
        }
    }
    
    injectCreateButtons() {
        const contentsSection = document.getElementById('contents');
        if (!contentsSection) {
            console.error('Contents section not found');
            return;
        }
        
        const header = contentsSection.querySelector('.section-header');
        if (!header) return;
        
        // Remove existing buttons if any
        const existingButtons = header.querySelector('.admin-create-buttons');
        if (existingButtons) existingButtons.remove();
        
        // Create buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'admin-create-buttons';
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.marginLeft = '10px';
        
        // Create buttons
        const platforms = [
            { name: 'tiktok', label: 'TikTok', color: '#000000', icon: 'fab fa-tiktok' },
            { name: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'fab fa-youtube' },
            { name: 'trivia', label: 'Trivia', color: '#2ecc71', icon: 'fas fa-question-circle' }
        ];
        
        platforms.forEach(platform => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `<i class="${platform.icon}"></i> Create ${platform.label}`;
            btn.style.background = platform.color;
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.padding = '10px 15px';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            
            btn.onclick = () => this.showCreateForm(platform.name);
            buttonsDiv.appendChild(btn);
        });
        
        header.appendChild(buttonsDiv);
        console.log('✅ Admin buttons injected');
    }
    
    showCreateForm(platform) {
        const formHTML = this.getFormHTML(platform);
        
        // Remove existing modal
        const existingModal = document.getElementById('adminPostModal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'adminPostModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = formHTML;
        document.body.appendChild(modal);
        
        // Setup form submission
        this.setupFormSubmission(platform);
        
        // Setup auto-thumbnail generation
        this.setupThumbnailGenerator(platform);
    }
    
    getFormHTML(platform) {
        const isTrivia = platform === 'trivia';
        
        return `
            <div style="
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="
                    padding: 20px;
                    background: #2c3e50;
                    color: white;
                    border-radius: 10px 10px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0;">
                        <i class="${isTrivia ? 'fas fa-question-circle' : 'fab fa-' + platform}"></i>
                        Create ${platform.charAt(0).toUpperCase() + platform.slice(1)} Content
                    </h3>
                    <button onclick="document.getElementById('adminPostModal').remove()" 
                            style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">
                        &times;
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    <form id="createPostForm">
                        <!-- Title -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Title *</label>
                            <input type="text" id="postTitle" required 
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Enter catchy title">
                        </div>
                        
                        <!-- Description -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description</label>
                            <textarea id="postDescription" rows="3"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Describe the task"></textarea>
                        </div>
                        
                        ${!isTrivia ? `
                        <!-- Video URL -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Video URL *</label>
                            <input type="url" id="postVideoUrl" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="https://${platform}.com/...">
                            <small style="color: #666;">Enter full ${platform} video URL</small>
                        </div>
                        
                        <!-- Thumbnail Preview -->
                        <div style="margin-bottom: 15px; display: none;" id="thumbnailPreviewContainer">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Thumbnail Preview</label>
                            <img id="thumbnailPreview" src="" alt="Preview" 
                                 style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;">
                            <input type="hidden" id="postThumbnail">
                        </div>
                        ` : ''}
                        
                        <!-- Sponsor -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Sponsor/Brand</label>
                            <input type="text" id="postSponsor"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Company name (optional)">
                        </div>
                        
                        <!-- Reward -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Reward (UGX) *</label>
                            <input type="number" id="postReward" 
                                   value="${isTrivia ? '1200' : '250'}" min="1" required
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        
                        ${isTrivia ? `
                        <!-- Trivia Questions -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Questions (one per line)</label>
                            <textarea id="postQuestions" rows="5"
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                                   placeholder="Question 1?&#10;A) Option A&#10;B) Option B&#10;C) Option C&#10;Correct: A"></textarea>
                            <small style="color: #666;">Format: Question on first line, options with A), B), C), then "Correct: [letter]"</small>
                        </div>
                        ` : ''}
                        
                        <!-- Submit Button -->
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
                            <i class="fas fa-save"></i> SAVE TO DATABASE
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
    
    setupThumbnailGenerator(platform) {
        if (platform === 'trivia') return;
        
        const videoUrlInput = document.getElementById('postVideoUrl');
        const previewContainer = document.getElementById('thumbnailPreviewContainer');
        const thumbnailPreview = document.getElementById('thumbnailPreview');
        const thumbnailInput = document.getElementById('postThumbnail');
        
        videoUrlInput.addEventListener('blur', () => {
            const url = videoUrlInput.value.trim();
            if (!url) return;
            
            let thumbnail = '';
            
            if (platform === 'youtube') {
                const videoId = this.extractYouTubeId(url);
                if (videoId) {
                    thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }
            } else if (platform === 'tiktok') {
                // Use placeholder or try to fetch TikTok thumbnail
                thumbnail = 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop';
            }
            
            if (thumbnail) {
                thumbnailPreview.src = thumbnail;
                thumbnailInput.value = thumbnail;
                previewContainer.style.display = 'block';
                
                // Test if image loads
                const testImg = new Image();
                testImg.onload = () => {
                    console.log('✅ Thumbnail loaded successfully');
                };
                testImg.onerror = () => {
                    thumbnailPreview.src = 'https://via.placeholder.com/600x400?text=Thumbnail+Not+Found';
                };
                testImg.src = thumbnail;
            }
        });
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
    
    setupFormSubmission(platform) {
        const form = document.getElementById('createPostForm');
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.createPost(platform);
        };
    }
    
    async createPost(platform) {
        try {
            // Get form values
            const title = document.getElementById('postTitle').value.trim();
            const description = document.getElementById('postDescription').value.trim();
            const sponsor = document.getElementById('postSponsor').value.trim();
            const reward = parseInt(document.getElementById('postReward').value);
            
            // Validate
            if (!title || !reward) {
                alert('Please fill all required fields');
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
                user_id: this.currentAdminId
            };
            
            // Platform-specific data
            if (platform !== 'trivia') {
                const videoUrl = document.getElementById('postVideoUrl').value.trim();
                const thumbnail = document.getElementById('postThumbnail').value.trim();
                
                if (!videoUrl) {
                    alert('Please enter video URL');
                    return;
                }
                
                postData.content_url = videoUrl;
                postData.thumbnail_url = thumbnail || this.generateDefaultThumbnail(platform);
            } else {
                postData.content_url = 'https://skylink.com/trivia';
                postData.thumbnail_url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop';
                
                // Parse trivia questions
                const questionsText = document.getElementById('postQuestions').value;
                if (questionsText) {
                    postData.requirements = this.parseTriviaQuestions(questionsText);
                }
            }
            
            console.log('📤 Inserting post:', postData);
            
            // INSERT INTO DATABASE
            const { data, error } = await this.supabase
                .from('dashboard_contents')
                .insert([postData])
                .select();
            
            if (error) {
                console.error('❌ Database error:', error);
                alert(`Error: ${error.message}`);
                return;
            }
            
            console.log('✅ Post created:', data);
            
            // Show success
            alert(`✅ Post "${title}" saved successfully!\n\nIt will appear on user dashboards immediately.`);
            
            // Close modal
            document.getElementById('adminPostModal').remove();
            
            // Refresh contents table
            if (typeof window.loadContents === 'function') {
                window.loadContents();
            }
            
        } catch (error) {
            console.error('❌ Error creating post:', error);
            alert('Error: ' + error.message);
        }
    }
    
    generateDefaultThumbnail(platform) {
        const thumbnails = {
            'tiktok': 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop',
            'youtube': 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop'
        };
        return thumbnails[platform] || 'https://via.placeholder.com/600x400';
    }
    
    parseTriviaQuestions(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const questions = [];
        let currentQuestion = null;
        
        for (const line of lines) {
            if (line.includes('?')) {
                // New question
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    question: line.trim(),
                    options: {},
                    correct_answer: ''
                };
            } else if (line.match(/^[A-D]\)/)) {
                // Option
                if (currentQuestion) {
                    const match = line.match(/^([A-D])\)\s*(.+)/);
                    if (match) {
                        currentQuestion.options[match[1].toLowerCase()] = match[2].trim();
                    }
                }
            } else if (line.toLowerCase().startsWith('correct:')) {
                // Correct answer
                if (currentQuestion) {
                    const match = line.match(/correct:\s*([A-D])/i);
                    if (match) {
                        currentQuestion.correct_answer = match[1].toLowerCase();
                    }
                }
            }
        }
        
        if (currentQuestion && currentQuestion.correct_answer) {
            questions.push(currentQuestion);
        }
        
        return questions;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminPostCreator = new AdminPostCreator();
    }, 2000);
});