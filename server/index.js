require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const resumeRoutes = require('./routes/resume');
const { initializeDatabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint for ELB
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', resumeRoutes);

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`ResumeIQ server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    // Still start server even if DB init fails (for health checks)
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`ResumeIQ server running on port ${PORT} (DB init failed)`);
    });
});
