document.addEventListener('DOMContentLoaded', function () {
    // Supabase setup (from auth.js, assumes CDN script is loaded in HTML)
    const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8';
    const supabase = window.supabase ? window.supabase : window.createClient(supabaseUrl, supabaseKey);

    // Check for inviter in URL and attach to new user profile
    async function attachInviterToProfileOnJoin() {
        // Parse inviter from URL (invite link: https://greenqash.com/ref/{inviter})
        const urlParams = window.location.pathname.split('/');
        let inviter = '';
        if (urlParams.length >= 3 && urlParams[1] === 'ref') {
            inviter = urlParams[2];
        }
        // Only run if inviter is present and user is registering
        if (inviter) {
            // Listen for registration form submit (assume form id='registerForm')
            const regForm = document.getElementById('registerForm');
            if (regForm) {
                regForm.addEventListener('submit', async function (e) {
                    // After registration, update profiles table with inviter1
                    // Assume username/email input fields exist
                    const username = document.getElementById('registerUsername')?.value;
                    if (username) {
                        // Update profiles table for this user
                        await supabase
                            .from('profiles')
                            .update({ inviter1: inviter })
                            .eq('username', username);
                    }
                });
            }
        }
    }
    attachInviterToProfileOnJoin();
    const copyButton = document.getElementById('CopyLink');
    const linkInput = document.getElementById('link');
    const notification = document.getElementById('notification');
    // Get inviter's username from #username00 (input or text)
    let inviterUsername = '';
    const usernameElem = document.getElementById('username00');
    if (usernameElem) {
        if (usernameElem.tagName === 'INPUT') {
            inviterUsername = usernameElem.value;
        } else {
            inviterUsername = usernameElem.textContent.trim();
        }
    }
    // Set referral link value to include inviter's username
    if (linkInput && inviterUsername) {
        linkInput.value = `https://greenqash.com/ref/${inviterUsername}`;
    }

    // Function to copy link to clipboard
    function copyToClipboard() {
        // Select the text field
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices

        // Copy the text inside the text field
        navigator.clipboard.writeText(linkInput.value)
            .then(() => {
                // Show success feedback
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');

                // Show notification
                notification.classList.add('show');

                // Reset button after 2 seconds
                setTimeout(() => {
                    copyButton.textContent = 'Copy Link';
                    copyButton.classList.remove('copied');
                    notification.classList.remove('show');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy link. Please try again.');
            });
    }

    // Add click event to the copy button
    copyButton.addEventListener('click', copyToClipboard);

    // Bonus: Allow clicking on the input to select all text
    linkInput.addEventListener('click', function () {
        this.select();
    });
});
