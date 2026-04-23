import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectSqlite3 from 'connect-sqlite3';
import { initDB } from './server/config/database.js';
import { configurePassport } from './server/config/passport.js';

import authRoutes from './server/routes/authRoutes.js';
import eventRoutes from './server/routes/eventRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import promotionRoutes from './server/routes/promotionRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import { startCleanupJob } from './server/utils/cleanupJob.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─── DATABASE INITIALIZATION ───
const db = initDB();

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'attendee',
      tickets TEXT DEFAULT '[]',
      google_id TEXT UNIQUE,
      resetPasswordToken TEXT,
      resetPasswordExpires INTEGER,
      currency TEXT DEFAULT 'XAF'
    )`);
    
    db.run(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN resetPasswordToken TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN resetPasswordExpires INTEGER`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'XAF'`, (err) => { /* Ignore duplicate */ });
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      date TEXT,
      endDate TEXT,
      location TEXT,
      country TEXT,
      city TEXT,
      neighborhood TEXT,
      latitude REAL,
      longitude REAL,
      image TEXT,
      category TEXT,
      organizer TEXT,
      organizerId TEXT,
      tickets TEXT,
      isFeatured INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending'
    )`);
    
    // Add new columns if table already exists (migrations)
    db.run(`ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'approved'`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN organizerId TEXT`, (err) => { /* Ignore duplicate */ });
    
    // Promotion requests table
    db.run(`CREATE TABLE IF NOT EXISTS promotion_requests (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userEmail TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      requestDate TEXT,
      reviewDate TEXT
    )`);

    // Audit logs table
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      action TEXT,
      resourceType TEXT,
      resourceId TEXT,
      details TEXT,
      timestamp TEXT
    )`);

    // Reports table (Policy #7: Community reporting)
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporterId TEXT,
      reporterName TEXT,
      reporterEmail TEXT,
      eventId TEXT,
      reason TEXT,
      details TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      reviewedAt TEXT,
      reviewedBy TEXT
    )`);

    // User Favorites table
    db.run(`CREATE TABLE IF NOT EXISTS user_favorites (
      userId TEXT,
      eventId TEXT,
      createdAt TEXT,
      PRIMARY KEY (userId, eventId)
    )`);

    // Organizer charter tracking (Policy #1)
    db.run(`ALTER TABLE users ADD COLUMN organizerCharterAccepted INTEGER DEFAULT 0`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN organizerCharterDate TEXT`, (err) => { /* Ignore duplicate */ });

    // Add columns if table already exists
    db.run(`ALTER TABLE events ADD COLUMN country TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN city TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN neighborhood TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN latitude REAL`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN longitude REAL`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN endDate TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE events ADD COLUMN coOrganizers TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN permissions TEXT`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN acceptedCgu INTEGER DEFAULT 0`, (err) => { /* Ignore duplicate */ });
    db.run(`ALTER TABLE users ADD COLUMN acceptedCguDate TEXT`, (err) => { /* Ignore duplicate */ });
    
    // Inject First Super-Admin
    const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin-system-id', 'Super Admin', process.env.ADMIN_EMAIL || 'admin@luminary.com', adminPassword, 'admin']);
});

const app = express();

// ─── 1. HELMET: Security Headers ───
app.use(helmet({
    contentSecurityPolicy: IS_PRODUCTION ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.basemaps.cartocdn.com", "https://*.tile.openstreetmap.org"],
            connectSrc: ["'self'"],
        }
    } : false,
    crossOriginEmbedderPolicy: false
}));

// ─── 2. CORS ───
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());

// In production when serving from the same origin, allow all same-origin requests
app.use(cors({ 
    origin: (origin, callback) => {
        // Allow requests with no origin (same-origin in production, mobile apps, curl)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    },
    credentials: true 
}));

// ─── 3. RATE LIMITING ───
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 100 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 10 : 50,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (local dev fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── 4. SESSION STORE ───
const SQLiteStore = connectSqlite3(session);

const sessionConfig = {
    store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
    secret: process.env.SESSION_SECRET || 'dev_session_secret_CHANGE_ME',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: IS_PRODUCTION,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: IS_PRODUCTION ? 'strict' : 'lax'
    }
};

// Trust proxy in production (required for secure cookies behind reverse proxy)
if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
}

app.use(session(sessionConfig));

const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── 5. API ROUTES ───
app.use('/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        env: IS_PRODUCTION ? 'production' : 'development',
        timestamp: new Date().toISOString()
    });
});

// ─── 6. SERVE REACT APP IN PRODUCTION ───
if (IS_PRODUCTION) {
    const distPath = path.join(__dirname, 'dist');
    
    // Serve static files from the Vite build
    app.use(express.static(distPath));
    
    // SPA fallback: any non-API route returns index.html
    app.get('*', (req, res) => {
        // Don't intercept API or auth routes
        if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/uploads')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.send('Luminary Events API is running 🚀'));
}

// ─── 7. GLOBAL ERROR HANDLER ───
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: IS_PRODUCTION ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Luminary Events server running on port ${PORT} (${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'})`);
    
    // Start automatic cleanup of expired events (7 days after end date)
    startCleanupJob();
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});