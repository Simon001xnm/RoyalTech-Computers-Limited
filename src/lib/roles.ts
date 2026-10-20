import type { NavItem, BusinessCategory } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import type { User, Company } from '@/types';

export const USER_ROLES = ['super_admin', 'admin', 'user'] as const;
export type Role = typeof USER_ROLES[number];

export const roleDescriptions: Record<Role, string> = {
    super_admin: "Master Dashboard Controller. Full access to all companies and global infrastructure.",
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
    
    // 1. Super Admin: Master Infrastructure Hub (8 Modules)
    if (role === 'super_admin') {
        const { 
            LayoutDashboard, 
            Share2, 
            Users, 
            CreditCard, 
            Headset, 
            ShieldAlert, 
            Activity, 
            Settings 
        } = require('lucide-react');

        return [
            { id: 'master_dashboard', href: '/super-admin', label: 'Master Dashboard', icon: LayoutDashboard },
            { id: 'master_data_flow', href: '/super-admin/data-flow', label: 'Data Flow', icon: Share2 },
            { id: 'master_users', href: '/super-admin/users', label: 'Identity Pool', icon: Users },
            { id: 'master_billing', href: '/super-admin/finance', label: 'Revenue', icon: CreditCard },
            { id: 'master_support', href: '/super-admin/support', label: 'Support Desk', icon: Headset },
            { id: 'master_audit', href: '/super-admin/audit', label: 'Security Logs', icon: ShieldAlert },
            { id: 'master_health', href: '/super-admin/health', label: 'System Health', icon: Activity },
            { id: 'master_config', href: '/super-admin/settings', label: 'Global Config', icon: Settings },
        ]; 
    }

    // Base filter for standard roles
    let items = NAV_ITEMS.filter(item => {
        if (!item.businessTypes) return true; 
        return item.businessTypes.includes(bizType);
    });

    if (role === 'admin') {
        // Admin gets everything except super admin routes
        return items.filter(i => !i.id.startsWith('master_'));
    }
    
    const alwaysAllowedHrefs = ['/'];
    return items.filter(item => {
        if (alwaysAllowedHrefs.includes(item.href)) return true;
        // User (Staff) cannot see User Management, Settings, or the new Payment Ledger unless specifically permitted
        if (['users', 'settings', 'payments'].includes(item.id)) return false;
        return permissions.includes(item.id);
    });
};
