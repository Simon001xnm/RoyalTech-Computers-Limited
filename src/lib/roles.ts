import type { NavItem, BusinessCategory } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import type { User, Company } from '@/types';

export const USER_ROLES = ['admin', 'user'] as const;
export type Role = typeof USER_ROLES[number];

export const roleDescriptions: Record<Role, string> = {
    admin: "Shop Owner. Full access to business data and settings.",
    user: "Staff Member. Restricted module access for daily operations.",
};

/**
 * Filter navigation items based on user role and granular permissions.
 */
export const getPermittedNavItems = (user?: User | null, company?: Company | null): NavItem[] => {
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    const bizType = (company?.businessType || 'retail') as BusinessCategory;
    
    // Base filter: Check business type compatibility
    let items = NAV_ITEMS.filter(item => {
        if (!item.businessTypes) return true; 
        return item.businessTypes.includes(bizType);
    });

    // 1. Workspace Admin: Access to all permitted modules
    if (role === 'admin') {
        return items;
    }
    
    // 2. Standard User: Respect granular permissions
    const alwaysAllowedHrefs = ['/', '/profile'];
    
    return items.filter(item => {
        if (alwaysAllowedHrefs.includes(item.href)) return true;
        if (item.href === '/users' || item.href === '/audit') return false;
        return permissions.includes(item.id);
    });
};
