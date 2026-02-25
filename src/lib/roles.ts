

import type { NavItem } from '@/lib/constants';
import { NAV_ITEMS } from '@/lib/constants';
import type { User } from '@/types';

// The canonical list of user roles.
export const USER_ROLES = ['admin', 'user'] as const;

// Type definition for a user role.
export type Role = typeof USER_ROLES[number];

// Descriptions for each role, used in the user creation form.
export const roleDescriptions: Record<Role, string> = {
    admin: "Full system access. Can create and manage all other user accounts.",
    user: "Standard user access. Can perform day-to-day operations but cannot manage users.",
};

// Defines which navigation items (modules) each role can see.
const rolePermissions: Record<Role, string[]> = {
    admin: NAV_ITEMS.map(item => item.href), // Admin can see everything.
    user: NAV_ITEMS.filter(item => item.href !== '/users').map(item => item.href), // User can see everything except Users.
};


/**
 * Returns the list of navigation items that the user with the given role is permitted to see.
 * If the role is undefined or invalid, it defaults to a minimal set for anonymous/undefined users.
 * @param role The user's role.
 * @param isAnonymous Whether the user is anonymous (currently unused).
 * @returns A filtered array of NavItem objects.
 */
export const getPermittedNavItems = (role?: Role, isAnonymous: boolean = false): NavItem[] => {
    if (!role) {
        return [];
    }
    const permissions = rolePermissions[role];
    if (!permissions) {
        return [];
    }
    return NAV_ITEMS.filter(item => permissions.includes(item.href));
};
