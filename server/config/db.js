const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false  // Required for RDS
    }
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

// Initialize tables
async function initializeDatabase() {
    const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS resumes (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            s3_key VARCHAR(500) NOT NULL,
            s3_url VARCHAR(1000),
            extracted_text TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS match_results (
            id SERIAL PRIMARY KEY,
            resume_id INTEGER REFERENCES resumes(id) ON DELETE CASCADE,
            job_description TEXT NOT NULL,
            score INTEGER NOT NULL,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTablesQuery);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase
};
