// dashboard-core.js - UPDATED FOR YOUR SCHEMA
(function() {
    console.log('Dashboard core starting...');
    
    let currentUser = null;
    let userProfile = null;
    let earningsData = null;
    let userId = null; // This will be the BIGINT ID from users table
    
    // Wait for everything to be ready
    function initDashboard() {
        console.log('Initializing dashboard...');
        
        // Check if we have Supabase
        if (!window.supabase) {
            console.log('Waiting for Supabase...');
            setTimeout(initDashboard, 500);
            return;
        }
        
        // Get current user
        window.supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error) {
                console.error('Error getting user:', error);
                return;
            }
            
            if (!user) {
                console.log('No user found, redirecting to login...');
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = user;
            console.log('Auth user found:', user.email, 'UUID:', user.id);
            
            // Load user data
            loadUserData(user);
            
        }).catch(error => {
            console.error('Auth error:', error);
        });
    }
    
    async function loadUserData(authUser) {
        try {
            console.log('Loading user data for:', authUser.email);
            
            // STEP 1: Get user profile from users table using email or UUID
            const { data: profile, error: profileError } = await window.supabase
                .from('users')
                .select('*')
                .or(`email_address.eq.${authUser.email},uuid.eq.${authUser.id}`)
                .maybeSingle();
            
            if (profileError) {
                console.error('Error loading profile:', profileError);
                showMessage('Error loading user profile', 'error');
                return;
            }
            
            if (!profile) {
                console.error('User not found in users table');
                showMessage('User profile not found in database', 'error');
                return;
            }
            
            userProfile = profile;
            userId = profile.id; // This is the BIGINT ID we need for other tables
            console.log('User profile loaded. ID:', userId, 'Username:', profile.user_name);
            
            // STEP 2: Get earnings data using the BIGINT id
            const { data: earnings, error: earningsError } = await window.supabase
                .from('earnings')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (earningsError) {
                console.error('Error loading earnings:', earningsError);
                // Don't show error - user might not have earnings record yet
            }
            
            earningsData = earnings;
            console.log('Earnings data:', earningsData);
            
            // STEP 3: Get payment information
            const { data: paymentInfo, error: paymentError } = await window.supabase
                .from('payment_information')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (paymentError) {
                console.error('Error loading payment info:', paymentError);
            }
            
            // Store all data globally
            window.userData = {
                profile: userProfile,
                earnings: earningsData,
                payment: paymentInfo,
                authUser: authUser
            };
            
            console.log('All data loaded:', window.userData);
            
            // Update UI
            updateUI();
            
            // Setup event listeners
            setupEventListeners();
            
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('Error loading data. Please refresh.', 'error');
        }
    }
    
    function updateUI() {
        console.log('Updating UI with loaded data...');
        
        // 1. Update username everywhere
        updateUsername();
        
        // 2. Update email
        updateEmail();
        
        // 3. Update earnings/stats
        updateEarningsStats();
        
        // 4. Update referral link
        updateReferralLink();
        
        // 5. Update profile section
        updateProfileSection();
        
        // 6. Update greeting
        updateGreeting();
    }
    
    function updateUsername() {
        // Get username from database or auth
        let username = 'User';
        
        if (userProfile?.user_name) {
            username = userProfile.user_name;
        } else if (currentUser?.user_metadata?.full_name) {
            username = currentUser.user_metadata.full_name;
        } else if (currentUser?.email) {
            username = currentUser.email.split('@')[0];
        }
        
        console.log('Setting username to:', username);
        
        // Update ALL username elements
        document.querySelectorAll('#user_name').forEach((element, index) => {
            console.log(`Updating user_name element ${index}:`, element.tagName);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = username;
            } else {
                element.textContent = username;
            }
        });
    }
    
    function updateEmail() {
        const email = currentUser?.email || userProfile?.email_address || '';
        
        document.querySelectorAll('#email_address, .emailAdress').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = email;
            } else {
                element.textContent = email;
            }
        });
    }
    
    function updateEarningsStats() {
        if (!earningsData) {
            console.log('No earnings data to display, showing zeros');
            
            // Show zeros if no earnings data
            const defaultStats = {
                'youtube': 0,
                'tiktok': 0,
                'trivia': 0,
                'refferal': 0,
                'bonus': 5000, // Default bonus from your schema
                'total_income': userProfile?.total_income || 0,
                'withdrawn': 0,
                'walletQash': userProfile?.total_income || 0
            };
            
            updateStatElements(defaultStats);
            return;
        }
        
        console.log('Updating earnings stats with data:', earningsData);
        
        // Calculate available balance
        const allTimeEarn = earningsData.all_time_earn || userProfile?.total_income || 0;
        const totalWithdrawn = earningsData.total_withdrawn || 0;
        const availableBalance = allTimeEarn - totalWithdrawn;
        
        const stats = {
            'youtube': earningsData.youtube || 0,
            'tiktok': earningsData.tiktok || 0,
            'trivia': earningsData.trivia || 0,
            'refferal': earningsData.refferal || 0,
            'bonus': earningsData.bonus || 5000, // Default 5000 from schema
            'total_income': allTimeEarn,
            'withdrawn': totalWithdrawn,
            'walletQash': availableBalance
        };
        
        updateStatElements(stats);
    }
    
    function updateStatElements(stats) {
        Object.entries(stats).forEach(([elementId, value]) => {
            const elements = document.querySelectorAll(`#${elementId}`);
            
            elements.forEach(element => {
                if (element) {
                    element.textContent = typeof value === 'number' ? 
                        value.toLocaleString('en-US') : value;
                    console.log(`Updated ${elementId}: ${value}`);
                }
            });
        });
        
        // Also update total income in profile section
        document.querySelectorAll('#totalCash, #total_income').forEach(element => {
            if (element && stats.total_income !== undefined) {
                element.textContent = stats.total_income.toLocaleString('en-US');
            }
        });
    }
    
    // ========== GITHUB PAGES COMPATIBLE REFERRAL SYSTEM ==========

// Configuration for GitHub Pages
const GITHUB_PAGES_CONFIG = {
    // Your GitHub Pages URL (e.g., https://username.github.io/repo-name)
    baseUrl: window.location.origin,
    
    // Repository name if using project site
    repoName: window.location.pathname.split('/')[1] || '',
    
    // Check if we're on GitHub Pages
    isGitHubPages: window.location.hostname.includes('github.io'),
    
    // Site name for sharing
    siteName: 'SkyLink'
};

// Generate and display referral link
async function updateReferralLink() {
    try {
        const linkInput = document.getElementById('link');
        if (!linkInput) {
            console.error('Link input not found');
            return;
        }

        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            console.error('User not authenticated:', authError);
            linkInput.value = `${getGitHubPagesUrl()}/#/ref/guest`;
            return;
        }

        // Get user details from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, user_name, email_address')
            .or(`email_address.eq.${authUser.email},uuid.eq.${authUser.id}`)
            .maybeSingle();

        if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            linkInput.value = `${getGitHubPagesUrl()}/#/ref/${authUser.id}`;
            return;
        }

        // Generate referral link with user ID and name
        const userId = userData.id; // Numeric ID from users table
        const userName = userData.user_name || authUser.email?.split('@')[0] || 'user';
        const encodedName = encodeURIComponent(userName.replace(/\s+/g, '-'));
        
        // Create referral link for GitHub Pages
        const referralLink = `${getGitHubPagesUrl()}/#/ref/${userId}/${encodedName}`;
        linkInput.value = referralLink;
        
        console.log('✅ Referral link generated:', referralLink);
        
        // Store referral data for registration tracking
        localStorage.setItem('referral_data', JSON.stringify({
            inviter_id: userId,
            inviter_name: userName,
            referral_link: referralLink,
            generated_at: new Date().toISOString()
        }));

        // Setup copy functionality
        setupCopyButton(referralLink);
        
        // Setup social sharing
        setupSocialSharing(referralLink, userName);

    } catch (error) {
        console.error('Error generating referral link:', error);
        const linkInput = document.getElementById('link');
        if (linkInput) {
            linkInput.value = `${getGitHubPagesUrl()}/#/ref/error`;
        }
    }
}

// Get GitHub Pages compatible URL
function getGitHubPagesUrl() {
    // Check for custom domain configuration
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.siteUrl) {
        const customUrl = window.SUPABASE_CONFIG.siteUrl.replace(/\/$/, '');
        // Ensure it's using https for GitHub Pages
        return customUrl.replace(/^http:/, 'https:');
    }
    
    // For GitHub Pages project site
    if (GITHUB_PAGES_CONFIG.repoName && GITHUB_PAGES_CONFIG.isGitHubPages) {
        const base = window.location.origin;
        // If we're in a project repository, include repo name
        if (window.location.pathname.split('/')[1] === GITHUB_PAGES_CONFIG.repoName) {
            return `${base}/${GITHUB_PAGES_CONFIG.repoName}`;
        }
    }
    
    // Fallback to current origin
    return window.location.origin;
}

