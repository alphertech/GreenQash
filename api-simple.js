// api-simple.js - Simple Express server
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'GreenQash Simple API'
    });
});

// Serve static files
app.use(express.static('.'));

// Fallback for all other routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

app.listen(PORT, () => {
    console.log(`🚀 Simple API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard.html`);
});