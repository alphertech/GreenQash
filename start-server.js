// start-server.js
const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting GreenQash Application...');

// Check if necessary files exist
const requiredFiles = ['dashboard.html', 'index.html', 'config.js'];
requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        process.exit(1);
    }
});

console.log('✓ All required files found');

// Start the simple server
console.log('🌐 Starting web server on port 8080...');
exec('npx http-server -p 8080 -c-1', (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Server error: ${error}`);
        return;
    }
    console.log(stdout);
});

console.log('✅ Application is starting...');
console.log('👉 Open your browser to: http://localhost:8080/dashboard.html');