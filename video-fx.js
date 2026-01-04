// video-fix.js - MINIMAL FIX FOR VIDEO PLAYER
class VideoPlayerFix {
    constructor() {
        this.supabase = null;
        this.init();
    }
    
    async init() {
        console.log('🎬 VideoPlayerFix loading...');
        
        // Wait for page to load
        setTimeout(() => {
            this.fixPlaceholderImages();
            this.setupVideoButtons();
        }, 2000);
    }
    
    fixPlaceholderImages() {
        // Replace broken placeholder.com images with working ones
        document.querySelectorAll('img[src*="via.placeholder.com"]').forEach(img => {
            const src = img.src;
            
            // Detect platform from alt text or parent
            const parentText = img.parentElement?.textContent || '';
            let platform = 'general';
            
            if (src.includes('TikTok') || parentText.includes('TikTok')) {
                platform = 'tiktok';
                img.src = 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop';
            } else if (src.includes('YouTube') || parentText.includes('YouTube')) {
                platform = 'youtube';
                img.src = 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop';
            } else {
                // Generic fallback
                img.src = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop';
            }
            
            console.log(`🖼️ Fixed image: ${src} -> ${img.src}`);
        });
    }
    
    setupVideoButtons() {
        // Fix all "View Video" buttons
        document.querySelectorAll('#replay, .view-video, button[onclick*="watchVideo"]').forEach(btn => {
            const oldOnClick = btn.getAttribute('onclick') || '';
            
            if (oldOnClick.includes('watchVideo') || btn.id === 'replay' || btn.classList.contains('view-video')) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.showSimpleVideoPlayer();
                };
                
                // Remove old onclick to prevent conflicts
                btn.removeAttribute('onclick');
            }
        });
        
        // Fix claim buttons to use our system
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('claim-btn-tiktok') || 
                e.target.classList.contains('claim-btn-youtube')) {
                e.preventDefault();
                e.stopPropagation();
                
                const postId = this.getRandomPostId();
                const platform = e.target.classList.contains('claim-btn-tiktok') ? 'tiktok' : 'youtube';
                
                this.showVideoWithTimer(postId, platform);
            }
        });
    }
    
    showSimpleVideoPlayer() {
        // Create simple video modal
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
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: #1a1a1a;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                ">
                    <h2 style="color: #2ecc71; margin-bottom: 20px;">🎬 Video Player</h2>
                    <p style="margin-bottom: 30px; color: #bdc3c7;">
                        In the full implementation, this would embed the actual video.
                        For now, this simulates the video watching experience.
                    </p>
                    
                    <div id="videoTimer" style="
                        background: #2c3e50;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                    ">
                        <div style="font-size: 14px; color: #95a5a6; margin-bottom: 10px;">
                            ⏱️ Watch for 30 seconds to unlock reward
                        </div>
                        <div id="timerCountdown" style="
                            font-size: 48px;
                            font-weight: bold;
                            color: #2ecc71;
                            font-family: monospace;
                        ">00:30</div>
                        <div style="
                            height: 6px;
                            background: #34495e;
                            border-radius: 3px;
                            margin-top: 15px;
                            overflow: hidden;
                        ">
                            <div id="timerProgress" style="
                                height: 100%;
                                background: #2ecc71;
                                width: 0%;
                                transition: width 1s linear;
                            "></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="document.getElementById('simpleVideoModal').remove(); document.body.style.overflow=''"
                                style="
                                    flex: 1;
                                    padding: 15px;
                                    background: #e74c3c;
                                    color: white;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                ">
                            ✕ Close
                        </button>
                        <button id="claimAfterWatch" 
                                disabled
                                style="
                                    flex: 1;
                                    padding: 15px;
                                    background: #95a5a6;
                                    color: white;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: not-allowed;
                                    opacity: 0.5;
                                ">
                            🔒 Wait 30s
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existing = document.getElementById('simpleVideoModal');
        if (existing) existing.remove();
        
        // Add new modal
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Start timer
        this.startSimpleTimer();
    }
    
    startSimpleTimer() {
        let seconds = 30;
        const timerDisplay = document.getElementById('timerCountdown');
        const progressBar = document.getElementById('timerProgress');
        const claimBtn = document.getElementById('claimAfterWatch');
        
        if (!timerDisplay || !progressBar || !claimBtn) return;
        
        const timer = setInterval(() => {
            seconds--;
            
            // Update display
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Update progress
            const progress = ((30 - seconds) / 30) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Change colors
            if (seconds <= 10) {
                timerDisplay.style.color = '#e74c3c';
                progressBar.style.background = '#e74c3c';
            } else if (seconds <= 20) {
                timerDisplay.style.color = '#f39c12';
                progressBar.style.background = '#f39c12';
            }
            
            // Timer finished
            if (seconds <= 0) {
                clearInterval(timer);
                
                timerDisplay.innerHTML = '<span style="color: #2ecc71;">✓ READY!</span>';
                progressBar.style.background = '#2ecc71';
                
                // Enable claim button
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.style.cursor = 'pointer';
                claimBtn.style.background = '#2ecc71';
                claimBtn.textContent = '🎁 Claim Reward';
                
                claimBtn.onclick = () => {
                    this.showNotification('✅ Reward claimed successfully!', 'success');
                    document.getElementById('simpleVideoModal').remove();
                    document.body.style.overflow = '';
                };
            }
        }, 1000);
        
        // Store timer for cleanup
        this.currentTimer = timer;
    }
    
    showVideoWithTimer(postId, platform) {
        this.showSimpleVideoPlayer();
        
        // After timer completes, show claim success
        setTimeout(() => {
            const claimBtn = document.getElementById('claimAfterWatch');
            if (claimBtn) {
                claimBtn.onclick = () => {
                    this.showNotification(`✅ Claimed UGX 250 from ${platform}!`, 'success');
                    
                    // Update earnings display
                    this.updateEarningsDisplay(platform, 250);
                    
                    // Close modal
                    document.getElementById('simpleVideoModal')?.remove();
                    document.body.style.overflow = '';
                };
            }
        }, 30500); // 30.5 seconds
    }
    
    updateEarningsDisplay(platform, amount) {
        // Find and update the earnings display
        const earningsMap = {
            'tiktok': 'tiktok',
            'youtube': 'youtube'
        };
        
        const elementId = earningsMap[platform];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                const currentText = element.textContent;
                const currentMatch = currentText.match(/UGX\s*([\d,]+)/);
                if (currentMatch) {
                    const currentAmount = parseInt(currentMatch[1].replace(/,/g, ''));
                    const newAmount = currentAmount + amount;
                    element.textContent = `UGX ${newAmount.toLocaleString()}`;
                }
            }
        }
    }
    
    getRandomPostId() {
        return Math.floor(Math.random() * 1000) + 1;
    }
    
    showNotification(message, type = 'info') {
        // Create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#2ecc71' : 
                        type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Add animation
        if (!document.querySelector('#simple-anim')) {
            const style = document.createElement('style');
            style.id = 'simple-anim';
            style.textContent = `
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.videoFix = new VideoPlayerFix();
});