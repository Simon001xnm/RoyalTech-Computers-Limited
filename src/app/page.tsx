'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { PageHeader } from '@/components/layout/page-header';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    AlertTriangle, 
    ArrowUpRight, 
    DollarSign, 
    Package, 
    FileWarning, 
    TrendingUp,
    Wallet,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    format, 
    parseISO,
    isWithinInterval,
    endOfDay,
    startOfMonth,
    startOfWeek,
    isToday
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const stockQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: assets, isLoading: stockLoading } = useCollection(stockQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);

  const stats = useMemo(() => {
    if (!sales || !assets || !expenses) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const weekStart = startOfWeek(now);
    const monthInterval = { start: monthStart, end: endOfDay(now) };

    // FILTERS
    const todaysSales = sales.filter(s => {
        try { return isToday(parseISO(s.date)); } catch { return false; }
    });

    const weeklySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: weekStart, end: endOfDay(now) }); } catch { return false; }
    });

    const monthlySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), monthInterval); } catch { return false; }
    });

    const monthlyExp = expenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), monthInterval); } catch { return false; }
    });

    // TOTALS (Monthly)
    const totalRevenue = monthlySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalCost = monthlySales.reduce((acc, s) => {
        const cogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + cogs;
    }, 0);
    const totalExpenses = monthlyExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // PROFIT: Revenue - (Expenses + Cost)
    const totalProfit = totalRevenue - (totalExpenses + totalCost);

    // VELOCITY
    const dailyRevenueValue = todaysSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const weeklyRevenueValue = weeklySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // DEBT - ALL-TIME HISTORY
    const unpaidInvoices = sales.filter(s => (Number(s.balance) || 0) > 0);
    const totalDebt = unpaidInvoices.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    
    // LOW STOCK
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

    // TOP PRODUCTS (Monthly)
    const productMap: Record<string, number> = {};
    monthlySales.forEach(s => s.items?.forEach((i: any) => {
        const name = i.name || 'Other';
        productMap[name] = (productMap[name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalRevenue,
        totalProfit,
        totalExpenses,
        totalDebt,
        dailyRevenue: dailyRevenueValue,
        weeklyRevenue: weeklyRevenueValue,
        lowStockCount: lowStock.length,
        unpaidCount: unpaidInvoices.length,
        recent: [...todaysSales].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 10),
        topSelling,
        viewLabel: format(now, 'MMMM yyyy')
    };
  }, [sales, assets, expenses]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || stockLoading || expLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-widest">Checking Shop Records...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Main Shop Dashboard" 
        description={`Records for ${stats.viewLabel}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockCount > 0 && (
            <Link href="/stock">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-orange-600">Stock Alert</p>
                            <p className="text-sm font-bold">{stats.lowStockCount} items almost finished</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-orange-300" />
                    </CardContent>
                </Card>
            </Link>
          )}

          {stats.unpaidCount > 0 && (
            <Link href="/receivables">
                <Card className="border-l-4 border-l-red-500 hover:bg-red-50 cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-red-100 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-600">Total Money Owed</p>
                            <p className="text-sm font-bold">{stats.unpaidCount} people owe money ({formatKes(stats.totalDebt)})</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-red-300" />
                    </CardContent>
                </Card>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Monthly Sales" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total money in this month" />
          <SummaryCard title="Monthly Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Money left after expenses and costs" />
          <SummaryCard title="Monthly Expenses" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Shop spend this month" />
          <SummaryCard title="Total Money Owed" value={formatKes(stats.totalDebt)} icon={FileWarning} description="All money pending from clients" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Sales Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>Today</span>
                        <span className="text-primary">{formatKes(stats.dailyRevenue)}</span>
                    </div>
                    <Progress value={Math.min(100, (stats.dailyRevenue / (stats.weeklyRevenue / 7 || 1)) * 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>This Week</span>
                        <span className="text-blue-600">{formatKes(stats.weeklyRevenue)}</span>
                    </div>
                    <Progress value={Math.min(100, (stats.weeklyRevenue / (stats.totalRevenue / 4 || 1)) * 100)} className="h-2 bg-blue-50" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>This Month</span>
                        <span className="text-green-600">{formatKes(stats.totalRevenue)}</span>
                    </div>
                    <Progress value={100} className="h-2 bg-green-50" />
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Popular Items (Monthly)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10">
                            <p className="text-[10px] font-bold uppercase truncate max-w-[180px]">{name}</p>
                            <Badge className="font-black text-[10px] bg-black text-white">{qty} SOLD</Badge>
                        </div>
                    ))}
                    {stats.topSelling.length === 0 && <div className="p-12 text-center opacity-30 text-xs font-bold uppercase italic">No items sold yet</div>}
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase pl-6">Time</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Client</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right pr-6">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.recent.map(sale => (
                        <TableRow key={sale.id} className="h-12 border-b last:border-0 hover:bg-muted/5">
                            <TableCell className="pl-6"><span className="text-[10px] font-mono opacity-50">{format(parseISO(sale.date), 'HH:mm')}</span></TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase">{sale.customerName || 'Walk-in'}</span></TableCell>
                            <TableCell><Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className="text-[8px] font-black uppercase h-4 px-2">{sale.status}</Badge></TableCell>
                            <TableCell className={cn("text-right pr-6 font-black", sale.status !== 'Paid' ? "text-red-600" : "text-primary")}>
                                {formatKes(Number(sale.total) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.recent.length === 0 && <TableRow><TableCell colSpan={4} className="h-32 text-center opacity-30 text-xs font-bold uppercase italic">No sales recorded today</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[11px] font-black tracking-widest uppercase">Matesh Version 3.26</p>
      </div>
    </div>
  );
}
