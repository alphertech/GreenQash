// auth.js - Updated with your new project credentials
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// REPLACE THESE WITH YOUR ACTUAL NEW CREDENTIALS
const supabaseUrl = 'https://kwghulqonljulmvlcfnz.supabase.co' // Your Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM' // Your anon public key
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const showLoginBtn = document.getElementById('showLogin')
const showRegisterBtn = document.getElementById('showRegister')
const showLoginLink = document.getElementById('showLoginLink')
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')
const notification = document.getElementById('notification')
const togglePasswordButtons = document.querySelectorAll('.toggle-password')

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 GreenQash Auth System Ready')
    setupEventListeners()
    checkCurrentSession()
})

async function checkCurrentSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            console.log('User already logged in, redirecting...')
            window.location.href = 'dashboard.html'
        }
    } catch (error) {
        console.log('No active session')
    }
}

function setupEventListeners() {
    // Form toggle listeners
    showLoginBtn.addEventListener('click', () => toggleForms('login'))
    showRegisterBtn.addEventListener('click', () => toggleForms('register'))
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault()
        toggleForms('login')
    })

    // Password toggle listeners
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input')
            togglePasswordVisibility(input, this)
        })
    })

    // Form submission listeners
    loginForm.addEventListener('submit', handleLogin)
    registerForm.addEventListener('submit', handleRegistration)
}

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

async function handleLogin(e) {
    e.preventDefault()
    
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value
    
    try {
        showNotification('Signing you in...')
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) throw error
        
        // Create user in public table if needed
        await createUserInPublicTable(data.user, email)
        
        // Check user role and redirect accordingly
        const redirectUrl = await getUserRedirectUrl(email)
        
        showNotification('Welcome back! Redirecting...')
        setTimeout(() => {
            window.location.href = redirectUrl
        }, 1500)
        
    } catch (error) {
        console.error('Login error:', error)
        showNotification(error.message, true)
    }
}

// Function to get redirect URL based on user role
async function getUserRedirectUrl(email) {
    try {
        // Query the users table to get user's rank
        const { data: userData, error } = await supabase
            .from('users')
            .select('rank')
            .eq('email_address', email)
            .single()
        
        if (error) {
            console.warn('Could not fetch user role, defaulting to dashboard:', error.message)
            return 'dashboard.html'
        }
        //users
        if (userData && userData.rank === 'user') {
            console.log('Normal user detected, redirecting to admin dashboard')
            return 'dashboard.html'
        }
        
        // Check user role and return appropriate redirect URL
        if (userData && userData.rank === 'admin') {
            console.log('Admin user detected, redirecting to admin dashboard')
            return 'level1/administrators.html'
        }
        
        // Default redirect for regular users
        console.log('Regular user, redirecting to standard dashboard')
        return 'dashboard.html'
        
    } catch (error) {
        console.error('Error checking user role:', error)
        // Fallback to regular dashboard if there's any error
        return 'dashboard.html'
    }
}

// Also update the auth state change listener for role-based redirects
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event)
    if (event === 'SIGNED_IN' && session) {
        try {
            const redirectUrl = await getUserRedirectUrl(session.user.email)
            window.location.href = redirectUrl
        } catch (error) {
            console.error('Error in auth state redirect:', error)
            // Fallback to regular dashboard
            window.location.href = 'dashboard.html'
        }
    }
})

async function handleRegistration(e) {
    e.preventDefault()
    
    const username = document.getElementById('registerUsername').value
    const email = document.getElementById('registerEmail').value
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('registerConfirmPassword').value
    
    // Validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true)
        return
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', true)
        return
    }
    
    try {
        showNotification('Creating your account...')
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        })
        
        if (error) throw error
        
        // Create user in public table
        if (data.user) {
            await createUserInPublicTable(data.user, email, username)
        }
        
        showNotification('Account created successfully!')
        
        // Reset form and switch to login
        setTimeout(() => {
            registerForm.reset()
            toggleForms('login')
        }, 2000)
        
    } catch (error) {
        console.error('Registration error:', error)
        showNotification(error.message, true)
    }
}

async function createUserInPublicTable(authUser, email, username = null) {
    try {
        const finalUsername = username || email.split('@')[0]
        
        const { error } = await supabase
            .from('users')
            .insert([
                { 
                    user_name: finalUsername,
                    email_address: email
                }
            ])
            
        if (error && error.code !== '23505') { // Ignore duplicate errors
            console.error('Public table error:', error)
        }
        
    } catch (error) {
        console.error('Error creating public user:', error)
    }
}

function showNotification(message, isError = false) {
    notification.textContent = message
    notification.className = 'notification' + (isError ? ' error' : '')
    notification.classList.add('show')

    setTimeout(() => {
        notification.classList.remove('show')
    }, 5000)
}

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event)
    if (event === 'SIGNED_IN' && session) {
        window.location.href = 'dashboard.html'
    }
})
