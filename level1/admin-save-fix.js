// admin-save-fix.js - MINIMAL FIX FOR ADMIN POST SAVING
class AdminSaveFix {
    constructor() {
        this.supabase = null;
        this.init();
    }
    
    async init() {
        console.log('💾 AdminSaveFix loading...');
        
        // Wait for admin panel to load
        setTimeout(() => {
            this.injectSaveButtons();
            this.setupSaveListener();
        }, 3000);
    }
    
    injectSaveButtons() {
        // Find the contents section
        const contentsSection = document.getElementById('contents');
        if (!contentsSection) return;
        
        // Look for existing "Add Content" button
        const addButton = contentsSection.querySelector('button[onclick*="showAddContentModal"]');
        if (!addButton) return;
        
        // Add a new "Quick Save" button next to it
        const quickSaveBtn = document.createElement('button');
        quickSaveBtn.className = 'btn btn-success';
        quickSaveBtn.innerHTML = '<i class="fas fa-bolt"></i> Quick Save Test';
        quickSaveBtn.style.marginLeft = '10px';
        quickSaveBtn.onclick = () => this.testSavePost();
        
        addButton.parentNode.appendChild(quickSaveBtn);
        
        console.log('✅ Quick Save button injected');
    }
    
    setupSaveListener() {
        // Listen for form submissions in the content modal
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'contentForm') {
                e.preventDefault();
                await this.saveContentForm(e.target);
            }
        });
    }
    
    async saveContentForm(form) {
        try {
            // Get form data
            const formData = new FormData(form);
            const title = formData.get('title') || document.getElementById('modalContentTitle')?.value;
            const type = document.getElementById('modalContentType')?.value || 'youtube';
            const userId = document.getElementById('modalContentUserId')?.value || '1';
            
            if (!title) {
                alert('Please enter a title');
                return;
            }
            
            // Show saving indicator
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            
            // Get Supabase client
            const supabase = await this.getSupabase();
            if (!supabase) {
                alert('Database connection failed');
                return;
            }
            
            // Prepare post data
            const postData = {
                platform: type === 'youtube' ? 'youtube' : 
                         type === 'tiktok' ? 'tiktok' : 'trivia',
                content_type: type === 'trivia' ? 'quiz' : 'video',
                title: title,
                description: document.getElementById('modalContentDescription')?.value || 
                           `Complete this ${type} task`,
                content_url: document.getElementById('modalContentUrl')?.value || 
                           `https://${type}.com/sample`,
                thumbnail_url: this.generateThumbnail(type),
                sponsor: 'Skylink',
                reward_amount: parseInt(document.getElementById('modalContentActions')?.value) || 250,
                is_active: true,
                user_id: parseInt(userId) || 1
            };
            
            console.log('Saving post:', postData);
            
            // Save to database
            const { data, error } = await supabase
                .from('dashboard_contents')
                .insert([postData])
                .select();
            
            if (error) {
                console.error('Save error:', error);
                alert(`Save failed: ${error.message}`);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            console.log('✅ Post saved:', data);
            
            // Show success
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            submitBtn.style.background = '#2ecc71';
            
            // Close modal after delay
            setTimeout(() => {
                if (typeof closeModal === 'function') {
                    closeModal();
                }
                
                // Reset button
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                }, 1000);
                
                // Refresh content list
                if (typeof loadContents === 'function') {
                    setTimeout(loadContents, 500);
                }
            }, 1500);
            
            // Show notification
            this.showNotification(`✅ Post "${title}" saved to database!`, 'success');
            
        } catch (error) {
            console.error('Form save error:', error);
            alert('Error saving: ' + error.message);
        }
    }
    
    async testSavePost() {
        try {
            // Simple test post
            const testPost = {
                platform: 'youtube',
                content_type: 'video',
                title: 'Test Post ' + new Date().toLocaleTimeString(),
                description: 'Test post created from admin panel',
                content_url: 'https://youtube.com/watch?v=test',
                thumbnail_url: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop',
                sponsor: 'Test Sponsor',
                reward_amount: 250,
                is_active: true,
                user_id: 1
            };
            
            const supabase = await this.getSupabase();
            if (!supabase) {
                alert('Database not connected');
                return;
            }
            
            const { data, error } = await supabase
                .from('dashboard_contents')
                .insert([testPost])
                .select();
            
            if (error) {
                alert('Test save failed: ' + error.message);
                return;
            }
            
            alert(`✅ Test post saved! ID: ${data[0].id}\n\nCheck Supabase table "dashboard_contents"`);
            
        } catch (error) {
            console.error('Test save error:', error);
            alert('Test error: ' + error.message);
        }
    }
    
    async getSupabase() {
        if (this.supabase) return this.supabase;
        
        try {
            const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM';
            
            if (window.supabase && window.supabase.createClient) {
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                this.supabase = createClient(supabaseUrl, supabaseKey);
            }
            
            return this.supabase;
            
        } catch (error) {
            console.error('Supabase init error:', error);
            return null;
        }
    }
    
    generateThumbnail(type) {
        const thumbnails = {
            'youtube': 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop',
            'tiktok': 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop',
            'trivia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop'
        };
        
        return thumbnails[type] || 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
}

// Initialize in admin panel
if (window.location.pathname.includes('administrator') || 
    window.location.pathname.includes('admin')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminSaveFix = new AdminSaveFix();
    });
}