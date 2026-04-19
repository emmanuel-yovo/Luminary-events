import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getDB } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Report an event (Policy #7)
router.post('/', requireAuth, (req, res) => {
    const { eventId, reason, details } = req.body;
    if (!eventId || !reason) return res.status(400).json({ error: 'Événement et raison requis.' });

    const VALID_REASONS = [
        'contenu_inapproprie', 'arnaque', 'spam', 
        'evenement_fictif', 'discrimination', 'autre'
    ];
    if (!VALID_REASONS.includes(reason)) {
        return res.status(400).json({ error: 'Raison de signalement invalide.' });
    }

    const db = getDB();

    // Check if user already reported this event
    db.get(`SELECT id FROM reports WHERE reporterId = ? AND eventId = ?`, 
        [req.user.id, eventId], (err, existing) => {
            if (existing) return res.status(400).json({ error: 'Vous avez déjà signalé cet événement.' });

            const id = uuidv4();
            db.run(`INSERT INTO reports (id, reporterId, reporterName, reporterEmail, eventId, reason, details, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, req.user.id, req.user.name, req.user.email, eventId, reason, details || '', new Date().toISOString()],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Erreur base de données.' });
                    res.json({ ok: true, message: 'Signalement enregistré. Notre équipe va examiner cet événement.' });
                }
            );
        }
    );
});

// Accept organizer charter (Policy #1)
router.post('/accept-charter', requireAuth, (req, res) => {
    const db = getDB();
    db.run(`UPDATE users SET organizerCharterAccepted = 1, organizerCharterDate = ? WHERE id = ?`,
        [new Date().toISOString(), req.user.id], function(err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json({ ok: true });
        }
    );
});

// Check charter status
router.get('/charter-status', requireAuth, (req, res) => {
    const db = getDB();
    db.get(`SELECT organizerCharterAccepted FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ accepted: !!row?.organizerCharterAccepted });
    });
});

export default router;
