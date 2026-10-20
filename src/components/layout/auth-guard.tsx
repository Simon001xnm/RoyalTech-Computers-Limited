'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, Loader2, Lock, Building2, Settings, Search, Sun, Moon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';
import { logger } from '@/lib/logger';
import { NotificationCenter } from '@/components/layout/notification-center';
import { Separator } from '@/components/ui/separator';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

const AUTH_PATHS = ['/login', '/signup'];
const PUBLIC_ROOT_PATHS = ['/', '/login', '/signup'];
const PUBLIC_PREFIXES = ['/solutions', '/resources', '/support', '/company', '/legal'];

function AuthenticatedLayout({ children, userProfile }: { children: React.ReactNode, userProfile: AppUser | null }) {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('rcl_theme');
        if (saved === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('rcl_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('rcl_theme', 'light');
        }
    };

    const companyRef = useMemoFirebase(() => 
      userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
      [firestore, userProfile?.tenantId]
    );
    const { data: company } = useDoc<Company>(companyRef);

    const handleLogout = () => {
        if (auth) {
            logger.business('Identity', 'Shop Session Ended', { 
                email: user?.email, 
                company: company?.name || 'Shop',
                uid: user?.uid 
            });
            auth.signOut();
        }
    };

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon" 
        className="bg-transparent border-none no-print group-data-[side=left]:ml-4 group-data-[side=left]:my-4"
      >
        <div className="flex flex-col h-full bg-sidebar rounded-[2.5rem] shadow-2xl border border-sidebar-border overflow-hidden">
            <SidebarHeader className="p-6 pb-2 space-y-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
                <div className="flex gap-1.5 px-2 group-data-[collapsible=icon]:hidden">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>

                <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 overflow-hidden shadow-sm">
                        {company?.logoUrl ? (
                            <img src={company.logoUrl} className="h-full w-full object-contain p-1" alt="Logo" />
                        ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-black uppercase tracking-tighter truncate text-foreground">{company?.name || APP_NAME}</p>
                    </div>
                </div>

                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-40" />
                        <Input 
                            placeholder="Search..." 
                            className="h-9 pl-8 bg-muted/40 border-none rounded-xl text-xs font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>
                
                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
                    <Search className="h-4 w-4 text-muted-foreground opacity-40" />
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4 group-data-[collapsible=icon]:px-0 scrollbar-hide overflow-y-auto">
                <SidebarNav />
            </SidebarContent>

            <SidebarFooter className="p-6 space-y-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-6 group-data-[collapsible=icon]:items-center">
                <div className="flex justify-center group-data-[collapsible=icon]:pb-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleTheme}
                        className="h-10 w-10 rounded-xl transition-all hover:bg-muted/50"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
                    </Button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/30 transition-colors group group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center">
                        <Avatar className="h-9 w-9 rounded-xl border-2 border-background shadow-sm ring-1 ring-black/5 shrink-0">
                            <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                {userProfile?.name?.substring(0,2).toUpperCase() || 'ME'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                            <p className="text-xs font-bold text-foreground truncate">{userProfile?.name || user?.displayName || 'User'}</p>
                            <p className="text-[10px] text-muted-foreground truncate opacity-40">{userProfile?.email || user?.email}</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarFooter>
        </div>
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
                            <DropdownMenuItem className="cursor-pointer font-bold text-xs uppercase tracking-tight">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Shop Settings</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold text-xs uppercase tracking-tight">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Exit Shop Area</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/20">
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

  if (isPublicPath) {
    return <>{children}</>;
  }

  return null;
}
