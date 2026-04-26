'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  Package, 
  Component, 
  Users, 
  TrendingUp,
  History,
  Zap
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

/**
 * @fileOverview Integrated Executive Dashboard
 * Fully integrated with Firestore cloud synchronization.
 */
export default function DashboardPage() {
  const { tenant, isLoading: isSaaSLoading } = useSaaS();
  const firestore = useFirestore();

  // CLOUD QUERIES: Filtered by tenantId, sorted in memory to avoid index requirements
  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: assets, isLoading: assetsLoading } = useCollection(assetsQuery);

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
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const stats = useMemo(() => ({
    availableAssets: assets?.filter(l => l.status === 'Available').length || 0,
    accessoryItems: accessories?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0,
    totalClients: customers?.length || 0,
    recentSalesCount: sales?.filter(s => {
        try {
            const saleDate = new Date(s.date);
            const today = new Date();
            return saleDate.getMonth() === today.getMonth();
        } catch { return false; }
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
        .sort((a,b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 10);
  }, [sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const showMetricsLoading = isSaaSLoading || assetsLoading || accessoriesLoading || customersLoading || salesLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Executive Command" 
        description={tenant ? `Real-time performance for ${tenant.name}.` : "Synchronizing cloud data..."} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <SummaryCard title="Stock Available" value={stats.availableAssets} icon={Package} description="Active hardware assets" />
                <SummaryCard title="Accessory Stock" value={stats.accessoryItems} icon={Component} description="Total units in node" />
                <SummaryCard title="Total Clients" value={stats.totalClients} icon={Users} description="Registered in CRM" />
                <SummaryCard title="Monthly Sales" value={stats.recentSalesCount} icon={TrendingUp} description="Transactions this month" />
            </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-muted/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Revenue Stream</CardTitle>
              <CardDescription>Aggregate performance across the last 7 business days.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cloud Node Active</Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
              {salesLoading ? (
                  <div className="h-full w-full flex items-center justify-center opacity-30 animate-pulse"><Zap className="h-8 w-8" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                    <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Recent Sales</CardTitle></div>
          </CardHeader>
          <CardContent className="max-h-[320px] overflow-auto">
            {salesLoading ? (
                <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate">{sale.customerName || 'Walk-in Client'}</p>
                      <p className="text-[10px] text-muted-foreground">{sale.date ? format(parseISO(sale.date), 'MMM d, h:mm a') : 'Recently'}</p>
                    </div>
                    <p className="text-sm font-black text-primary">{formatCurrency(sale.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground italic text-xs">No cloud transactions detected in this workspace.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}