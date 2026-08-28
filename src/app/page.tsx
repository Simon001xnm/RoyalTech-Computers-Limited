
'use client';

import { useState, useMemo, useEffect } from 'react';
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
    Zap,
    Calendar as CalendarIcon,
    Filter,
    Clock
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
    isToday,
    startOfYear,
    subDays
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { DateRange } from 'react-day-picker';

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const [filter, setFilter] = useState<TimeFilter>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  // Client-side clock state to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
        setCurrentTime(`${dayStr}, ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    let interval: { start: Date; end: Date };

    switch (filter) {
        case 'today':
            interval = { start: new Date().setHours(0,0,0,0) as any, end: endOfDay(now) };
            break;
        case 'week':
            interval = { start: startOfWeek(now), end: endOfDay(now) };
            break;
        case 'month':
            interval = { start: startOfMonth(now), end: endOfDay(now) };
            break;
        case 'year':
            interval = { start: startOfYear(now), end: endOfDay(now) };
            break;
        case 'custom':
            interval = { start: dateRange?.from || startOfMonth(now), end: endOfDay(dateRange?.to || now) };
            break;
        default:
            interval = { start: startOfMonth(now), end: endOfDay(now) };
    }

    const filteredSales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; }
    });

    const filteredExp = expenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; }
    });

    // TOTALS
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalCost = filteredSales.reduce((acc, s) => {
        const cogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + cogs;
    }, 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // PROFIT
    const totalProfit = totalRevenue - (totalExpenses + totalCost);

    // DEBT
    const unpaidInvoices = sales.filter(s => (Number(s.balance) || 0) > 0);
    const totalDebt = unpaidInvoices.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    
    // LOW STOCK
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

    // TOP PRODUCTS
    const productMap: Record<string, number> = {};
    filteredSales.forEach(s => s.items?.forEach((i: any) => {
        const name = i.name || 'Other';
        productMap[name] = (productMap[name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalRevenue,
        totalProfit,
        totalExpenses,
        totalDebt,
        lowStockCount: lowStock.length,
        unpaidCount: unpaidInvoices.length,
        transactions: [...filteredSales].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
        topSelling,
        viewLabel: filter === 'custom' && dateRange?.from ? `${format(dateRange.from, 'dd MMM')} - ${format(dateRange.to || now, 'dd MMM')}` : filter.toUpperCase()
    };
  }, [sales, assets, expenses, filter, dateRange]);

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
        description={`Analyzing records for period: ${stats.viewLabel}`}
        actions={
            <div className="flex items-center gap-3">
                {currentTime && (
                    <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-xl border border-primary/20 font-mono text-[11px] font-black uppercase tracking-widest text-primary shadow-sm">
                        <Clock className="h-3 w-3" />
                        {currentTime}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="h-9 w-32 font-bold text-[10px] uppercase">
                            <Filter className="h-3 w-3 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Date Range</SelectItem>
                        </SelectContent>
                    </Select>
                    {filter === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold">
                                    <CalendarIcon className="h-3 w-3 mr-2" />
                                    Custom Range
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    initialFocus
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
        }
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
          <SummaryCard title="Period Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total money in" />
          <SummaryCard title="Period Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Money left after costs" />
          <SummaryCard title="Period Expenses" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Shop spend" />
          <SummaryCard title="Total Money Owed" value={formatKes(stats.totalDebt)} icon={FileWarning} description="Historical pending payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md border-none ring-1 ring-black/5 bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Performance Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>Revenue</span>
                        <span className="text-primary">{formatKes(stats.totalRevenue)}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>Costs & Expenses</span>
                        <span className="text-red-600">{formatKes(stats.totalRevenue - stats.totalProfit)}</span>
                    </div>
                    <Progress value={Math.min(100, ((stats.totalRevenue - stats.totalProfit) / (stats.totalRevenue || 1)) * 100)} className="h-2 bg-red-50" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                        <span>Net Margin</span>
                        <span className="text-green-600">{((stats.totalProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.max(0, (stats.totalProfit / (stats.totalRevenue || 1)) * 100)} className="h-2 bg-green-50" />
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Popular Items (Selected Period)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10">
                            <p className="text-[10px] font-bold uppercase truncate max-w-[180px]">{name}</p>
                            <Badge className="font-black text-[10px] bg-black text-white">{qty} SOLD</Badge>
                        </div>
                    ))}
                    {stats.topSelling.length === 0 && <div className="p-12 text-center opacity-30 text-xs font-bold uppercase italic">No items sold in this period</div>}
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Transactions History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase pl-6">Date & Time</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Client</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right pr-6">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.transactions.slice(0, 50).map(sale => (
                        <TableRow key={sale.id} className="h-12 border-b last:border-0 hover:bg-muted/5">
                            <TableCell className="pl-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold">{format(parseISO(sale.date), 'dd MMM yyyy')}</span>
                                    <span className="text-[9px] font-mono opacity-50">{format(parseISO(sale.date), 'HH:mm')}</span>
                                </div>
                            </TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase">{sale.customerName || 'Walk-in'}</span></TableCell>
                            <TableCell><Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className="text-[8px] font-black uppercase h-4 px-2">{sale.status}</Badge></TableCell>
                            <TableCell className={cn("text-right pr-6 font-black", sale.status !== 'Paid' ? "text-red-600" : "text-primary")}>
                                {formatKes(Number(sale.total) || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {stats.transactions.length === 0 && <TableRow><TableCell colSpan={4} className="h-32 text-center opacity-30 text-xs font-bold uppercase italic">No transactions found for this period</TableCell></TableRow>}
                </TableBody>
            </Table>
            {stats.transactions.length > 50 && (
                <div className="p-4 text-center border-t">
                    <p className="text-[10px] font-bold text-muted-foreground italic">Showing first 50 results. Use the reports module for full data.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[11px] font-black tracking-widest uppercase">Matesh Version 3.26</p>
      </div>
    </div>
  );
}