// GitHub Pages compatible referral link parsing
function parseGitHubPagesReferral() {
    try {
        const hash = window.location.hash.substring(1); // Remove the #
        
        // Parse the hash as a path
        const parts = hash.split('/');
        
        if (parts.length > 1 && parts[1] === 'ref') {
            const refIndex = parts.indexOf('ref');
            const refPath = parts.slice(refIndex + 1).join('/');
            
            // Split the referral path
            const refParts = refPath.split('/');
            if (refParts.length >= 1) {
                const inviterId = parseInt(refParts[0]);
                const inviterName = refParts[1] ? decodeURIComponent(refParts[1]) : null;
                
                if (inviterId && !isNaN(inviterId)) {
                    return {
                        inviter_id: inviterId,
                        inviter_name: inviterName,
                        source: 'github_pages_url'
                    };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing GitHub Pages referral:', error);
        return null;
    }
}

// Handle referral registration for GitHub Pages
async function handleGitHubPagesReferralRegistration() {
    try {
        let referralData = null;
        
        // First try to parse from GitHub Pages hash routing
        const hashReferral = parseGitHubPagesReferral();
        if (hashReferral) {
            referralData = hashReferral;
        }
        
        // If no hash referral, check URL parameters (for direct links)
        if (!referralData) {
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            
            if (refParam) {
                const parts = refParam.split('/');
                if (parts.length >= 1) {
                    const inviterId = parseInt(parts[0]);
                    const inviterName = parts[1] ? decodeURIComponent(parts[1]) : null;
                    
                    if (inviterId && !isNaN(inviterId)) {
                        referralData = {
                            inviter_id: inviterId,
                            inviter_name: inviterName,
                            source: 'url_param'
                        };
                    }
                }
            }
        }
        
        // If still no referral data, check localStorage for recent clicks
        if (!referralData) {
            const stored = localStorage.getItem('referral_click');
            if (stored) {
                referralData = JSON.parse(stored);
            }
        }
        
        // Store referral data for use during registration
        if (referralData) {
            localStorage.setItem('pending_referral', JSON.stringify(referralData));
            console.log('✅ Referral data captured:', referralData);
            
            // Show message to user
            const messageEl = document.getElementById('referral-message');
            if (messageEl) {
                messageEl.textContent = `You were referred by ${referralData.inviter_name || 'a friend'}!`;
                messageEl.style.display = 'block';
            }
            
            // Optional: Update page URL to clean it up (remove referral info)
            cleanGitHubPagesUrl();
        }
        
    } catch (error) {
        console.error('Error handling referral registration:', error);
    }
}

// Clean up GitHub Pages URL after capturing referral
function cleanGitHubPagesUrl() {
    if (GITHUB_PAGES_CONFIG.isGitHubPages) {
        try {
            // Remove referral from hash
            if (window.location.hash.includes('/ref/')) {
                // Get current hash and clean it
                const hash = window.location.hash;
                const cleanHash = hash.replace(/\/ref\/[^\/]+\/?[^\/]*/, '');
                
                // Update URL without refreshing page
                window.history.replaceState(
                    {}, 
                    document.title, 
                    window.location.pathname + window.location.search + (cleanHash || '#')
                );
            }
        } catch (error) {
            console.warn('Could not clean GitHub Pages URL:', error);
        }
    }
}

// Enhanced social sharing setup for GitHub Pages
function setupSocialSharing(referralLink, userName) {
    const shareText = `Join me on ${GITHUB_PAGES_CONFIG.siteName} and start earning! Use my referral link: ${referralLink}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(referralLink);
    
    // WhatsApp
    const whatsappBtn = document.getElementById('shareWhatsApp');
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${encodedText}`;
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        });
    }
    
    // Facebook
    const facebookBtn = document.getElementById('shareFacebook');
    if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        facebookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
        });
    }
    
    // Twitter/X
    const twitterBtn = document.getElementById('shareTwitter');
    if (twitterBtn) {
        const twitterText = encodeURIComponent(`Join ${userName} on ${GITHUB_PAGES_CONFIG.siteName} and start earning!`);
        twitterBtn.href = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodedUrl}`;
        twitterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodedUrl}`, '_blank', 'width=600,height=400');
        });
    }
    
    // Telegram
    const telegramBtn = document.getElementById('shareTelegram');
    if (telegramBtn) {
        telegramBtn.href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        telegramBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
        });
    }
    
    // Email
    const emailBtn = document.getElementById('shareEmail');
    if (emailBtn) {
        const subject = encodeURIComponent(`Join me on ${GITHUB_PAGES_CONFIG.siteName}!`);
        const body = encodeURIComponent(`Hi,\n\nJoin me on ${GITHUB_PAGES_CONFIG.siteName} and start earning money by completing simple tasks!\n\nUse my referral link: ${referralLink}\n\nBest regards,\n${userName}`);
        emailBtn.href = `mailto:?subject=${subject}&body=${body}`;
    }
    
    // SMS
    const smsBtn = document.getElementById('shareSMS');
    if (smsBtn) {
        smsBtn.href = `sms:?body=${encodedText}`;
    }
    
    // Copy link fallback for sharing
    setupShareFallback(referralLink);
}

// Setup share fallback for environments without Web Share API
function setupShareFallback(referralLink) {
    const shareBtn = document.getElementById('shareNative');
    if (shareBtn && navigator.share) {
        shareBtn.style.display = 'flex';
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: `Join me on ${GITHUB_PAGES_CONFIG.siteName}`,
                    text: `Join me on ${GITHUB_PAGES_CONFIG.siteName} and start earning!`,
                    url: referralLink,
                });
            } catch (err) {
                console.log('Share cancelled or failed:', err);
            }
        });
    }
}

// Track referral link clicks (GitHub Pages compatible)
function trackGitHubPagesReferralClick(inviterId, inviterName) {
    const clickData = {
        inviter_id: inviterId,
        inviter_name: inviterName,
        clicked_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        page_url: window.location.href,
        is_github_pages: GITHUB_PAGES_CONFIG.isGitHubPages
    };
    
    localStorage.setItem('referral_click', JSON.stringify(clickData));
    
    // Also send to analytics if available
    logReferralClickAnalytics(clickData);
    
    console.log('✅ Referral click tracked:', clickData);
}

// Log referral analytics
async function logReferralClickAnalytics(clickData) {
    try {
        // Send to Supabase if user is available
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            await supabase
                .from('referral_analytics')
                .insert({
                    inviter_id: clickData.inviter_id,
                    visitor_user_id: user.id,
                    user_agent: clickData.user_agent,
                    referrer: clickData.referrer,
                    page_url: clickData.page_url,
                    clicked_at: clickData.clicked_at
                });
        }
    } catch (error) {
        console.error('Error logging analytics:', error);
        // Non-critical, so don't throw
    }
}

// Initialize referral system for GitHub Pages
async function initializeGitHubPagesReferralSystem() {
    console.log('🚀 Initializing GitHub Pages Referral System...');
    
    // Add GitHub Pages specific styles
    addGitHubPagesStyles();
    
    // Update referral link for current user
    await updateReferralLink();
    
    // Check for referral links on page load
    if (window.location.hash.includes('/ref/') || window.location.search.includes('ref=')) {
        handleGitHubPagesReferralRegistration();
    }
    
    // Listen for hash changes (GitHub Pages routing)
    window.addEventListener('hashchange', () => {
        if (window.location.hash.includes('/ref/')) {
            handleGitHubPagesReferralRegistration();
        }
    });
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
        if (window.location.hash.includes('/ref/')) {
            handleGitHubPagesReferralRegistration();
        }
    });
}

// Add GitHub Pages specific styles
function addGitHubPagesStyles() {
    const styles = `
        .github-pages-notice {
            background: #f0f8ff;
            border-left: 4px solid #0366d6;
            padding: 12px 16px;
            margin: 15px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .github-pages-notice a {
            color: #0366d6;
            text-decoration: underline;
        }
        
        /* Ensure referral links work in single-page apps */
        a[href*="#/ref/"] {
            cursor: pointer;
        }
        
        /* Loading state for referral system */
        .referral-loading {
            opacity: 0.7;
            pointer-events: none;
            position: relative;
        }
        
        .referral-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            transform: translate(-50%, -50%);
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        /* Enhanced notification for GitHub Pages */
        .link-notification.github-pages {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 1px solid rgba(255,255,255,0.2);
        }
    `;
    
    if (!document.querySelector('#github-pages-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'github-pages-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
}

// Create referral QR code for mobile sharing
function createReferralQRCode(referralLink, containerId = 'qrCodeContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create QR code using a simple API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referralLink)}`;
    
    const qrImg = document.createElement('img');
    qrImg.src = qrCodeUrl;
    qrImg.alt = 'Scan to join with referral link';
    qrImg.style.borderRadius = '8px';
    qrImg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    const qrCaption = document.createElement('p');
    qrCaption.textContent = 'Scan QR code to share';
    qrCaption.style.fontSize = '12px';
    qrCaption.style.color = '#666';
    qrCaption.style.marginTop = '8px';
    qrCaption.style.textAlign = 'center';
    
    container.appendChild(qrImg);
    container.appendChild(qrCaption);
}

// Export functions for use in other modules
window.ReferralSystem = {
    initialize: initializeGitHubPagesReferralSystem,
    updateReferralLink,
    handleRegistration: handleGitHubPagesReferralRegistration,
    saveReferral: saveReferralAfterRegistration,
    createQRCode: createReferralQRCode,
    trackClick: trackGitHubPagesReferralClick
};

// Auto-initialize if script is loaded in main context
if (typeof supabase !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGitHubPagesReferralSystem();
    });
}

// Keep your existing functions (setupCopyButton, showLinkNotification, 
// saveReferralAfterRegistration, determineSecondaryBenefit) unchanged
// They will work with the GitHub Pages compatible system
// Start when page loads



