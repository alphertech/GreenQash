//activation
let how2activate = document.getElementById("how2a");
let activationMess = document.getElementById("activationMess")

document.getElementById("how2a").addEventListener("click", function () {
    const username = document.getElementById("headerUsername").textContent.replace("Welcome, ", "");

    document.getElementById("activationMess").innerHTML = `
    <h3>MTN Mobile Money</h3>
    <p>1. Dial *165#</p>
    <p>2. Select Option 3 (Pay Bill)</p>
    <p>3. Enter Business Number: 000000</p>
    <p>4. Enter Amount: 18000</p>
    <p>5. Enter Reference: ${username}</p>
    <p>6. Confirm transaction</p>
    <hr>
    <h3>Airtel Money</h3>
    <p>1. Dial *165#</p>
    <p>2. Select Option 3 (Pay Bill)</p>
    <p>3. Enter Business Number: 000000</p>
    <p>4. Enter Amount: 18000</p>
    <p>5. Enter Reference: ${username}</p>
    <p>6. Confirm transaction</p>
    <hr>
    <p style="font-weight:bold;color:var(--green-accent)">After payment, click "Activate Account" to verify</p>`;

    document.getElementById("activate").style.display = "block";
});

document.getElementById("activate").addEventListener("click", function () {
    this.disabled = true;
    this.textContent = "Processing...";

    // Simulate activation process
    setTimeout(() => {
        this.textContent = "Account Activated!";
        this.style.background = "rgba(0, 255, 153, 0.3)";
        document.getElementById("activationMessage").innerHTML += `
            <p style="color: var(--green-main); font-weight: bold; margin-top: 15px;">
                Account activated successfully! You can now access all features.
            </p>
                `;
    }, 1500);
});

document.getElementById("helpbtn").addEventListener("click", function () {
    alert("Please contact support at admin@greenqash.com for assistance.");
});

// DOM Elements
const navLinks = document.getElementById('navLinks');
const menuIcon = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const sections = document.querySelectorAll('.admin-section');
const menuItems = document.querySelectorAll('menu a[data-section]');
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.showLogoutConfirmation) {
            window.showLogoutConfirmation();
        } else {
            // Fallback: perform logout directly
            window.location.href = 'index.html';
        }
    });
}
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
