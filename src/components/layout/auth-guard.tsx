'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_NAME, PRICING } from '@/lib/constants';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, Loader2, Lock, Building2, Search, Sun, Moon, Clock, Filter, Wallet, Zap, RefreshCw, Settings, Wifi, WifiOff, Barcode, ShieldAlert, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc, collection, query, where } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';
import { logger } from '@/lib/logger';
import { NotificationCenter } from '@/components/layout/notification-center';
import { Separator } from '@/components/ui/separator';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useSaaS } from '@/components/saas/saas-provider';
import { Badge } from '../ui/badge';
import { ModuleTutorial } from './module-tutorial';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPaymentModal } from '@/components/saas/subscription-payment-modal';
import { SubscriptionReminder } from './subscription-reminder';

const AUTH_PATHS = ['/login', '/signup'];
const PUBLIC_ROOT_PATHS = ['/', '/login', '/signup'];
const PUBLIC_PREFIXES = ['/solutions', '/resources', '/support', '/company', '/legal'];

/**
 * Real-time Trial Status for Header
 * Persistent until plan is upgraded from 'free'.
 */
function TrialStatus({ company }: { company: Company | null | undefined }) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const trialDaysLeft = useMemo(() => {
        if (!company || company.plan !== 'free') return null;
        const createdDate = company.createdAt ? parseISO(company.createdAt) : new Date();
        const daysPassed = differenceInDays(new Date(), createdDate);
        return Math.max(0, PRICING.TRIAL_DAYS - daysPassed);
    }, [company]);

    if (trialDaysLeft === null) return null;

    const isUrgent = trialDaysLeft <= 2;
    const isAwaitingVerification = company?.status === 'awaiting_payment_verification';

    return (
        <>
            <div className="flex items-center gap-2">
                <Badge 
                    variant="outline" 
                    className={cn(
                        "h-8 px-3 font-black uppercase text-[8px] sm:text-[10px] tracking-widest border-2 flex items-center gap-2",
                        isUrgent ? "border-red-500 bg-red-50 text-red-700 animate-pulse" : "border-yellow-500 bg-yellow-50 text-yellow-700"
                    )}
                >
                    <Zap className="h-3 w-3 fill-current" />
                    {trialDaysLeft} Days Left
                </Badge>
                <Button 
                    size="sm" 
                    onClick={() => setIsPaymentOpen(true)}
                    className={cn(
                        "h-8 px-4 font-black uppercase text-[9px] tracking-widest shadow-lg border-none rounded-xl",
                        isAwaitingVerification ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                    )}
                >
                    <CreditCard className="h-3 w-3 mr-1.5" />
                    {isAwaitingVerification ? 'Pending Verify' : 'Pay Now'}
                </Button>
            </div>

            <SubscriptionPaymentModal 
                open={isPaymentOpen} 
                onClose={() => setIsPaymentOpen(false)} 
                shopName={company?.name || 'My Shop'} 
                allowClose={true}
            />
        </>
    );
}

/**
 * Global Hardware Scanner Status Indicator
 */
function ScannerStatus() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const checkDevices = async () => {
            if (typeof navigator === 'undefined' || !('hid' in navigator)) return;
            try {
                // @ts-ignore
                const devices = await navigator.hid.getDevices();
                setIsConnected(devices.length > 0);
            } catch (e) {}
        };

        checkDevices();

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = async () => {
            // @ts-ignore
            const devices = await navigator.hid.getDevices();
            setIsConnected(devices.length > 0);
        };

        // @ts-ignore
        navigator.hid?.addEventListener('connect', handleConnect);
        // @ts-ignore
        navigator.hid?.addEventListener('disconnect', handleDisconnect);

        return () => {
            // @ts-ignore
            navigator.hid?.removeEventListener('connect', handleConnect);
            // @ts-ignore
            navigator.hid?.removeEventListener('disconnect', handleDisconnect);
        };
    }, []);

    const handleRequest = async () => {
        if (typeof navigator !== 'undefined' && 'hid' in navigator) {
            try {
                // @ts-ignore
                await navigator.hid.requestDevice({ filters: [] });
            } catch (e) {}
        }
    };

    return (
        <Badge 
            variant={isConnected ? "default" : "destructive"} 
            className={cn(
                "h-7 px-2 sm:px-3 font-black uppercase text-[7px] sm:text-[9px] tracking-widest border-2 transition-all cursor-pointer select-none shrink-0",
                isConnected ? "bg-green-50 border-green-600 text-white" : "bg-red-50 border-red-600 text-white"
            )}
            onClick={handleRequest}
            title={isConnected ? "Scanner Active" : "Scanner Offline - Click to Connect"}
        >
            {isConnected ? <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1.5" /> : <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1.5" />}
            <span className="hidden xs:inline">{isConnected ? 'Scanner' : 'Offline'}</span>
        </Badge>
    );
}

