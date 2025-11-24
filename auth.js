// auth.js - Enhanced with detailed error logging
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Initialize Supabase client - REPLACE WITH YOUR CREDENTIALS
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
    console.log('Initializing auth system...')
    checkCurrentSession()
    setupEventListeners()
})

async function checkCurrentSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session check:', session ? 'User logged in' : 'No session')
        if (session) {
            window.location.href = 'dashboard.html'
        }
    } catch (error) {
        console.log('Session check error:', error.message)
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
    
    // Other auth listeners
    googleLoginBtn.addEventListener('click', handleGoogleLogin)
    forgotPasswordLink.addEventListener('click', handleForgotPassword)

    console.log('Event listeners setup complete')
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
        showNotification('Logging in...')
        console.log('Login attempt for:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) {
            console.error('Login auth error:', error)
            throw error
        }
        
        console.log('Auth login successful:', data.user.id)
        
        // Check if user exists in public.users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email_address', email)
            .single()
            
        console.log('Public user check:', userData ? 'Exists' : 'Not found', userError)
        
        // If user doesn't exist in public.users, create entry
        if (!userData && data.user) {
            console.log('Creating user in public table...')
            await createUserInPublicTable(data.user, email)
        }
        
        showNotification('Login successful! Redirecting...')
        console.log('Login complete, redirecting...')
        
        setTimeout(() => {
            window.location.href = 'dashboard.html'
        }, 1500)
        
    } catch (error) {
        console.error('Login error details:', error)
        showNotification(error.message, true)
    }
}

async function handleRegistration(e) {
    e.preventDefault()
    
    const username = document.getElementById('registerUsername').value
    const email = document.getElementById('registerEmail').value
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('registerConfirmPassword').value
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true)
        return
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', true)
        return
    }
    
    try {
        showNotification('Creating account...')
        console.log('Registration attempt:', { username, email })
        
        // Create auth user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        })
        
        if (error) {
            console.error('Registration auth error:', error)
            throw error
        }
        
        console.log('Auth registration successful:', data.user?.id)
        
        // Create user in public.users table
        if (data.user) {
            console.log('Creating public user record...')
            const publicUser = await createUserInPublicTable(data.user, email, username)
            console.log('Public user creation result:', publicUser)
        }
        
        showNotification('Registration successful! Please check your email for verification.')
        
        // Reset form and switch to login
        setTimeout(() => {
            registerForm.reset()
            toggleForms('login')
        }, 2000)
        
    } catch (error) {
        console.error('Registration error details:', error)
        showNotification(error.message, true)
    }
}

// Helper function to create user in public.users table
async function createUserInPublicTable(authUser, email, username = null) {
    try {
        // Use email part as username if not provided
        const finalUsername = username || email.split('@')[0]
        
        console.log('Creating public user:', { auth_uid: authUser.id, email, username: finalUsername })
        
        const { data, error } = await supabase
            .from('users')
            .insert([
                { 
                    auth_uid: authUser.id,
                    user_name: finalUsername,
                    email_address: email
                }
            ])
            .select()
            
        if (error) {
            console.error('Public table insert error:', error)
            // If it's a duplicate error, try to update instead
            if (error.code === '23505') {
                console.log('User already exists, updating...')
                const { data: updateData, error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        user_name: finalUsername,
                        auth_uid: authUser.id
                    })
                    .eq('email_address', email)
                    .select()
                    
                if (updateError) {
                    console.error('Update error:', updateError)
                    throw updateError
                }
                return updateData
            }
            throw error
        }
        
        console.log('User created in public table:', data)
        return data
        
    } catch (error) {
        console.error('Error in createUserInPublicTable:', error)
        // Don't throw error here - we don't want to block auth if public table fails
        return null
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
            redirectTo: `${window.location.origin}/reset-password.html`
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
    console.log('Auth state changed:', event, session?.user?.id)
    if (event === 'SIGNED_IN' && session) {
        // Create/update user in public table when they sign in
        if (session.user) {
            createUserInPublicTable(session.user, session.user.email, session.user.user_metadata?.username)
        }
        window.location.href = 'dashboard.html'
    }
})
