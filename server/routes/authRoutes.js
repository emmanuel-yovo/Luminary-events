import express from 'express';
import passport from 'passport';
import { register, login, logout, getCurrentUser, forgotPassword, resetPassword, updateCurrency, getFavorites } from '../controllers/authController.js';
import { getDB } from '../config/database.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const authStrategy = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'google' : 'mock';

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/user', getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/account/currency', updateCurrency);
router.get('/account/favorites', getFavorites);

// RGPD: Self-delete account
router.delete('/account', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    const userId = req.user.id;
    const db = getDB();
    
    // Delete user's events
    db.run(`DELETE FROM events WHERE organizerId = ?`, [userId], (err) => {
        if (err) console.error('Error deleting user events:', err);
    });
    
    // Delete user account
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
        if (err) return res.status(500).json({ error: 'Erreur lors de la suppression' });
        
        req.logout((logoutErr) => {
            req.session && req.session.destroy(() => {
                res.clearCookie('connect.sid');
                res.json({ ok: true, message: 'Compte supprimé avec succès' });
            });
        });
    });
});

// OAuth Google
router.get('/google', passport.authenticate(authStrategy, { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate(authStrategy, { failureRedirect: FRONTEND_URL }),
    (req, res) => {
        res.redirect(FRONTEND_URL);
    }
);

export default router;
