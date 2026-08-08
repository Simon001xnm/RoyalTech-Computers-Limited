"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { getPermittedNavItems } from '@/lib/roles';
import { useSaaS } from "@/components/saas/saas-provider";
import { useMemo } from "react";
import type { User as AppUser, Company } from '@/types';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: currentUser, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc<Company>(companyRef);

  const permittedNavItems = useMemo(() => {
    return getPermittedNavItems(currentUser, company);
  }, [currentUser, company]);

  if (isUserLoading || isProfileLoading) {
    return (
        <SidebarMenu className="p-2">
            {Array.from({ length: 5 }).map((_, i) => <SidebarMenuSkeleton key={i} />)}
        </SidebarMenu>
    );
  }

  if (!user) return null;
  
  return (
    <div className="flex flex-col h-full">
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
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
