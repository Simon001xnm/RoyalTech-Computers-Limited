import type { NavItem, BusinessCategory } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import type { User, Company } from '@/types';

export const USER_ROLES = ['admin', 'user', 'super_admin'] as const;
export type Role = typeof USER_ROLES[number];

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
 * Filter navigation items based on user role, granular permissions, and business type.
 */
export const getPermittedNavItems = (user?: User | null, email?: string | null, company?: Company | null): NavItem[] => {
    const isMaster = isMasterKey(email);
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    const bizType = (company?.businessType || 'retail') as BusinessCategory;
    
    // Base filter: Check business type compatibility
    let items = NAV_ITEMS.filter(item => {
        if (!item.businessTypes) return true; // Universal
        return item.businessTypes.includes(bizType);
    });

    // 1. Super Admin / Master Keys: Access to all filtered by bizType
    if (role === 'super_admin' || isMaster) {
        return items;
    }
    
    // 2. Workspace Admin: Access to everything except Platform Command
    if (role === 'admin') {
        return items.filter(item => item.href !== '/admin');
    }
    
    // 3. Standard User: Respect granular permissions
    const alwaysAllowedHrefs = ['/', '/profile'];
    
    return items.filter(item => {
        if (alwaysAllowedHrefs.includes(item.href)) return true;
        if (item.href === '/admin' || item.href === '/users' || item.href === '/audit') return false;
        return permissions.includes(item.id);
    });
};
