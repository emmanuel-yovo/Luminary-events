import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDB } from '../config/database.js';
import { sendResetEmail } from '../utils/mailer.js';
import { v4 as uuidv4 } from 'uuid';
import { validateRegistration, sanitize } from '../utils/validation.js';

export const register = async (req, res) => {
    let { name, email, password, acceptedCgu } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!acceptedCgu) return res.status(400).json({ error: 'Vous devez accepter les Conditions Générales d\'Utilisation.' });

    const validation = validateRegistration({ name, email, password });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(' ') });
    }

    name = sanitize(name, 100);
    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();

    // 1. Check if user already exists
    db.get(`SELECT id FROM users WHERE email = ?`, [normalizedEmail], async (err, existingUser) => {
        if (err) {
            console.error('DB Error during check:', err);
            return res.status(500).json({ error: 'Database verification failed' });
        }
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        try {
            // 2. Auto-promotion: check for professional email domain
            const freeEmailDomains = [
                'gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr',
                'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'aol.com',
                'icloud.com', 'mail.com', 'protonmail.com', 'gmx.com', 'yandex.com',
                'zoho.com', 'laposte.net', 'free.fr', 'orange.fr', 'sfr.fr', 'wanadoo.fr'
            ];
            const emailDomain = normalizedEmail.split('@')[1];
            const isProfessionalEmail = emailDomain && !freeEmailDomains.includes(emailDomain);
            const assignedRole = isProfessionalEmail ? 'organizer' : 'attendee';

            // 3. Hash password and insert
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(`INSERT INTO users (id, name, email, password, role, acceptedCgu, acceptedCguDate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), name, normalizedEmail, hashedPassword, assignedRole, 1, new Date().toISOString()], function (err) {
                    if (err) {
                        console.error('Insert Error:', err);
                        return res.status(500).json({ error: 'Registration failed: ' + err.message });
                    }
                    res.json({ ok: true });
                });
        } catch (error) {
            console.error('Hashing Error:', error);
            res.status(500).json({ error: 'Security processing error' });
        }
    });
};

export const login = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();
    
    db.get(`SELECT * FROM users WHERE email = ?`, [normalizedEmail], async (err, row) => {
        if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
        
        try {
            const isValid = await bcrypt.compare(password, row.password);
            if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

            const user = {
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                permissions: row.permissions || null,
                tickets: JSON.parse(row.tickets || '[]')
            };
            
            req.login(user, (err) => {
                if (err) return res.status(500).json({ error: 'Login failed' });
                res.json(user);
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
};

export const logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session && req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ ok: true });
        });
    });
};

export const getCurrentUser = (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        const db = getDB();
        db.all(`SELECT eventId FROM user_favorites WHERE userId = ?`, [req.user.id], (err, rows) => {
            const userWithFavorites = { ...req.user, favorites: err ? [] : rows.map(r => r.eventId) };
            res.json(userWithFavorites);
        });
    } else {
        res.json(null);
    }
};

export const forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();

    db.get(`SELECT id, name FROM users WHERE email = ?`, [normalizedEmail], (err, user) => {
        if (err || !user) return res.status(200).json({ ok: true }); // Silent fail for security

        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        db.run(`UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?`,
            [token, expires, normalizedEmail], async (err) => {
                if (err) return res.status(500).json({ error: 'Failed to generate token' });

                // REAL EMAIL SENDING
                await sendResetEmail(normalizedEmail, token);

                res.json({ ok: true });
            });
    });
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });

    const db = getDB();
    const now = Date.now();

    db.get(`SELECT id FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?`, [token, now], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Token is invalid or has expired' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(`UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?`,
                [hashedPassword, user.id], (err) => {
                    if (err) return res.status(500).json({ error: 'Failed to reset password' });
                    res.json({ ok: true });
                });
        } catch (error) {
            res.status(500).json({ error: 'Processing error' });
        }
    });
};

export const updateCurrency = (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    const { currency } = req.body;
    const validCurrencies = ['XAF', 'XOF', 'EUR', 'USD', 'GBP', 'CAD'];
    if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ error: 'Devise invalide' });
    }

    const db = getDB();
    db.run(`UPDATE users SET currency = ? WHERE id = ?`, [currency, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: 'Erreur base de données' });
        // Update session user object if present
        if (req.user) req.user.currency = currency;
        res.json({ ok: true, currency });
    });
};

export const getFavorites = (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    const db = getDB();
    db.all(`SELECT eventId FROM user_favorites WHERE userId = ?`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        const favorites = rows.map(r => r.eventId);
        res.json(favorites);
    });
};
