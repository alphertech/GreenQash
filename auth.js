// Initialize Supabase
const supabaseUrl = 'https://xfbvdpidpfqynlurgvsj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYnZkcGlkcGZxeW5sdXJndnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Nzg5NDAsImV4cCI6MjA3MDA1NDk0MH0.oFZjb5dbMHuymL8GUlPPFsnR50uQeE668KHzXw4RcC8';
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