document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeReferralSystem, 1000);
});
    
    function updateProfileSection() {
        console.log('Updating profile section...');
        
        // Update username in profile section
        const username = userProfile?.user_name || 
                        currentUser?.user_metadata?.full_name || 
                        currentUser?.email?.split('@')[0] || 'User';
        
        document.querySelectorAll('#profile-section #user_name, .profile-username').forEach(element => {
            element.textContent = username;
        });
        
        // Update email in profile
        const email = currentUser?.email || userProfile?.email_address || '';
        document.querySelectorAll('.profile-email, #profile-section .emailAdress').forEach(element => {
            element.textContent = email;
        });
        
        // Update created at date
        const createdAtElement = document.getElementById('createdAt');
        if (createdAtElement && userProfile?.created_at) {
            const date = new Date(userProfile.created_at);
            createdAtElement.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }
        
        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement && userProfile?.status) {
            statusElement.textContent = userProfile.status;
            statusElement.className = `status-${userProfile.status.toLowerCase().replace(' ', '-')}`;
        }
        
        // Update rank
        const rankElement = document.getElementById('rank');
        if (rankElement && userProfile?.rank) {
            rankElement.textContent = userProfile.rank;
        }
    }
    
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 16) greeting = "Good Afternoon";
        else greeting = "Good Evening";
        
        const greetingElement = document.getElementById("greetings");
        if (greetingElement) {
            greetingElement.textContent = greeting + "! ";
        }
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners for user ID:', userId);
        
        // Task claim buttons
        setupTaskClaims();
        
        // Settings save
        setupSettingsSave();
        
        // Withdrawal form
        setupWithdrawalForm();
        
        // Export button
        setupExportButton();
        
        // Refresh buttons
        setupRefreshButtons();
        
        // Trivia form
        setupTriviaForm();
        
        // Activation
        setupActivation();
    }
    
    function setupTaskClaims() {
        // TikTok claim
        const tiktokClaim = document.getElementById('claim');
        if (tiktokClaim) {
            tiktokClaim.addEventListener('click', () => handleTaskClaim('tiktok'));
        }
        
        // YouTube claim
        const youtubeClaim = document.getElementById('claimYoutube');
        if (youtubeClaim) {
            youtubeClaim.addEventListener('click', () => handleTaskClaim('youtube'));
        }
    }
    
    async function handleTaskClaim(taskType) {
        if (!userId || !currentUser) {
            showMessage('User data not loaded. Please refresh.', 'error');
            return;
        }
        
        const button = document.getElementById(taskType === 'youtube' ? 'claimYoutube' : 'claim');
        if (!button) return;
        
        try {
            button.disabled = true;
            button.textContent = 'Processing...';
            
            // Check cooldown
            const storageKey = `nextClaim_${taskType}_${userId}`;
            const nextClaimTime = localStorage.getItem(storageKey);
            
            if (nextClaimTime && Date.now() < Number(nextClaimTime)) {
                const remaining = Number(nextClaimTime) - Date.now();
                const hours = Math.ceil(remaining / (1000 * 60 * 60));
                showMessage(`Please wait ${hours} hours before claiming again`, 'warning');
                button.disabled = false;
                button.textContent = 'Claim Reward';
                return;
            }
            
            const rewardAmount = 500;
            
            // Get current earnings or create new record
            let currentEarnings = earningsData;
            if (!currentEarnings) {
                // Create new earnings record
                currentEarnings = {
                    id: userId,
                    youtube: 0,
                    tiktok: 0,
                    trivia: 0,
                    refferal: 0,
                    bonus: 5000,
                    all_time_earn: 0,
                    total_withdrawn: 0
                };
            }
            
            // Calculate new values
            const currentValue = currentEarnings[taskType] || 0;
            const newValue = currentValue + rewardAmount;
            const currentTotal = currentEarnings.all_time_earn || userProfile?.total_income || 0;
            const newTotal = currentTotal + rewardAmount;
            
            console.log(`Updating ${taskType}: ${currentValue} → ${newValue}, Total: ${currentTotal} → ${newTotal}`);
            
            // Update earnings table
            const updateData = {
                id: userId,
                [taskType]: newValue,
                all_time_earn: newTotal
            };
            
            // Include other fields to avoid null values
            if (currentEarnings.tiktok !== undefined) updateData.tiktok = currentEarnings.tiktok;
            if (currentEarnings.youtube !== undefined) updateData.youtube = currentEarnings.youtube;
            if (currentEarnings.trivia !== undefined) updateData.trivia = currentEarnings.trivia;
            if (currentEarnings.refferal !== undefined) updateData.refferal = currentEarnings.refferal;
            if (currentEarnings.bonus !== undefined) updateData.bonus = currentEarnings.bonus;
            if (currentEarnings.total_withdrawn !== undefined) updateData.total_withdrawn = currentEarnings.total_withdrawn;
            
            const { error } = await window.supabase
                .from('earnings')
                .upsert(updateData, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.error('Database update error:', error);
                
                // If error is about missing record, try insert instead
                if (error.code === '23503' || error.message.includes('foreign key')) {
                    console.log('Trying to insert new earnings record...');
                    
                    const newEarnings = {
                        id: userId,
                        [taskType]: rewardAmount,
                        all_time_earn: rewardAmount,
                        tiktok: taskType === 'tiktok' ? rewardAmount : 0,
                        youtube: taskType === 'youtube' ? rewardAmount : 0,
                        trivia: 0,
                        refferal: 0,
                        bonus: 5000,
                        total_withdrawn: 0
                    };
                    
                    const { error: insertError } = await window.supabase
                        .from('earnings')
                        .insert(newEarnings);
                    
                    if (insertError) throw insertError;
                    
                    earningsData = newEarnings;
                } else {
                    throw error;
                }
            } else {
                // Update local data
                earningsData = {
                    ...earningsData,
                    [taskType]: newValue,
                    all_time_earn: newTotal
                };
            }
            
            // Update users table total_income
            await window.supabase
                .from('users')
                .update({ total_income: newTotal })
                .eq('id', userId);
            
            // Update userProfile
            if (userProfile) {
                userProfile.total_income = newTotal;
            }
            
            // Update UI
            updateEarningsStats();
            
            // Set cooldown (48 hours)
            const nextClaim = Date.now() + (48 * 60 * 60 * 1000);
            localStorage.setItem(storageKey, nextClaim.toString());
            
            button.textContent = 'Claimed!';
            button.style.backgroundColor = '#95a5a6';
            
            showMessage(`Successfully claimed UGX ${rewardAmount} from ${taskType} task!`, 'success');
            
        } catch (error) {
            console.error('Task claim error:', error);
            button.disabled = false;
            button.textContent = 'Claim Reward';
            showMessage('Error claiming reward: ' + error.message, 'error');
        }
    }
    
    function setupSettingsSave() {
        const saveBtn = document.getElementById('saveSettings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', async () => {
            if (!userId) {
                showMessage('User data not loaded', 'error');
                return;
            }
            
            const username = document.querySelector('#settings-section #user_name')?.value;
            const email = document.querySelector('#settings-section #email_address')?.value;
            const phone = document.querySelector('#settings-section #phone_number')?.value;
            
            if (!username || !email) {
                showMessage('Username and email are required', 'error');
                return;
            }
            
            try {
                // Update users table
                const { error: userError } = await window.supabase
                    .from('users')
                    .update({
                        user_name: username,
                        email_address: email
                    })
                    .eq('id', userId);
                
                if (userError) throw userError;
                
                // Update payment info
                if (phone) {
                    const { error: paymentError } = await window.supabase
                        .from('payment_information')
                        .upsert({
                            id: userId,
                            mobile_number: phone,
                            email: email
                        }, {
                            onConflict: 'id'
                        });
                    
                    if (paymentError) throw paymentError;
                }
                
                // Update auth email if changed
                if (email !== currentUser.email) {
                    const { error: authError } = await window.supabase.auth.updateUser({
                        email: email
                    });
                    
                    if (authError) throw authError;
                    
                    // Update local user object
                    currentUser.email = email;
                }
                
                // Update userProfile
                if (userProfile) {
                    userProfile.user_name = username;
                    userProfile.email_address = email;
                }
                
                // Update UI
                updateUsername();
                updateEmail();
                
                showMessage('Settings saved successfully!', 'success');
                
            } catch (error) {
                console.error('Save settings error:', error);
                showMessage('Error saving settings: ' + error.message, 'error');
            }
        });
    }
    
  function setupWithdrawalForm() {
    const form = document.getElementById('withdrawalForm');
    if (!form) return;
    
    // FIX: First ensure the select has correct options
    const walletSelect = form.querySelector('.form-group:nth-child(2) select');
    if (walletSelect) {
        // Check if options show numbers instead of text
        const hasNumberOptions = Array.from(walletSelect.options).some(option => 
            !isNaN(parseInt(option.textContent.trim())) && option.textContent.trim() !== ''
        );
        
        if (hasNumberOptions) {
            console.log('FIXING: Options show numbers instead of text. Restoring correct options...');
            
            // Clear and restore correct options
            walletSelect.innerHTML = '';
            
            const correctOptions = [
                { id: 'bonus', text: 'Bonus' },
                { id: 'trivia', text: 'Trivia' },
                { id: 'youtube', text: 'Youtube' },
                { id: 'tiktok', text: 'TikTok' },
                { id: 'referral', text: 'Refferals' }
            ];
            
            correctOptions.forEach(opt => {
                const option = document.createElement('option');
                option.id = opt.id;
                option.value = opt.id;
                option.textContent = opt.text;
                walletSelect.appendChild(option);
            });
        }
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userId) {
            showMessage('User data not loaded', 'error');
            return;
        }
        
        // Get form values
        const amountInput = form.querySelector('input[type="number"]');
        const amount = parseFloat(amountInput.value);
        
        // Get wallet select
        const walletSelect = form.querySelector('.form-group:nth-child(2) select');
        if (!walletSelect) {
            showMessage('Wallet selection not found', 'error');
            return;
        }
        
        // DOUBLE CHECK: Ensure options are correct before proceeding
        const selectedOption = walletSelect.options[walletSelect.selectedIndex];
        const walletId = selectedOption.id || selectedOption.value;
        
        // If walletId is a number (like 8000, 56000), we need to get the real wallet type
        let actualWalletId = walletId;
        if (!isNaN(parseInt(walletId))) {
            // This means the option was showing a number instead of proper text
            // We need to determine which wallet this number represents
            console.log('WARNING: Option ID is a number:', walletId);
            
            // Try to match the number to a wallet based on current balances
            if (earningsData) {
                if (earningsData.bonus == walletId) actualWalletId = 'bonus';
                else if (earningsData.trivia == walletId) actualWalletId = 'trivia';
                else if (earningsData.youtube == walletId) actualWalletId = 'youtube';
                else if (earningsData.tiktok == walletId) actualWalletId = 'tiktok';
                else if (earningsData.refferal == walletId) actualWalletId = 'referral';
                else {
                    showMessage('Cannot determine wallet type. Please refresh and try again.', 'error');
                    return;
                }
            } else {
                showMessage('Cannot determine wallet type. Please refresh and try again.', 'error');
                return;
            }
        }
        
        const paymentMethodSelect = form.querySelector('.form-group:nth-child(3) select');
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
        
        const accountDetails = document.getElementById('account_number')?.value;
        
        // Validation
        if (!amount || amount < 59000) {
            showMessage('Minimum withdrawal amount is UGX 59,000', 'warning');
            return;
        }
        
        if (!accountDetails) {
            showMessage('Please enter account details', 'warning');
            return;
        }
        
        if (!actualWalletId) {
            showMessage('Please select a wallet', 'error');
            return;
        }
        
        // Map option IDs to database column names
        const columnMap = {
            'bonus': 'bonus',
            'trivia': 'trivia',
            'youtube': 'youtube',
            'tiktok': 'tiktok',
            'referral': 'refferal'
        };
        
        const dbColumn = columnMap[actualWalletId];
        
        if (!dbColumn) {
            showMessage('Invalid wallet selection', 'error');
            return;
        }
        
        try {
            // 1. Get current balance
            const { data: earnings, error: fetchError } = await window.supabase
                .from('earnings')
                .select(`id, ${dbColumn}, all_time_earn, total_withdrawn`)
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            if (!earnings) throw new Error('No earnings data found');
            
            const currentBalance = earnings[dbColumn] || 0;
            const allTimeEarn = earnings.all_time_earn || 0;
            const totalWithdrawn = earnings.total_withdrawn || 0;
            
            // 2. Validate balance
            if (amount > currentBalance) {
                showMessage(`Insufficient balance. Available: UGX ${currentBalance.toLocaleString()}`, 'error');
                return;
            }
            
            // Check if wallet has minimum balance
            if (currentBalance < 59000) {
                showMessage(`Minimum withdrawal is UGX 59,000. Your wallet has UGX ${currentBalance.toLocaleString()}`, 'warning');
                return;
            }
            
            // 3. Calculate new values
            const newBalance = currentBalance - amount;
            const newAllTimeEarn = allTimeEarn - amount;
            const newTotalWithdrawn = totalWithdrawn + amount;
            
            // 4. Update earnings table
            const { error: updateEarningsError } = await window.supabase
                .from('earnings')
                .update({
                    [dbColumn]: newBalance,
                    all_time_earn: newAllTimeEarn,
                    total_withdrawn: newTotalWithdrawn
                })
                .eq('id', userId);
            
            if (updateEarningsError) throw updateEarningsError;
            
            // 5. Update users table total_income
            const { error: updateUserError } = await window.supabase
                .from('users')
                .update({ total_income: newAllTimeEarn })
                .eq('id', userId);
            
            if (updateUserError) {
                console.warn('Users table update failed:', updateUserError);
            }
            
            // 6. Create withdrawal request
            const phoneNumber = parseInt(accountDetails) || 0;
            const { error: withdrawalError } = await window.supabase
                .from('withdrawal_requests')
                .insert({
                    id: userId,
                    amount: amount,
                    payment_method: paymentMethod,
                    phone_number: phoneNumber,
                    email: currentUser?.email || '',
                    status: 'pending',
                    wallet_type: dbColumn // Store the database column name
                });
            
            if (withdrawalError) throw withdrawalError;
            
            // 7. Update local data
            if (earningsData) {
                earningsData[dbColumn] = newBalance;
                earningsData.all_time_earn = newAllTimeEarn;
                earningsData.total_withdrawn = newTotalWithdrawn;
            }
            
            if (userProfile) {
                userProfile.total_income = newAllTimeEarn;
            }
            
            // 8. Update UI and reset form
            if (typeof updateEarningsStats === 'function') {
                updateEarningsStats();
            }
            
            form.reset();
            showMessage(`Withdrawal request submitted for UGX ${amount.toLocaleString()}`, 'success');
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    });
}
// Add this function to your initDashboard or setupEventListeners
function protectWithdrawalForm() {
    const form = document.getElementById('withdrawalForm');
    if (!form) return;
    
    const walletSelect = form.querySelector('.form-group:nth-child(2) select');
    if (!walletSelect) return;
    
    // Store original options
    const originalOptions = [
        { id: 'bonus', text: 'Bonus' },
        { id: 'trivia', text: 'Trivia' },
        { id: 'youtube', text: 'Youtube' },
        { id: 'tiktok', text: 'TikTok' },
        { id: 'referral', text: 'Refferals' }
    ];
    
    // Monitor for changes
    const observer = new MutationObserver(() => {
        const currentOptions = Array.from(walletSelect.options);
        const hasNumbers = currentOptions.some(opt => !isNaN(parseInt(opt.textContent.trim())));
        
        if (hasNumbers) {
            console.log('Blocking attempt to change options to numbers');
            walletSelect.innerHTML = '';
            originalOptions.forEach(opt => {
                const option = document.createElement('option');
                option.id = opt.id;
                option.value = opt.id;
                option.textContent = opt.text;
                walletSelect.appendChild(option);
            });
        }
    });
    
    observer.observe(walletSelect, { childList: true, subtree: true });
    }
    function setupEventListeners() {
    console.log('Setting up event listeners for user ID:', userId);
    
    setupTaskClaims();
    setupSettingsSave();
    setupWithdrawalForm();
    protectWithdrawalForm(); // ADD THIS LINE
    setupExportButton();
    setupRefreshButtons();
    setupTriviaForm();
    setupActivation();
}
    function setupExportButton() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', () => {
            if (!earningsData) {
                showMessage('No data to export', 'warning');
                return;
            }
            
            const data = {
                user: {
                    name: userProfile?.user_name || 'User',
                    email: currentUser.email,
                    joined: userProfile?.created_at || new Date().toISOString(),
                    status: userProfile?.status,
                    rank: userProfile?.rank
                },
                earnings: earningsData,
                totalIncome: userProfile?.total_income || 0,
                exportedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `greenqash-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showMessage('Data exported successfully!', 'success');
        });
    }
    
    function setupRefreshButtons() {
        document.querySelectorAll('#refresh-tiktok, #refresh-youtube, #refresh-downlines').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.textContent = 'Refreshing...';
                btn.disabled = true;
                
                // Reload all data
                await loadUserData(currentUser);
                
                setTimeout(() => {
                    btn.textContent = btn.id.includes('tiktok') ? 'Refresh Tasks' : 
                                     btn.id.includes('youtube') ? 'Refresh Tasks' : 'Refresh';
                    btn.disabled = false;
                    showMessage('Data refreshed!', 'success');
                }, 1000);
            });
        });
    }
    
    function setupTriviaForm() {
        const form = document.getElementById('quizForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!userId) {
                showMessage('User data not loaded', 'error');
                return;
            }
            
            // Check if already submitted today
            const lastTriviaKey = `lastTrivia_${userId}`;
            const lastTrivia = localStorage.getItem(lastTriviaKey);
            const today = new Date().toDateString();
            
            if (lastTrivia === today) {
                showMessage('You have already completed trivia today', 'warning');
                return;
            }
            
            // Calculate score
            const correctAnswers = {
                q1: 'c',
                q2: 'b', 
                q3: 'c',
                q4: 'b',
                q5: 'b'
            };
            
            let score = 0;
            Object.keys(correctAnswers).forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                if (selected && selected.value === correctAnswers[q]) {
                    score++;
                }
            });
            
            // Calculate earnings
            const amountEarned = score >= 3 ? 1500 : score * 300;
            
            try {
                // Get current earnings or create new
                let currentEarnings = earningsData;
                if (!currentEarnings) {
                    currentEarnings = {
                        id: userId,
                        trivia: 0,
                        all_time_earn: userProfile?.total_income || 0
                    };
                }
                
                const newTriviaValue = (currentEarnings.trivia || 0) + amountEarned;
                const newTotal = (currentEarnings.all_time_earn || userProfile?.total_income || 0) + amountEarned;
                
                // Update database
                const updateData = {
                    id: userId,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                };
                
                // Include other fields
                if (currentEarnings.tiktok !== undefined) updateData.tiktok = currentEarnings.tiktok;
                if (currentEarnings.youtube !== undefined) updateData.youtube = currentEarnings.youtube;
                if (currentEarnings.refferal !== undefined) updateData.refferal = currentEarnings.refferal;
                if (currentEarnings.bonus !== undefined) updateData.bonus = currentEarnings.bonus;
                if (currentEarnings.total_withdrawn !== undefined) updateData.total_withdrawn = currentEarnings.total_withdrawn;
                
                const { error } = await window.supabase
                    .from('earnings')
                    .upsert(updateData, {
                        onConflict: 'id'
                    });
                
                if (error) throw error;
                
                // Update users table
                await window.supabase
                    .from('users')
                    .update({ total_income: newTotal })
                    .eq('id', userId);
                
                // Update local data
                earningsData = {
                    ...earningsData,
                    trivia: newTriviaValue,
                    all_time_earn: newTotal
                };
                
                // Update userProfile
                if (userProfile) {
                    userProfile.total_income = newTotal;
                }
                
                // Update UI
                updateEarningsStats();
                
                // Mark as completed for today
                localStorage.setItem(lastTriviaKey, today);
                
                // Disable form
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Completed Today';
                }
                
                showMessage(`Trivia completed! You earned UGX ${amountEarned}`, 'success');
                
            } catch (error) {
                console.error('Trivia error:', error);
                showMessage('Error saving trivia results: ' + error.message, 'error');
            }
        });
    }
    
    function setupActivation() {
        const how2activate = document.getElementById("how2a");
        const activateBtn = document.getElementById("activate");
        
        if (how2activate) {
            how2activate.addEventListener("click", () => {
                const username = userProfile?.user_name || 
                                currentUser?.user_metadata?.full_name || 
                                currentUser?.email?.split('@')[0] || 'user';
                
                const activationMess = document.getElementById("activationMess");
                if (activationMess) {
                    activationMess.innerHTML = `
                        <h3>Account Activation</h3>
                        <p><strong>Username:</strong> ${username}</p>
                        <p><strong>Amount:</strong> UGX 20,000</p>
                        <p>After payment, click "Activate Account" below to verify.</p>
                    `;
                }
                
                if (activateBtn) {
                    activateBtn.style.display = "block";
                }
            });
        }
        
        if (activateBtn) {
            activateBtn.addEventListener("click", async function() {
                if (!userId) {
                    showMessage('User data not loaded', 'error');
                    return;
                }
                
                try {
                    this.disabled = true;
                    this.textContent = "Processing...";
                    
                    // Update user status
                    const { error } = await window.supabase
                        .from('users')
                        .update({ 
                            status: 'active',
                            rank: 'user'
                        })
                        .eq('id', userId);
                    
                    if (error) throw error;
                    
                    // Update local profile
                    if (userProfile) {
                        userProfile.status = 'active';
                        userProfile.rank = 'activated_user';
                    }
                    
                    this.textContent = "Account Activated!";
                    this.style.background = "rgba(0, 255, 153, 0.3)";
                    
                    showMessage('Account activated successfully!', 'success');
                    
                } catch (error) {
                    console.error('Activation error:', error);
                    this.disabled = false;
                    this.textContent = "Activate Account";
                    showMessage('Error activating account: ' + error.message, 'error');
                }
            });
        }
    }
    
    function showMessage(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }


    //ACTIVITY MONITORING SYSTEM
    // ========== 24-HOUR ACTIVITY TRACKER ==========
// Add this to greenqash.js

// Activity tracking with 24-hour persistence
const ActivityTracker24 = {
    // Initialize
    init: function() {
        console.log('⏰ 24-Hour Activity Tracker starting...');
        
        // Load and display activities
        this.loadAndDisplay();
        
        // Setup event listeners
        this.setupListeners();
        
        // Setup auto-cleanup every 5 minutes
        setInterval(() => this.cleanupOld(), 5 * 60 * 1000);
        
        // Clean up on startup (but don't delete fresh ones)
        setTimeout(() => this.cleanupOld(), 2000);
        
        // Add test functions
        this.addTestFunctions();
        
        console.log('✅ 24-Hour tracker ready');
    },
    
    // Record activity with 24-hour expiry
    record: function(task, activity, amount = 0, status = 'Completed') {
        console.log('📝 Recording 24-hour activity:', task);
        
        const activityObj = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            expiry: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
            task: task,
            activity: activity,
            amount: amount,
            status: status,
            user: this.getUserId() || 'anonymous'
        };
        
        // Save to localStorage
        this.saveToStorage(activityObj);
        
        // Display immediately
        this.displayInTable(activityObj);
        
        return activityObj;
    },
    
    // Get user ID for persistence
    getUserId: function() {
        // Try to get user ID from various sources
        try {
            // Check if user is logged in via your existing code
            if (window.currentUser) return window.currentUser.id;
            if (window.userData?.authUser?.id) return window.userData.authUser.id;
            
            // Use localStorage user ID
            const storedUser = localStorage.getItem('current_user_id');
            if (storedUser) return storedUser;
            
            // Create a persistent anonymous ID
            let anonId = localStorage.getItem('anonymous_user_id');
            if (!anonId) {
                anonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('anonymous_user_id', anonId);
            }
            return anonId;
            
        } catch (error) {
            console.error('Error getting user ID:', error);
            return 'anonymous';
        }
    },
    
    // Save activity to localStorage with user grouping
    saveToStorage: function(activity) {
        try {
            // Get user ID
            const userId = this.getUserId();
            
            // Get existing activities for this user
            const storageKey = `activities_${userId}`;
            let userActivities = [];
            
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                userActivities = JSON.parse(stored);
                if (!Array.isArray(userActivities)) userActivities = [];
            }
            
            // Add new activity
            userActivities.unshift(activity);
            
            // Keep max 100 activities per user
            if (userActivities.length > 100) {
                userActivities = userActivities.slice(0, 100);
            }
            
            // Save back to localStorage
            localStorage.setItem(storageKey, JSON.stringify(userActivities));
            
            // Also save to global activities (for compatibility)
            this.saveToGlobal(activity);
            
            console.log(`💾 Saved activity for user: ${userId}`);
            
        } catch (error) {
            console.error('Error saving activity:', error);
        }
    },
    
    // Also save to global activities (backup)
    saveToGlobal: function(activity) {
        try {
            const globalKey = 'all_activities_24h';
            let allActivities = [];
            
            const stored = localStorage.getItem(globalKey);
            if (stored) {
                allActivities = JSON.parse(stored);
                if (!Array.isArray(allActivities)) allActivities = [];
            }
            
            // Add with user identifier
            const globalActivity = {
                ...activity,
                userId: this.getUserId(),
                savedAt: Date.now()
            };
            
            allActivities.unshift(globalActivity);
            
            // Keep max 500 activities globally
            if (allActivities.length > 500) {
                allActivities = allActivities.slice(0, 500);
            }
            
            localStorage.setItem(globalKey, JSON.stringify(allActivities));
            
        } catch (error) {
            console.error('Error saving to global:', error);
        }
    },
    
    // Load and display activities for current user
    loadAndDisplay: function() {
        console.log('📂 Loading 24-hour activities...');
        
        // Get user ID
        const userId = this.getUserId();
        const storageKey = `activities_${userId}`;
        
        let userActivities = [];
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                userActivities = JSON.parse(stored);
                if (!Array.isArray(userActivities)) userActivities = [];
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
        
        console.log(`Found ${userActivities.length} activities for user ${userId}`);
        
        // Clean expired activities
        userActivities = this.filterExpired(userActivities);
        
        // Save back if any were removed
        if (userActivities.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(userActivities));
        }
        
        // Display in table
        this.displayAllInTable(userActivities);
    },
    
    // Filter out expired activities
    filterExpired: function(activities) {
        const now = Date.now();
        const valid = activities.filter(activity => {
            // Check if activity has expiry time
            if (activity.expiry && activity.expiry > now) {
                return true;
            }
            
            // If no expiry, check if timestamp is within 24 hours
            if (activity.timestamp) {
                const activityTime = new Date(activity.timestamp).getTime();
                return (now - activityTime) < (24 * 60 * 60 * 1000);
            }
            
            return false; // Invalid activity
        });
        
        const expiredCount = activities.length - valid.length;
        if (expiredCount > 0) {
            console.log(`🧹 Removed ${expiredCount} expired activities`);
        }
        
        return valid;
    },
    
    // Clean up old activities
    cleanupOld: function() {
        console.log('🔄 Running 24-hour cleanup...');
        
        try {
            // Get user ID
            const userId = this.getUserId();
            const storageKey = `activities_${userId}`;
            
            // Load user activities
            let userActivities = [];
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                userActivities = JSON.parse(stored);
                if (!Array.isArray(userActivities)) userActivities = [];
            }
            
            // Filter expired
            const validActivities = this.filterExpired(userActivities);
            
            // Save back if changed
            if (validActivities.length !== userActivities.length) {
                localStorage.setItem(storageKey, JSON.stringify(validActivities));
                // Refresh display
                this.displayAllInTable(validActivities);
            }
            
            // Also clean global activities
            this.cleanupGlobal();
            
        } catch (error) {
            console.error('Error in cleanup:', error);
        }
    },
    
    // Clean up global activities
    cleanupGlobal: function() {
        try {
            const globalKey = 'all_activities_24h';
            let allActivities = [];
            
            const stored = localStorage.getItem(globalKey);
            if (stored) {
                allActivities = JSON.parse(stored);
                if (!Array.isArray(allActivities)) allActivities = [];
            }
            
            const now = Date.now();
            const valid = allActivities.filter(activity => {
                if (activity.expiry && activity.expiry > now) return true;
                if (activity.timestamp) {
                    const activityTime = new Date(activity.timestamp).getTime();
                    return (now - activityTime) < (24 * 60 * 60 * 1000);
                }
                return false;
            });
            
            if (valid.length !== allActivities.length) {
                localStorage.setItem(globalKey, JSON.stringify(valid));
                console.log(`Cleaned global: ${allActivities.length} → ${valid.length}`);
            }
            
        } catch (error) {
            console.error('Error cleaning global:', error);
        }
    },
    
    // Display activity in table
    displayInTable: function(activity) {
        const tbody = this.getTableBody();
        if (!tbody) return;
        
        // Remove "no activities" message
        if (tbody.innerHTML.includes('No recent activities')) {
            tbody.innerHTML = '';
        }
        
        // Create row
        const row = this.createTableRow(activity);
        
        // Insert at top
        if (tbody.firstChild) {
            tbody.insertBefore(row, tbody.firstChild);
        } else {
            tbody.appendChild(row);
        }
    },
    
    // Display all activities in table
    displayAllInTable: function(activities) {
        const tbody = this.getTableBody();
        if (!tbody) return;
        
        // Clear table
        tbody.innerHTML = '';
        
        if (!activities || activities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">No recent activities. Complete tasks to earn!</td>
                </tr>
            `;
            return;
        }
        
        // Sort by time (newest first)
        activities.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Add each activity
        activities.forEach(activity => {
            const row = this.createTableRow(activity);
            tbody.appendChild(row);
        });
        
        console.log(`✅ Displayed ${activities.length} activities`);
    },
    
    // Get table body
    getTableBody: function() {
        // Try multiple selectors
        const selectors = [
            '#recent-activity tbody',
            'table#recent-activity tbody',
            '.admin-section.active table tbody',
            'table:has(th:contains("Time")) tbody'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        // Create table if it doesn't exist
        return this.createFallbackTable();
    },
    
    // Create fallback table
    createFallbackTable: function() {
        console.log('Creating fallback activity table');
        
        // Find or create container
        let container = document.querySelector('#dashboard-section, .admin-section.active');
        if (!container) {
            container = document.querySelector('main');
        }
        
        if (!container) {
            console.error('No container found for table');
            return null;
        }
        
        // Create table HTML
        const tableHTML = `
            <div class="section-header">
                <h2 class="section-title">Recent Activity (24H)</h2>
            </div>
            <table id="recent-activity">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Task</th>
                        <th>Activity</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5">Loading activities...</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        // Add to container
        const div = document.createElement('div');
        div.innerHTML = tableHTML;
        container.appendChild(div);
        
        return div.querySelector('tbody');
    },
    
    // Create table row
    createTableRow: function(activity) {
        const row = document.createElement('tr');
        
        // Format time
        const time = new Date(activity.timestamp);
        const timeString = time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format amount
        let amountText = 'UGX 0';
        if (activity.amount > 0) {
            amountText = `UGX ${activity.amount.toLocaleString()}`;
        } else if (activity.amount < 0) {
            amountText = `-UGX ${Math.abs(activity.amount).toLocaleString()}`;
        }
        
        // Status class
        let statusClass = 'status-completed';
        if (activity.status === 'Paid') statusClass = 'status-active';
        if (activity.status === 'Pending') statusClass = 'status-pending';
        if (activity.status === 'Saved') statusClass = 'status-saved';
        
        // Calculate time remaining
        const now = Date.now();
        const expiry = activity.expiry || (new Date(activity.timestamp).getTime() + (24 * 60 * 60 * 1000));
        const hoursLeft = Math.max(0, Math.round((expiry - now) / (60 * 60 * 1000)));
        
        row.innerHTML = `
            <td>${timeString}</td>
            <td>${activity.task}</td>
            <td>${activity.activity}</td>
            <td>${amountText}</td>
            <td>
                <span class="${statusClass}">${activity.status}</span>
                <small style="display:block;font-size:10px;color:#666;">Expires in ${hoursLeft}h</small>
            </td>
        `;
        
        return row;
    },
    
    // Setup event listeners
    setupListeners: function() {
        console.log('🔧 Setting up 24-hour activity listeners');
        
        // TikTok
        this.setupButtonListener('claim', 'TikTok Task', 'Watched TikTok video', 1000, 'Paid');
        
        // YouTube
        this.setupButtonListener('claimYoutube', 'YouTube Task', 'Watched YouTube video', 1000, 'Paid');
        
        // Withdrawal
        this.setupFormListener('withdrawalForm', 'Withdrawal Request', 'Requested funds withdrawal', -59000, 'Pending');
        
        // Trivia
        this.setupFormListener('quizForm', 'Trivia Quiz', 'Completed daily trivia', 1500, 'Paid');
        
        // Settings
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.record('Account Settings', 'Updated account information', 0, 'Saved');
            });
        }
        
        // Activation
        const activateBtn = document.getElementById('activate');
        if (activateBtn) {
            activateBtn.addEventListener('click', function() {
                setTimeout(() => {
                    if (this.disabled || this.textContent.includes('Activated')) {
                        ActivityTracker24.record('Account Activation', 'Activated account', -20000, 'Completed');
                    }
                }, 1000);
            });
        }
        
        // Referral
        const copyBtn = document.getElementById('CopyLink');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                setTimeout(() => {
                    if (this.textContent.includes('Copied')) {
                        ActivityTracker24.record('Referral', 'Copied referral link', 0, 'Completed');
                    }
                }, 100);
            });
        }
    },
    
    // Setup button listener
    setupButtonListener: function(buttonId, task, activity, amount, status) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.log(`Button #${buttonId} not found`);
            return;
        }
        
        button.addEventListener('click', function() {
            setTimeout(() => {
                if (this.disabled || this.textContent.includes('Claimed')) {
                    ActivityTracker24.record(task, activity, amount, status);
                }
            }, 300);
        });
    },
    
    // Setup form listener
    setupFormListener: function(formId, task, activity, amount, status) {
        const form = document.getElementById(formId);
        if (!form) {
            console.log(`Form #${formId} not found`);
            return;
        }
        
        form.addEventListener('submit', function(e) {
            let finalAmount = amount;
            
            if (formId === 'withdrawalForm') {
                const amountInput = this.querySelector('input[type="number"]');
                if (amountInput) {
                    finalAmount = -parseFloat(amountInput.value);
                }
            }
            
            setTimeout(() => {
                ActivityTracker24.record(task, activity, finalAmount, status);
            }, 500);
        });
    },
    
    // Add test functions to window
    addTestFunctions: function() {
        window.test24hActivity = function() {
            const activity = ActivityTracker24.record(
                '24H Test',
                'Testing 24-hour persistence',
                5000,
                'Paid'
            );
            
            alert(`✅ 24-hour activity recorded!\nExpires in 24 hours.\nID: ${activity.id}`);
            
            // Show expiry time
            const expiry = new Date(activity.expiry);
            console.log('Activity expires at:', expiry.toLocaleString());
            console.log('User ID:', ActivityTracker24.getUserId());
        };
        
        window.showAllActivities = function() {
            const userId = ActivityTracker24.getUserId();
            const storageKey = `activities_${userId}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const activities = JSON.parse(stored);
                console.log(`📊 Activities for ${userId}:`, activities);
                
                // Show expiry info
                activities.forEach((act, i) => {
                    const expiry = new Date(act.expiry);
                    const now = new Date();
                    const hoursLeft = (act.expiry - Date.now()) / (60 * 60 * 1000);
                    console.log(`${i+1}. ${act.task} - Expires: ${expiry.toLocaleTimeString()} (${hoursLeft.toFixed(1)}h left)`);
                });
            } else {
                console.log('No activities stored');
            }
        };
        
        window.clear24hActivities = function() {
            const userId = ActivityTracker24.getUserId();
            const storageKey = `activities_${userId}`;
            localStorage.removeItem(storageKey);
            localStorage.removeItem('all_activities_24h');
            
            ActivityTracker24.loadAndDisplay();
            alert('🧹 All 24-hour activities cleared!');
        };
        
        window.checkExpiry = function() {
            const userId = ActivityTracker24.getUserId();
            const storageKey = `activities_${userId}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const activities = JSON.parse(stored);
                const now = Date.now();
                
                activities.forEach((act, i) => {
                    const expiry = act.expiry;
                    const expired = expiry < now;
                    const timeLeft = expired ? 'EXPIRED' : `${((expiry - now) / (60 * 60 * 1000)).toFixed(1)}h`;
                    
                    console.log(`${i+1}. ${act.task} - ${expired ? '❌' : '✅'} ${timeLeft}`);
                });
            }
        };
    }
};

    //DISPLAY PENDING WITHDRAWALS IN DASHBOARD FUNCTION
    // ========== FIXED PENDING WITHDRAWALS CALCULATOR ==========

