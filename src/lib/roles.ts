
import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import { isFeatureEnabled } from '@/lib/feature-flags';

// The canonical list of user roles.
export const USER_ROLES = ['admin', 'user', 'super_admin'] as const;

// Type definition for a user role.
export type Role = typeof USER_ROLES[number];

// Descriptions for each role, used in the user creation form.
export const roleDescriptions: Record<Role, string> = {
    admin: "Tenant Owner. Full access to their company's data and user management.",
    user: "Standard Employee. Can perform day-to-day operations but cannot manage workspace settings.",
    super_admin: "Platform Technician. Global access for support and SaaS management.",
};

/**
 * Defines which navigation items (modules) each role can see.
 * CRITICAL: Super Admin View is now completely distinct from Tenant View.
 */
const getRolePermissions = (role: Role | string): string[] => {
    // 1. SUPER ADMIN: Only sees Platform-level controls.
    if (role === 'super_admin') {
        return [
            '/admin',     // Platform Nerve Center
            '/audit',     // Global Audit Trail
            '/desk',      // Global Support Oversight
            '/users',     // System User Management (Global)
            '/profile',   // Platform Settings
        ];
    }
    
    // 2. ADMIN (Tenant Owner): Full Retail/ERP Suite for their specific workspace.
    if (role === 'admin') {
        const baseNav = NAV_ITEMS.map(item => item.href);
        // Exclude the Super Admin Command Center
        return baseNav.filter(href => href !== '/admin');
    }
    
    // 3. USER (Staff) or UNKNOWN: Daily Operations only.
    return [
        '/',
        '/pos',
        '/stock',
        '/accessories',
        '/customers',
        '/documents',
        '/tracking',
        '/salesiq',
        '/projects',
        '/profile'
    ];
};


/**
 * Returns the list of navigation items that the user with the given role is permitted to see.
 */
export const getPermittedNavItems = (role?: Role | string, isAnonymous: boolean = false): NavItem[] => {
    // Robust fallback: if role is missing, treat as 'user' to ensure navbar content
    const effectiveRole = role || 'user';
    const permissions = getRolePermissions(effectiveRole);
    
    return NAV_ITEMS.filter(item => {
        // Special check for the Admin Panel which is also feature-flagged
        if (item.href === '/admin' && !isFeatureEnabled('SUPER_ADMIN_PANEL')) {
            return false;
        }
        return permissions.includes(item.href);
    });
};
