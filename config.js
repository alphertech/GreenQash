// config.js - Local configuration for Supabase credentials
// This file should be created locally with your Supabase credentials.
// It is NOT committed to GitHub (add to .gitignore if not already).

// Instructions:
// 1. Copy your Supabase project URL and anon key
// 2. Replace the placeholder values below
// 3. Keep this file in .gitignore (do NOT commit to GitHub)

window.SUPABASE_CONFIG = {
    url: 'https://kwghulqonljulmvlcfnz.supabase.co', // Your Supabase project URL
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z2h1bHFvbmxqdWxtdmxjZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzcyMDcsImV4cCI6MjA3OTU1MzIwN30.hebcPqAvo4B23kx4gdWuXTJhmx7p8zSHHEYSkPzPhcM' // Your Supabase anon key
};

// Optional: API proxy base (set to your Render/other host where API runs)
// Example: 'https://greenqash-api.onrender.com'
window.SUPABASE_CONFIG.apiBase = window.SUPABASE_CONFIG.apiBase || '';
// Expose a short alias used by the frontend
window.API_BASE_URL = window.API_BASE_URL || window.SUPABASE_CONFIG.apiBase || '';
