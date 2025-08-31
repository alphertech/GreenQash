// Supabase credentials from auth.js
const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8';
const supabase = createClient(supabaseUrl, supabaseKey);
// Automatically reward inviter when referred user's status changes to true
function setupReferralStatusListener() {
    supabase
        .channel('referral-status-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
        }, async (payload) => {
            if (payload.new.status === true && payload.old.status !== true) {
                await rewardInviterOnReferralStatusTrue(payload.new.username);
            }
        })
        .subscribe();
}

// Call this on app startup
setupReferralStatusListener();
// Call this function after a referred user's status changes to true
async function rewardInviterOnReferralStatusTrue(referredUsername) {
    try {
        // Get the referred user's profile to find inviter1
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('inviter1')
            .eq('username', referredUsername)
            .single();
        if (fetchError || !profile || !profile.inviter1) return;
        const inviterUsername = profile.inviter1;

        // Get current refferals value from user_stats
        const { data: stats, error: statsError } = await supabase
            .from('user_stats')
            .select('refferals')
            .eq('username', inviterUsername)
            .single();
        if (statsError || !stats) return;
        const newRefferals = (stats.refferals || 0) + 8000;

        // Update inviter's refferals value
        await supabase
            .from('user_stats')
            .update({ refferals: newRefferals })
            .eq('username', inviterUsername);
    } catch (error) {
        console.error('Error rewarding inviter:', error);
    }
}
// referral.js - Referral System for GreenQash
// This works with your existing auth.js file

// Extract referral code from URL
function getReferralCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// Store referral code in session storage
function storeReferralCode() {
    const refCode = getReferralCodeFromURL();
    if (refCode) {
        sessionStorage.setItem('referralCode', refCode);
        console.log('Referral code detected:', refCode);
    }
}

// Process referral during registration
async function processReferralOnRegistration(userId, username) {
    try {
        const refCode = sessionStorage.getItem('referralCode');
        if (!refCode) return null;

        let inviter1 = refCode;
        let inviter2 = null;

        // Get the inviter1's profile to find inviter2
        const { data: inviterProfile, error: inviterError } = await supabase
            .from('profiles')
            .select('inviter1')
            .eq('username', inviter1)
            .single();

        if (!inviterError && inviterProfile && inviterProfile.inviter1) {
            inviter2 = inviterProfile.inviter1;
        }

        // Update the new user's profile with referral information
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                inviter1: inviter1,
                inviter2: inviter2
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Update referral counts
        if (inviter1) {
            await updateReferralCount(inviter1, 'primary');
        }

        if (inviter2) {
            await updateReferralCount(inviter2, 'secondary');
        }

        // Clear the referral code from storage
        sessionStorage.removeItem('referralCode');

        return { inviter1, inviter2 };
    } catch (error) {
        console.error('Error processing referral:', error);
        return null;
    }
}

// Update referral count for a user
async function updateReferralCount(username, type) {
    try {
        const columnName = type === 'primary' ? 'primary_referrals' : 'secondary_referrals';

        // First get the current count
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select(columnName)
            .eq('username', username)
            .single();

        if (fetchError) throw fetchError;

        // Increment the count
        const newCount = (profile[columnName] || 0) + 1;

        // Update the profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ [columnName]: newCount })
            .eq('username', username);

        if (updateError) throw updateError;

        return newCount;
    } catch (error) {
        console.error(`Error updating ${type} referral count:`, error);
        throw error;
    }
}

// Generate referral link for a user
function generateReferralLink(username) {
    return `https://greenqash.com/ref/${username}`;
}

// Copy referral link to clipboard
function setupReferralLinkCopy() {
    const copyButton = document.getElementById('CopyLink');
    if (!copyButton) return;

    copyButton.addEventListener('click', function (e) {
        e.preventDefault();

        const refInput = document.getElementById('link');
        if (!refInput) return;

        refInput.select();
        document.execCommand('copy');

        // Provide user feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';

        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    });
}

// Modify the existing registration function to include referral processing
async function handleRegistrationWithReferral(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true);
        return;
    }

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Get referral code if present
        let inviter1 = null;
        if (sessionStorage.getItem('referralCode')) {
            inviter1 = sessionStorage.getItem('referralCode');
        }

        // Insert user profile into profiles table, including inviter1 if present
        const { error: profError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                username: username,
                phone: phone,
                email_address: email,
                inviter1: inviter1 || null
            });

        if (profError) throw profError;

        // Process referral if exists
        const referralResult = await processReferralOnRegistration(authData.user.id, username);

        if (referralResult) {
            showNotification(`Account created! You were referred by ${referralResult.inviter1}.`);
        } else {
            showNotification('Account created successfully!');
        }

        registerForm.reset();
        toggleForms('login');

    } catch (error) {
        showNotification('Registration failed: ' + error.message, true);
    }
}

// Initialize referral system
function initReferralSystem() {
    // Store referral code from URL if present
    storeReferralCode();

    // Set up referral link copy functionality
    setupReferralLinkCopy();

    // Replace the original registration handler with our enhanced version
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.removeEventListener('submit', handleRegistration);
        registerForm.addEventListener('submit', handleRegistrationWithReferral);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Wait for auth.js to initialize, then init our referral system
    setTimeout(initReferralSystem, 100);
});

// If you want to make the user's referral link available in the UI
function updateUserReferralLink(username) {
    const refInput = document.getElementById('link');
    if (refInput) {
        refInput.value = generateReferralLink(username);
    }
}

// Export functions if needed
export {
    getReferralCodeFromURL,
    storeReferralCode,
    processReferralOnRegistration,
    generateReferralLink,
    setupReferralLinkCopy,
    initReferralSystem
};