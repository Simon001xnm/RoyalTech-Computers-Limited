
import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { User } from '@/types';

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
    user: "Standard Employee. Can perform day-to-day operations with restricted module access.",
    super_admin: "Platform Technician. Global oversight for infrastructure maintenance.",
};

export const isMasterKey = (email?: string | null): boolean => {
    if (!email) return false;
    return MASTER_KEYS.includes(email.toLowerCase());
};

export const getPermittedNavItems = (user?: User | null, email?: string | null): NavItem[] => {
    const isMaster = isMasterKey(email);
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    
    // Super Admin (Master Keys): Everything
    if (role === 'super_admin' || isMaster) {
        return NAV_ITEMS;
    }
    
    // Workspace Admin: Everything except Platform Command
    if (role === 'admin') {
        return NAV_ITEMS.filter(item => item.href !== '/admin');
    }
    
    // Standard User: Respect granular permissions
    if (permissions.length > 0) {
        return NAV_ITEMS.filter(item => {
            // Profile and Dashboard are always visible for base context
            if (item.href === '/profile' || item.href === '/') return true;
            // Filter based on the selected IDs in the User record
            return permissions.includes(item.id);
        });
    }

    // Default restricted set for 'user' with no specific permissions defined
    const defaultUserHrefs = [
        '/',
        '/pos',
        '/stock',
        '/customers',
        '/documents',
        '/profile'
    ];
    
    return NAV_ITEMS.filter(item => defaultUserHrefs.includes(item.href));
};
