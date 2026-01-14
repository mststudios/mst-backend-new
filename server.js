require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mststudios.com',
    user: process.env.DB_USER || 'u766997427_mst_user',
    password: process.env.DB_PASSWORD || 'OsVIOPzdukp^1',
    database: process.env.DB_NAME || 'u766997427_mst_backend',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ----------------------------------------------------
// Initialize DB Tables
// ----------------------------------------------------
const initDB = async () => {
    try {
        const connection = await pool.getConnection();

        // Price Calculator Submissions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS price_calculator_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                message TEXT,
                selections JSON,
                totalPrice INT DEFAULT 0,
                monthlyPrice INT DEFAULT 0,
                priceEstimate TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Cookie Consent
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cookie_consent (
                id INT AUTO_INCREMENT PRIMARY KEY,
                status ENUM('accepted','rejected','custom') NOT NULL,
                userAgent TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ Database tables initialized successfully.");
        connection.release();
    } catch (err) {
        console.error("❌ Error initializing MySQL DB:", err);
    }
};

initDB();

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// Health Check
app.get('/', (req, res) => {
    res.send('MST Studios Backend is running (MySQL).');
});

// POST /submit - Price Calculator Submission
app.post('/submit', async (req, res) => {
    try {
        const { email, message, selections, totalPrice, monthlyPrice, priceEstimate } = req.body;

        if (!email) return res.status(400).json({ error: 'Missing required field: email' });

        const [result] = await pool.execute(
            `INSERT INTO price_calculator_submissions 
                (email, message, selections, totalPrice, monthlyPrice, priceEstimate)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                email,
                message || '',
                JSON.stringify(selections || {}),
                totalPrice || 0,
                monthlyPrice || 0,
                priceEstimate || ''
            ]
        );

        res.json({
            success: true,
            message: 'Submission saved to database',
            id: result.insertId
        });
    } catch (error) {
        console.error('❌ Error in /submit:', error);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// POST /cookie-consent
app.post('/cookie-consent', async (req, res) => {
    try {
        const { status, userAgent } = req.body;

        if (!status) return res.status(400).json({ error: 'Missing required field: status' });

        await pool.execute(
            `INSERT INTO cookie_consent (status, userAgent) VALUES (?, ?)`,
            [status, userAgent || 'unknown']
        );

        res.json({ success: true, status });
    } catch (error) {
        console.error('❌ Error in /cookie-consent:', error);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
