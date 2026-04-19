import { getDB } from '../config/database.js';

export const getDashboardStats = (req, res) => {
    const db = getDB();
    const organizerName = req.user.name;
    const isAdmin = req.user.role === 'admin';

    // Admin sees all events, organizer sees only their own
    const query = isAdmin ? `SELECT * FROM events` : `SELECT * FROM events WHERE organizer = ?`;
    const params = isAdmin ? [] : [organizerName];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });

        let totalSales = 0;
        let ticketsSold = 0;
        let totalCapacity = 0;
        
        // Mock weekly data for the chart, but we will adjust it slightly to show dynamics
        const weeklyData = [
          { name: 'Lun', sales: 0, attendees: 0 },
          { name: 'Mar', sales: 0, attendees: 0 },
          { name: 'Mer', sales: 0, attendees: 0 },
          { name: 'Jeu', sales: 0, attendees: 0 },
          { name: 'Ven', sales: 0, attendees: 0 },
          { name: 'Sam', sales: 0, attendees: 0 },
          { name: 'Dim', sales: 0, attendees: 0 },
        ];

        rows.forEach(row => {
            try {
                const tickets = JSON.parse(row.tickets || '[]');
                tickets.forEach(t => {
                    const price = Number(t.price) || 0;
                    const sold = Number(t.sold) || 0;
                    const qty = Number(t.quantity) || 0;

                    ticketsSold += sold;
                    totalSales += (price * sold);
                    totalCapacity += qty;
                    
                    // Distribute across days artificially for the demo
                    weeklyData.forEach((day, index) => {
                       // Distribute random sales based on actual totals
                       day.sales += Math.floor((price * sold) / 7) + (Math.random() * 50);
                       day.attendees += Math.floor(sold / 7) + (Math.random() * 5);
                    });
                });
            } catch (e) {
                // Ignore malformed tickets
            }
        });

        const fillRate = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;
        const avgRevenue = ticketsSold > 0 ? Math.round(totalSales / ticketsSold) : 0;

        res.json({
            stats: [
                { label: 'Ventes Totales', value: totalSales.toLocaleString('fr-FR') + '€', trend: '+12%', color: 'from-indigo-500 to-purple-600' },
                { label: 'Billets Vendus', value: ticketsSold.toString(), trend: '+5%', color: 'from-pink-500 to-rose-600' },
                { label: 'Taux de Remplissage', value: fillRate + '%', trend: '+8%', color: 'from-emerald-500 to-teal-600' },
                { label: 'Revenu Moyen', value: avgRevenue + '€', trend: '-2%', color: 'from-amber-500 to-orange-600' }
            ],
            chartData: weeklyData.map(d => ({ ...d, sales: Math.round(d.sales), attendees: Math.round(d.attendees) })),
            events: rows.map(r => ({ ...r, tickets: JSON.parse(r.tickets || '[]') })) // Parse tickets for frontend
        });
    });
};
