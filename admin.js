
// DOM Elements
const navLinks = document.getElementById('navLinks');
const menuIcon = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const sections = document.querySelectorAll('.admin-section');
const menuItems = document.querySelectorAll('menu a[data-section]');
const logoutBtn = document.getElementById('logout');
const copyLinkBtn = document.getElementById('CopyLink');
const linkInput = document.getElementById('link');
const quizForm = document.getElementById('quizForm');
const greetingElement = document.getElementById('greetings');

// Toggle mobile menu
function toggleMenu() {
    menuIcon.classList.toggle('active');
    sideMenu.classList.toggle('active');

    // Toggle body overflow when menu is open
    if (sideMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (sideMenu.classList.contains('active') &&
        !e.target.closest('#sideMenu') &&
        !e.target.closest('#menuToggle')) {
        toggleMenu();
    }
});

// Set active section
function setActiveSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        }
    });

    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
}

// Navigation click handler
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        setActiveSection(sectionId);

        // Close mobile menu if open
        if (sideMenu.classList.contains('active')) {
            toggleMenu();
        }
    });
});

// Logout handler
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('confirmation-message').textContent = 'Please Click \"Confirm\" to Logout or \"x\" to return to site';
    document.getElementById('confirm-action').textContent = 'Confirm';
    document.getElementById('confirmation-modal').style.display = 'flex';
});

// Confirm action handler
document.getElementById('confirm-action').addEventListener('click', () => {
    const action = document.getElementById('confirm-action').textContent;
    if (action === 'Logout') {
        alert('You have been logged out. Redirecting to login page...');
        // In a real app, you would redirect to login page
    }
    document.getElementById('confirmation-modal').style.display = 'none';
});

// Close modal handlers
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('confirmation-modal').style.display = 'none';
    });
});

// Copy referral link
copyLinkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    linkInput.select();
    document.execCommand('copy');
    alert('Referral link copied to clipboard!');
});

// Quiz form submission
quizForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Correct answers
    const answers = {
        q1: "c",
        q2: "b",
        q3: "c",
        q4: "b",
        q5: "b"
    };

    let score = 0;
    let totalQuestions = Object.keys(answers).length;

    // Check each question
    for (let i = 1; i <= totalQuestions; i++) {
        const questionName = "q" + i;
        const selectedOption = document.querySelector(`input[name="${questionName}"]:checked`);

        if (selectedOption && selectedOption.value === answers[questionName]) {
            score++;
        }
    }

    // Calculate earnings
    let earnings = 0;
    if (score >= 4) {
        earnings = 2.00;
    } else if (score >= 2) {
        earnings = 1.00;
    }

    // Show results
    if (earnings > 0) {
        alert(`You scored ${score} out of ${totalQuestions}! You've earned $${earnings.toFixed(2)}.`);
    } else {
        alert(`You scored ${score} out of ${totalQuestions}. Try again tomorrow for another chance to earn!`);
    }
});

// Set greeting based on time of day
function setGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    greetingElement.textContent = greeting;
}

// Claim reward buttons
document.addEventListener('click', (e) => {
    if (e.target.id === 'claim') {
        e.preventDefault();
        const card = e.target.closest('.vidSection');
        const rewardText = card.querySelector('.rightInfo h6').textContent;
        const reward = rewardText.match(/\$\d+(\.\d+)?/)[0];

        document.getElementById('confirmation-message').textContent = `Claim ${reward} reward for this task?`;
        document.getElementById('confirm-action').textContent = 'Claim';
        document.getElementById('confirmation-modal').style.display = 'flex';

        // Store the reward amount in the confirm button for later use
        document.getElementById('confirm-action').dataset.reward = reward;
    }
});

// Handle reward claiming confirmation
document.getElementById('confirm-action').addEventListener('click', (e) => {
    if (e.target.textContent === 'Claim') {
        const reward = e.target.dataset.reward;
        alert(`Success! ${reward} has been added to your balance.`);
        document.getElementById('confirmation-modal').style.display = 'none';

        // In a real app, you would update the user's balance via API
    }
});