// Calculate and display pending withdrawals for current user
async function calculatePendingWithdrawals(user) {
    try {
        console.log('💰 Calculating pending withdrawals for user:', user?.id);
        
        if (!user) {
            console.error('User object is required');
            updatePendingWithdrawalsDisplay(0);
            return 0;
        }

        // First, get the numeric user ID from users table using email or UUID
        const numericUserId = await getNumericUserId(user);
        
        if (!numericUserId) {
            console.error('Could not find numeric user ID');
            updatePendingWithdrawalsDisplay(0);
            return 0;
        }

        console.log('Using numeric user ID:', numericUserId);

        // Query withdrawal_requests table for pending withdrawals
        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('amount, status, id, created_at')
            .eq('id', numericUserId)  // Use NUMERIC ID here
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching pending withdrawals:', error);
            updatePendingWithdrawalsDisplay(0);
            return 0;
        }

        // Calculate total amount
        let totalPendingAmount = 0;
        let pendingCount = 0;
        
        if (data && data.length > 0) {
            data.forEach(withdrawal => {
                if (withdrawal.status === 'pending' && withdrawal.amount) {
                    totalPendingAmount += Number(withdrawal.amount);
                    pendingCount++;
                }
            });
        }

        console.log(`📊 Found ${pendingCount} pending withdrawals totaling UGX ${totalPendingAmount.toLocaleString()}`);

        // Update display
        updatePendingWithdrawalsDisplay(totalPendingAmount);
        
        // Return the total amount
        return totalPendingAmount;

    } catch (error) {
        console.error('Error in calculatePendingWithdrawals:', error);
        updatePendingWithdrawalsDisplay(0);
        return 0;
    }
}