function DebtIndicator({ tenantId }: { tenantId: string }) {
    const firestore = useFirestore();
    const q = useMemoFirebase(() => query(
        collection(firestore, 'sales_transactions'),
        where('tenantId', '==', tenantId)
    ), [firestore, tenantId]);
    
    const { data: allSales } = useCollection(q);
    
    const uniqueDebtors = useMemo(() => {
        if (!allSales) return 0;
        const debtorIds = allSales
            .filter(s => (Number(s.balance) || 0) > 0)
            .map(s => s.customerId);
            
        return new Set(debtorIds).size;
    }, [allSales]);

    if (uniqueDebtors === 0) return null;

    return (
        <Link href="/receivables">
            <Button variant="ghost" size="icon" className="relative group w-8 h-8 sm:w-10 sm:h-10">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 group-hover:text-red-600 transition-colors" />
                <Badge className="absolute top-0 right-0 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[7px] sm:text-[10px] border-2 border-background bg-red-600 text-white shadow-sm font-black">
                    {uniqueDebtors}
                </Badge>
            </Button>
        </Link>
    );
}

function BrandedLoader({ title }: { title?: string }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] text-white space-y-8 animate-in fade-in duration-1000">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary animate-pulse" />
                </div>
            </div>
            <div className="text-center px-6">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">
                    {title || "Business Hub"}
                </h2>
            </div>
        </div>
    );
}

