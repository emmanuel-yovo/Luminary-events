import { getDB } from '../config/database.js';
import { detectDuplicate } from '../utils/duplicateDetection.js';
import { can, canActOnEvent, getRateLimit } from '../utils/rbac.js';
import { auditLog } from '../utils/auditLog.js';
import { v4 as uuidv4 } from 'uuid';
import { validateEventInput, sanitize } from '../utils/validation.js';

export const getAllEvents = (req, res) => {
    const db = getDB();
    // Public: only approved events. If user is logged in, also include their own pending events.
    const userId = req.user?.id;
    let query, params;
    
    if (userId) {
        query = `SELECT * FROM events WHERE status = 'approved' OR organizerId = ?`;
        params = [userId];
    } else {
        query = `SELECT * FROM events WHERE status = 'approved'`;
        params = [];
    }
    
    db.all(query, params, (err, rows) => {
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
};

export const createEvent = (req, res) => {
    let { title, description, date, endDate, location, country, city, neighborhood, latitude, longitude, image, category, tickets } = req.body;
    
    if (typeof tickets === 'string') {
        try { tickets = JSON.parse(tickets); } catch (e) { tickets = []; }
    }

    if (req.file) {
        // Cloudinary returns full URL in req.file.path, disk storage uses filename
        image = req.file.path || `/uploads/${req.file.filename}`;
    }

    // Server-side validation
    const validation = validateEventInput({ title, date, endDate, location, category, tickets });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(' ') });
    }

    // Sanitize text inputs
    title = sanitize(title, 200);
    description = sanitize(description, 5000);
    location = sanitize(location, 300);
    country = sanitize(country, 100);
    city = sanitize(city, 100);
    neighborhood = sanitize(neighborhood, 100);

    const db = getDB();
    const organizer = req.user.name;
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // Rate limiting: check how many events this user created this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    const limit = getRateLimit(req.user);

    db.get(
        `SELECT COUNT(*) as count FROM events WHERE organizer = ? AND date >= ?`,
        [organizer, monthAgoStr],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            
            if (row.count >= limit) {
                return res.status(429).json({ 
                    error: `Limite atteinte : ${limit} événements par mois. Vous en avez déjà ${row.count}.` 
                });
            }

            // Hybrid duplicate detection
            db.all(`SELECT title, date, endDate, location, city, country, category, latitude, longitude FROM events`, [], (err, existingEvents) => {
                if (err) return res.status(500).json({ error: 'DB error' });

                const newEvent = { title, date, endDate, location, city, country, category, latitude: lat, longitude: lng };
                const result = detectDuplicate(newEvent, existingEvents);

                if (result.isDuplicate) {
                    return res.status(409).json({ error: result.reason, confidence: result.confidence });
                }

                const id = uuidv4();
                // Auto-approve for admins, pending for others
                const status = req.user.role === 'admin' ? 'approved' : 'pending';
                db.run(
                    `INSERT INTO events (id, title, description, date, endDate, location, country, city, neighborhood, latitude, longitude, image, category, organizer, organizerId, tickets, coOrganizers, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, title, description, date, endDate || null, location, country || '', city || '', neighborhood || '', lat, lng, image, category, organizer, req.user.id, JSON.stringify(tickets || []), '[]', status],
                    function (err) {
                        if (err) return res.status(500).json({ error: 'DB error' });
                        
                        // Audit log
                        auditLog(req.user.id, req.user.name, 'event:create', 'event', id, { title, category, location });
                        
                        res.json({ id });
                    }
                );
            });
        }
    );
};

export const updateEvent = (req, res) => {
    const eventId = req.params.id;
    let { title, description, date, endDate, location, country, city, neighborhood, latitude, longitude, image, category, tickets } = req.body;
    
    if (typeof tickets === 'string') {
        try { tickets = JSON.parse(tickets); } catch (e) { tickets = []; }
    }

    if (req.file) {
        // Cloudinary returns full URL in req.file.path, disk storage uses filename
        image = req.file.path || `/uploads/${req.file.filename}`;
    }

    const db = getDB();

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // RBAC check with co-organizer support
        if (!canActOnEvent(req.user, event, 'edit')) {
            return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres événements.' });
        }

        db.run(`UPDATE events SET title=?, description=?, date=?, endDate=?, location=?, country=?, city=?, neighborhood=?, latitude=?, longitude=?, image=?, category=?, tickets=? WHERE id=?`,
            [title, description, date, endDate || null, location, country || '', city || '', neighborhood || '', latitude || null, longitude || null, image, category, JSON.stringify(tickets || []), eventId], function (err) {
                if (err) return res.status(500).json({ error: 'DB error' });
                
                auditLog(req.user.id, req.user.name, 'event:update', 'event', eventId, { title });
                
                res.json({ ok: true, id: eventId });
            });
    });
};

export const deleteEvent = (req, res) => {
    const eventId = req.params.id;
    const db = getDB();

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // RBAC check
        if (!canActOnEvent(req.user, event, 'delete')) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres événements.' });
        }

        db.run(`DELETE FROM events WHERE id=?`, [eventId], function (err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            
            auditLog(req.user.id, req.user.name, 'event:delete', 'event', eventId, { title: event.title });
            
            res.json({ ok: true });
        });
    });
};

// Co-organizer management
export const addCoOrganizer = (req, res) => {
    const eventId = req.params.id;
    const { email } = req.body;
    const db = getDB();

    if (!email) return res.status(400).json({ error: 'Email requis' });

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Only owner can manage co-organizers
        if (req.user.role !== 'admin' && event.organizer !== req.user.name) {
            return res.status(403).json({ error: 'Seul le créateur peut ajouter des co-organisateurs.' });
        }

        // Find the user to add
        db.get(`SELECT id, name, email, role FROM users WHERE email = ?`, [email.toLowerCase().trim()], (err, targetUser) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            if (!targetUser) return res.status(404).json({ error: 'Utilisateur introuvable avec cet email.' });
            if (targetUser.role === 'attendee') return res.status(400).json({ error: 'Cet utilisateur n\'est pas organisateur.' });

            const coOrganizers = JSON.parse(event.coOrganizers || '[]');
            
            if (coOrganizers.some(co => co.userId === targetUser.id)) {
                return res.status(400).json({ error: 'Cet utilisateur est déjà co-organisateur.' });
            }

            coOrganizers.push({
                userId: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                addedAt: new Date().toISOString()
            });

            db.run(`UPDATE events SET coOrganizers = ? WHERE id = ?`, [JSON.stringify(coOrganizers), eventId], (err) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                
                auditLog(req.user.id, req.user.name, 'event:add_coorganizer', 'event', eventId, { 
                    coOrganizerEmail: targetUser.email, coOrganizerName: targetUser.name 
                });
                
                res.json({ ok: true, coOrganizers });
            });
        });
    });
};

export const removeCoOrganizer = (req, res) => {
    const eventId = req.params.id;
    const { userId } = req.body;
    const db = getDB();

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (req.user.role !== 'admin' && event.organizer !== req.user.name) {
            return res.status(403).json({ error: 'Seul le créateur peut retirer des co-organisateurs.' });
        }

        const coOrganizers = JSON.parse(event.coOrganizers || '[]');
        const filtered = coOrganizers.filter(co => co.userId !== userId);

        db.run(`UPDATE events SET coOrganizers = ? WHERE id = ?`, [JSON.stringify(filtered), eventId], (err) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            
            auditLog(req.user.id, req.user.name, 'event:remove_coorganizer', 'event', eventId, { removedUserId: userId });
            
            res.json({ ok: true, coOrganizers: filtered });
        });
    });
};

export const buyTicket = (req, res) => {
    const eventId = req.params.id;
    const { ticketId } = req.body;
    const db = getDB();

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Event not found' });
        
        let tickets;
        try {
            tickets = JSON.parse(row.tickets || '[]');
        } catch (e) {
            return res.status(500).json({ error: 'Invalid tickets data' });
        }
        
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket || ticket.quantity <= ticket.sold) return res.status(400).json({ error: 'Ticket unavailable' });
        
        ticket.sold += 1;
        db.run(`UPDATE events SET tickets = ? WHERE id = ?`, [JSON.stringify(tickets), eventId]);
        
        const userTickets = JSON.parse(req.user.tickets || '[]');
        userTickets.push({ eventId, ticketTypeId: ticketId, qrCode: 'simulated-qr-' + Date.now() });
        
        db.run(`UPDATE users SET tickets = ? WHERE id = ?`, [JSON.stringify(userTickets), req.user.id], function(updateErr) {
             if (updateErr) return res.status(500).json({ error: 'Failed to update user' });
             
             auditLog(req.user.id, req.user.name, 'ticket:purchase', 'event', eventId, { ticketId, eventTitle: row.title });
             
             res.json({ ok: true });
        });
    });
};

// ─── FAVORITES ───
export const toggleFavorite = (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    const db = getDB();

    db.get(`SELECT * FROM user_favorites WHERE userId = ? AND eventId = ?`, [userId, eventId], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });

        if (row) {
            db.run(`DELETE FROM user_favorites WHERE userId = ? AND eventId = ?`, [userId, eventId], (err) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                res.json({ ok: true, favorited: false });
            });
        } else {
            db.run(`INSERT INTO user_favorites (userId, eventId, createdAt) VALUES (?, ?, ?)`, [userId, eventId, new Date().toISOString()], (err) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                res.json({ ok: true, favorited: true });
            });
        }
    });
};

// ─── SCANNER ───
export const scanTicket = (req, res) => {
    const eventId = req.params.id;
    const { qrCode } = req.body;
    const db = getDB();

    if (!qrCode) return res.status(400).json({ error: 'QR Code manquant' });

    db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err || !event) return res.status(404).json({ error: 'Event not found' });
        
        // RBAC Check (only organizers/co-organizers can scan)
        if (!canActOnEvent(req.user, event, 'edit')) {
            return res.status(403).json({ error: 'Non autorisé à scanner pour cet événement' });
        }

        db.get(`SELECT * FROM users WHERE tickets LIKE ?`, [`%${qrCode}%`], (err, userWithTicket) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            if (!userWithTicket) return res.status(404).json({ error: 'Billet introuvable (QR Code invalide)' });

            const tickets = JSON.parse(userWithTicket.tickets || '[]');
            const ticketIndex = tickets.findIndex(t => t.qrCode === qrCode && t.eventId === eventId);

            if (ticketIndex === -1) return res.status(404).json({ error: 'Ce billet n\'est pas pour cet événement' });
            
            if (tickets[ticketIndex].scanned) {
                return res.status(400).json({ error: 'ATTENTION : Ce billet a déjà été scanné !' });
            }

            // Mark as scanned
            tickets[ticketIndex].scanned = true;
            tickets[ticketIndex].scannedAt = new Date().toISOString();

            db.run(`UPDATE users SET tickets = ? WHERE id = ?`, [JSON.stringify(tickets), userWithTicket.id], (err) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                res.json({ ok: true, message: 'Billet validé !', attendee: userWithTicket.name });
            });
        });
    });
};
