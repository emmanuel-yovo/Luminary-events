/**
 * Audit Log System
 * Tracks all important actions for accountability and traceability
 */

import { getDB } from '../config/database.js';

/**
 * Log an action to the audit trail
 * @param {string} userId - Who performed the action
 * @param {string} userName - Name of the user
 * @param {string} action - Action performed (e.g., 'event:create', 'user:promote')
 * @param {string} resourceType - Type of resource (e.g., 'event', 'user', 'promotion')
 * @param {string} resourceId - ID of the affected resource
 * @param {object} details - Additional details about the action
 */
export function auditLog(userId, userName, action, resourceType, resourceId, details = {}) {
    const db = getDB();
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6);
    const timestamp = new Date().toISOString();

    db.run(
        `INSERT INTO audit_logs (id, userId, userName, action, resourceType, resourceId, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, userName, action, resourceType, resourceId, JSON.stringify(details), timestamp],
        (err) => {
            if (err) console.error('Audit log error:', err);
        }
    );
}

/**
 * Retrieve audit logs with filters
 */
export function getAuditLogs(filters = {}, callback) {
    const db = getDB();
    let query = `SELECT * FROM audit_logs`;
    const conditions = [];
    const params = [];

    if (filters.userId) {
        conditions.push(`userId = ?`);
        params.push(filters.userId);
    }
    if (filters.action) {
        conditions.push(`action = ?`);
        params.push(filters.action);
    }
    if (filters.resourceType) {
        conditions.push(`resourceType = ?`);
        params.push(filters.resourceType);
    }
    if (filters.from) {
        conditions.push(`timestamp >= ?`);
        params.push(filters.from);
    }
    if (filters.to) {
        conditions.push(`timestamp <= ?`);
        params.push(filters.to);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT ${filters.limit || 100}`;

    db.all(query, params, (err, rows) => {
        if (err) return callback(err, null);
        const logs = rows.map(r => ({
            ...r,
            details: JSON.parse(r.details || '{}')
        }));
        callback(null, logs);
    });
}