// Get numeric user ID from users table using auth user info
async function getNumericUserId(authUser) {
    try {
        if (!authUser) return null;
        
        console.log('Looking up numeric ID for auth user:', authUser.email);
        
        // Try to find user by email (most reliable)
        const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('id')
            .eq('email_address', authUser.email)
            .maybeSingle();
        
        if (!emailError && userByEmail) {
            console.log('Found user by email:', userByEmail.id);
            return userByEmail.id;
        }
        
        // Try by UUID if available
        if (authUser.id) {
            const { data: userByUuid, error: uuidError } = await supabase
                .from('users')
                .select('id')
                .eq('uuid', authUser.id)
                .maybeSingle();
            
            if (!uuidError && userByUuid) {
                console.log('Found user by UUID:', userByUuid.id);
                return userByUuid.id;
            }
        }
        
        // Try by ID directly (might be already numeric)
        const { data: userById, error: idError } = await supabase
            .from('users')
            .select('id')
            .eq('id', authUser.id)
            .maybeSingle();
        
        if (!idError && userById) {
            console.log('Found user by ID:', userById.id);
            return userById.id;
        }
        
        console.error('Could not find numeric user ID');
        return null;
        
    } catch (error) {
        console.error('Error getting numeric user ID:', error);
        return null;
    }
}