// Initialize the page
function init() {
    setGreeting();
    setActiveSection('dashboard');

    // Set up event listeners for task buttons
    document.querySelectorAll('#claim, #share, #like, #comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id !== 'claim') {
                alert(`This will open ${e.target.id} functionality in a real app`);
            }
        });
    });

    // Set up refresh buttons
    document.getElementById('refresh-tiktok').addEventListener('click', () => {
        alert('Refreshing TikTok tasks...');
        // In a real app, you would fetch new tasks from the server
    });

    document.getElementById('refresh-youtube').addEventListener('click', () => {
        alert('Refreshing YouTube tasks...');
        // In a real app, you would fetch new tasks from the server
    });

    document.getElementById('refresh-downlines').addEventListener('click', () => {
        alert('Refreshing downlines list...');
        // In a real app, you would fetch updated referral data
    });

    // Set up withdrawal form
    document.getElementById('withdrawalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = e.target.querySelector('input[type="number"]').value;
        const method = e.target.querySelector('select').value;
        alert(`Withdrawal request for $${amount} via ${method} has been submitted.`);
    });
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);





document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const claimBtn = document.getElementById('claim');
    const replayBtn = document.getElementById('replay');
    const shareBtn = document.getElementById('share');
    const likeBtn = document.getElementById('like');
    const commentBtn = document.getElementById('comment');
    const postContainer = document.querySelector('.post-container'); // Add this container in your HTML

    // State
    let isLiked = false;
    let likeCount = 0;
    let comments = [];

    // Initialize from localStorage
    if (localStorage.getItem('postData')) {
        const savedData = JSON.parse(localStorage.getItem('postData'));
        isLiked = savedData.isLiked;
        likeCount = savedData.likeCount;
        comments = savedData.comments || [];
        updateLikeButton();
        renderComments();
    }

    // Claim Reward Functionality
    claimBtn.addEventListener('click', function () {
        alert('Reward claimed successfully! $0.50 has been added to your balance.');
        // Add to activities if you're using the previous tracking system
        if (window.addActivity) {
            addActivity('Reward Claim', 'Completed', 0.50);
        }
    });

    // View Profile Functionality
    replayBtn.addEventListener('click', function () {
        window.location.href = '/profile'; // Update with your actual profile URL
    });

    // Like Functionality
    likeBtn.addEventListener('click', function () {
        isLiked = !isLiked;
        likeCount += isLiked ? 1 : -1;
        updateLikeButton();
        saveToLocalStorage();
    });

    function updateLikeButton() {
        likeBtn.innerHTML = isLiked ?
            `<i class="fas fa-heart"></i> Liked (${likeCount})` :
            `<i class="far fa-heart"></i> Like (${likeCount})`;
    }

    // Comment Functionality
    commentBtn.addEventListener('click', function () {
        const commentText = prompt('Enter your comment:');
        if (commentText && commentText.trim() !== '') {
            const newComment = {
                id: Date.now(),
                text: commentText,
                timestamp: new Date().toISOString(),
                author: 'You' // Replace with actual username
            };
            comments.unshift(newComment);
            renderComments();
            saveToLocalStorage();
        }
    });

    function renderComments() {
        const commentsSection = document.getElementById('comments-section') || createCommentsSection();
        commentsSection.innerHTML = '';

        if (comments.length === 0) {
            commentsSection.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
        <div class="comment-header">
          <strong>${comment.author}</strong>
          <span>${formatCommentDate(comment.timestamp)}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-actions">
          <button class="reply-btn" data-comment-id="${comment.id}">Reply</button>
        </div>
      `;
            commentsSection.appendChild(commentElement);
        });
    }

    function createCommentsSection() {
        const section = document.createElement('div');
        section.id = 'comments-section';
        section.className = 'comments-section';
        postContainer.appendChild(section);
        return section;
    }

    function formatCommentDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
        });
    }

    // Share Functionality
    shareBtn.addEventListener('click', function () {
        if (navigator.share) {
            navigator.share({
                title: 'Check this out!',
                text: 'From GreenQash',
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare();
            });
        } else {
            fallbackShare();
        }
    });

    function fallbackShare() {
        const shareUrl = `${window.location.href}?shared=true`;
        prompt('Copy this link to share:', shareUrl);

        // Track share activity
        if (window.addActivity) {
            addActivity('Post Shared', 'Completed', 0.25);
        }
    }

    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('postData', JSON.stringify({
            isLiked,
            likeCount,
            comments
        }));
    }

    // Event delegation for comment replies
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('reply-btn')) {
            const commentId = parseInt(e.target.dataset.commentId);
            const parentComment = comments.find(c => c.id === commentId);
            if (parentComment) {
                const replyText = prompt(`Reply to "${parentComment.text.substring(0, 30)}..."`);
                if (replyText && replyText.trim() !== '') {
                    const newReply = {
                        id: Date.now(),
                        text: replyText,
                        timestamp: new Date().toISOString(),
                        author: 'You',
                        parentId: commentId
                    };
                    comments.splice(comments.findIndex(c => c.id === commentId) + 1, 0, newReply);
                    renderComments();
                    saveToLocalStorage();
                }
            }
        }
    });
});





document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const tableBody = document.querySelector('table tbody');
    const activitySelect = document.getElementById('activity-type'); // If you have a dropdown
    const activityForm = document.getElementById('activity-form'); // If you have a form

    // Initialize activities from localStorage or create sample data
    let activities = JSON.parse(localStorage.getItem('userActivities')) || [
        {
            timestamp: new Date().getTime(),
            type: "TikTok Like",
            status: "Completed",
            amount: 0.50,
            paymentStatus: "Paid"
        }
    ];

    // Activity Types Configuration
    const activityConfig = {
        "TikTok Like": { status: "Completed", amount: 0.50 },
        "Youtube View": { status: "Completed", amount: 1.20 },
        "Trivia Quiz": { status: "8/10 Correct", amount: 2.00 },
        "Referral Bonus": { status: "New signup", amount: 5.00 },
        "Facebook Share": { status: "Completed", amount: 0.75 }
    };

    // Format date for display
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return "Yesterday";
        return `${diffDays} days ago`;
    }

    // Add new activity
    function addActivity(type, customStatus, customAmount) {
        const config = activityConfig[type] || {
            status: customStatus || "Completed",
            amount: customAmount || 0
        };

        const newActivity = {
            timestamp: new Date().getTime(),
            type: type,
            status: config.status,
            amount: config.amount,
            paymentStatus: "Paid" // Could be "Pending" for some activities
        };

        activities.unshift(newActivity);
        if (activities.length > 50) activities.pop(); // Keep only last 50 activities
        localStorage.setItem('userActivities', JSON.stringify(activities));
        renderActivities();
    }

    // Render all activities
    function renderActivities() {
        tableBody.innerHTML = '';

        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${formatDate(activity.timestamp)}</td>
        <td>${activity.type}</td>
        <td>${activity.status}</td>
        <td>$${activity.amount.toFixed(2)}</td>
        <td><span class="status-${activity.paymentStatus.toLowerCase()}">${activity.paymentStatus}</span></td>
      `;
            tableBody.appendChild(row);
        });
    }

    // Form submission handler (if you have a form)
    if (activityForm) {
        activityForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const type = activitySelect.value;
            addActivity(type);
            this.reset();
        });
    }

    // Track actual user events (example for TikTok Like button)
    document.querySelectorAll('[data-activity]').forEach(button => {
        button.addEventListener('click', function () {
            const activityType = this.dataset.activity;
            addActivity(activityType);
        });
    });

    // Initialize
    renderActivities();

    // Daily summary (optional)
    function generateDailySummary() {
        const today = new Date().toDateString();
        const todayActivities = activities.filter(act =>
            new Date(act.timestamp).toDateString() === today
        );
        const dailyEarnings = todayActivities.reduce((sum, act) => sum + act.amount, 0);

        console.log(`Today's activities: ${todayActivities.length}`);
        console.log(`Daily earnings: $${dailyEarnings.toFixed(2)}`);
    }

    // Run daily summary every hour
    setInterval(generateDailySummary, 3600000);
});




