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
import { LogOut, Settings } from 'lucide-react';


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
        <SidebarFooter className="p-2 space-y-2">
            {user && (
            <Link href="/profile" legacyBehavior passHref>
                <button
                    className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="User Avatar" data-ai-hint="person avatar" />
                        <AvatarFallback>{user.displayName ? user.displayName.substring(0, 2) : user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium truncate">{user.displayName || 'User'}</span>
                        <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                    </div>
                </button>
            </Link>
            )}
            <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                <Link href="/settings" passHref legacyBehavior>
                    <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:w-full" aria-label="Settings">
                        <Settings className="h-5 w-5"/>
                    </Button>
                </Link>
                <Button onClick={handleLogout} variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:w-full" aria-label="Log Out">
                    <LogOut className="h-5 w-5"/>
                </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
             <Image src="/picture1.png" alt="RoyalTech Logo" width={30} height={30} className="rounded-md" />
            <span className="">{APP_NAME}</span>
          </Link>
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