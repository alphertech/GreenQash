// auth.js - Supabase Authentication for GreenQash
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase client
const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const showLoginBtn = document.getElementById('showLogin')
const showRegisterBtn = document.getElementById('showRegister')
const showLoginLink = document.getElementById('showLoginLink')
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')
const notification = document.getElementById('notification')
const togglePasswordButtons = document.querySelectorAll('.toggle-password')
const googleLoginBtn = document.getElementById('googleLogin')
const forgotPasswordLink = document.getElementById('forgotPassword')

// Initialize the authentication system
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in
    checkCurrentSession()

    // Set up event listeners
    setupEventListeners()
})

// Check if user already has a valid session
async function checkCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html'
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Form toggle functionality
    showLoginBtn.addEventListener('click', () => toggleForms('login'))
    showRegisterBtn.addEventListener('click', () => toggleForms('register'))
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault()
        toggleForms('login')
    })

    // Toggle password visibility
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input')
            togglePasswordVisibility(input, this)
        })
    })

    // Form submissions
    loginForm.addEventListener('submit', handleLogin)
    registerForm.addEventListener('submit', handleRegistration)

    // Google login
    googleLoginBtn.addEventListener('click', handleGoogleLogin)

    // Forgot password
    forgotPasswordLink.addEventListener('click', handleForgotPassword)
}

// Toggle between login and register forms
function toggleForms(form) {
    if (form === 'login') {
        showLoginBtn.classList.add('active')
        showRegisterBtn.classList.remove('active')
        loginForm.classList.add('active')
        registerForm.classList.remove('active')
    } else {
        showRegisterBtn.classList.add('active')
        showLoginBtn.classList.remove('active')
        registerForm.classList.add('active')
        loginForm.classList.remove('active')
    }
}

// Toggle password visibility
function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
        input.type = 'text'
        button.classList.remove('fa-eye')
        button.classList.add('fa-eye-slash')
    } else {
        input.type = 'password'
        button.classList.remove('fa-eye-slash')
        button.classList.add('fa-eye')
    }
}

// Show notification to user
function showNotification(message, isError = false) {
    notification.textContent = message
    notification.className = 'notification' + (isError ? ' error' : '')
    notification.classList.add('show')

    setTimeout(() => {
        notification.classList.remove('show')
    }, 5000)
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault()

    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) throw error

        showNotification('Login successful! Redirecting to dashboard...')

        // Clear form
        loginForm.reset()

        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html'
        }, 1500)

    } catch (error) {
        showNotification('Login failed: ' + error.message, true)
    }
}

// Handle registration form submission
async function handleRegistration(e) {
    e.preventDefault()

    const username = document.getElementById('registerUsername').value
    const email = document.getElementById('registerEmail').value
    const phone = document.getElementById('phone').value
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('registerConfirmPassword').value

    // Basic validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true)
        return
    }

    try {
        // Create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    phone: phone
                }
            }
        })

        if (authError) throw authError

        showNotification('Account created successfully! Please check your email to verify your account.')

        // Clear form
        registerForm.reset()

        // Switch to login form
        toggleForms('login')

    } catch (error) {
        showNotification('Registration failed: ' + error.message, true)
    }
}

// Handle Google OAuth login
async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        })

        if (error) throw error

    } catch (error) {
        showNotification('Google login failed: ' + error.message, true)
    }
}

// Handle forgot password flow
async function handleForgotPassword(e) {
    e.preventDefault()

    let email = document.getElementById('loginEmail').value
    if (!email) {
        email = prompt('Please enter your email:')
        if (!email) return
    }

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html',
        })

        if (error) throw error

        showNotification('Password reset instructions sent to your email')

    } catch (error) {
        showNotification('Error sending reset email: ' + error.message, true)
    }
}

// Export functions for use in other files if needed
export {
    supabase,
    checkCurrentSession,
    handleLogin,
    handleRegistration,
    handleGoogleLogin,
    handleForgotPassword
}
