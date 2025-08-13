// Initialize Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Registration form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          phone
        }
      }
    });
    
    if (authError) throw authError;
    
    // Insert user data into the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          username, 
          email, 
          phone,
          password_hash: password // Note: In production, you should hash this properly
        }
      ]);
    
    if (userError) throw userError;
    
    // Show success message
    showNotification('Registration successful! Redirecting...', 'success');
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
    
  } catch (error) {
    showNotification(error.message, 'error');
    console.error('Registration error:', error);
  }
});

// Helper function to show notifications
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}