function AuthenticatedLayout({ children, userProfile }: { children: React.ReactNode, userProfile: AppUser | null }) {
    const { user } = useUser();
    const auth = useAuth();
    const { tenant } = useSaaS();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isDark, setIsDark] = useState(false);
    const [dateTime, setDateTime] = useState({
        time: "--:--:--",
        date: "..."
    });
    const [barcodeBuffer, setBarcodeBuffer] = useState("");
    const headerInputRef = useRef<HTMLInputElement>(null);

    const currentPeriod = searchParams.get('period') || 'month';
    const isSuperAdmin = userProfile?.role === 'super_admin';

    useEffect(() => {
        const saved = localStorage.getItem('rcl_theme');
        if (saved === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setDateTime({
                time: format(now, "hh:mm:ss a"),
                date: format(now, "EEEE, dd MMM yyyy")
            });
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
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

    const handlePeriodChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleScannerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const code = barcodeBuffer.trim();
            if (code) {
                // Emit global event for POS to consume
                window.dispatchEvent(new CustomEvent('erp-barcode-scan', { detail: code }));
                setBarcodeBuffer("");
                
                if (pathname !== '/pos') {
                    toast({ 
                        title: "Code Scanned", 
                        description: `Identified: ${code}. Open Point of Sale to process?`,
                        action: (
                            <Button size="sm" onClick={() => router.push('/pos')} className="font-bold text-[10px] uppercase">
                                Open POS
                            </Button>
                        )
                    });
                } else {
                    toast({ title: "Scanner Synchronized", description: `Processing code: ${code}` });
                }
            }
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

    // SUBSCRIPTION WALL LOGIC
    // Persistent until plan is upgraded from 'free'.
    const isTrialExpired = useMemo(() => {
        if (!company || isSuperAdmin || company.plan !== 'free') return false;
        // Even if awaiting verification, if trial is expired, the wall stays until admin marks as paid (upgrades plan)
        const createdDate = company.createdAt ? parseISO(company.createdAt) : new Date();
        const daysActive = differenceInDays(new Date(), createdDate);
        return daysActive >= PRICING.TRIAL_DAYS;
    }, [company, isSuperAdmin]);

    const isTrialing = useMemo(() => {
        if (!company || isSuperAdmin || company.plan !== 'free') return false;
        const createdDate = company.createdAt ? parseISO(company.createdAt) : new Date();
        const daysActive = differenceInDays(new Date(), createdDate);
        return daysActive < PRICING.TRIAL_DAYS;
    }, [company, isSuperAdmin]);

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon" 
        className="bg-transparent border-none no-print group-data-[side=left]:ml-4 group-data-[side=left]:my-4 z-40 hidden md:flex"
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
                        {isSuperAdmin ? (
                             <Zap className="h-5 w-5 text-primary" />
                        ) : company?.logoUrl ? (
                            <img src={company.logoUrl} className="h-full w-full object-contain p-1" alt="Logo" />
                        ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-black uppercase tracking-tighter truncate text-foreground">
                            {isSuperAdmin ? "Business Hub" : (company?.name || APP_NAME)}
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4 group-data-[collapsible=icon]:px-1 overflow-y-auto flex-1 min-0">
                <SidebarNav />
            </SidebarContent>

            <SidebarFooter className="p-6 space-y-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-6 group-data-[collapsible=icon]:items-center mt-auto border-t border-white/5 bg-sidebar">
                <div className="flex justify-center group-data-[collapsible=icon]:pb-2">
                    <button 
                        onClick={toggleTheme}
                        className="h-10 w-10 rounded-xl transition-all hover:bg-muted/50 flex items-center justify-center"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
                    </button>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 mx-auto text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-muted/10 relative">
        <header className="sticky top-1 sm:top-4 z-30 mx-1 sm:mx-4 flex h-12 sm:h-20 items-center justify-between border bg-background/95 backdrop-blur-sm px-2 sm:px-4 no-print rounded-lg sm:rounded-2xl shadow-sm text-foreground">
          <div className="flex items-center gap-1 sm:gap-4 overflow-hidden">
            <SidebarTrigger className="h-8 w-8" />
            <Link href="/" className="flex items-center gap-1.5 font-bold text-sm sm:text-lg overflow-hidden">
                <div className="bg-primary p-0.5 sm:p-1 rounded-md sm:rounded-lg shadow-sm shrink-0">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="font-black uppercase tracking-tighter truncate max-w-[80px] sm:max-w-none text-foreground">
                    {isSuperAdmin ? "Control Hub" : (company?.name || APP_NAME)}
                </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[400px] px-2">
              <div className="relative w-full">
                  <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-primary opacity-40" />
                  <Input 
                    ref={headerInputRef}
                    placeholder="SCAN/TYPE CODE..." 
                    value={barcodeBuffer}
                    onChange={(e) => setBarcodeBuffer(e.target.value)}
                    onKeyDown={handleScannerInput}
                    className="h-8 sm:h-11 pl-8 bg-muted/20 border-none font-black text-[8px] sm:text-[10px] rounded-xl placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
                  />
              </div>
              <ScannerStatus />
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <TrialStatus company={company} />

            <div className="hidden xl:flex flex-col items-end px-4 py-2 bg-muted/30 rounded-xl border border-border/50 font-mono text-muted-foreground shadow-inner">
                <div className="flex items-center gap-2">
                    <Clock className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{dateTime.time}</span>
                </div>
                <div className="text-[9px] font-bold uppercase opacity-40 tracking-tighter mt-0.5">{dateTime.date}</div>
            </div>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors hidden sm:flex" onClick={handleRefresh} title="Sync Workspace">
                <RefreshCw className="h-4 w-4" />
            </Button>

            {!isSuperAdmin && (
                <div className="hidden sm:block">
                    <Select value={currentPeriod} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="h-9 w-32 font-black text-[9px] uppercase bg-white border-2 rounded-xl">
                            <Filter className="h-2.5 w-2.5 mr-1.5 text-primary" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            {!isSuperAdmin && <ModuleTutorial />}
            {!isSuperAdmin && tenant?.id && <DebtIndicator tenantId={tenant.id} />}
            <NotificationCenter />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/20 shadow-sm bg-white">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[7px] sm:text-[10px] font-black uppercase">
                        {isSuperAdmin ? "BH" : (company?.name?.substring(0, 2).toUpperCase() || 'CP')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {isSuperAdmin ? "Platform Controller" : "Current System"}
                      </p>
                      <p className="text-xs font-black uppercase tracking-tight leading-none truncate">
                        {isSuperAdmin ? "Business Hub" : (company?.name || 'My Shop')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!isSuperAdmin && (
                    <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer font-bold text-xs uppercase tracking-tight py-2">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Shop Settings</span>
                        </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold text-xs uppercase tracking-tight py-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Exit Area</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 p-1 sm:p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
        
        {isTrialing && <SubscriptionReminder />}

        <SubscriptionPaymentModal 
            open={isTrialExpired} 
            onClose={() => {}} 
            shopName={company?.name || 'My Shop'} 
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { tenant, isLoading: isSaaSLoading } = useSaaS();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const isAuthPath = AUTH_PATHS.includes(pathname);
  const isPublicPath = PUBLIC_ROOT_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const companyRef = useMemoFirebase(() => 
    userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
    [firestore, userProfile?.tenantId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isAuthPath) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, userProfile, router, pathname, isPublicPath, isAuthPath]);

  if (user && (isProfileLoading || isSaaSLoading)) {
      const isMaster = userProfile?.role === 'super_admin';
      return (
        <BrandedLoader 
            title={isMaster ? "Business Hub" : (tenant?.name || "Business Hub")} 
        />
      );
  }

  if (isUserLoading) {
    return <BrandedLoader />;
  }

  if (user) {
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
                <Button onClick={() => window.location.reload()} variant="outline" className="font-bold">Retry Sync</Button>
            </div>
        );
    }

    if (company && company.status === 'pending' && userProfile?.role !== 'super_admin') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center space-y-8 bg-background">
                <div className="bg-primary/5 p-8 rounded-[3rem] shadow-inner border-2 border-dashed relative">
                    <div className="bg-primary p-4 rounded-3xl w-fit mx-auto mb-6 shadow-xl">
                        <Clock className="h-10 w-10 text-white animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Installation Pending</h1>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-4 font-medium">
                        Our engineering team is currently setting up your workspace: <span className="text-primary font-black">{company.name}</span>.
                    </p>
                    <div className="mt-8 p-4 bg-white rounded-2xl border flex items-center gap-4 text-left">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status: Awaiting Node Verification</p>
                    </div>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="h-12 px-10 font-bold uppercase text-xs tracking-widest rounded-xl">Check Installation Status</Button>
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
