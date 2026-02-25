
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { getPermittedNavItems } from '@/lib/roles';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Only try to fetch a user document if the user is *not* anonymous
  const userDocRef = useMemoFirebase(() => (user && !user.isAnonymous) ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useDoc<AppUser>(userDocRef);

  if (isUserLoading) {
    return (
        <SidebarMenu className="p-2">
            {Array.from({ length: 8 }).map((_, i) => <SidebarMenuSkeleton key={i} />)}
        </SidebarMenu>
    );
  }

  if (!user) return null; // Should not happen if AuthGuard is working, but a good safeguard.

  // For a non-anonymous user, if their doc is still loading, show a skeleton.
  if (!user.isAnonymous && isCurrentUserLoading) {
      return (
        <SidebarMenu className="p-2">
            {Array.from({ length: 8 }).map((_, i) => <SidebarMenuSkeleton key={i} />)}
        </SidebarMenu>
      );
  }
  
  const permittedNavItems = getPermittedNavItems(currentUser?.role, user.isAnonymous);

  return (
    <SidebarMenu>
      {permittedNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              tooltip={{ children: item.label, side: "right", align: "center" }}
              className="justify-start"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
