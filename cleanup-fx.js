// cleanup-fix.js - FIX ALL REMAINING ISSUES
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧹 Cleanup Fix starting...');
    
    // Fix 1: Remove YouTube API loading from any script
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        // Block YouTube API script loading
        if (tagName === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'src' && value && value.includes('youtube.com/iframe_api')) {
                    console.log('🚫 Blocked YouTube API script:', value);
                    return; // Don't set the attribute
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
    
    // Fix 2: Replace all broken images IMMEDIATELY
    function fixAllImages() {
        // Fix placeholder images
        document.querySelectorAll('img').forEach(img => {
            const src = img.src || '';
            if (src.includes('via.placeholder.com') || src.includes('placeholder.com')) {
                const alt = img.alt || '';
                let newSrc = '';
                
                if (alt.includes('TikTok') || src.includes('TikTok')) {
                    newSrc = 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop';
                } else if (alt.includes('YouTube') || src.includes('YouTube')) {
                    newSrc = 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop';
                } else {
                    newSrc = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop';
                }
                
                img.src = newSrc;
                console.log('🖼️ Fixed image:', src, '→', newSrc);
            }
            
            // Fix youtube+Task images from database
            if (src.includes('youtube+Task') || src.includes('tiktok+Task')) {
                const platform = src.includes('youtube') ? 'youtube' : 'tiktok';
                img.src = platform === 'youtube' 
                    ? 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop'
                    : 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=600&h=400&fit=crop';
            }
        });
    }
    
    // Run immediately and on changes
    fixAllImages();
    setInterval(fixAllImages, 3000);
    
    // Fix 3: Make ALL video buttons work
    function setupVideoButtons() {
        // Fix "View Video" buttons
        document.querySelectorAll('#replay, .view-video, button[onclick*="watchVideo"], button[onclick*="openVideo"]').forEach(btn => {
            const oldClick = btn.onclick;
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showSimpleVideoPlayer();
            };
            
            // Remove conflicting onclick attributes
            btn.removeAttribute('onclick');
        });
        
        // Fix claim buttons
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            if (target.classList.contains('claim-btn-tiktok') || 
                target.classList.contains('claim-btn-youtube') ||
                target.classList.contains('claim-btn')) {
                
                e.preventDefault();
                e.stopPropagation();
                
                const platform = target.classList.contains('claim-btn-tiktok') ? 'tiktok' : 'youtube';
                const postId = target.dataset.postId || Math.floor(Math.random() * 1000);
                
                showVideoWithTimer(postId, platform);
            }
        });
    }
    
    // Simple video player function
    function showSimpleVideoPlayer() {
        // Remove existing
        const existing = document.getElementById('simpleVideoPlayer');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'simpleVideoPlayer';
        modal.style.cssText = `
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
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                width: 100%;
                color: white;
                text-align: center;
            ">
                <h2 style="color: #2ecc71; margin-bottom: 20px;">🎬 Video Player</h2>
                
                <!-- Video area -->
                <div style="
                    background: #000;
                    height: 250px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    font-size: 60px;
                ">
                    📺
                </div>
                
                <!-- Timer -->
                <div id="videoTimer" style="
                    background: #2c3e50;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                ">
                    <div style="color: #95a5a6; margin-bottom: 10px; font-size: 14px;">
                        ⏱️ Watch 30 seconds to unlock reward
                    </div>
                    <div id="timerDisplay" style="
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
                        "></div>
                    </div>
                </div>
                
                <!-- Buttons -->
                <div style="display: flex; gap: 10px;">
                    <button onclick="closeVideoPlayer()" style="
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
                    <button id="claimRewardBtn" onclick="claimVideoReward()" 
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
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Start timer
        startVideoTimer();
    }
    
    function startVideoTimer() {
        let seconds = 30;
        const display = document.getElementById('timerDisplay');
        const progress = document.getElementById('timerProgress');
        const claimBtn = document.getElementById('claimRewardBtn');
        
        if (!display || !progress || !claimBtn) return;
        
        const timer = setInterval(() => {
            seconds--;
            
            // Update display
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Update progress
            const progressPercent = ((30 - seconds) / 30) * 100;
            progress.style.width = `${progressPercent}%`;
            
            // Color changes
            if (seconds <= 10) {
                display.style.color = '#e74c3c';
                progress.style.background = '#e74c3c';
            } else if (seconds <= 20) {
                display.style.color = '#f39c12';
                progress.style.background = '#f39c12';
            }
            
            // Timer finished
            if (seconds <= 0) {
                clearInterval(timer);
                display.innerHTML = '<span style="color: #2ecc71;">✓ READY!</span>';
                progress.style.background = '#2ecc71';
                
                // Enable claim button
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.style.cursor = 'pointer';
                claimBtn.style.background = '#2ecc71';
                claimBtn.textContent = '🎁 Claim Reward';
            }
        }, 1000);
        
        // Store timer for cleanup
        window.videoTimer = timer;
    }
    
    function showVideoWithTimer(postId, platform) {
        showSimpleVideoPlayer();
        
        // After timer, make claim button work
        setTimeout(() => {
            const claimBtn = document.getElementById('claimRewardBtn');
            if (claimBtn) {
                claimBtn.onclick = function() {
                    // Show success
                    showNotification(`✅ Claimed UGX 250 from ${platform}!`, 'success');
                    
                    // Update earnings display
                    updateEarnings(platform, 250);
                    
                    // Close player
                    closeVideoPlayer();
                };
            }
        }, 30500);
    }
    
    function closeVideoPlayer() {
        const player = document.getElementById('simpleVideoPlayer');
        if (player) {
            player.remove();
            document.body.style.overflow = '';
            
            // Clear timer
            if (window.videoTimer) {
                clearInterval(window.videoTimer);
                window.videoTimer = null;
            }
        }
    }
    
    function claimVideoReward() {
        showNotification('✅ Reward claimed!', 'success');
        closeVideoPlayer();
    }
    
    function updateEarnings(platform, amount) {
        const elementId = platform === 'tiktok' ? 'tiktok' : 'youtube';
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
    
    function showNotification(message, type) {
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
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Make functions globally available
    window.showSimpleVideoPlayer = showSimpleVideoPlayer;
    window.closeVideoPlayer = closeVideoPlayer;
    window.claimVideoReward = claimVideoReward;
    window.showVideoWithTimer = showVideoWithTimer;
    
    // Run setup
    setTimeout(setupVideoButtons, 1000);
    setInterval(setupVideoButtons, 5000);
    
    console.log('✅ Cleanup Fix loaded');
});