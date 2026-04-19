/**
 * RBAC (Role-Based Access Control) + Granular Permissions System
 * Centralized permission management for Luminary Events
 */

// Default permissions per role
const ROLE_PERMISSIONS = {
    attendee: [
        'event:view',
        'event:buy_ticket',
        'profile:view',
        'profile:edit',
        'promotion:request'
    ],
    organizer: [
        'event:view',
        'event:buy_ticket',
        'event:create',
        'event:edit_own',
        'event:delete_own',
        'event:manage_coorganizers',
        'dashboard:view_own',
        'profile:view',
        'profile:edit'
    ],
    admin: [
        'event:view',
        'event:buy_ticket',
        'event:create',
        'event:edit_own',
        'event:edit_any',
        'event:delete_own',
        'event:delete_any',
        'event:feature',
        'event:manage_coorganizers',
        'dashboard:view_own',
        'dashboard:view_all',
        'users:view',
        'users:edit_role',
        'users:delete',
        'users:manage_permissions',
        'promotion:manage',
        'audit:view',
        'profile:view',
        'profile:edit',
        'admin:access'
    ]
};

// Rate limits per role (events per month)
const RATE_LIMITS = {
    attendee: 0,
    organizer: 10,
    admin: Infinity
};

/**
 * Check if a user has a specific permission
 * Checks both role defaults and custom per-user permissions
 */
export function can(user, permission) {
    if (!user) return false;
    
    // Get role-based defaults
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    
    // Get custom per-user permissions (overrides)
    let customPerms = [];
    let revokedPerms = [];
    
    if (user.permissions) {
        try {
            const parsed = typeof user.permissions === 'string' 
                ? JSON.parse(user.permissions) 
                : user.permissions;
            customPerms = parsed.granted || [];
            revokedPerms = parsed.revoked || [];
        } catch (e) {
            // Ignore malformed permissions
        }
    }
    
    // A permission is granted if: (in role defaults OR custom granted) AND NOT revoked
    if (revokedPerms.includes(permission)) return false;
    return rolePerms.includes(permission) || customPerms.includes(permission);
}

/**
 * Check if user can act on a specific event (ownership check)
 * Handles co-organizers as well
 */
export function canActOnEvent(user, event, action) {
    if (!user || !event) return false;
    
    // Admin with edit_any/delete_any
    if (action === 'edit' && can(user, 'event:edit_any')) return true;
    if (action === 'delete' && can(user, 'event:delete_any')) return true;
    
    // Check ownership (organizer name match)
    const isOwner = event.organizer === user.name;
    
    // Check co-organizer status
    let isCoOrganizer = false;
    if (event.coOrganizers) {
        try {
            const coOrgs = typeof event.coOrganizers === 'string' 
                ? JSON.parse(event.coOrganizers) 
                : event.coOrganizers;
            isCoOrganizer = coOrgs.some(co => co.userId === user.id || co.email === user.email);
        } catch (e) {}
    }
    
    if (action === 'edit') return (isOwner || isCoOrganizer) && can(user, 'event:edit_own');
    if (action === 'delete') return isOwner && can(user, 'event:delete_own'); // Only owner can delete, not co-organizer
    
    return false;
}

/**
 * Get rate limit for a user's role
 */
export function getRateLimit(user) {
    if (!user) return 0;
    return RATE_LIMITS[user.role] ?? 0;
}

/**
 * Get all available permissions (for admin UI)
 */
export function getAllPermissions() {
    const allPerms = new Set();
    Object.values(ROLE_PERMISSIONS).forEach(perms => {
        perms.forEach(p => allPerms.add(p));
    });
    return [...allPerms].sort();
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Express middleware: requires a specific permission
 */
export function authorize(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        if (!can(req.user, permission)) {
            return res.status(403).json({ 
                error: `Permission refusée: ${permission}`,
                required: permission 
            });
        }
        next();
    };
}

export { ROLE_PERMISSIONS, RATE_LIMITS };
