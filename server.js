require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { calculatePrice } = require('./pricing');

const app = express();
const PORT = process.env.PORT || 10000; // Render default port

// Middleware
app.use(cors()); // Allow all origins for now (configure for production later)
app.use(express.json());

// Database Connection (Postgres)
// Use connection string from environment variable DATABASE_URL
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Render Postgres
    });
    console.log("Connected to PostgreSQL");
} else {
    console.log("No DATABASE_URL found. Running in memory-only mode (No persistent storage).");
}

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'hotmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Initialize DB Tables (Run once on startup if DB is connected)
const initDB = async () => {
    if (!pool) return;
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        message TEXT,
        selections JSONB,
        total_price INTEGER,
        monthly_price INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id SERIAL PRIMARY KEY,
        user_agent TEXT,
        ip_hash TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Database tables initialized.");
    } catch (err) {
        console.error("Error initializing DB:", err);
    }
};
initDB();

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// GET / - Health Check
app.get('/', (req, res) => {
    res.send('MST Studios Backend is running.');
});

// POST /submit - Handle Calculator Submission
app.post('/submit', async (req, res) => {
    try {
        const { email, message, selections } = req.body;

        if (!email || !selections) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Calculate Price on Server (Source of Truth)
        const { totalPrice, monthlyPrice, breakdown } = calculatePrice(selections);

        // 2. Log to Database (if available)
        if (pool) {
            await pool.query(
                'INSERT INTO submissions (email, message, selections, total_price, monthly_price) VALUES ($1, $2, $3, $4, $5)',
                [email, message, JSON.stringify(selections), totalPrice, monthlyPrice]
            );
        }

        // 3. Send Email Notification to Admin (You)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER, // Send to yourself
            subject: `Ny Prisberegning fra ${email} - ${totalPrice} kr`,
            text: `
        Ny henvendelse fra Prisberegneren:

        Email: ${email}
        Besked: ${message}

        ----------------------------------------
        Beregnet Pris: ${totalPrice} kr.
        Månedlig: ${monthlyPrice} kr/md.
        ----------------------------------------

        Valgte Muligheder:
        ${JSON.stringify(selections, null, 2)}
      `
        };

        // Only attempt to send if credentials are set
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log('Skipping email sending (credentials missing). Logged: ', mailOptions);
        }

        // 4. Return success and the confirmed price
        res.json({
            success: true,
            message: 'Submission received',
            totalPrice,
            monthlyPrice
        });

    } catch (error) {
        console.error('Error in /submit:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /cookie-consent - Save Consent
app.post('/cookie-consent', async (req, res) => {
    try {
        const { status, userAgent } = req.body;
        // Note: Storing IP/UserAgent requires strict GDPR compliance. 
        // Usually a simple "true" cookie on client is enough.
        // We will simulate logging here if requested.

        if (pool) {
            // Anonymizing IP for basic privacy (hashing or just neglecting it)
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await pool.query(
                'INSERT INTO cookie_consents (user_agent, ip_hash, status) VALUES ($1, $2, $3)',
                [userAgent || 'unknown', 'anonymized', status]
            );
        }

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error in /cookie-consent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /cookie-consent-status
app.get('/cookie-consent-status', (req, res) => {
    // Since this is a REST API without session cookies, we can't identify the user easily 
    // without them sending a token. 
    // Typically, the frontend checks its own localStorage.
    // We will return a generic message or expect a query param/token if implemented fully.
    res.json({ message: "Check client-side localStorage for active consent state." });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
