// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

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
    checkCurrentSession()
    setupEventListeners()
})

async function checkCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        window.location.href = 'dashboard.html'
    }
}

function setupEventListeners() {
    showLoginBtn.addEventListener('click', () => toggleForms('login'))
    showRegisterBtn.addEventListener('click', () => toggleForms('register'))
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault()
        toggleForms('login')
    })

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input')
            togglePasswordVisibility(input, this)
        })
    })

    loginForm.addEventListener('submit', handleLogin)
    registerForm.addEventListener('submit', handleRegistration)
    googleLoginBtn.addEventListener('click', handleGoogleLogin)
    forgotPasswordLink.addEventListener('click', handleForgotPassword)
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) throw error
        
        // Check if user exists in public.users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email_address', email)
            .single()
            
        if (userError && userError.code !== 'PGRST116') {
            throw userError
        }
        
        // If user doesn't exist in public.users, create entry
        if (!userData) {
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    { 
                        email_address: email,
                        user_name: email.split('@')[0] // Use part of email as username
                    }
                ])
                .select()
                
            if (insertError) throw insertError
        }
        
        showNotification('Login successful! Redirecting...')
        setTimeout(() => {
            window.location.href = 'dashboard.html'
        }, 1000)
        
    } catch (error) {
        showNotification(error.message, true)
    }
}

async function handleRegistration(e) {
    e.preventDefault()
    
    const username = document.getElementById('registerUsername').value
    const email = document.getElementById('registerEmail').value
    const phone = document.getElementById('phone').value
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('registerConfirmPassword').value
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true)
        return
    }
    
    try {
        // Create auth user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    phone: phone
                }
            }
        })
        
        if (error) throw error
        
        // Create user in public.users table
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { 
                    user_name: username,
                    email_address: email
                    // Note: Phone field doesn't exist in your table structure
                }
            ])
            .select()
            
        if (insertError) throw insertError
        
        showNotification('Registration successful! Please check your email for verification.')
        
        // Reset form
        registerForm.reset()
        toggleForms('login')
        
    } catch (error) {
        showNotification(error.message, true)
    }
}

async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        })
        
        if (error) throw error
        
    } catch (error) {
        showNotification(error.message, true)
    }
}

async function handleForgotPassword(e) {
    e.preventDefault()
    
    const email = prompt('Please enter your email address:')
    if (!email) return
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        })
        
        if (error) throw error
        
        showNotification('Password reset email sent! Please check your inbox.')
        
    } catch (error) {
        showNotification(error.message, true)
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

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        window.location.href = 'dashboard.html'
    }
})