// Update the display with pending withdrawals amount
function updatePendingWithdrawalsDisplay(amount) {
    // Find all elements that should show pending withdrawals
    const displayElements = [
        document.getElementById('pendingWithdrawals'),
        document.querySelector('[data-pending-withdrawals]'),
        document.querySelector('.stat-value#pendingWithdrawals')
    ];

    displayElements.forEach(element => {
        if (element) {
            // Format the amount with commas
            element.textContent = typeof amount === 'number' 
                ? amount.toLocaleString('en-US') 
                : '0';
            
            // Add tooltip
            element.title = `Total pending: UGX ${amount.toLocaleString()}`;
        }
    });

    // Also update in any other places that might show this
    const allPendingElements = document.querySelectorAll('#pendingWithdrawals, .pending-withdrawals');
    allPendingElements.forEach(el => {
        if (el && el.textContent !== amount.toLocaleString()) {
            el.textContent = amount.toLocaleString('en-US');
        }
    });
}

// Load pending withdrawals when user data is loaded
async function loadPendingWithdrawals(user) {
    if (!user) {
        console.error('User not available for pending withdrawals');
        return;
    }

    try {
        const pendingAmount = await calculatePendingWithdrawals(user);
        
        // Also update wallet balance display (subtract pending from available)
        await updateWalletBalanceWithPending(user, pendingAmount);
        
    } catch (error) {
        console.error('Error loading pending withdrawals:', error);
    }
}

