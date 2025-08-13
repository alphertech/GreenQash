import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabaseUrl = 'https://ntjltxbpnjcwfzwegtct.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50amx0eGJwbmpjd2Z6d2VndGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTQ3MTcsImV4cCI6MjA2NzgzMDcxN30.AHV1vIOL6QcRkHEWnTgnpg6zf0UBD1-HFuxIvU3vbag'

// Add this near your supabase initialization
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: true
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const showLoginBtn = document.getElementById('showLogin')
    const showRegisterBtn = document.getElementById('showRegister')
    const loginForm = document.getElementById('loginForm')
    const registerForm = document.getElementById('registerForm')
    const showLoginLink = document.getElementById('showLoginLink')
    const forgotPassword = document.getElementById('forgotPassword')

    // Form toggle
    function toggleForms(showLogin) {
        showLoginBtn.classList.toggle('active', showLogin)
        showRegisterBtn.classList.toggle('active', !showLogin)
        loginForm.classList.toggle('active', showLogin)
        registerForm.classList.toggle('active', !showLogin)
    }

    // Event listeners for form toggling
    showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForms(true) })
    showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForms(false) })
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); toggleForms(true) })

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.previousElementSibling
            const type = input.type === 'password' ? 'text' : 'password'
            input.type = type
            this.classList.toggle('fa-eye-slash')
        })
    })

    // Login handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            showNotification('Login successful! Redirecting...', 'success')
            setTimeout(() => window.location.href = '../user_pages/html_pages/index.html', 1500)
        } catch (error) {
            showNotification(getErrorMessage(error), 'error')
            console.error('Login error:', error)
        }
    })
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const username = document.getElementById('registerUsername').value;

        try {
            // 1. Check username availability
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('username', username);
            if (count > 0) throw new Error('Username taken');

            // 2. Create auth user (with explicit return session)
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                    emailRedirectTo: window.location.origin
                }
            });

            if (authError) throw authError;

            // 3. Wait for auth system to stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 4. Verify using the returned user object instead of getUser()
            if (!user) throw new Error('Registration incomplete');

            // 5. Insert profile using the returned user.id
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    username,
                    email
                });

            if (profileError) throw profileError;

            showNotification('Check your email to verify!', 'success');
            toggleForms(true);

        } catch (error) {
            showNotification(error.message, 'error');
            console.error('Registration error:', error);
        }
    });

    // Password reset
    forgotPassword.addEventListener('click', async (e) => {
        e.preventDefault()
        const email = document.getElementById('loginEmail').value || prompt('Enter your email:')
        if (!email) return

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            })
            if (error) throw error
            showNotification('Password reset link sent!', 'success')
        } catch (error) {
            showNotification(getErrorMessage(error), 'error')
        }
    })

    // OAuth handlers
    document.getElementById('googleLogin').addEventListener('click', () => handleOAuthLogin('google'))
    document.getElementById('githubLogin').addEventListener('click', () => handleOAuthLogin('github'))

    async function handleOAuthLogin(provider) {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin + '../user_pages/html_pages/index.html' }
            })
            if (error) throw error
        } catch (error) {
            showNotification(getErrorMessage(error), 'error')
        }
    }

    // Check existing session
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) window.location.href = '../user_pages/html_pages/index.html'
    })

    // Helper functions
    function showNotification(message, type) {
        const notification = document.getElementById('notification')
        notification.textContent = message
        notification.className = `notification show ${type}`
        setTimeout(() => notification.classList.remove('show'), 3000)
    }

    function getErrorMessage(error) {
        if (!error) return 'An unknown error occurred'

        // Handle Supabase errors
        if (error.code === '23505') return 'Username or email already exists'
        if (error.code === '42501') return 'Permission denied'
        if (error.message?.includes('User already registered')) return 'Email already registered'

        return error.message || 'An error occurred'
    }
})