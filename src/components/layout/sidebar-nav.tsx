
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { getPermittedNavItems } from '@/lib/roles';
import { useSaaS } from "@/components/saas/saas-provider";
import { AlertTriangle } from "lucide-react";
import { parseISO, differenceInDays } from "date-fns";
import { useMemo } from "react";
import type { User as AppUser } from '@/types';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { tenant, plan, usage, isLegacyUser } = useSaaS();
  const firestore = useFirestore();

  // Firestore: Fetch user details
  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: currentUser, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const hasHealthIssue = useMemo(() => {
    if (!plan || isLegacyUser) return false;
    
    // Check if usage > 80% or expiry within 7 days
    const isHighUsage = usage.assets >= plan.maxAssets * 0.8 || usage.salesThisMonth >= plan.maxSalesPerMonth * 0.8;
    let isExpiringSoon = false;
    if (tenant?.expiresAt) {
        const daysLeft = differenceInDays(parseISO(tenant.expiresAt), new Date());
        isExpiringSoon = daysLeft <= 7;
    }
    
    return isHighUsage || isExpiringSoon;
  }, [plan, usage, isLegacyUser, tenant]);

  // Use a stable fallback if loading or missing to keep modules visible
  const permittedNavItems = useMemo(() => {
    return getPermittedNavItems(currentUser?.role, !!user?.isAnonymous);
  }, [currentUser?.role, user?.isAnonymous]);

  if (isUserLoading || isProfileLoading) {
    return (
        <SidebarMenu className="p-2">
            {Array.from({ length: 8 }).map((_, i) => <SidebarMenuSkeleton key={i} />)}
        </SidebarMenu>
    );
  }

  // If we have no user, don't show anything. But if we HAVE a user, 
  // getPermittedNavItems now has a safe fallback role.
  if (!user) return null;
  
  return (
    <SidebarMenu>
      {permittedNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              tooltip={{ children: item.label, side: "right", align: "center" }}
              className="justify-start relative"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.href === '/profile' && hasHealthIssue && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <AlertTriangle className="h-3 w-3 text-destructive animate-pulse" />
                  </div>
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