// Update wallet balance considering pending withdrawals
async function updateWalletBalanceWithPending(user, pendingAmount) {
    try {
        // Get numeric user ID
        const numericUserId = await getNumericUserId(user);
        if (!numericUserId) return;
        
        // Get current earnings
        const { data: earnings, error } = await supabase
            .from('earnings')
            .select('all_time_earn, total_withdrawn')
            .eq('id', numericUserId)
            .maybeSingle();

        if (error) throw error;

        if (earnings) {
            const allTimeEarn = earnings.all_time_earn || 0;
            const totalWithdrawn = earnings.total_withdrawn || 0;
            
            // Calculate available balance (excluding pending withdrawals)
            const availableBalance = allTimeEarn - totalWithdrawn - pendingAmount;
            
            // Update wallet display
            const walletElement = document.getElementById('walletQash');
            if (walletElement) {
                walletElement.textContent = Math.max(0, availableBalance).toLocaleString('en-US');
                walletElement.title = `Available: UGX ${availableBalance.toLocaleString()}\n(Pending: UGX ${pendingAmount.toLocaleString()})`;
            }
        }
    } catch (error) {
        console.error('Error updating wallet balance:', error);
    }
}

// Refresh pending withdrawals (can be called manually)
async function refreshPendingWithdrawals() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            await calculatePendingWithdrawals(user);
            
            // Show notification if function exists
            if (typeof showNotification === 'function') {
                showNotification('Pending withdrawals refreshed', 'success');
            } else {
                console.log('Pending withdrawals refreshed');
            }
        }
    } catch (error) {
        console.error('Error refreshing pending withdrawals:', error);
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('Error refreshing pending withdrawals', 'error');
        }
    }
}

// ========== INTEGRATION WITH EXISTING CODE ==========

// Update your initializeFeatures function
async function initializeFeatures() {
    // ... existing code ...
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize features that require authentication
    await Promise.all([
        initializeNavigation(),
        initializeGreeting(),
        initializeUserData(user),
        initializeTasks(user),
        initializeTrivia(user),
        initializeSettings(user),
        initializeActivities(user),
        initializeActivation(user),
        initializeCopyLink(user),
        initializeChat(),
        initializeWithdrawal(user),
        initializeQuiz(),
        initializeRefreshButtons(),
        initializeExportButton(user),
        initializeDownlines(user),
        initializeStatistics(user),
        // FIXED: Pass user object instead of just ID
        loadPendingWithdrawals(user)
    ]);
    
    // Start real-time updates
    initializeRealtimeUpdates(user.id);
    
    // Also set up real-time updates for withdrawal requests
    initializeWithdrawalUpdates(user);
}

// Real-time updates for withdrawal status changes
function initializeWithdrawalUpdates(user) {
    if (!user) return;
    
    // We need to get numeric ID first
    getNumericUserId(user).then(numericUserId => {
        if (!numericUserId) return;
        
        const withdrawalChannel = supabase
            .channel('withdrawal_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'withdrawal_requests',
                    filter: `id=eq.${numericUserId}`
                },
                () => {
                    console.log('Withdrawal request changed, refreshing...');
                    calculatePendingWithdrawals(user);
                }
            )
            .subscribe();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            supabase.removeChannel(withdrawalChannel);
        });
    });
}

// ========== ADDITIONAL HELPER FUNCTIONS ==========

// Get detailed pending withdrawals info
async function getPendingWithdrawalsDetails(user) {
    try {
        const numericUserId = await getNumericUserId(user);
        if (!numericUserId) return [];
        
        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('id', numericUserId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error getting withdrawal details:', error);
        return [];
    }
}

// Display pending withdrawals in a table or list
async function displayPendingWithdrawalsList(user) {
    try {
        const pendingWithdrawals = await getPendingWithdrawalsDetails(user);
        
        if (pendingWithdrawals.length === 0) {
            return '<p>No pending withdrawals</p>';
        }
        
        let html = `
            <div class="pending-withdrawals-list">
                <h4>Pending Withdrawals (${pendingWithdrawals.length})</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        pendingWithdrawals.forEach(withdrawal => {
            const date = new Date(withdrawal.created_at).toLocaleDateString();
            html += `
                <tr>
                    <td>${date}</td>
                    <td>UGX ${Number(withdrawal.amount).toLocaleString()}</td>
                    <td>${withdrawal.payment_method || 'N/A'}</td>
                    <td><span class="status-pending">${withdrawal.status}</span></td>
                </tr>
            `;
        });
        
        const total = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
        html += `
                    </tbody>
                </table>
                <p><strong>Total Pending:</strong> UGX ${total.toLocaleString()}</p>
            </div>
        `;
        
        return html;
    } catch (error) {
        console.error('Error displaying withdrawals:', error);
        return '<p>Error loading pending withdrawals</p>';
    }
}

// ========== SAFE NOTIFICATION FUNCTION ==========
// Add this if showNotification doesn't exist

if (typeof showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a simple notification if needed
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    };
}

// ========== MANUAL REFRESH BUTTON ==========

function addPendingWithdrawalsRefreshButton() {
    // Check if button already exists
    if (document.getElementById('refreshPendingWithdrawals')) return;
    
    // Find a good place to add the button
    const pendingElement = document.getElementById('pendingWithdrawals');
    if (pendingElement && pendingElement.parentElement) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshPendingWithdrawals';
        refreshBtn.innerHTML = '↻';
        refreshBtn.title = 'Refresh pending withdrawals';
        refreshBtn.style.cssText = `
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 12px;
            margin-left: 5px;
            color: #3498db;
        `;
        
        refreshBtn.addEventListener('click', refreshPendingWithdrawals);
        
        pendingElement.parentElement.appendChild(refreshBtn);
    }
}

// ========== TEST FUNCTIONS ==========

window.testPendingWithdrawals = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const amount = await calculatePendingWithdrawals(user);
        console.log('✅ Pending withdrawals test:', amount);
        alert(`Pending withdrawals: UGX ${amount.toLocaleString()}`);
    } else {
        alert('Please log in first');
    }
};

window.showPendingDetails = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const details = await getPendingWithdrawalsDetails(user);
        console.log('📋 Pending details:', details);
        
        let message = `Found ${details.length} pending withdrawals:\n\n`;
        details.forEach((w, i) => {
            message += `${i+1}. UGX ${Number(w.amount).toLocaleString()} - ${w.payment_method || 'N/A'} - ${new Date(w.created_at).toLocaleDateString()}\n`;
        });
        
        alert(message);
    }
};

// ========== DEBUG FUNCTION ==========

window.debugUserIds = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('No auth user found');
        return;
    }
    
    console.log('=== USER ID DEBUG ===');
    console.log('Auth user ID (UUID):', user.id);
    console.log('Auth user email:', user.email);
    
    // Try to find numeric ID
    const numericId = await getNumericUserId(user);
    console.log('Numeric user ID:', numericId);
    
    // Test withdrawal query
    if (numericId) {
        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('id', numericId)
            .limit(1);
        
        console.log('Withdrawal test query:', error ? error.message : data);
    }
};

// ========== AUTO INITIALIZE ==========

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            addPendingWithdrawalsRefreshButton();
        }, 2000);
    });
}

// Export for manual calling
window.refreshPendingWithdrawals = refreshPendingWithdrawals;
window.calculatePendingWithdrawals = calculatePendingWithdrawals;

console.log('✅ Fixed pending withdrawals calculator loaded. Test with: testPendingWithdrawals()');
console.log('Debug with: debugUserIds()');

    //DISPLAY DOWNLINE INVITES AND RELATED LOGIC IN DOWNLINES TAB
    // ========== FINAL WORKING REFERRAL SYSTEM ==========
// For your CORRECTED schema

async function calculateReferralNetwork(user) {
    try {
        console.log('👥 Calculating referral network...');
        
        if (!user) {
            console.error('User object is required');
            updateReferralDisplay(0, 0, 0);
            return;
        }

        // Get numeric user ID
        const numericUserId = await getNumericUserId(user);
        if (!numericUserId) {
            console.error('Could not find numeric user ID');
            updateReferralDisplay(0, 0, 0);
            return;
        }

        console.log('Using numeric user ID:', numericUserId);

        // 1. Get Level 1 referrals (where user is the inviter)
        const { data: l1Referrals, error: l1Error } = await supabase
            .from('refferals')
            .select('referral_id, referred_id, created_at')
            .eq('inviter_id', numericUserId);
        
        if (l1Error) {
            console.error('Error fetching L1 referrals:', l1Error);
            // Continue anyway with empty array
        }

        // 2. Get Level 2 referrals (where user gets secondary benefit)
        const { data: l2Referrals, error: l2Error } = await supabase
            .from('refferals')
            .select('referral_id, referred_id, created_at')
            .eq('secondary_benefit', numericUserId);
        
        if (l2Error) {
            console.error('Error fetching L2 referrals:', l2Error);
        }

        console.log(`Found ${l1Referrals?.length || 0} L1 referrals and ${l2Referrals?.length || 0} L2 referrals`);

        // 3. Get all referred user IDs
        const allReferredIds = [];
        
        if (l1Referrals) {
            l1Referrals.forEach(ref => {
                if (ref.referred_id) allReferredIds.push(ref.referred_id);
            });
        }
        
        if (l2Referrals) {
            l2Referrals.forEach(ref => {
                if (ref.referred_id) allReferredIds.push(ref.referred_id);
            });
        }
        
        // Remove duplicates
        const uniqueReferredIds = [...new Set(allReferredIds)];
        
        console.log('Unique referred user IDs:', uniqueReferredIds);

        let referredUsers = [];
        
        // 4. Get user details for all referred users
        if (uniqueReferredIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, user_name, email_address, created_at, status')
                .in('id', uniqueReferredIds);
            
            if (usersError) {
                console.error('Error fetching referred users:', usersError);
            } else {
                referredUsers = usersData || [];
            }
        }

        // 5. Process downlines
        const downlines = [];
        
        // Process L1 referrals
        if (l1Referrals && referredUsers.length > 0) {
            l1Referrals.forEach(referral => {
                const referredUser = referredUsers.find(u => u.id === referral.referred_id);
                if (referredUser) {
                    downlines.push({
                        ...referredUser,
                        referral_id: referral.referral_id,
                        level: 1,
                        earnings: 7000,
                        referral_date: referral.created_at
                    });
                }
            });
        }
        
        // Process L2 referrals
        if (l2Referrals && referredUsers.length > 0) {
            l2Referrals.forEach(referral => {
                const referredUser = referredUsers.find(u => u.id === referral.referred_id);
                if (referredUser) {
                    downlines.push({
                        ...referredUser,
                        referral_id: referral.referral_id,
                        level: 2,
                        earnings: 4000,
                        referral_date: referral.created_at
                    });
                }
            });
        }

        // 6. Calculate totals
        const l1Count = downlines.filter(d => d.level === 1 && d.status === 'active').length;
        const l2Count = downlines.filter(d => d.level === 2 && d.status === 'active').length;
        const totalEarnings = (l1Count * 7000) + (l2Count * 4000);

        console.log(`Active referrals: ${l1Count} L1 + ${l2Count} L2 = UGX ${totalEarnings}`);

        // 7. Update display
        updateReferralDisplay(l1Count, l2Count, totalEarnings);
        
        // 8. Update earnings table
        await updateReferralEarnings(numericUserId, totalEarnings);
        
        // 9. Display downlines table
        displayDownlinesTable(downlines);

        return {
            success: true,
            l1Count: l1Count,
            l2Count: l2Count,
            totalEarnings: totalEarnings,
            downlines: downlines.length
        };

    } catch (error) {
        console.error('Error in calculateReferralNetwork:', error);
        updateReferralDisplay(0, 0, 0);
        return { success: false, error: error.message };
    }
}

// Helper: Get numeric user ID
async function getNumericUserId(user) {
    try {
        if (!user) return null;
        
        // Try by email (most reliable)
        const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('id')
            .eq('email_address', user.email)
            .maybeSingle();
        
        if (!emailError && userByEmail) {
            return userByEmail.id;
        }
        
        // Try by UUID
        if (user.id) {
            const { data: userByUuid, error: uuidError } = await supabase
                .from('users')
                .select('id')
                .eq('uuid', user.id)
                .maybeSingle();
            
            if (!uuidError && userByUuid) {
                return userByUuid.id;
            }
        }
        
        console.error('User not found in database');
        return null;
        
    } catch (error) {
        console.error('Error getting numeric ID:', error);
        return null;
    }
}

// Update display elements
function updateReferralDisplay(l1Count, l2Count, totalEarnings) {
    // L1 Users
    const l1Element = document.getElementById('l1Users');
    if (l1Element) {
        l1Element.textContent = l1Count.toString();
        l1Element.title = `${l1Count} direct referrals × UGX 8,000 = UGX ${(l1Count * 8000).toLocaleString()}`;
    }
    
    // L2 Users
    const l2Element = document.getElementById('l2Users');
    if (l2Element) {
        l2Element.textContent = l2Count.toString();
        l2Element.title = `${l2Count} secondary referrals × UGX 5,000 = UGX ${(l2Count * 5000).toLocaleString()}`;
    }
    
    // Total Referral Earnings
    const referralElement = document.getElementById('refferal');
    if (referralElement) {
        referralElement.textContent = totalEarnings.toLocaleString('en-US');
        referralElement.title = `Total referral earnings: UGX ${totalEarnings.toLocaleString()}`;
    }
    
    console.log(`✅ Display updated: L1=${l1Count}, L2=${l2Count}, Total=UGX ${totalEarnings}`);
}

// Update earnings table
async function updateReferralEarnings(userId, totalEarnings) {
    try {
        console.log(`💾 Updating referral earnings for user ${userId}: UGX ${totalEarnings}`);
        
        // Use upsert to create or update
        const { error } = await supabase
            .from('earnings')
            .upsert({
                id: userId,
                refferal: totalEarnings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            });
        
        if (error) {
            console.error('Error updating earnings:', error);
        } else {
            console.log('✅ Earnings updated successfully');
        }
        
    } catch (error) {
        console.error('Error in updateReferralEarnings:', error);
    }
}

// Display downlines in table
function displayDownlinesTable(downlines) {
    const tbody = document.querySelector('#downlines-table tbody');
    if (!tbody) {
        console.error('Downlines table body not found');
        return;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    if (!downlines || downlines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">No referrals yet. Share your referral link to earn rewards!</td>
            </tr>
        `;
        return;
    }

    // Sort: L1 first, then L2, then by date (newest first)
    downlines.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return new Date(b.referral_date || b.created_at) - new Date(a.referral_date || a.created_at);
    });

    // Add each downline
    downlines.forEach(downline => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(downline.referral_date || downline.created_at);
        const dateString = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Status
        const statusClass = downline.status === 'active' ? 'status-active' : 'status-pending';
        const statusText = downline.status === 'active' ? 'Active' : 'Pending';

        row.innerHTML = `
            <td>${downline.user_name || 'Unknown'}</td>
            <td>${downline.email_address || 'No email'}</td>
            <td>${dateString}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${downline.level}</td>
            <td>UGX ${downline.earnings.toLocaleString()}</td>
        `;
        
        tbody.appendChild(row);
    });

    console.log(`✅ Displayed ${downlines.length} downlines in table`);
}

