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

// Initialize DB Tables
const initDB = async () => {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS price_calculator_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                message TEXT,
                selections JSON,
                totalPrice INT,
                monthlyPrice INT,
                priceEstimate TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS cookie_consent (
                id INT AUTO_INCREMENT PRIMARY KEY,
                status ENUM('accepted', 'rejected', 'custom') NOT NULL,
                userAgent TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Database tables initialized (MySQL).");
        connection.release();
    } catch (err) {
        console.error("Error initializing MySQL DB:", err);
    }
};

initDB();

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// GET / - Health Check
app.get('/', (req, res) => {
    res.send('MST Studios Backend is running (MySQL Version).');
});

// POST /submit - Handle Calculator Submission
app.post('/submit', async (req, res) => {
    try {
        const { email, message, selections, totalPrice, monthlyPrice, priceEstimate } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Use backend logic to validate or trust frontend? 
        // User requested storing frontend data. 
        // We will store exactly what is sent.

        const [result] = await pool.execute(
            'INSERT INTO price_calculator_submissions (email, message, selections, totalPrice, monthlyPrice, priceEstimate) VALUES (?, ?, ?, ?, ?, ?)',
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
        console.error('Error in /submit:', error);
        res.status(500).json({ error: "Database insert failed" });
    }
});

// POST /cookie-consent - Save Consent
app.post('/cookie-consent', async (req, res) => {
    try {
        const { status, userAgent } = req.body;

        await pool.execute(
            'INSERT INTO cookie_consent (status, userAgent) VALUES (?, ?)',
            [status, userAgent || 'unknown']
        );

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error in /cookie-consent:', error);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
