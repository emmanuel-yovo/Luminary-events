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

dotenv.config();

// Initialisation de la BDD
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
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin-system-id', 'Super Admin', 'admin@luminary.com', adminPassword, 'admin']);
});

const app = express();

// ─── 1. HELMET: Security Headers ───
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev (inline scripts from Vite)
    crossOriginEmbedderPolicy: false
}));

// ─── 2. STRICT CORS ───
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
];

app.use(cors({ 
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqué par la politique CORS'));
        }
    },
    credentials: true 
}));

// ─── 3. RATE LIMITING ───
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max 200 requests per IP per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, veuillez réessayer dans quelques minutes.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // max 20 auth attempts per 15 min (anti brute-force)
    message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── 4. PERSISTENT SESSION STORE (SQLite) ───
const SQLiteStore = connectSqlite3(session);

app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Enregistrement des Routes
app.use('/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => res.send('Luminary Events MVC Backend is running smooth!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Auth/API server listening on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});