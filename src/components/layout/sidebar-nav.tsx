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
import { ChevronRight } from "lucide-react";

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
    
    // Aesthetic Badges to match reference image
    let badge = null;
    if (item.id === 'pos') badge = "12";
    if (item.id === 'documents') badge = "14";

    return (
      <SidebarMenuItem key={item.href} className="relative">
        {isActive && (
            <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-600 rounded-r-full z-10" />
        )}
        <Link href={item.href} legacyBehavior passHref>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={{ children: item.label, side: "right", align: "center" }}
            className="justify-start relative font-bold hover:bg-sidebar-accent transition-all px-3 h-10 rounded-xl"
            size="default"
          >
            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground opacity-60'}`} />
            <span className={`text-[11px] uppercase tracking-tight ml-2 ${isActive ? 'font-black' : 'font-bold opacity-70'}`}>
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
    <div className="flex flex-col h-full py-2">
      <SidebarGroup>
        <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Menu</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu className="gap-1">
                {menuItems.map((item) => <NavItem key={item.id} item={item} />)}
            </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="my-2 px-3">
          <Separator className="opacity-5" />
      </div>

      <SidebarGroup>
        <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Group</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu className="gap-1">
                {groupItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <Link href={item.href} legacyBehavior passHref>
                            <SidebarMenuButton
                                isActive={pathname === item.href}
                                className="px-3 h-10 rounded-xl hover:bg-sidebar-accent"
                            >
                                <item.icon className="h-4 w-4 text-muted-foreground opacity-60" />
                                <span className="text-[11px] font-bold uppercase tracking-tight ml-2 opacity-70">{item.label}</span>
                                <ChevronRight className="ml-auto h-3 w-3 opacity-20 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}