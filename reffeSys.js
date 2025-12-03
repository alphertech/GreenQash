document.addEventListener('DOMContentLoaded', function () {
    console.log('reffeSys.js loaded');
    // Debug: check element existence
    console.log('CopyLink:', document.getElementById('CopyLink'));
    console.log('link:', document.getElementById('link'));
    console.log('notification:', document.getElementById('notification'));
    // Supabase setup (from auth.js, assumes CDN script is loaded in HTML)
    const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8';
    // Fix: Use global createClient, not window.createClient
    let supabase;
    if (window.supabase) {
        supabase = window.supabase;
    } else if (typeof createClient === 'function') {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        console.error('Supabase client not found. Make sure the CDN script is loaded before reffeSys.js.');
    }

    // Registration logic removed: no registerForm in HTML
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
        linkInput.value = `https://alphertech.github.io/greenqash.com/ref/${inviterUsername}`;
    }

    // Function to copy link to clipboard
    function copyToClipboard() {
        if (!linkInput || !copyButton) return;
        linkInput.focus();
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        if (navigator.clipboard) {
            navigator.clipboard.writeText(linkInput.value)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied');
                    if (notification) notification.classList.add('show');
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Link';
                        copyButton.classList.remove('copied');
                        if (notification) notification.classList.remove('show');
                    }, 2000);
                })
                .catch(err => {
                    // Fallback to execCommand
                    try {
                        document.execCommand('copy');
                        copyButton.textContent = 'Copied!';
                        copyButton.classList.add('copied');
                        if (notification) notification.classList.add('show');
                        setTimeout(() => {
                            copyButton.textContent = 'Copy Link';
                            copyButton.classList.remove('copied');
                            if (notification) notification.classList.remove('show');
                        }, 2000);
                    } catch (fallbackErr) {
                        console.error('Fallback copy failed:', fallbackErr);
                        if (notification) {
                            notification.textContent = 'Failed to copy link.';
                            notification.classList.add('show');
                        }
                        alert('Failed to copy link. Please try again.');
                    }
                });
        } else {
            // Fallback for older browsers
            try {
                document.execCommand('copy');
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                if (notification) notification.classList.add('show');
                setTimeout(() => {
                    copyButton.textContent = 'Copy Link';
                    copyButton.classList.remove('copied');
                    if (notification) notification.classList.remove('show');
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
                if (notification) {
                    notification.textContent = 'Failed to copy link.';
                    notification.classList.add('show');
                }
                alert('Failed to copy link. Please try again.');
            }
        }
    }

    if (copyButton) {
        console.log('Attaching click event to CopyLink button');
        copyButton.addEventListener('click', copyToClipboard);
    }
    if (linkInput) {
        console.log('Attaching click event to link input');
        linkInput.addEventListener('click', function () {
            this.select();
        });
    }
});
