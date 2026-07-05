
'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, ShieldCheck, Loader2, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';
import { isMasterKey } from '@/lib/roles';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/layout/notification-center';

const PUBLIC_PATHS = ['/', '/login', '/signup'];

function AuthenticatedLayout({ children, userProfile, isFastTrackAdmin }: { children: React.ReactNode, userProfile: AppUser | null, isFastTrackAdmin: boolean }) {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    const companyRef = useMemoFirebase(() => 
      userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
      [firestore, userProfile?.tenantId]
    );
    const { data: company } = useDoc<Company>(companyRef);

    const handleLogout = () => {
        if (auth) {
            logger.business('Identity', 'Account Session Ended', { 
                email: user?.email, 
                company: company?.name || 'ROOT',
                uid: user?.uid 
            });
            auth.signOut();
        }
    };

    const isSuperAdmin = isFastTrackAdmin || userProfile?.role === 'super_admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-md no-print">
        <SidebarHeader className="p-4">
            <Link href={isSuperAdmin ? "/admin" : "/"} className="flex items-center gap-2">
            <div className={isSuperAdmin ? "bg-primary p-1.5 rounded-lg shadow-sm" : ""}>
                <h1 className={cn(
                    "text-lg font-black uppercase tracking-tighter text-sidebar-foreground group-data-[collapsible=icon]:hidden",
                    isSuperAdmin && "text-primary-foreground"
                )}>
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 no-print">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 font-bold text-lg md:hidden">
              <span>{isSuperAdmin ? "PLATFORM COMMAND" : APP_NAME}</span>
            </Link>
            {isSuperAdmin && (
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 h-6">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Layer 2 Access
               </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border shadow-sm">
                      <AvatarImage src={userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="User" />
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
  const firestore = useFirestore();
  const auth = useAuth();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isFastTrackAdmin = useMemo(() => isMasterKey(user?.email), [user?.email]);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/signup')) {
        if (isFastTrackAdmin) router.push('/admin');
        else router.push('/');
      } else if (user && isFastTrackAdmin && pathname === '/') {
        // We stay at / but we will render AuthenticatedLayout in the return
      }
    }
  }, [user, isUserLoading, isFastTrackAdmin, userProfile, router, pathname, isPublicPath]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  // Handle Logged In user at Root path
  if (user && pathname === '/') {
     if (isProfileLoading && !isFastTrackAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
            </div>
        );
    }
    return <AuthenticatedLayout userProfile={userProfile || null} isFastTrackAdmin={isFastTrackAdmin}>{children}</AuthenticatedLayout>;
  }

  if (isPublicPath && !user) {
    return <>{children}</>;
  }

  if (user) {
    if (isProfileLoading && !isFastTrackAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
            </div>
        );
    }

    // TERMINATION CHECK
    if (userProfile?.status === 'suspended') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center space-y-6 bg-background">
                <div className="bg-destructive/10 p-6 rounded-full">
                    <Lock className="h-16 w-16 text-destructive" />
                </div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Access Terminated</h1>
                    <p className="text-muted-foreground">
                        Your account has been suspended by your workspace administrator. Please contact your IT department for resolution.
                    </p>
                </div>
                <Button onClick={() => auth.signOut()} variant="outline" className="font-bold">Return to Login</Button>
            </div>
        );
    }

    return <AuthenticatedLayout userProfile={userProfile || null} isFastTrackAdmin={isFastTrackAdmin}>{children}</AuthenticatedLayout>;
  }

  return null;
}
