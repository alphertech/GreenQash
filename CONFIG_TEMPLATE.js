// CONFIG_TEMPLATE.js - Template for local configuration
// 
// SETUP INSTRUCTIONS:
// 1. Copy this file and rename to config.js (in the same directory)
// 2. Replace the placeholder values with your Supabase credentials
// 3. config.js will be loaded by index.html and dashboard.html automatically
// 4. config.js is in .gitignore and will NOT be committed to GitHub
//
// Where to find your credentials:
// - Go to https://supabase.com
// - Open your project settings
// - Copy the Project URL and Anon Key
// - Paste them below

window.SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_PROJECT_URL_HERE',  // e.g., https://xxxxx.supabase.co
  key: 'YOUR_SUPABASE_ANON_KEY_HERE'      // e.g., eyJhbGc...
};
