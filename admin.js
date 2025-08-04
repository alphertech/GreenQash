//declarations
const allUsersElement = document.getElementById("allUsers");
const youtubeElement = document.getElementById("online");
const tiktokElement = document.getElementById("allfalse");
const triviaEarnElement = document.getElementById("triviaEarn");
const refferalsElement = document.getElementById("reff");
const bonusElement = document.getElementById("bonus");
const trixElement = document.getElementById("trix");
const share = document.getElementById("share");
const like = document.getElementById("like");
const comment = document.getElementById("comment");

// Initialize values
let allUsersValue = 0;
let youtubeValue = 1203; // Starting with your initial value
let tiktokValue = 850; // Starting with your initial value
let triviaEarnValue = 320; // Starting with your initial value
let refferalsValue = 42; // Starting with your initial value
let bonusValue = 150; // Starting with your initial value

// Set initial display values
allUsersElement.textContent = `$${allUsersValue}`;
youtubeElement.textContent = `$${youtubeValue}`;
tiktokElement.textContent = `$${tiktokValue}`;
triviaEarnElement.textContent = `$${triviaEarnValue}`;
refferalsElement.textContent = refferalsValue;
bonusElement.textContent = `$${bonusValue}`;

//chatbot/TrohnAI
// Chatbot responses
const chatbotResponses = {
    "hello": "Hello! How can I assist you today?",
    "hi": "Hi there! How can I help?",
    "withdraw": "We support PayPal, MTN and Airtel money methods, for anything beyond these methods, please email the management",
    "help": "I can help with general inquiries. What do you need?",
    "contact": "You can email us at alphertech@gmail.com or whatsapp +256 708 885 123",
    "email": "You can email us at alphertech@gmail.com",
    "hours": "Our support team is available Monday-Friday, 9AM-5PM",
    "thanks": "You're welcome! Is there anything else I can help with?",
    "default": "I'm not sure I understand. Could you try asking differently?"
};

// DOM elements
const messagesDiv = document.getElementById('chatbot-messages');
const inputField = document.getElementById('chatbot-input');
const sendButton = document.getElementById('chatbot-send');

// Send message function
function sendMessage() {
    const message = inputField.value.trim();
    if (message === '') return;

    // Add user message
    addMessage(message, 'user-message');
    inputField.value = '';

    // Get bot response
    setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response, 'bot-message');
    }, 500);
}

// Add message to chat
function addMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.className = className;
    messageElement.textContent = text;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Get bot response
function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(chatbotResponses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    return chatbotResponses['default'];
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Initial greeting
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        addMessage("Hello! Iam Trohn. How can I help you today?", 'bot-message');
    }, 1000);
});

//from html
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
    document.getElementById('confirmation-message').textContent = 'Are you sure you want to log out?';
    document.getElementById('confirm-action').textContent = 'Logout';
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
        // Update trivia earnings
        triviaEarnValue += earnings;
        triviaEarnElement.textContent = `$${triviaEarnValue}`;

        // Update total earnings
        allUsersValue += earnings;
        allUsersElement.textContent = `$${allUsersValue}`;
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


const button = document.getElementById("claim1");
const notification = document.getElementById("notification");
const STORAGE_KEY = "claim1_last_clicked";
const DISABLE_DAYS = 5;
const REWARD = 150;

// Get references to your stat elements
const allUsersElement = document.getElementById("allUsers"); // Make sure this ID exists
const tiktokElement = document.getElementById("tiktok");    // Make sure this ID exists

// CHECK IF BUTTON SHOULD BE DISABLED
const lastClicked = localStorage.getItem(STORAGE_KEY);
if (lastClicked) {
    const lastTime = new Date(parseInt(lastClicked));
    const now = new Date();
    const diffDays = (now - lastTime) / (1000 * 60 * 60 * 24);

    if (diffDays < DISABLE_DAYS) {
        button.disabled = true;
        button.innerText = `Reward already claimed. Come back in ${Math.ceil(DISABLE_DAYS - diffDays)} days`;
    }
}

button.addEventListener("click", () => {
    if (button.disabled) return;

    // Get current values
    let currentAllUsers = parseInt(allUsersElement.textContent.replace(/\D/g, '')) || 0;
    let currentTiktok = parseInt(tiktokElement.textContent.replace(/\D/g, '')) || 0;

    // Increase values
    const newAllUsers = currentAllUsers + REWARD;
    const newTiktok = currentTiktok + REWARD;

    // Update display
    allUsersElement.textContent = `$${newAllUsers}`;
    tiktokElement.textContent = `$${newTiktok}`;

    // Show notification
    notification.textContent = `Rewarded $${REWARD}`;
    notification.style.display = "block";

    // Disable button
    button.disabled = true;
    button.textContent = "REWARDED";
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.style.display = "none";
    }, 4000);
});






















//footerSECTION
document.addEventListener("DOMContentLoaded", function () {
    const yearElement = document.getElementById("currentYear");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});