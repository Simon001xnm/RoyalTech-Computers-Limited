import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const USER_ROLES = ['admin', 'user', 'super_admin'] as const;
export type Role = typeof USER_ROLES[number];

/**
 * MASTER_KEYS: Hardcoded identities restricted to exactly 2 authorized emails.
 * These bypass cloud database checks for instant, zero-latency admin access.
 */
export const MASTER_KEYS = [
    "info@simonstyless.co.ke",
    "master@businesshub.co.ke"
];

export const roleDescriptions: Record<Role, string> = {
    admin: "Tenant Owner. Full access to their company's data and workspace settings.",
    user: "Standard Employee. Can perform day-to-day operations but cannot manage workspace branding.",
    super_admin: "Platform Technician. Global oversight for infrastructure maintenance.",
};

export const isMasterKey = (email?: string | null): boolean => {
    if (!email) return false;
    return MASTER_KEYS.includes(email.toLowerCase());
};

const getRolePermissions = (role: Role | string, email?: string | null): string[] => {
    const isMaster = isMasterKey(email);
    
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
            '/resellers'
        ];
    }
    
    if (role === 'admin') {
        return NAV_ITEMS.map(i => i.href).filter(h => h !== '/admin');
    }
    
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
        // Explicitly hide admin from public list to maintain anonymity
        if (item.href === '/admin') return false; 
        return permissions.includes(item.href);
    });
};
