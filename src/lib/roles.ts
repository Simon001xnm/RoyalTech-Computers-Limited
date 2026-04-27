import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const USER_ROLES = ['admin', 'user', 'super_admin'] as const;
export type Role = typeof USER_ROLES[number];

/**
 * MASTER_KEYS: Hardcoded identities that are definitively recognized as Super Admins
 * to prevent role-reversion issues during cloud sync delays.
 */
export const MASTER_KEYS = [
    "info@simonatyles.co.ke",
    "master@royaltech.com", 
    "admin@royaltech.com"
];

export const roleDescriptions: Record<Role, string> = {
    admin: "Tenant Owner. Full access to their company's data and workspace settings.",
    user: "Standard Employee. Can perform day-to-day operations but cannot manage workspace branding.",
    super_admin: "Platform Technician. Global oversight for infrastructure maintenance.",
};

const getRolePermissions = (role: Role | string, email?: string | null): string[] => {
    // Definitive fallback for master keys to ensure Technicians are never locked out
    const isMaster = email && MASTER_KEYS.includes(email.toLowerCase());
    
    if (role === 'super_admin' || isMaster) {
        return [
            '/admin',
            '/audit',
            '/desk',
            '/users',
            '/profile',
            '/reports',
            '/',
            '/pos',
            '/stock',
            '/accessories',
            '/customers',
            '/documents',
            '/tracking',
            '/salesiq',
            '/projects',
            '/campaigns',
            '/resellers',
            '/recruit'
        ];
    }
    
    if (role === 'admin') {
        return NAV_ITEMS.map(i => i.href).filter(h => h !== '/admin');
    }
    
    // Standard User (Staff)
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

export const getPermittedNavItems = (role?: Role | string, email?: string | null): NavItem[] => {
    const effectiveRole = role || 'user';
    const permissions = getRolePermissions(effectiveRole, email);
    
    return NAV_ITEMS.filter(item => {
        if (item.href === '/admin' && !isFeatureEnabled('SUPER_ADMIN_PANEL')) return false;
        return permissions.includes(item.href);
    });
};
