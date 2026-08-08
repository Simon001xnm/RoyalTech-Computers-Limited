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
    Users, 
    FileWarning, 
    Clock, 
    ArrowRight,
    TrendingUp,
    Wallet,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    format, 
    isToday, 
    isYesterday, 
    startOfWeek, 
    startOfMonth, 
    isWithinInterval, 
    parseISO, 
    subDays 
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-Density Business Dashboard
 * Synchronized with high-fidelity invoice logic and split-payment processing.
 */
export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  // 1. DATA QUERIES (Filtered by Tenancy)
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const stockQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'products'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: assets, isLoading: stockLoading } = useCollection(stockQuery);
  const { data: documents, isLoading: docsLoading } = useCollection(docsQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);

  // 2. INTELLIGENCE CALCULATIONS
  const stats = useMemo(() => {
    if (!sales || !assets || !documents || !expenses) return null;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Robust Sales metrics (Preventing NaN)
    const todaySales = sales.filter(s => {
        try { return isToday(parseISO(s.date)); } catch { return false; }
    });
    const yesterdaySales = sales.filter(s => {
        try { return isYesterday(parseISO(s.date)); } catch { return false; }
    });
    const weekSales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: weekStart, end: now }); } catch { return false; }
    });
    const monthSales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: monthStart, end: now }); } catch { return false; }
    });

    const totalTodaySales = todaySales.reduce((acc, s) => acc + (Number(s.amount) || Number(s.total) || 0), 0);
    const totalTodayProfit = todaySales.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);
    const todayExp = expenses.filter(e => {
        try { return isToday(parseISO(e.date)); } catch { return false; }
    }).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const mpesaSales = todaySales.reduce((acc, s) => {
        const mpesaAmt = (s.payments || [])
            .filter((p: any) => p.method === 'M-Pesa')
            .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        return acc + (mpesaAmt || (s.paymentMethod === 'M-Pesa' ? (Number(s.amount) || Number(s.total) || 0) : 0));
    }, 0);

    const cashSales = todaySales.reduce((acc, s) => {
        const cashAmt = (s.payments || [])
            .filter((p: any) => p.method === 'Cash')
            .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        return acc + (cashAmt || (s.paymentMethod === 'Cash' ? (Number(s.amount) || Number(s.total) || 0) : 0));
    }, 0);

    const creditSales = todaySales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // Debts & Overdue (Synced with Invoices)
    const invoicesWithDebt = sales.filter(s => (Number(s.balance) || 0) > 0);
    const unpaidInvoicesCount = invoicesWithDebt.length;
    const uniqueDebtorsCount = new Set(invoicesWithDebt.map(s => s.customerId)).size;
    const totalOutstandingDebt = invoicesWithDebt.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // Inventory Alerts
    const lowStock = assets.filter(a => Number(a.currentStock) > 0 && Number(a.currentStock) <= (Number(a.minStock) || 5));
    const outOfStock = assets.filter(a => Number(a.currentStock) <= 0);

    // Document Alerts
    const pendingQuotes = documents.filter(d => d.type === 'Quotation');
    const overdueInvoices = documents.filter(d => {
        if (d.type !== 'Invoice' || d.data?.status === 'Paid') return false;
        try { return parseISO(d.generatedDate) < subDays(now, 7); } catch { return false; }
    });

    // Top Selling
    const productMap: Record<string, number> = {};
    sales.forEach(s => s.items?.forEach((i: any) => {
        productMap[i.name] = (productMap[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalTodaySales, totalTodayProfit, todayExp,
        mpesaSales, cashSales, creditSales,
        totalOutstandingDebt, 
        unpaidInvoicesCount,
        uniqueDebtorsCount,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        pendingQuotesCount: pendingQuotes.length,
        overdueInvoicesCount: overdueInvoices.length,
        recent: sales.sort((a,b) => {
            try { return parseISO(b.date).getTime() - parseISO(a.date).getTime(); } catch { return 0; }
        }).slice(0, 8),
        topSelling,
        yesterdayTotal: yesterdaySales.reduce((acc, s) => acc + (Number(s.amount) || Number(s.total) || 0), 0),
        weekTotal: weekSales.reduce((acc, s) => acc + (Number(s.amount) || Number(s.total) || 0), 0),
        monthTotal: monthSales.reduce((acc, s) => acc + (Number(s.amount) || Number(s.total) || 0), 0)
    };
  }, [sales, assets, documents, expenses]);

  const formatKes = (val: number) => {
      const safeVal = Number(val) || 0;
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(safeVal);
  };

  if (salesLoading || stockLoading || docsLoading || expLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Synchronizing Node Data...</div>;
  }

  if (!stats) return (
    <div className="p-20 text-center space-y-4">
        <div className="bg-muted p-6 rounded-full w-fit mx-auto opacity-20"><DollarSign className="h-12 w-12" /></div>
        <p className="font-black uppercase text-xs tracking-widest text-muted-foreground">Node data awaiting initialization...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 selection:bg-primary selection:text-white">
      <PageHeader 
        title="Business Command Center" 
        description={`Real-time intelligence node for ${format(new Date(), 'EEEE, do MMMM yyyy')}`}
      />

      {/* 1. ACTIONABLE CRITICAL ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
            <Link href="/inventory">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Inventory Alert</p>
                            <p className="text-sm font-bold">{stats.lowStockCount + stats.outOfStockCount} items low or out</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-orange-300 group-hover:text-orange-500 transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}

          {stats.unpaidInvoicesCount > 0 && (
            <Link href="/receivables">
                <Card className="border-l-4 border-l-red-500 hover:bg-red-50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-red-100 p-2.5 rounded-xl"><Users className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Debt Warning</p>
                            <p className="text-xs font-bold leading-tight">
                                {stats.unpaidInvoicesCount} unpaid bills from {stats.uniqueDebtorsCount} clients owe {formatKes(stats.totalOutstandingDebt)}
                            </p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-red-300 group-hover:text-red-500 transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}

          {stats.overdueInvoicesCount > 0 && (
            <Link href="/documents">
                <Card className="border-l-4 border-l-destructive hover:bg-destructive/5 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-destructive/10 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-destructive" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-destructive tracking-widest">Billing Overdue</p>
                            <p className="text-sm font-bold">{stats.overdueInvoicesCount} invoices are past due</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-destructive/30 group-hover:text-destructive transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}

          {stats.pendingQuotesCount > 0 && (
            <Link href="/documents">
                <Card className="border-l-4 border-l-primary hover:bg-primary/5 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-xl"><Clock className="h-5 w-5 text-primary" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Sales Pipeline</p>
                            <p className="text-sm font-bold">{stats.pendingQuotesCount} pending quotations</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}
      </div>

      {/* 2. PRIMARY FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Today's Revenue" value={formatKes(stats.totalTodaySales)} icon={DollarSign} trend={stats.totalTodaySales >= stats.yesterdayTotal ? "+ Growth" : "- Lower"} />
          <SummaryCard title="Today's Net Profit" value={formatKes(stats.totalTodayProfit)} icon={TrendingUp} description="Revenue minus historical COGS" />
          <SummaryCard title="Operational Exp" value={formatKes(stats.todayExp)} icon={Wallet} description="Expenses recorded today" />
          <SummaryCard title="Outstanding Receivables" value={formatKes(stats.totalOutstandingDebt)} icon={CreditCard} description="Total aggregate client debt" />
      </div>

      {/* 3. CASH FLOW & COMPARISONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Today's Settlements</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5 flex-grow">
                <div className="flex justify-between items-end border-b pb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase text-green-600">M-Pesa / Mobile</p>
                        <p className="text-2xl font-black">{formatKes(stats.mpesaSales)}</p>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 uppercase text-[8px] font-black h-5">Verified</Badge>
                </div>
                <div className="flex justify-between items-end border-b pb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary">Cash Settlements</p>
                        <p className="text-2xl font-black">{formatKes(stats.cashSales)}</p>
                    </div>
                    <Badge variant="outline" className="uppercase text-[8px] font-black h-5">Physical</Badge>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase text-red-500">Unpaid Balances</p>
                        <p className="text-2xl font-black">{formatKes(stats.creditSales)}</p>
                    </div>
                    <Badge variant="destructive" className="uppercase text-[8px] font-black h-5">Invoiced</Badge>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Revenue Velocity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>Yesterday</span><span>{formatKes(stats.yesterdayTotal)}</span></div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (stats.yesterdayTotal / (stats.totalTodaySales || 1)) * 50)}%` }} />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>This Week</span><span>{formatKes(stats.weekTotal)}</span></div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '80%' }} />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>This Month</span><span>{formatKes(stats.monthTotal)}</span></div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '100%' }} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="mt-auto border-t bg-muted/5 p-4 text-center">
                <Link href="/reports" className="w-full">
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest">View Detailed P&L <ArrowRight className="ml-2 h-3 w-3"/></Button>
                </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <p className="text-[10px] font-bold uppercase truncate max-w-[150px]">{name}</p>
                            <Badge variant="secondary" className="font-black text-[9px] px-2">{qty} UNITS</Badge>
                        </div>
                    ))}
                    {stats.topSelling.length === 0 && (
                        <div className="p-12 text-center text-[10px] font-bold text-muted-foreground italic uppercase opacity-30">No transaction data recorded</div>
                    )}
                </div>
            </CardContent>
          </Card>
      </div>

      {/* 4. RECENT TRANSACTIONS FEED */}
      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Cloud Transaction Feed</CardTitle>
            <Link href="/pos">
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-2">Open POS Node</Button>
            </Link>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="h-10">
                        <TableHead className="text-[10px] font-black uppercase pl-6">Timestamp</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Client Node</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Ledger Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right pr-6">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.recent.map(sale => (
                        <TableRow key={sale.id} className="h-12 hover:bg-muted/5 transition-colors border-b last:border-0">
                            <TableCell className="pl-6">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {sale.date ? format(parseISO(sale.date), 'HH:mm:ss') : 'Recently'}
                                </span>
                            </TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase tracking-tighter">{sale.customerName || 'Walk-in Client'}</span></TableCell>
                            <TableCell>
                                <Badge 
                                    variant={sale.status === 'Paid' ? 'default' : 'destructive'} 
                                    className={cn(
                                        "text-[8px] font-black h-4 px-2 uppercase border-none",
                                        sale.status === 'Partial' && "bg-red-600 text-white"
                                    )}
                                >
                                    {sale.status}
                                </Badge>
                            </TableCell>
                            <TableCell><span className="text-[10px] font-bold text-muted-foreground uppercase">{sale.paymentMethod}</span></TableCell>
                            <TableCell className={cn(
                                "text-right pr-6 font-black text-sm",
                                (sale.status === 'Partial' || sale.status === 'Credit') ? "text-red-600" : "text-primary"
                            )}>
                                {formatKes(Number(sale.total) || Number(sale.amount) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.recent.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-[10px] font-bold uppercase opacity-30">Waiting for first cloud transaction...</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[9px] text-muted-foreground tracking-[0.5em] uppercase leading-relaxed">
             Branded Node Sync Active &bull; Financial Integrity Guard &bull; Shop Manager v2.6.1
          </p>
      </div>
    </div>
  );
}
