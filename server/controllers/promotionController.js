import { getDB } from '../config/database.js';
import { auditLog } from '../utils/auditLog.js';
import { v4 as uuidv4 } from 'uuid';
import { sanitize } from '../utils/validation.js';

// User requests promotion to organizer
export const requestPromotion = (req, res) => {
    const db = getDB();
    const user = req.user;
    const message = sanitize(req.body.message, 1000);

    if (user.role === 'organizer' || user.role === 'admin') {
        return res.status(400).json({ error: 'Vous êtes déjà organisateur ou admin.' });
    }

    // Check for existing pending request
    db.get(`SELECT id FROM promotion_requests WHERE userId = ? AND status = 'pending'`, [user.id], (err, existing) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (existing) return res.status(400).json({ error: 'Une demande est déjà en attente.' });

        const id = uuidv4();
        db.run(
            `INSERT INTO promotion_requests (id, userId, userName, userEmail, message, status, requestDate) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
            [id, user.id, user.name, user.email, message, new Date().toISOString()],
            function (err) {
                if (err) return res.status(500).json({ error: 'DB error' });
                auditLog(user.id, user.name, 'promotion:request', 'promotion', id, { message });
                res.json({ ok: true, id });
            }
        );
    });
};

// Get current user's promotion request status
export const getMyRequestStatus = (req, res) => {
    const db = getDB();
    db.get(
        `SELECT * FROM promotion_requests WHERE userId = ? ORDER BY requestDate DESC LIMIT 1`,
        [req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json(row || null);
        }
    );
};

// Admin: get all pending requests
export const getAllRequests = (req, res) => {
    const db = getDB();
    db.all(`SELECT * FROM promotion_requests ORDER BY requestDate DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
};

// Admin: approve a request
export const approveRequest = (req, res) => {
    const db = getDB();
    const requestId = req.params.id;

    db.get(`SELECT * FROM promotion_requests WHERE id = ?`, [requestId], (err, request) => {
        if (err || !request) return res.status(404).json({ error: 'Demande introuvable' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Demande déjà traitée.' });

        // Update user role to organizer
        db.run(`UPDATE users SET role = 'organizer' WHERE id = ?`, [request.userId], (err) => {
            if (err) return res.status(500).json({ error: 'DB error' });

            // Mark request as approved
            db.run(
                `UPDATE promotion_requests SET status = 'approved', reviewDate = ? WHERE id = ?`,
                [new Date().toISOString(), requestId],
                (err) => {
                    if (err) return res.status(500).json({ error: 'DB error' });
                    auditLog(req.user.id, req.user.name, 'promotion:approve', 'promotion', requestId, { promotedUser: request.userName });
                    res.json({ ok: true });
                }
            );
        });
    });
};

// Admin: reject a request
export const rejectRequest = (req, res) => {
    const db = getDB();
    const requestId = req.params.id;

    db.get(`SELECT * FROM promotion_requests WHERE id = ?`, [requestId], (err, request) => {
        if (err || !request) return res.status(404).json({ error: 'Demande introuvable' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Demande déjà traitée.' });

        db.run(
            `UPDATE promotion_requests SET status = 'rejected', reviewDate = ? WHERE id = ?`,
            [new Date().toISOString(), requestId],
            (err) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                auditLog(req.user.id, req.user.name, 'promotion:reject', 'promotion', requestId, { rejectedUser: request.userName });
                res.json({ ok: true });
            }
        );
    });
};
