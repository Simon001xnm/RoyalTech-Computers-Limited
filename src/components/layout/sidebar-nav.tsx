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
import { useUser } from "@/firebase/provider";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getPermittedNavItems } from '@/lib/roles';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // DEXIE: Fetch user details locally instead of via useDoc (Firestore)
  const currentUser = useLiveQuery(
    async () => user ? await db.users.get(user.uid) : null,
    [user]
  );

  if (isUserLoading) {
    return (
        <SidebarMenu className="p-2">
            {Array.from({ length: 8 }).map((_, i) => <SidebarMenuSkeleton key={i} />)}
        </SidebarMenu>
    );
  }

  if (!user) return null;

  // If the local profile hasn't loaded yet, show skeleton
  if (currentUser === undefined) {
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