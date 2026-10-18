import type { NavItem, BusinessCategory } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import type { User, Company } from '@/types';

export const USER_ROLES = ['super_admin', 'admin', 'user'] as const;
export type Role = typeof USER_ROLES[number];

export const roleDescriptions: Record<Role, string> = {
    super_admin: "Platform Controller. Full access to all companies and global users.",
    admin: "Shop Owner. Full access to business data and settings for their workspace.",
    user: "Staff Member. Restricted module access for daily operations.",
};

/**
 * MASTER KEYS: Emails that automatically get Super Admin role.
 * Logging in with these emails grants global infrastructure control.
 */
export const MASTER_KEYS = [
    "admin@businesshub.co.ke",
    "developer@matesh.co.ke"
];

/**
 * Filter navigation items based on user role and granular permissions.
 */
export const getPermittedNavItems = (user?: User | null, company?: Company | null): NavItem[] => {
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    const bizType = (company?.businessType || 'retail') as BusinessCategory;
    
    // 1. Super Admin: Infrastructure Focus Only
    if (role === 'super_admin') {
        return [
            { id: 'super_admin', href: '/super-admin', label: 'Platform Control', icon: require('lucide-react').Globe },
        ]; 
    }

    // Base filter for standard roles: Check business type compatibility
    let items = NAV_ITEMS.filter(item => {
        if (!item.businessTypes) return true; 
        return item.businessTypes.includes(bizType);
    });

    // 2. Workspace Admin: Access to all permitted shop modules
    if (role === 'admin') {
        return items.filter(i => i.id !== 'super_admin');
    }
    
    // 3. Standard User: Respect granular permissions
    const alwaysAllowedHrefs = ['/'];
    
    return items.filter(item => {
        if (alwaysAllowedHrefs.includes(item.href)) return true;
        // Specifically block management modules for non-admins
        if (item.id === 'super_admin' || item.id === 'users' || item.id === 'settings') return false;
        return permissions.includes(item.id);
    });
};
