import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const USER_ROLES = ['admin', 'user', 'super_admin'] as const;
export type Role = typeof USER_ROLES[number];

export const roleDescriptions: Record<Role, string> = {
    admin: "Tenant Owner. Full access to their company's data and workspace settings.",
    user: "Standard Employee. Can perform day-to-day operations but cannot manage workspace branding.",
    super_admin: "Platform Technician. Global oversight for infrastructure maintenance.",
};

const getRolePermissions = (role: Role | string): string[] => {
    if (role === 'super_admin') {
        return [
            '/admin',
            '/audit',
            '/desk',
            '/users',
            '/profile',
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

export const getPermittedNavItems = (role?: Role | string): NavItem[] => {
    const effectiveRole = role || 'user';
    const permissions = getRolePermissions(effectiveRole);
    
    return NAV_ITEMS.filter(item => {
        if (item.href === '/admin' && !isFeatureEnabled('SUPER_ADMIN_PANEL')) return false;
        return permissions.includes(item.href);
    });
};