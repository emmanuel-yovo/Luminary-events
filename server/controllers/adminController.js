import { getDB } from '../config/database.js';
import { auditLog } from '../utils/auditLog.js';

export const getGlobalStats = (req, res) => {
    const db = getDB();
    db.all(`SELECT * FROM users`, (err, users) => {
        if (err) return res.status(500).json({ error: 'DB error users' });
        
        db.all(`SELECT * FROM events`, (err, events) => {
            if (err) return res.status(500).json({ error: 'DB error events' });
            
            let totalRevenue = 0;
            let totalTicketsSold = 0;

            events.forEach(row => {
                try {
                    const tickets = JSON.parse(row.tickets || '[]');
                    tickets.forEach(t => {
                        const price = Number(t.price) || 0;
                        const sold = Number(t.sold) || 0;
                        totalTicketsSold += sold;
                        totalRevenue += (price * sold);
                    });
                } catch(e) {}
            });

            res.json({
                totalUsers: users.length,
                totalEvents: events.length,
                totalTicketsSold,
                totalRevenue
            });
        });
    });
};

export const getAllUsers = (req, res) => {
    const db = getDB();
    db.all(`SELECT id, name, email, role, tickets FROM users`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        const users = rows.map(u => ({
            ...u,
            tickets: JSON.parse(u.tickets || '[]')
        }));
        res.json(users);
    });
};

export const deleteUser = (req, res) => {
    const db = getDB();
    const userId = req.params.id;

    // Protection: Ne pas s'hyppodamiser (se supprimer soi-même) ou supprimer le Super Admin principal
    if (userId === req.user.id || userId === 'admin-system-id') {
         return res.status(403).json({ error: 'Cannot delete yourself or the primary admin account.' });
    }

    db.run(`DELETE FROM users WHERE id=?`, [userId], function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        auditLog(req.user.id, req.user.name, 'user:delete', 'user', userId, {});
        res.json({ ok: true });
    });
};

export const updateUserRole = (req, res) => {
    const db = getDB();
    const userId = req.params.id;
    const { role } = req.body;

    if (!['attendee', 'organizer', 'admin'].includes(role)) {
         return res.status(400).json({ error: 'Invalid role.' });
    }
    
    if (userId === 'admin-system-id' && role !== 'admin') {
         return res.status(403).json({ error: 'Cannot demote the primary admin account.' });
    }

    db.run(`UPDATE users SET role=? WHERE id=?`, [role, userId], function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        auditLog(req.user.id, req.user.name, 'user:update_role', 'user', userId, { newRole: role });
        res.json({ ok: true });
    });
};

// Toggle "isFeatured" property of an event
export const toggleEventFeatured = (req, res) => {
    const db = getDB();
    const eventId = req.params.id;
    
    db.get(`SELECT isFeatured FROM events WHERE id=?`, [eventId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Event not found' });
        const newValue = row.isFeatured ? 0 : 1;
        db.run(`UPDATE events SET isFeatured=? WHERE id=?`, [newValue, eventId], function(err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            auditLog(req.user.id, req.user.name, 'event:feature_toggle', 'event', eventId, { isFeatured: !!newValue });
            res.json({ ok: true, isFeatured: !!newValue });
        });
    });
};
