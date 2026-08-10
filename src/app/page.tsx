
'use client';

import { useMemo, useState } from 'react';
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
    TrendingUp,
    Wallet,
    CreditCard,
    Landmark,
    Banknote,
    Clock,
    History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
    format, 
    parseISO,
    isToday
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Business Command Center - Dashboard
 * Includes a toggle to switch between "Today Only" and "Historical" data views.
 */
export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [showAllHistory, setShowAllHistory] = useState(false);

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

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Filter logic based on toggle
    const filteredSales = showAllHistory ? sales : sales.filter(s => {
        try { 
            const d = parseISO(s.date);
            return format(d, 'yyyy-MM-dd') === todayStr || isToday(d); 
        } catch { return false; }
    });

    const filteredExp = showAllHistory ? expenses : expenses.filter(e => {
        try { 
            const d = parseISO(e.date);
            return format(d, 'yyyy-MM-dd') === todayStr || isToday(d); 
        } catch { return false; }
    });

    // Calculations
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.total) || Number(s.amount) || 0), 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Settlements breakdown
    const calculateModeTotal = (mode: string) => {
        return filteredSales.reduce((acc, s) => {
            const modeAmt = (s.payments || [])
                .filter((p: any) => p.method === mode)
                .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
            const legacyAmt = s.paymentMethod === mode ? (Number(s.amount) || Number(s.total) || 0) : 0;
            return acc + (modeAmt || legacyAmt);
        }, 0);
    };

    const mpesaTotal = calculateModeTotal('M-Pesa');
    const cashTotal = calculateModeTotal('Cash');
    const bankTotal = calculateModeTotal('Bank');
    const cardTotal = calculateModeTotal('Card');
    const creditTotal = filteredSales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    // Alerts
    const unpaidInvoices = filteredSales.filter(s => (Number(s.balance) || 0) > 0);
    const totalDebt = unpaidInvoices.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const lowStock = assets.filter(a => Number(a.quantity) > 0 && Number(a.quantity) <= (Number(a.minStock) || 5));

    // Top Selling
    const productMap: Record<string, number> = {};
    filteredSales.forEach(s => s.items?.forEach((i: any) => {
        productMap[i.name] = (productMap[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalRevenue,
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
        recent: [...filteredSales].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 10),
        topSelling,
        viewLabel: showAllHistory ? "All-Time History" : `Today: ${format(new Date(), 'PPPP')}`
    };
  }, [sales, assets, documents, expenses, showAllHistory]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || stockLoading || docsLoading || expLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Synchronizing Node Data...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20 selection:bg-primary selection:text-white">
      <PageHeader 
        title="Business Command Center" 
        description={stats.viewLabel}
        actions={
            <div className="flex items-center gap-3 bg-muted/50 p-2 px-4 rounded-xl border">
                <Switch checked={showAllHistory} onCheckedChange={setShowAllHistory} id="history-toggle" />
                <Label htmlFor="history-toggle" className="text-[10px] font-black uppercase cursor-pointer flex items-center gap-2">
                    <History className="h-3 w-3" />
                    {showAllHistory ? "Showing All Records" : "Today Only"}
                </Label>
            </div>
        }
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
          <SummaryCard title="Gross Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total sales in view" />
          <SummaryCard title="Net Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Revenue minus COGS" />
          <SummaryCard title="Operational Spend" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Expenses recorded" />
          <SummaryCard title="Unpaid Debt" value={formatKes(stats.totalDebt)} icon={CreditCard} description="Total pending receivables" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Settlement Map</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-grow">
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-lg"><Wallet className="h-3.5 w-3.5 text-green-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-green-600">M-Pesa</p><p className="text-xl font-black">{formatKes(stats.mpesaTotal)}</p></div>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 uppercase text-[7px] font-black h-4">Verified</Badge>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg"><Landmark className="h-3.5 w-3.5 text-blue-700" /></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-600">Bank</p><p className="text-xl font-black">{formatKes(stats.bankTotal)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-1.5 rounded-lg"><CreditCard className="h-3.5 w-3.5 text-primary" /></div>
                        <div><p className="text-[10px] font-black uppercase text-primary">Card</p><p className="text-xl font-black">{formatKes(stats.cardTotal)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted p-1.5 rounded-lg"><Banknote className="h-3.5 w-3.5 text-muted-foreground" /></div>
                        <div><p className="text-[10px] font-black uppercase text-muted-foreground">Cash</p><p className="text-xl font-black">{formatKes(stats.cashTotal)}</p></div>
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-1.5 rounded-lg"><AlertTriangle className="h-3.5 w-3.5 text-red-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-red-500">Unpaid Balances</p><p className="text-xl font-black">{formatKes(stats.creditTotal)}</p></div>
                    </div>
                    <Badge variant="destructive" className="uppercase text-[7px] font-black h-4">Credit</Badge>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Performance Units</CardTitle>
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
                        <div className="p-12 text-center text-[10px] font-bold text-muted-foreground italic uppercase opacity-30">No inventory movements in this view.</div>
                    )}
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Node Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 flex-grow">
                <div className="bg-green-50 p-4 rounded-full"><Clock className="h-10 w-10 text-green-600" /></div>
                <div>
                    <p className="text-sm font-black uppercase">Realtime Sync Active</p>
                    <p className="text-[10px] text-muted-foreground">The node is listening for cloud updates. Data is refreshed automatically.</p>
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Transaction Feed</CardTitle>
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
                            <TableCell className="pl-6"><span className="text-[10px] font-mono text-muted-foreground">{format(parseISO(sale.date), 'dd/MM HH:mm')}</span></TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase tracking-tighter">{sale.customerName || 'Walk-in'}</span></TableCell>
                            <TableCell><Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className="text-[8px] font-black h-4 px-2 uppercase border-none">{sale.status}</Badge></TableCell>
                            <TableCell><span className="text-[10px] font-bold text-muted-foreground uppercase">{sale.paymentMethod}</span></TableCell>
                            <TableCell className={cn("text-right pr-6 font-black text-sm", sale.status !== 'Paid' ? "text-red-600" : "text-primary")}>
                                {formatKes(Number(sale.total) || Number(sale.amount) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.recent.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-[10px] font-bold uppercase opacity-30">No records found for selected period.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[9px] text-muted-foreground tracking-[0.5em] uppercase leading-relaxed">
             Node-Sync: {showAllHistory ? "FULL LEDGER MODE" : "DAILY FILTER ACTIVE"} &bull; v2.7.5
          </p>
      </div>
    </div>
  );
}
