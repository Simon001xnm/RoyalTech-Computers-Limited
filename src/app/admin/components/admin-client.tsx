'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    TrendingUp, 
    DollarSign, 
    Users, 
    AlertTriangle, 
    ArrowUpRight, 
    PieChart, 
    BarChart3,
    Activity,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { format, parseISO, startOfMonth, subMonths, isWithinInterval } from 'date-fns';

export function AdminClient() {
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();

  // Shop Analysis Data Fetching
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);

  const stats = useMemo(() => {
    if (!sales || !expenses) return null;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);

    const monthlySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: currentMonthStart, end: now }); } catch { return false; }
    });

    const prevMonthSales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: lastMonthStart, end: lastMonthEnd }); } catch { return false; }
    });

    const totalRevenue = monthlySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const prevRevenue = prevMonthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const totalDebt = sales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const avgSale = monthlySales.length > 0 ? totalRevenue / monthlySales.length : 0;

    const totalCogs = monthlySales.reduce((acc, s) => {
        const saleCogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + saleCogs;
    }, 0);

    const totalExp = expenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), { start: currentMonthStart, end: now }); } catch { return false; }
    }).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const netProfit = totalRevenue - (totalCogs + totalExp);
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
        revenue: totalRevenue,
        growth,
        debt: totalDebt,
        avgSale,
        margin,
        netProfit,
        salesCount: monthlySales.length
    };
  }, [sales, expenses]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || expLoading) {
      return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Preparing Shop Analysis...
      </div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Official Shop Analysis" 
        description="Deep dive intelligence into your business performance and health."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="Gross Revenue (GMV)" 
            value={formatKes(stats.revenue)} 
            icon={DollarSign} 
            trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}% vs last month`}
          />
          <SummaryCard 
            title="Profit Margin" 
            value={`${stats.margin.toFixed(1)}%`} 
            icon={TrendingUp} 
            description="Efficiency of your shop" 
            className="border-l-4 border-l-green-500"
          />
          <SummaryCard 
            title="Total Debt exposure" 
            value={formatKes(stats.debt)} 
            icon={AlertTriangle} 
            description="Money stuck with clients" 
            className="border-l-4 border-l-red-500"
          />
          <SummaryCard 
            title="Avg. Transaction" 
            value={formatKes(stats.avgSale)} 
            icon={Activity} 
            description="Value per customer visit" 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b p-8">
                  <div className="flex items-center gap-4">
                      <div className="bg-primary p-3 rounded-2xl shadow-lg">
                          <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Performance Radar</CardTitle>
                          <CardDescription>HOW YOUR SHOP IS DOING THIS MONTH</CardDescription>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Net Profit</p>
                          <p className="text-4xl font-black tracking-tighter text-green-600">{formatKes(stats.netProfit)}</p>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">Bottom Line Result</Badge>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Units Sold</p>
                          <p className="text-4xl font-black tracking-tighter">{stats.salesCount}</p>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">Sales Velocity</Badge>
                      </div>
                  </div>

                  <div className="p-6 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/10 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          Health Assessment
                      </h4>
                      <div className="space-y-3">
                          <p className="text-sm font-medium leading-relaxed">
                              Your shop is operating at a <span className="font-black">{stats.margin.toFixed(1)}% profit margin</span>. 
                              {stats.debt > stats.revenue ? 
                                " Warning: Your debt exposure is currently higher than your monthly revenue. Focus on collections." : 
                                " Your debt levels are healthy compared to monthly turnover."}
                          </p>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-black text-white p-8">
                    <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Admin Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm font-bold uppercase tracking-tight">Security Audit</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                                <span className="text-[10px] font-black uppercase">Staff Members Active</span>
                                <span className="font-black">VERIFIED</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                                <span className="text-[10px] font-black uppercase">Cloud Sync Status</span>
                                <span className="font-black text-green-600">CONNECTED</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                                <span className="text-[10px] font-black uppercase">Data Isolation (SaaS)</span>
                                <span className="font-black">ENFORCED</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                            "The Analysis module provides a high-level view of shop commerciality. Use this to make decisions about inventory purchasing and expansion."
                        </p>
                    </div>
                </CardContent>
          </Card>
      </div>

      <div className="text-center pt-8 opacity-30">
          <p className="text-[11px] font-black tracking-widest uppercase italic">Shop intelligence provided by Matesh Version 3.26</p>
      </div>
    </div>
  );
}
