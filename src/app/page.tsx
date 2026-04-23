
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  Package, 
  Component, 
  Users, 
  TrendingUp,
  History,
  AlertTriangle,
  Zap,
  ArrowRight,
  Bell,
  CheckCircle2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { format, startOfDay, subDays, parseISO, differenceInDays } from 'date-fns';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { tenant, plan, usage, isLegacyUser } = useSaaS();

  // SaaS Isolated Queries
  const assets = useLiveQuery(async () => {
    if (!tenant) return [];
    return await db.assets.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const accessories = useLiveQuery(async () => {
    if (!tenant) return [];
    return await db.accessories.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const customers = useLiveQuery(async () => {
    if (!tenant) return [];
    return await db.customers.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const sales = useLiveQuery(async () => {
    if (!tenant) return [];
    return await db.sales.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  // PLATFORM ALERTS: Prominent Dashboard Notifications
  const platformNotifications = useLiveQuery(async () => {
    if (!user) return [];
    
    const profile = await db.users.get(user.uid);
    const tid = profile?.tenantId || tenant?.id;

    // Get unread notifications for this user or their tenant
    const all = await db.notifications
        .where('read').equals(0) // 0 for false in some indexeddb contexts, but Dexie uses booleans
        .toArray();

    return all
        .filter(n => !n.read && (n.userId === user.uid || (tid && n.tenantId === tid)))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, tenant?.id]);

  const stats = useMemo(() => ({
    availableAssets: assets?.filter(l => l.status === 'Available').length || 0,
    accessoryItems: accessories?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0,
    totalClients: customers?.length || 0,
    recentSalesCount: sales?.filter(s => {
        const saleDate = new Date(s.date);
        const today = new Date();
        return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }).length || 0
  }), [assets, accessories, customers, sales]);

  const healthAlerts = useMemo(() => {
    if (!plan || isLegacyUser) return [];
    const alerts = [];
    
    // Usage Alerts
    if (usage.assets >= plan.maxAssets * 0.8) {
        alerts.push({ type: 'usage', title: 'Asset Capacity Nearly Full', description: `You have used ${usage.assets} of your ${plan.maxAssets} allowed asset slots.` });
    }
    if (usage.salesThisMonth >= plan.maxSalesPerMonth * 0.8) {
        alerts.push({ type: 'usage', title: 'Sales Limit Approaching', description: `You are close to your monthly limit of ${plan.maxSalesPerMonth} transactions.` });
    }

    // Expiry Alerts
    if (tenant?.expiresAt) {
        const daysLeft = differenceInDays(parseISO(tenant.expiresAt), new Date());
        if (daysLeft <= 7 && daysLeft >= 0) {
            alerts.push({ type: 'billing', title: 'Subscription Renewal Soon', description: `Your workspace subscription expires in ${daysLeft} days.` });
        }
    }

    return alerts;
  }, [plan, usage, isLegacyUser, tenant]);

  const handleMarkAsRead = async (id: string) => {
    await db.notifications.update(id, { 
        read: true, 
        updatedAt: new Date().toISOString() 
    });
  };

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
      const saleDate = startOfDay(parseISO(sale.date));
      const chartDay = last7Days.find(d => d.rawDate.getTime() === saleDate.getTime());
      if (chartDay) {
        chartDay.revenue += sale.amount;
      }
    });

    return last7Days;
  }, [sales]);

  const sortedRecentSales = useMemo(() => {
      if (!sales) return [];
      return [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isUserLoading || !tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Syncing workspace metrics..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Executive Command" 
          description={`Welcome, ${user?.displayName || 'Administrator'}. Real-time performance for ${tenant.name}.`} 
        />
      </div>

      {/* PLATFORM COMMUNICATION: High-Priority Dashboard Alerts */}
      {platformNotifications && platformNotifications.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-top duration-700">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Bell className="h-4 w-4 animate-bounce" />
                Urgent Platform Communications
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {platformNotifications.map((notif) => (
                    <Card key={notif.id} className={cn(
                        "relative overflow-hidden border-l-4 shadow-lg transition-all hover:scale-[1.01]",
                        notif.priority === 'alert' ? "border-l-red-600 bg-red-50/50" : "border-l-primary bg-primary/5"
                    )}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    {notif.priority === 'alert' ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                                    <CardTitle className="text-base font-black uppercase tracking-tight">{notif.subject}</CardTitle>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(parseISO(notif.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground leading-relaxed font-medium">{notif.message}</p>
                        </CardContent>
                        <CardFooter className="pt-2 flex justify-between items-center border-t bg-background/50">
                            <p className="text-[10px] font-bold text-muted-foreground">From: {notif.from}</p>
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} className="h-8 font-bold text-xs hover:bg-primary/10">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Read
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
              </div>
          </div>
      )}

      {/* Workspace Health Section */}
      {healthAlerts.length > 0 && (
          <div className="space-y-4">
              {healthAlerts.map((alert, idx) => (
                  <Alert key={idx} variant={alert.type === 'usage' ? 'default' : 'destructive'} className="bg-gradient-to-r from-background to-muted/50 border-primary/20 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <AlertTitle className="font-black text-sm uppercase tracking-tight">{alert.title}</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">{alert.description}</AlertDescription>
                            </div>
                        </div>
                        <Button asChild size="sm" className="font-bold gap-2">
                            <Link href="/profile">
                                <Zap className="h-3 w-3 fill-white" />
                                Upgrade Workspace
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                  </Alert>
              ))}
          </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Stock Availability" 
          value={stats.availableAssets} 
          icon={Package} 
          description="Assets ready for distribution"
        />
        <SummaryCard 
          title="Components" 
          value={stats.accessoryItems} 
          icon={Component} 
          description="Total units in inventory"
        />
        <SummaryCard 
          title="Client Base" 
          value={stats.totalClients} 
          icon={Users} 
          description="Active accounts in CRM"
        />
        <SummaryCard 
          title="Monthly Sales" 
          value={stats.recentSalesCount} 
          icon={TrendingUp} 
          description="Total transactions this month"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-muted/40 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Visual trend of sales across the last 7 business days.</CardDescription>
            </div>
            <Badge variant="outline" className="h-fit">Live Tracking</Badge>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="h-[300px] w-full px-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/40 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary">
                <Link href="/audit">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow max-h-[320px] overflow-auto">
            {sortedRecentSales && sortedRecentSales.length > 0 ? (
              <div className="space-y-4">
                {sortedRecentSales.slice(0, 10).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none">{sale.customerName || 'Walk-in'}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(sale.date), 'MMM d, h:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(sale.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <Badge variant="outline" className="mb-2">Quiet</Badge>
                <p className="text-xs text-muted-foreground">No recent activity detected.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
