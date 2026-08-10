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
    CreditCard,
    Landmark,
    Banknote,
    Clock,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    format, 
    parseISO,
    startOfWeek,
    isWithinInterval,
    endOfDay
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

/**
 * @fileOverview Business Command Center - Dashboard
 * Strictly focused on Today's operational performance.
 */
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

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekInterval = { start: weekStart, end: endOfDay(today) };

    // FILTERING
    const dailySales = sales.filter(s => {
        try { return format(parseISO(s.date), 'yyyy-MM-dd') === todayStr; } catch { return false; }
    });

    const weeklySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), weekInterval); } catch { return false; }
    });

    const dailyExp = expenses.filter(e => {
        try { return format(parseISO(e.date), 'yyyy-MM-dd') === todayStr; } catch { return false; }
    });

    // TOTALS
    const totalRevenue = dailySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const weeklyRevenue = weeklySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalProfit = dailySales.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);
    const totalExpenses = dailyExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // SETTLEMENTS
    const calculateModeTotal = (mode: string) => {
        return dailySales.reduce((acc, s) => {
            const modeAmt = (s.payments || [])
                .filter((p: any) => p.method === mode)
                .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
            return acc + modeAmt;
        }, 0);
    };

    const mpesaTotal = calculateModeTotal('M-Pesa');
    const cashTotal = calculateModeTotal('Cash');
    const bankTotal = calculateModeTotal('Bank');
    const cardTotal = calculateModeTotal('Card');
    const creditTotal = dailySales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // ALERTS
    const unpaidInvoices = dailySales.filter(s => (Number(s.balance) || 0) > 0);
    const totalDebt = unpaidInvoices.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

    // TOP SELLING (Today)
    const productMap: Record<string, number> = {};
    dailySales.forEach(s => s.items?.forEach((i: any) => {
        productMap[i.name] = (productMap[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalRevenue,
        weeklyRevenue,
        totalProfit,
        totalExpenses,
        mpesaTotal,
        cashTotal,
        bankTotal,
        cardTotal,
        creditTotal,
        totalDebt,
        unpaidCount: unpaidInvoices.length,
        lowStockCount: lowStock.length,
        recent: [...dailySales].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 10),
        topSelling,
        viewLabel: `Reporting Cycle: ${format(today, 'PPPP')}`
    };
  }, [sales, assets, expenses]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || stockLoading || expLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Synchronizing Node Data...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20 selection:bg-primary selection:text-white">
      <PageHeader 
        title="Business Command Center" 
        description={stats.viewLabel}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockCount > 0 && (
            <Link href="/stock">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Inventory Alert</p>
                            <p className="text-sm font-bold">{stats.lowStockCount} items low or out of stock</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-orange-300 group-hover:text-orange-500 transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}

          {stats.unpaidCount > 0 && (
            <Link href="/receivables">
                <Card className="border-l-4 border-l-red-500 hover:bg-red-50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-red-100 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Unpaid Invoices</p>
                            <p className="text-sm font-bold">{stats.unpaidCount} invoices pending ({formatKes(stats.totalDebt)})</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-red-300 group-hover:text-red-50 transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Gross Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total sales today" />
          <SummaryCard title="Net Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Daily profit estimate" />
          <SummaryCard title="Operational Spend" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Today's expenses" />
          <SummaryCard title="Unpaid Debt" value={formatKes(stats.totalDebt)} icon={CreditCard} description="New debt today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Revenue Velocity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-grow">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-muted-foreground">Today's Sales</span>
                        <span className="text-primary">{formatKes(stats.totalRevenue)}</span>
                    </div>
                    <Progress value={Math.min(100, (stats.totalRevenue / (stats.weeklyRevenue / 7 || 1)) * 50)} className="h-2" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-muted-foreground">Weekly Aggregate</span>
                        <span className="text-primary">{formatKes(stats.weeklyRevenue)}</span>
                    </div>
                    <Progress value={100} className="h-2 bg-muted opacity-30" />
                </div>
                <div className="pt-4 border-t">
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                        "Your current daily velocity is contributing to a weekly run-rate of {formatKes(stats.weeklyRevenue)}."
                    </p>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Performance Units (Today)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <p className="text-[10px] font-bold uppercase truncate max-w-[150px]">{name}</p>
                            <Badge className="font-black text-[11px] px-3 h-6 bg-black text-white border-none shadow-sm">
                                {qty} UNITS
                            </Badge>
                        </div>
                    ))}
                    {stats.topSelling.length === 0 && (
                        <div className="p-12 text-center text-[10px] font-bold text-muted-foreground italic uppercase opacity-30">No inventory movements today.</div>
                    )}
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-green-700">Settlement Verified</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-grow">
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-lg"><Wallet className="h-3.5 w-3.5 text-green-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-green-600">M-Pesa</p><p className="text-xl font-black">{formatKes(stats.mpesaTotal)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg"><Landmark className="h-3.5 w-3.5 text-blue-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-600">Bank</p><p className="text-xl font-black">{formatKes(stats.bankTotal)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted p-1.5 rounded-lg"><Banknote className="h-3.5 w-3.5 text-muted-foreground" /></div>
                        <div><p className="text-[10px] font-black uppercase text-muted-foreground">Cash</p><p className="text-xl font-black">{formatKes(stats.cashTotal)}</p></div>
                    </div>
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Daily Transaction Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="h-10">
                        <TableHead className="text-[10px] font-black uppercase pl-6">Timestamp</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Client</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right pr-6">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.recent.map(sale => (
                        <TableRow key={sale.id} className="h-12 hover:bg-muted/5 transition-colors border-b last:border-0">
                            <TableCell className="pl-6"><span className="text-[10px] font-mono text-muted-foreground">{format(parseISO(sale.date), 'HH:mm')}</span></TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase tracking-tighter">{sale.customerName || 'Walk-in'}</span></TableCell>
                            <TableCell><Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className="text-[8px] font-black h-4 px-2 uppercase border-none">{sale.status}</Badge></TableCell>
                            <TableCell><span className="text-[10px] font-bold text-muted-foreground uppercase">{sale.paymentMethod}</span></TableCell>
                            <TableCell className={cn("text-right pr-6 font-black text-sm", sale.status !== 'Paid' ? "text-red-600" : "text-primary")}>
                                {formatKes(Number(sale.total) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.recent.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-[10px] font-bold uppercase opacity-30">No records found for today.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[9px] text-muted-foreground tracking-[0.5em] uppercase leading-relaxed">
             Node-Sync: STRICT DAILY FILTER ACTIVE &bull; v3.0.0
          </p>
      </div>
    </div>
  );
}
