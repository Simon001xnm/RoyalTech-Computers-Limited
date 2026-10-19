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
// PUBLIC_ROOT_PATHS allows these routes to be viewed without redirection to login
const PUBLIC_ROOT_PATHS = ['/', '/login', '/signup'];
const PUBLIC_PREFIXES = ['/solutions', '/resources', '/support', '/company', '/legal'];

function AuthenticatedLayout({ children, userProfile }: { children: React.ReactNode, userProfile: AppUser | null }) {
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
            logger.business('Identity', 'Shop Session Ended', { 
                email: user?.email, 
                company: company?.name || 'SHOP',
                uid: user?.uid 
            });
            auth.signOut();
        }
    };

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-2xl no-print">
        <SidebarHeader className="h-28 flex items-center justify-center p-0 border-b bg-sidebar-accent/5">
            <Link href="/" className="flex items-center justify-center w-full">
                 <div className="transition-all hover:scale-110 active:scale-95 bg-white p-3 rounded-[20px] shadow-lg border-4 border-primary/10">
                    <img 
                        src="/images__9_-removebg-preview.png" 
                        className="h-12 w-12 object-contain" 
                        alt="Identity" 
                    />
                </div>
            </Link>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar/95">
            <SidebarNav />
        </SidebarContent>
        <SidebarSeparator className="opacity-50" />
        <SidebarFooter className="p-4 bg-sidebar/95">
            <div className="flex flex-col gap-2">
                <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="w-full h-12 justify-start gap-4 px-4 text-sidebar-foreground/70 hover:text-red-500 hover:bg-red-500/5 rounded-xl group-data-[collapsible=icon]:px-3" 
                    aria-label="Exit Shop"
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">Exit Area</span>
                </Button>
                <div className="flex flex-col items-center justify-center pt-4 opacity-20 group-data-[collapsible=icon]:hidden">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">Matesh v3.26</p>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 no-print">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-10 w-10" />
            <Link href="/" className="flex items-center gap-2 font-bold text-lg md:hidden">
                <div className="bg-primary p-1.5 rounded-lg shadow-sm">
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
                      <AvatarImage 
                        src={company?.logoUrl || userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} 
                        alt="Shop Profile" 
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
                      <p className="text-xs font-black uppercase tracking-widest text-primary">Current Shop</p>
                      <p className="text-sm font-black uppercase tracking-tight leading-none truncate">
                        {company?.name || 'My Shop'}
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
                    <span>Exit Shop Area</span>
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
  const isPublicPath = PUBLIC_ROOT_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isAuthPath) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, userProfile, router, pathname, isPublicPath, isAuthPath]);

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
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Shop Access Denied</h1>
                    <p className="text-muted-foreground">
                        Your account is currently locked.
                    </p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="font-bold">Retry</Button>
            </div>
        );
    }

    return <AuthenticatedLayout userProfile={userProfile || null}>{children}</AuthenticatedLayout>;
  }

  // If not logged in but it's a public path, just show the landing page/public view
  if (isPublicPath) {
    return <>{children}</>;
  }

  return null;
}