document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const claimBtn = document.getElementById('claim');
    const replayBtn = document.getElementById('replay');
    const shareBtn = document.getElementById('share');
    const likeBtn = document.getElementById('like');
    const commentBtn = document.getElementById('comment');
    const postContainer = document.querySelector('.post-container'); // Add this container in your HTML

    // State
    let isLiked = false;
    let likeCount = 0;
    let comments = [];

    // Initialize from localStorage
    if (localStorage.getItem('postData')) {
        const savedData = JSON.parse(localStorage.getItem('postData'));
        isLiked = savedData.isLiked;
        likeCount = savedData.likeCount;
        comments = savedData.comments || [];
        updateLikeButton();
        renderComments();
    }

    // Claim Reward Functionality
    claimBtn.addEventListener('click', function () {
        alert('Reward claimed successfully! $0.50 has been added to your balance.');
        // Add to activities if you're using the previous tracking system
        if (window.addActivity) {
            addActivity('Reward Claim', 'Completed', 0.50);
        }
    });

    // View Profile Functionality
    replayBtn.addEventListener('click', function () {
        window.location.href = '/profile'; // Update with your actual profile URL
    });

    // Like Functionality
    likeBtn.addEventListener('click', function () {
        isLiked = !isLiked;
        likeCount += isLiked ? 1 : -1;
        updateLikeButton();
        saveToLocalStorage();
    });

    function updateLikeButton() {
        likeBtn.innerHTML = isLiked ?
            `<i class="fas fa-heart"></i> Liked (${likeCount})` :
            `<i class="far fa-heart"></i> Like (${likeCount})`;
    }

    // Comment Functionality
    commentBtn.addEventListener('click', function () {
        const commentText = prompt('Enter your comment:');
        if (commentText && commentText.trim() !== '') {
            const newComment = {
                id: Date.now(),
                text: commentText,
                timestamp: new Date().toISOString(),
                author: 'You' // Replace with actual username
            };
            comments.unshift(newComment);
            renderComments();
            saveToLocalStorage();
        }
    });

    function renderComments() {
        const commentsSection = document.getElementById('comments-section') || createCommentsSection();
        commentsSection.innerHTML = '';

        if (comments.length === 0) {
            commentsSection.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
        <div class="comment-header">
          <strong>${comment.author}</strong>
          <span>${formatCommentDate(comment.timestamp)}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-actions">
          <button class="reply-btn" data-comment-id="${comment.id}">Reply</button>
        </div>
      `;
            commentsSection.appendChild(commentElement);
        });
    }

    function createCommentsSection() {
        const section = document.createElement('div');
        section.id = 'comments-section';
        section.className = 'comments-section';
        postContainer.appendChild(section);
        return section;
    }

    function formatCommentDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
        });
    }

    // Share Functionality
    shareBtn.addEventListener('click', function () {
        if (navigator.share) {
            navigator.share({
                title: 'Check this out!',
                text: 'I found this interesting post on this platform',
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare();
            });
        } else {
            fallbackShare();
        }
    });

    function fallbackShare() {
        const shareUrl = `${window.location.href}?shared=true`;
        prompt('Copy this link to share:', shareUrl);

        // Track share activity
        if (window.addActivity) {
            addActivity('Post Shared', 'Completed', 0.25);
        }
    }

    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('postData', JSON.stringify({
            isLiked,
            likeCount,
            comments
        }));
    }

    // Event delegation for comment replies
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('reply-btn')) {
            const commentId = parseInt(e.target.dataset.commentId);
            const parentComment = comments.find(c => c.id === commentId);
            if (parentComment) {
                const replyText = prompt(`Reply to "${parentComment.text.substring(0, 30)}..."`);
                if (replyText && replyText.trim() !== '') {
                    const newReply = {
                        id: Date.now(),
                        text: replyText,
                        timestamp: new Date().toISOString(),
                        author: 'You',
                        parentId: commentId
                    };
                    comments.splice(comments.findIndex(c => c.id === commentId) + 1, 0, newReply);
                    renderComments();
                    saveToLocalStorage();
                }
            }
        }
    });
});
