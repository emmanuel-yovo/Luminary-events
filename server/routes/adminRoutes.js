import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import { getGlobalStats, getAllUsers, deleteUser, updateUserRole, toggleEventFeatured } from '../controllers/adminController.js';
import { deleteEvent } from '../controllers/eventController.js';
import { getAuditLogs } from '../utils/auditLog.js';
import { getAllPermissions, getDefaultPermissions } from '../utils/rbac.js';
import { getDB } from '../config/database.js';
import { auditLog } from '../utils/auditLog.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// Dashboard / Stats
router.get('/stats', getGlobalStats);

// Users Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);

// User permissions management
router.get('/permissions/available', (req, res) => {
    res.json({ 
        permissions: getAllPermissions(),
        defaults: {
            attendee: getDefaultPermissions('attendee'),
            organizer: getDefaultPermissions('organizer'),
            admin: getDefaultPermissions('admin')
        }
    });
});

router.put('/users/:id/permissions', (req, res) => {
    const { granted, revoked } = req.body;
    const db = getDB();
    const userId = req.params.id;
    
    const permissions = JSON.stringify({ granted: granted || [], revoked: revoked || [] });
    
    db.run(`UPDATE users SET permissions = ? WHERE id = ?`, [permissions, userId], (err) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ ok: true });
    });
});

// Global Event Management
router.delete('/events/:id', deleteEvent); 
router.put('/events/:id/feature', toggleEventFeatured);

// Audit Logs
router.get('/audit-logs', (req, res) => {
    const { userId, action, resourceType, limit } = req.query;
    getAuditLogs({ userId, action, resourceType, limit: parseInt(limit) || 100 }, (err, logs) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(logs);
    });
});

// Event Moderation: Get ALL events (including pending)
router.get('/events/all', (req, res) => {
    const db = getDB();
    db.all(`SELECT * FROM events ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        const events = rows.map(row => ({
            ...row,
            tickets: JSON.parse(row.tickets || '[]'),
            coOrganizers: JSON.parse(row.coOrganizers || '[]'),
            isFeatured: !!row.isFeatured,
            status: row.status || 'approved'
        }));
        res.json(events);
    });
});

// Event Moderation: Approve
router.put('/events/:id/approve', (req, res) => {
    const db = getDB();
    db.run(`UPDATE events SET status = 'approved' WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
        auditLog(req.user.id, req.user.name, 'event:approve', 'event', req.params.id, {});
        res.json({ ok: true });
    });
});

// Event Moderation: Reject
router.put('/events/:id/reject', (req, res) => {
    const { reason } = req.body;
    const db = getDB();
    db.run(`UPDATE events SET status = 'rejected' WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
        auditLog(req.user.id, req.user.name, 'event:reject', 'event', req.params.id, { reason: reason || '' });
        res.json({ ok: true });
    });
});

// Reports Management (Policy #7)
router.get('/reports', (req, res) => {
    const db = getDB();
    db.all(`SELECT r.*, e.title as eventTitle FROM reports r LEFT JOIN events e ON r.eventId = e.id ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
});

router.put('/reports/:id/resolve', (req, res) => {
    const db = getDB();
    db.run(`UPDATE reports SET status = 'resolved', reviewedAt = ?, reviewedBy = ? WHERE id = ?`,
        [new Date().toISOString(), req.user.name, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            auditLog(req.user.id, req.user.name, 'report:resolve', 'report', req.params.id, {});
            res.json({ ok: true });
        }
    );
});

router.put('/reports/:id/dismiss', (req, res) => {
    const db = getDB();
    db.run(`UPDATE reports SET status = 'dismissed', reviewedAt = ?, reviewedBy = ? WHERE id = ?`,
        [new Date().toISOString(), req.user.name, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            auditLog(req.user.id, req.user.name, 'report:dismiss', 'report', req.params.id, {});
            res.json({ ok: true });
        }
    );
});

export default router;