// ========== TEST FUNCTIONS ==========

window.testReferralCalculation = async function() {
    console.log('🧪 Testing referral calculation...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Please log in first');
        return;
    }
    
    const result = await calculateReferralNetwork(user);
    
    if (result.success) {
        alert(`✅ Referral Calculation Successful!\n\n` +
              `Level 1 Referrals: ${result.l1Count}\n` +
              `Level 2 Referrals: ${result.l2Count}\n` +
              `Total Earnings: UGX ${result.totalEarnings.toLocaleString()}\n` +
              `Total Downlines: ${result.downlines}`);
    } else {
        alert(`❌ Error: ${result.error}`);
    }
};

window.debugReferralData = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const numericId = await getNumericUserId(user);
    console.log('=== REFERRAL DEBUG ===');
    console.log('User numeric ID:', numericId);
    
    // Check referrals table
    const { data: allReferrals } = await supabase
        .from('refferals')
        .select('*')
        .limit(10);
    
    console.log('Sample referrals:', allReferrals);
    
    // Check user's referrals
    if (numericId) {
        const { data: userReferrals } = await supabase
            .from('refferals')
            .select('*')
            .or(`inviter_id.eq.${numericId},secondary_benefit.eq.${numericId}`);
        
        console.log('User referrals:', userReferrals);
    }
};

// ========== REAL-TIME UPDATES ==========

function setupReferralRealtimeUpdates(user) {
    if (!user) return;
    
    getNumericUserId(user).then(numericUserId => {
        if (!numericUserId) return;
        
        // Watch for new referrals
        const channel = supabase
            .channel('referral-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'refferals',
                    filter: `inviter_id=eq.${numericUserId}`
                },
                () => {
                    console.log('New L1 referral detected, refreshing...');
                    calculateReferralNetwork(user);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'refferals',
                    filter: `secondary_benefit=eq.${numericUserId}`
                },
                () => {
                    console.log('New L2 referral detected, refreshing...');
                    calculateReferralNetwork(user);
                }
            )
            .subscribe();
        
        // Cleanup
        window.addEventListener('beforeunload', () => {
            supabase.removeChannel(channel);
        });
    });
}

// ========== MAIN INITIALIZATION ==========

async function initializeReferralSystem() {
    console.log('🚀 Initializing referral system...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('No authenticated user');
        return;
    }
    
    // Calculate and display referrals
    await calculateReferralNetwork(user);
    
    // Setup real-time updates
    setupReferralRealtimeUpdates(user);
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-downlines');
    if (refreshBtn && !refreshBtn.dataset.listenerAdded) {
        refreshBtn.dataset.listenerAdded = 'true';
        refreshBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.textContent = 'Refreshing...';
            
            await calculateReferralNetwork(user);
            
            setTimeout(() => {
                this.disabled = false;
                this.textContent = 'Refresh';
            }, 1000);
        });
    }
    
    console.log('✅ Referral system initialized');
}

// ========== CSS ==========

const styles = `
    .status-active {
        background-color: #2ecc71;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
    }
    
    .status-pending {
        background-color: #f39c12;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
    }
    
    #refresh-downlines {
        transition: all 0.3s ease;
    }
    
    #refresh-downlines:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// Add styles
if (!document.querySelector('#referral-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'referral-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}

// ========== AUTO START ==========

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeReferralSystem, 2000);
    });
} else {
    setTimeout(initializeReferralSystem, 2000);
}

console.log('✅ Referral system loaded. Test with: testReferralCalculation()');

    
    
// ========== START THE TRACKER ==========
// Start after page loads

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Store current user ID for persistence
        if (window.currentUser) {
            localStorage.setItem('current_user_id', window.currentUser.id);
        } else if (window.userData?.authUser?.id) {
            localStorage.setItem('current_user_id', window.userData.authUser.id);
        }
        
        // Initialize tracker
        ActivityTracker24.init();
        
        // Also add to window for testing
        window.ActivityTracker24 = ActivityTracker24;
        
        console.log('⏰ 24-Hour tracker loaded. Test with: test24hActivity()');
        
    }, 2000);
});

// ========== CSS FOR STATUS BADGES ==========
// Add this CSS if not already present

if (!document.querySelector('#activity-24h-styles')) {
    const style = document.createElement('style');
    style.id = 'activity-24h-styles';
    style.textContent = `
        .status-active {
            background: #2ecc71;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        .status-pending {
            background: #f39c12;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        .status-completed {
            background: #3498db;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        .status-saved {
            background: #9b59b6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        
        /* Highlight expiring activities */
        tr.expiring-soon {
            background-color: #fff9e6;
        }
        tr.expired {
            opacity: 0.6;
            background-color: #f9f9f9;
        }
    `;
    document.head.appendChild(style);
}

// ========== INTEGRATION WITH YOUR CODE ==========
// In your initializeFeatures function:

async function initializeFeatures() {
    // ... existing code ...
    
    // Initialize features that require authentication
    await Promise.all([
        // ... your existing initializations ...
    ]);
    
    // Store user ID for activity tracking
    if (user && user.id) {
        localStorage.setItem('current_user_id', user.id);
    }
    
    // Start real-time updates
    initializeRealtimeUpdates(user.id);
}
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .status-active {
            background-color: #2ecc71;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        
        .status-not-active {
            background-color: #e74c3c;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
        
        .status-pending {
            background-color: #f39c12;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
         .status-completed {
        background-color: #3498db;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
        }
    
        .status-viewed {
            background-color: #9b59b6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
    
    // Start initialization
    setTimeout(initDashboard, 1000);
})();