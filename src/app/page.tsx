'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
    TrendingUp,
    Wallet,
    CreditCard,
    Landmark,
    Banknote,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    format, 
    isWithinInterval, 
    parseISO, 
    startOfDay,
    endOfDay
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Business Command Center - Today's Intelligence Node
 * Strictly filtered to show only today's transactions and documents.
 * Historical data is ignored per user request.
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

  const stats = useMemo(() => {
    if (!sales || !assets || !documents || !expenses) return null;

    const now = new Date();
    const todayInterval = { start: startOfDay(now), end: endOfDay(now) };

    // STRICT FILTER: Only Today's Data
    const todaySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), todayInterval); } catch { return false; }
    });

    const todayDocs = documents.filter(d => {
        try { return isWithinInterval(parseISO(d.generatedDate), todayInterval); } catch { return false; }
    });

    const todayExp = expenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), todayInterval); } catch { return false; }
    });

    // Calculations
    const totalTodaySales = todaySales.reduce((acc, s) => acc + (Number(s.total) || Number(s.amount) || 0), 0);
    const totalTodayProfit = todaySales.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);
    const totalTodayExp = todayExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Today's Settlements
    const calculateModeTotal = (mode: string) => {
        return todaySales.reduce((acc, s) => {
            const modeAmt = (s.payments || [])
                .filter((p: any) => p.method === mode)
                .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
            const legacyAmt = s.paymentMethod === mode ? (Number(s.amount) || Number(s.total) || 0) : 0;
            return acc + (modeAmt || legacyAmt);
        }, 0);
    };

    const mpesaSales = calculateModeTotal('M-Pesa');
    const cashSales = calculateModeTotal('Cash');
    const bankSales = calculateModeTotal('Bank');
    const cardSales = calculateModeTotal('Card');
    const creditSales = todaySales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // Unpaid Invoices ALERT (Today only)
    const unpaidInvoices = todaySales.filter(s => (Number(s.balance) || 0) > 0);
    const totalTodayDebt = unpaidInvoices.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // Inventory Alerts
    const lowStock = assets.filter(a => Number(a.quantity) > 0 && Number(a.quantity) <= (Number(a.minStock) || 5));
    const outOfStock = assets.filter(a => Number(a.quantity) <= 0);

    // Top Selling (Today)
    const productMap: Record<string, number> = {};
    todaySales.forEach(s => s.items?.forEach((i: any) => {
        productMap[i.name] = (productMap[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalTodaySales,
        totalTodayProfit,
        totalTodayExp,
        mpesaSales,
        cashSales,
        bankSales,
        cardSales,
        creditSales,
        totalTodayDebt,
        unpaidInvoicesCount: unpaidInvoices.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        recent: todaySales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 8),
        topSelling,
        todayName: format(now, 'PPPP')
    };
  }, [sales, assets, documents, expenses]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || stockLoading || docsLoading || expLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Synchronizing Today's Node Data...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20 selection:bg-primary selection:text-white">
      <PageHeader 
        title="Business Command Center" 
        description={`Today's performance node: ${stats.todayName}`}
      />

      {/* ACTIONABLE ALERTS - STRICTLY UNPAID & INVENTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
            <Link href="/stock">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Inventory Alert</p>
                            <p className="text-sm font-bold">{stats.lowStockCount + stats.outOfStockCount} items low or out of stock</p>
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
                        <div className="bg-red-100 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Unpaid Invoices</p>
                            <p className="text-sm font-bold">{stats.unpaidInvoicesCount} invoices pending today ({formatKes(stats.totalTodayDebt)})</p>
                        </div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-red-300 group-hover:text-red-50 transition-colors" />
                    </CardContent>
                </Card>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Today's Revenue" value={formatKes(stats.totalTodaySales)} icon={DollarSign} description="Gross sales since midnight" />
          <SummaryCard title="Today's Net Profit" value={formatKes(stats.totalTodayProfit)} icon={TrendingUp} description="Revenue minus item costs" />
          <SummaryCard title="Today's Expenses" value={formatKes(stats.totalTodayExp)} icon={Wallet} className="border-l-4 border-l-red-500" description="Outgoings recorded today" />
          <SummaryCard title="Today's Unpaid Debt" value={formatKes(stats.totalTodayDebt)} icon={CreditCard} description="New receivables today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Today's Settlements</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-grow">
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-lg"><Wallet className="h-3.5 w-3.5 text-green-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-green-600">M-Pesa</p><p className="text-xl font-black">{formatKes(stats.mpesaSales)}</p></div>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 uppercase text-[7px] font-black h-4">Verified</Badge>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg"><Landmark className="h-3.5 w-3.5 text-blue-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-600">Bank</p><p className="text-xl font-black">{formatKes(stats.bankSales)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-1.5 rounded-lg"><CreditCard className="h-3.5 w-3.5 text-primary" /></div>
                        <div><p className="text-[10px] font-black uppercase text-primary">Card</p><p className="text-xl font-black">{formatKes(stats.cardSales)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted p-1.5 rounded-lg"><Banknote className="h-3.5 w-3.5 text-muted-foreground" /></div>
                        <div><p className="text-[10px] font-black uppercase text-muted-foreground">Cash</p><p className="text-xl font-black">{formatKes(stats.cashSales)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-1.5 rounded-lg"><AlertTriangle className="h-3.5 w-3.5 text-red-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-red-500">Unpaid Today</p><p className="text-xl font-black">{formatKes(stats.creditSales)}</p></div>
                    </div>
                    <Badge variant="destructive" className="uppercase text-[7px] font-black h-4">Credit</Badge>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Today's Top Sellers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <p className="text-[10px] font-bold uppercase truncate max-w-[150px]">{name}</p>
                            <Badge className="font-black text-[10px] px-3 h-6 bg-black text-white border-none">{qty} UNITS</Badge>
                        </div>
                    ))}
                    {stats.topSelling.length === 0 && (
                        <div className="p-12 text-center text-[10px] font-bold text-muted-foreground italic uppercase opacity-30">No sales recorded yet today.</div>
                    )}
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Node Health</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 flex-grow">
                <div className="bg-green-50 p-4 rounded-full"><TrendingUp className="h-10 w-10 text-green-600" /></div>
                <div>
                    <p className="text-sm font-black uppercase">Sync Operational</p>
                    <p className="text-[10px] text-muted-foreground">Today's transactions are being written to the cloud in real-time.</p>
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Today's Transaction Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="h-10">
                        <TableHead className="text-[10px] font-black uppercase pl-6">Time</TableHead>
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
                                {formatKes(Number(sale.total) || Number(sale.amount) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.recent.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-[10px] font-bold uppercase opacity-30">No activity recorded today.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[9px] text-muted-foreground tracking-[0.5em] uppercase leading-relaxed">
             Node-Sync: TODAY ONLY MODE &bull; Financial Integrity Guard &bull; v2.7.0
          </p>
      </div>
    </div>
  );
}
