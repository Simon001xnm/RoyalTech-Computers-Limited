
'use client';

import { useUser, useAuth } from '@/firebase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, Settings, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const LOADING_SCREEN = (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
    </div>
);

const PUBLIC_PATHS = ['/login', '/signup'];


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const auth = useAuth();
    const handleLogout = () => {
        auth.signOut();
    };
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
            <Image src="/picture1.png" alt="RoyalTech Logo" width={40} height={40} className="rounded-md" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                {APP_NAME}
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg md:hidden">
               <Image src="/picture1.png" alt="RoyalTech Logo" width={30} height={30} className="rounded-md" />
              <span className="">{APP_NAME}</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="User" />
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
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
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
    if (isUserLoading) {
      return; 
    }

    if (!user && !isPublicPath) {
      router.push('/login');
    }

    if (user && isPublicPath) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, isPublicPath]);


  if (isUserLoading) {
    return LOADING_SCREEN;
  }

  // If we are on a public page, render it directly without the authenticated layout
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If we have a user and are on a protected page, render the authenticated layout
  if (user) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // If there's no user and we're not on a public path yet, we are in the process of redirecting.
  // Show a loading screen to prevent flashing any content.
  return LOADING_SCREEN;
}
