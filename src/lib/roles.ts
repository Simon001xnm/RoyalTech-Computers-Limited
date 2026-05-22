
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

/**
 * Filter navigation items based on user role and granular permissions.
 */
export const getPermittedNavItems = (user?: User | null, email?: string | null): NavItem[] => {
    const isMaster = isMasterKey(email);
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    
    // 1. Super Admin / Master Keys: Access to everything
    if (role === 'super_admin' || isMaster) {
        return NAV_ITEMS;
    }
    
    // 2. Workspace Admin: Access to everything except Platform Command
    if (role === 'admin') {
        return NAV_ITEMS.filter(item => item.href !== '/admin');
    }
    
    // 3. Standard User: Respect granular permissions
    // We always allow Profile/Settings and Dashboard (Home) for basic context
    const alwaysAllowedHrefs = ['/', '/profile'];
    
    return NAV_ITEMS.filter(item => {
        if (alwaysAllowedHrefs.includes(item.href)) return true;
        
        // Block restricted modules
        if (item.href === '/admin' || item.href === '/users' || item.href === '/audit') return false;
        
        // Allow if specifically ticked in permissions
        return permissions.includes(item.id);
    });
};
