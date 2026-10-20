
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { getPermittedNavItems } from '@/lib/roles';
import { useSaaS } from "@/components/saas/saas-provider";
import { useMemo } from "react";
import type { User as AppUser, Company } from '@/types';
import { Badge } from "../ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

  const menuItems = useMemo(() => permittedNavItems.slice(0, 6), [permittedNavItems]);
  const groupItems = useMemo(() => permittedNavItems.slice(6), [permittedNavItems]);

  if (isUserLoading || isProfileLoading) {
    return (
        <div className="p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted/20 rounded-xl animate-pulse" />
            ))}
        </div>
    );
  }

  if (!user) return null;

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    
    let badge = null;
    if (item.id === 'pos') badge = "12";
    if (item.id === 'documents') badge = "14";

    return (
      <SidebarMenuItem key={item.href} className="relative px-0 flex items-center justify-center w-full">
        {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-600 rounded-r-full z-20 transition-all" />
        )}
        <Link href={item.href} className="w-full flex justify-center px-2 group-data-[collapsible=icon]:px-0">
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.label}
            className={cn(
                "w-full flex items-center font-bold transition-all px-3 h-11 rounded-xl justify-start",
                "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-full",
                isActive ? "bg-muted/60" : "hover:bg-muted/40"
            )}
            size="default"
          >
            <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? 'text-foreground' : 'text-muted-foreground opacity-60'
            )} />
            <span className={cn(
                "text-[11px] tracking-tight ml-2",
                isActive ? 'font-bold' : 'font-medium opacity-70',
                "group-data-[collapsible=icon]:hidden"
            )}>
                {item.label}
            </span>
            
            {badge && (
                <Badge className="ml-auto bg-red-600 text-white border-none h-4 px-1.5 text-[8px] font-black group-data-[collapsible=icon]:hidden">
                    {badge}
                </Badge>
            )}
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };
  
  return (
    <div className="flex flex-col py-2 min-h-min">
      <SidebarGroup className="group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
        <SidebarGroupLabel className="px-3 text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 mb-2 group-data-[collapsible=icon]:hidden">Main Menu</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
                {menuItems.map((item) => <NavItem key={item.id} item={item} />)}
            </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="my-2 px-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:my-1">
          <Separator className="opacity-5" />
      </div>

      <SidebarGroup className="group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
        <SidebarGroupLabel className="px-3 text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 mb-2 group-data-[collapsible=icon]:hidden">Company Groups</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
                {groupItems.map((item) => <NavItem key={item.id} item={item} />)}
            </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
