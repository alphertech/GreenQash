// simple-video-player.js - NO YOUTUBE API NEEDED
class SimpleVideoPlayer {
    constructor() {
        this.activePlayers = new Map();
        this.init();
    }
    
    init() {
        console.log('🎬 SimpleVideoPlayer loading...');
        
        // Wait for page to load
        setTimeout(() => {
            this.makeAllVideoButtonsWork();
            this.fixAllVideoThumbnails();
        }, 1000);
    }
    
    makeAllVideoButtonsWork() {
        // 1. Fix all "View Video" buttons
        const videoButtons = [
            '#replay',
            '.view-video',
            'button[onclick*="watchVideo"]',
            'button[onclick*="openVideo"]',
            'button[onclick*="playVideo"]',
            '.watch-btn',
            '.video-btn'
        ];
        
        videoButtons.forEach(selector => {
            document.querySelectorAll(selector).forEach(btn => {
                // Remove any existing onclick
                btn.removeAttribute('onclick');
                
                // Add our handler
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showVideoModal();
                });
            });
        });
        
        // 2. Fix claim buttons
        document.addEventListener('click', (e) => {
            const btn = e.target;
            if (btn.classList.contains('claim-btn-tiktok') || 
                btn.classList.contains('claim-btn-youtube') ||
                (btn.classList.contains('claim-btn') && !btn.disabled)) {
                
                e.preventDefault();
                e.stopPropagation();
                
                const platform = btn.classList.contains('claim-btn-tiktok') ? 'tiktok' : 'youtube';
                const postId = btn.dataset.postId || '1';
                
                this.showVideoWithTimer(postId, platform, btn);
            }
        });
        
        console.log('✅ All video buttons fixed');
    }
    
    fixAllVideoThumbnails() {
        // Replace broken images with working ones
        const imageMap = {
            'tiktok': 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop',
            'youtube': 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop',
            'default': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop'
        };
        
        document.querySelectorAll('img').forEach(img => {
            const src = img.src || '';
            const alt = img.alt || '';
            
            // Fix placeholder.com images
            if (src.includes('placeholder.com') || src.includes('youtube+Task') || src.includes('tiktok+Task')) {
                let platform = 'default';
                
                if (src.includes('TikTok') || alt.includes('TikTok') || src.includes('tiktok')) {
                    platform = 'tiktok';
                } else if (src.includes('YouTube') || alt.includes('YouTube') || src.includes('youtube')) {
                    platform = 'youtube';
                }
                
                img.src = imageMap[platform];
                img.onerror = () => {
                    img.src = imageMap.default;
                };
            }
        });
        
        console.log('✅ All thumbnails fixed');
    }
    
    showVideoModal(videoUrl = null, platform = 'youtube') {
        // Create modal HTML
        const modalHTML = `
            <div id="simpleVideoModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <div style="
                    background: #1a1a1a;
                    border-radius: 15px;
                    width: 100%;
                    max-width: 800px;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        padding: 20px;
                        background: #2c3e50;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h3 style="margin: 0; color: white;">🎬 Watch Video to Earn</h3>
                        <button id="closeVideoModal" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">
                            ✕ Close
                        </button>
                    </div>
                    
                    <!-- Video Area -->
                    <div style="padding: 20px; background: #000; text-align: center;">
                        <div style="
                            width: 100%;
                            height: 400px;
                            background: linear-gradient(45deg, #1a1a1a, #2c3e50);
                            border-radius: 8px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            margin-bottom: 20px;
                        ">
                            <div style="font-size: 60px; margin-bottom: 20px;">
                                ${platform === 'youtube' ? '📺' : '🎵'}
                            </div>
                            <h3 style="margin: 0 0 10px 0;">Video Player</h3>
                            <p style="margin: 0; color: #bdc3c7;">Watch for 30 seconds to earn</p>
                        </div>
                        
                        <!-- Direct YouTube embed WITHOUT API -->
                        ${videoUrl && videoUrl.includes('youtube.com') ? `
                            <iframe 
                                src="${this.getYouTubeEmbedUrl(videoUrl)}"
                                style="width: 100%; height: 400px; border: none; border-radius: 8px;"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                            </iframe>
                        ` : ''}
                    </div>
                    
                    <!-- Timer -->
                    <div style="
                        padding: 20px;
                        background: #34495e;
                        color: white;
                        text-align: center;
                    ">
                        <h4 style="margin: 0 0 15px 0;">⏱️ WATCH TIMER</h4>
                        <div id="videoTimerDisplay" style="
                            font-size: 48px;
                            font-weight: bold;
                            color: #2ecc71;
                            font-family: monospace;
                            margin: 10px 0;
                        ">00:30</div>
                        <div style="
                            width: 80%;
                            height: 8px;
                            background: #2c3e50;
                            border-radius: 4px;
                            margin: 20px auto;
                            overflow: hidden;
                        ">
                            <div id="videoProgressBar" style="
                                height: 100%;
                                background: #2ecc71;
                                width: 0%;
                                transition: width 1s linear;
                            "></div>
                        </div>
                    </div>
                    
                    <!-- Claim Button -->
                    <div style="padding: 20px; background: #1a1a1a; text-align: center;">
                        <button id="claimVideoRewardBtn"
                                style="
                                    padding: 18px 40px;
                                    background: #27ae60;
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-size: 18px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    width: 100%;
                                    max-width: 400px;
                                "
                                onclick="window.simpleVideoPlayer.claimReward()">
                            🎁 CLAIM REWARD
                        </button>
                        <p style="color: #95a5a6; margin-top: 15px; font-size: 14px;">
                            Complete tasks to unlock claiming
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        this.closeModal();
        
        // Add new modal
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Setup close button
        document.getElementById('closeVideoModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Start timer
        this.startVideoTimer();
        
        console.log('✅ Video modal shown');
    }
    
    getYouTubeEmbedUrl(url) {
        // Convert YouTube URL to embed URL
        const videoId = this.extractYouTubeId(url);
        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0`;
        }
        return url;
    }
    
    extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
            /youtu\.be\/([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    
    startVideoTimer() {
        const timerDisplay = document.getElementById('videoTimerDisplay');
        const progressBar = document.getElementById('videoProgressBar');
        const claimBtn = document.getElementById('claimVideoRewardBtn');
        
        if (!timerDisplay || !progressBar || !claimBtn) return;
        
        // Disable claim button initially
        claimBtn.disabled = true;
        claimBtn.style.opacity = '0.5';
        claimBtn.style.cursor = 'not-allowed';
        claimBtn.textContent = '🔒 WAIT 30 SECONDS';
        
        let seconds = 30;
        const timerId = setInterval(() => {
            seconds--;
            
            // Update display
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Update progress
            const progress = ((30 - seconds) / 30) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Timer finished
            if (seconds <= 0) {
                clearInterval(timerId);
                
                timerDisplay.innerHTML = '<span style="color: #2ecc71;">✓ READY!</span>';
                progressBar.style.background = '#2ecc71';
                
                // Enable claim button
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.style.cursor = 'pointer';
                claimBtn.style.background = '#2ecc71';
                claimBtn.textContent = '🎁 CLAIM REWARD NOW!';
            }
        }, 1000);
        
        this.activePlayers.set('timer', timerId);
    }
    
    showVideoWithTimer(postId, platform, originalButton) {
        this.showVideoModal();
        
        // Store data for claiming
        window.currentVideoData = { postId, platform, originalButton };
        
        // After timer, enable claiming
        setTimeout(() => {
            const claimBtn = document.getElementById('claimVideoRewardBtn');
            if (claimBtn) {
                claimBtn.onclick = () => {
                    this.completeVideoTask(postId, platform, originalButton);
                };
            }
        }, 30500);
    }
    
    completeVideoTask(postId, platform, originalButton) {
        // Mark button as claimed
        if (originalButton) {
            originalButton.disabled = true;
            originalButton.style.opacity = '0.5';
            originalButton.style.cursor = 'not-allowed';
            originalButton.innerHTML = '✅ Claimed';
        }
        
        // Show success
        this.showNotification(`✅ Successfully claimed UGX 250 from ${platform}!`, 'success');
        
        // Update earnings display
        this.updateEarningsDisplay(platform, 250);
        
        // Close modal
        this.closeModal();
        
        console.log(`✅ Completed ${platform} task ${postId}`);
    }
    
    updateEarningsDisplay(platform, amount) {
        const elementId = platform === 'tiktok' ? 'tiktok' : 'youtube';
        const element = document.getElementById(elementId);
        
        if (element) {
            const currentText = element.textContent;
            const currentMatch = currentText.match(/UGX\s*([\d,]+)/);
            
            if (currentMatch) {
                const currentAmount = parseInt(currentMatch[1].replace(/,/g, ''));
                const newAmount = currentAmount + amount;
                element.textContent = `UGX ${newAmount.toLocaleString()}`;
            } else {
                element.textContent = `UGX ${amount.toLocaleString()}`;
            }
        }
    }
    
    claimReward() {
        const claimBtn = document.getElementById('claimVideoRewardBtn');
        
        if (claimBtn && !claimBtn.disabled) {
            this.showNotification('✅ Reward claimed successfully!', 'success');
            this.closeModal();
        } else {
            this.showNotification('⏳ Please wait for timer to finish', 'warning');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('simpleVideoModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
            
            // Clear any active timers
            this.activePlayers.forEach(timerId => {
                clearInterval(timerId);
            });
            this.activePlayers.clear();
        }
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
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.simpleVideoPlayer = new SimpleVideoPlayer();
});