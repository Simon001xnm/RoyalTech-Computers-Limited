
'use client';

import { useUser, useAuth, useFirestore } from '@/firebase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

const PUBLIC_PATHS = ['/login', '/signup'];

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

    // Get user role from local database for layout decisions
    const userProfile = useLiveQuery(async () => user ? await db.users.get(user.uid) : null, [user]);

    useEffect(() => {
      if (user && firestore) {
        setProfileAvatar(user.photoURL);
        const userRef = doc(firestore, 'users', user.uid);
        const unsub = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as AppUser;
            if (userData.avatarUrl) {
              setProfileAvatar(userData.avatarUrl);
            }
          }
        });
        return () => unsub();
      }
    }, [user, firestore]);

    const handleLogout = () => {
        if (auth) auth.signOut();
    };

    const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarHeader className="p-4">
            <Link href={isSuperAdmin ? "/admin" : "/"} className="flex items-center gap-2">
            <div className={isSuperAdmin ? "bg-primary p-1 rounded" : ""}>
                <h1 className="text-lg font-black uppercase tracking-tighter text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {isSuperAdmin ? "PLATFORM" : APP_NAME}
                </h1>
            </div>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarNav />
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-4">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Button onClick={handleLogout} variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground" aria-label="Log Out">
                    <LogOut className="h-5 w-5"/>
                </Button>
                <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">End Session</span>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 font-bold text-lg md:hidden">
              <span>{isSuperAdmin ? "PLATFORM COMMAND" : APP_NAME}</span>
            </Link>
            {isSuperAdmin && (
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3">
                  Layer 2 Access
               </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border shadow-sm">
                      <AvatarImage src={profileAvatar || `https://picsum.photos/seed/${user.uid}/40/40`} alt="User" />
                      <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{isSuperAdmin ? "System Identity" : "Workspace Profile"}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router, pathname, isPublicPath]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Syncing identity...</p>
      </div>
    );
  }

  // If we are on a public page, render it directly
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If we have a user, render the authenticated layout
  if (user) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // Fallback: if not logged in and not public path, useEffect will redirect.
  // We return null to avoid flashing authenticated components.
  return null;
}
