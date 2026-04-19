export const requireAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
};

export const requireOrganizer = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
            return next();
        }
        return res.status(403).json({ error: 'Access denied: Organizer or Admin role required' });
    }
    return res.status(401).json({ error: 'Not authenticated' });
};

export const requireAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        return res.status(403).json({ error: 'Access denied: Admin role required' });
    }
    return res.status(401).json({ error: 'Not authenticated' });
};
