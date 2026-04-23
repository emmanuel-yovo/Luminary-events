import { getDB } from '../config/database.js';

/**
 * Supprime les événements dont la date de fin (ou la date de début si pas de fin)
 * est dépassée de plus de 7 jours.
 */
const cleanupExpiredEvents = () => {
    const db = getDB();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 jours avant maintenant
    const cutoffISO = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    db.all(
        `SELECT id, title, date, endDate FROM events WHERE 
            (endDate IS NOT NULL AND endDate != '' AND endDate < ?) 
            OR (endDate IS NULL OR endDate = '') AND date < ?`,
        [cutoffISO, cutoffISO],
        (err, rows) => {
            if (err) {
                console.error('🧹 Cleanup error (fetch):', err.message);
                return;
            }

            if (!rows || rows.length === 0) return;

            const ids = rows.map(r => r.id);
            const placeholders = ids.map(() => '?').join(',');

            // Delete the events
            db.run(`DELETE FROM events WHERE id IN (${placeholders})`, ids, function (err) {
                if (err) {
                    console.error('🧹 Cleanup error (delete):', err.message);
                    return;
                }
                if (this.changes > 0) {
                    console.log(`🧹 Auto-cleanup: ${this.changes} expired event(s) removed.`);
                    rows.forEach(r => console.log(`   - "${r.title}" (expired: ${r.endDate || r.date})`));
                }
            });

            // Also clean up related favorites
            db.run(`DELETE FROM user_favorites WHERE eventId IN (${placeholders})`, ids, (err) => {
                if (err) console.error('🧹 Cleanup error (favorites):', err.message);
            });
        }
    );
};

/**
 * Démarre le job de nettoyage automatique.
 * S'exécute une fois au démarrage, puis toutes les heures.
 */
export const startCleanupJob = () => {
    // Run once at startup (after a short delay to let DB initialize)
    setTimeout(cleanupExpiredEvents, 5000);

    // Then run every hour
    const INTERVAL = 60 * 60 * 1000; // 1 hour
    setInterval(cleanupExpiredEvents, INTERVAL);

    console.log('🧹 Event cleanup job scheduled (every hour, 7 days after expiry).');
};
