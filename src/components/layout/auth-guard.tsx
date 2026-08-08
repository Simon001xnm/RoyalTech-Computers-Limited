'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, Loader2, Lock, Building2, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';
import { logger } from '@/lib/logger';
import { NotificationCenter } from '@/components/layout/notification-center';
import { Separator } from '@/components/ui/separator';

const AUTH_PATHS = ['/login', '/signup'];

function AuthenticatedLayout({ children, userProfile }: { children: React.ReactNode, userProfile: AppUser | null }) {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    // Fetch the company based on the user's tenantId to ensure all users see the same logo
    const companyRef = useMemoFirebase(() => 
      userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
      [firestore, userProfile?.tenantId]
    );
    const { data: company } = useDoc<Company>(companyRef);

    const handleLogout = () => {
        if (auth) {
            logger.business('Identity', 'Account Session Ended', { 
                email: user?.email, 
                company: company?.name || 'STANDALONE',
                uid: user?.uid 
            });
            auth.signOut();
        }
    };

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-md no-print">
        <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg shadow-sm">
                    {company?.logoUrl ? (
                        <img src={company.logoUrl} className="h-5 w-5 object-contain invert brightness-0" alt="Logo" />
                    ) : (
                        <Building2 className="h-5 w-5 text-primary-foreground" />
                    )}
                </div>
                <h1 className="text-lg font-black uppercase tracking-tighter text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {company?.name || APP_NAME}
                </h1>
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
                <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Logout</span>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 no-print">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 font-bold text-lg md:hidden">
                <div className="bg-primary p-1 rounded-md">
                    <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-black uppercase tracking-tighter">{company?.name || APP_NAME}</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm bg-white">
                      {/* SHARED IDENTITY: Prioritize Company Logo for all users in same company */}
                      <AvatarImage 
                        src={company?.logoUrl || userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} 
                        alt="Workspace Identity" 
                        className="object-contain p-0.5"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-black uppercase">
                        {company?.name?.substring(0, 2).toUpperCase() || 'CP'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-primary">Active Workspace</p>
                      <p className="text-sm font-black uppercase tracking-tight leading-none truncate">
                        {company?.name || 'Your Company'}
                      </p>
                      <Separator className="my-2" />
                      <p className="text-[10px] font-bold text-muted-foreground truncate flex items-center gap-2">
                        <UserIcon className="h-3 w-3" /> {userProfile?.name || user.displayName}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                        <Link href="/profile">
                            <DropdownMenuItem className="cursor-pointer font-bold">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Shop Settings</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out from node</span>
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

  const isAuthPath = AUTH_PATHS.includes(pathname);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isAuthPath) {
        router.push('/login');
      } else if (user && isAuthPath) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, userProfile, router, pathname, isAuthPath]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  if (user) {
    if (isProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
            </div>
        );
    }

    if (userProfile?.status === 'suspended') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center space-y-6 bg-background">
                <div className="bg-destructive/10 p-6 rounded-full">
                    <Lock className="h-16 w-16 text-destructive" />
                </div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Terminated</h1>
                    <p className="text-muted-foreground">
                        Your account has been suspended.
                    </p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="font-bold">Retry</Button>
            </div>
        );
    }

    return <AuthenticatedLayout userProfile={userProfile || null}>{children}</AuthenticatedLayout>;
  }

  if (isAuthPath) {
    return <>{children}</>;
  }

  return null;
}
