
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  TrendingUp,
  History,
  Zap,
  LayoutTemplate,
  EyeOff,
  Maximize2,
  Minimize2,
  CalendarClock,
  Briefcase,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';
import { format, startOfDay, subDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { useSaaS } from '@/components/saas/saas-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LandingPage } from '@/components/marketing/landing-page';

export default function DashboardPage() {
  const { tenant, isLoading: isSaaSLoading } = useSaaS();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [visibleWidgets, setVisibleWidgets] = useState({
    revenueChart: true,
    recentSales: true,
    leaseExpirations: true,
    resellerWatch: true
  });
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);

  const accessoriesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'accessories'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: accessories, isLoading: accessoriesLoading } = useCollection(accessoriesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers, isLoading: customersLoading } = useCollection(customersQuery);

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id), limit(100));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const leasesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'leases'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawLeases, isLoading: leasesLoading } = useCollection(leasesQuery);

  const issuancesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'item_issuances'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawIssuances, isLoading: issuancesLoading } = useCollection(issuancesQuery);

  const activeLeases = useMemo(() => (rawLeases || []).filter(l => l.status === 'Active'), [rawLeases]);
  
  const activeResellerStock = useMemo(() => 
    (rawIssuances || []).filter(i => i.status === 'Issued' && i.itemType === 'asset'), 
  [rawIssuances]);

  const resellerBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    activeResellerStock.forEach(issuance => {
      if (!map[issuance.resellerId]) {
        map[issuance.resellerId] = { name: issuance.resellerName, count: 0 };
      }
      map[issuance.resellerId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [activeResellerStock]);

  const stats = useMemo(() => ({
    accessoryItems: accessories?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0,
    totalClients: customers?.length || 0,
    activeHires: activeLeases?.length || 0,
    withResellers: activeResellerStock.length,
    monthlySalesCount: sales?.filter(s => {
        try {
            const saleDate = new Date(s.date);
            const today = new Date();
            return saleDate.getMonth() === today.getMonth();
        } catch { return false; }
    }).length || 0
  }), [accessories, customers, activeLeases, sales, activeResellerStock]);

  const chartData = useMemo(() => {
    if (!sales) return [];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 6 - i));
      return {
        date: format(d, 'MMM dd'),
        rawDate: d,
        revenue: 0
      };
    });

    sales.forEach(sale => {
      try {
        const saleDate = startOfDay(parseISO(sale.date));
        const chartDay = last7Days.find(d => d.rawDate.getTime() === saleDate.getTime());
        if (chartDay) {
          chartDay.revenue += (sale.amount || 0);
        }
      } catch (e) {}
    });

    return last7Days;
  }, [sales]);

  const recentSales = useMemo(() => {
    if (!sales) return [];
    return [...sales]
        .sort((a,b) => (new Date(b.date).getTime() - new Date(a.date).getTime()))
        .slice(0, 10);
  }, [sales]);

  const urgentLeases = useMemo(() => {
    if (!activeLeases) return [];
    return [...activeLeases]
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5);
  }, [activeLeases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const toggleWidget = (key: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetLayout = () => {
    setVisibleWidgets({
        revenueChart: true,
        recentSales: true,
        leaseExpirations: true,
        resellerWatch: true
    });
    setMaximizedWidget(null);
  };

  if (isUserLoading) {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin opacity-20" />
        </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const isAnythingHidden = Object.values(visibleWidgets).some(v => v === false);
  const showMetricsLoading = isSaaSLoading || accessoriesLoading || customersLoading || salesLoading || leasesLoading || issuancesLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
            title="Shop Home" 
            description={tenant ? `Currently in: ${tenant.name}` : "Getting shop info..."} 
        />
        <div className="flex gap-2 mb-6 sm:mb-0">
            {isAnythingHidden && (
                <Button variant="outline" size="sm" onClick={resetLayout} className="h-9 font-bold border-dashed">
                    <LayoutTemplate className="h-4 w-4 mr-2" /> Show all boxes
                </Button>
            )}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-9 px-4 font-bold flex items-center">
                <Zap className="h-3 w-3 mr-2 fill-green-700" /> Online
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {showMetricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-32 shadow-sm border-muted/40">
                  <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
            ))
        ) : (
            <>
                <SummaryCard title="Sales this Month" value={stats.monthlySalesCount} icon={TrendingUp} description="Items sold" />
                <SummaryCard title="Active Hires" value={stats.activeHires} icon={CalendarClock} description="Items with customers" />
                <SummaryCard title="Partner Stock" value={stats.withResellers} icon={Briefcase} description="Items with partners" />
                <SummaryCard title="Clients" value={stats.totalClients} icon={Users} description="Registered people" />
            </>
        )}
      </div>

      <div className={cn(
        "grid gap-6 transition-all duration-500",
        maximizedWidget ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
      )}>
        
        {visibleWidgets.revenueChart && (maximizedWidget === null || maximizedWidget === 'revenueChart') && (
            <Card className={cn(
                "shadow-lg border-none overflow-hidden transition-all duration-500",
                (visibleWidgets.recentSales && !maximizedWidget) ? "lg:col-span-2" : "col-span-1"
            )}>
                <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Money Chart
                        </CardTitle>
                        <CardDescription>Sales for the last 7 days.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 no-print">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMaximizedWidget(maximizedWidget === 'revenueChart' ? null : 'revenueChart')}>
                            {maximizedWidget === 'revenueChart' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => toggleWidget('revenueChart')}>
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px] w-full pt-6">
                    {salesLoading ? (
                        <div className="h-full w-full flex items-center justify-center opacity-30 animate-pulse"><Zap className="h-8 w-8" /></div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        )}

        {visibleWidgets.recentSales && (maximizedWidget === null || maximizedWidget === 'recentSales') && (
            <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Latest Sales
                        </CardTitle>
                        <CardDescription>Most recent things sold.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 no-print">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => toggleWidget('recentSales')}>
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[350px]">
                        {salesLoading ? (
                            <div className="space-y-4 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : recentSales.length > 0 ? (
                            <div className="divide-y divide-muted/30">
                                {recentSales.map(sale => (
                                    <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                                        <div className="space-y-1 overflow-hidden">
                                            <p className="text-sm font-bold truncate">{sale.customerName || 'Walk-in Client'}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                <Clock className="h-3 w-3" /> 
                                                {sale.date ? format(parseISO(sale.date), 'MMM d, h:mm a') : 'Just now'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-primary">{formatCurrency(sale.amount)}</p>
                                            <Badge variant="outline" className="text-[8px] h-4 uppercase font-bold">{sale.paymentMethod}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-muted-foreground italic text-xs">No sales recorded yet.</div>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t p-2">
                    <Button variant="ghost" asChild className="w-full text-[10px] font-black uppercase tracking-widest h-8">
                        <Link href="/books">See all sales <ChevronRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        )}

        {visibleWidgets.resellerWatch && (maximizedWidget === null || maximizedWidget === 'resellerWatch') && (
            <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Partner Check
                        </CardTitle>
                        <CardDescription>Items with our partners.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => toggleWidget('resellerWatch')}>
                        <EyeOff className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        {issuancesLoading ? (
                             <div className="p-8 animate-pulse opacity-20"><Briefcase className="h-8 w-8 mx-auto" /></div>
                        ) : resellerBreakdown.length > 0 ? (
                            <div className="divide-y divide-muted/30">
                                {resellerBreakdown.map(partner => (
                                    <div key={partner.name} className="p-4 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold uppercase">{partner.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black">Authorized Partner</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-primary">{partner.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-muted-foreground italic text-xs">No items with partners.</div>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t p-2">
                    <Button variant="ghost" asChild className="w-full text-[10px] font-black uppercase tracking-widest h-8">
                        <Link href="/resellers">Partner Hub <ChevronRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        )}

        {visibleWidgets.leaseExpirations && (maximizedWidget === null || maximizedWidget === 'leaseExpirations') && (
            <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-primary" />
                            Return Soon
                        </CardTitle>
                        <CardDescription>Items to be returned soon.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => toggleWidget('leaseExpirations')}>
                        <EyeOff className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        {leasesLoading ? (
                             <div className="p-8 animate-pulse opacity-20"><CalendarClock className="h-8 w-8 mx-auto" /></div>
                        ) : urgentLeases.length > 0 ? (
                            <div className="divide-y divide-muted/30">
                                {urgentLeases.map(lease => (
                                    <div key={lease.id} className="p-4 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold uppercase">{lease.laptopModel}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{lease.customerName}</p>
                                            </div>
                                            <Badge variant="destructive" className="text-[9px] font-black uppercase px-2 py-0.5">
                                                DUE: {format(parseISO(lease.endDate), 'MMM d')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-muted-foreground italic text-xs">No returns due soon.</div>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t p-2">
                    <Button variant="ghost" asChild className="w-full text-[10px] font-black uppercase tracking-widest h-8">
                        <Link href="/leases">Manage Hires <ChevronRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        )}
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-4">
              <div className="bg-primary p-2 rounded-lg shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Shop Online</p>
                  <p className="text-[10px] text-muted-foreground">Logged in as: {user?.email}</p>
              </div>
          </div>
          <div className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter text-center md:text-right">
              Powered by simonstyless technologies limited
          </div>
      </div>
    </div>
  );
}
