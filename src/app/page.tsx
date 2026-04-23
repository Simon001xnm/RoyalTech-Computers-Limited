
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
  History
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();

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
          description={`Welcome, ${user?.displayName || 'Administrator'}. Real-time performance for your workspace.`} 
        />
      </div>

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

        <Card className="shadow-sm border-muted/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest sales transactions recorded.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[320px] overflow-auto">
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
