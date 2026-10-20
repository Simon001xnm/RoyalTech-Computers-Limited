"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    PlusCircle, 
    Search, 
    Filter, 
    WalletCards, 
    DollarSign, 
    ArrowDownLeft, 
    Loader2,
    Calendar as CalendarIcon,
    History as HistoryIcon,
    TrendingUp,
    Banknote,
    Smartphone,
    Landmark,
    CreditCard,
    Receipt,
    PieChart as PieChartIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Payment, User as AppUser } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { getPaymentColumns } from './payment-columns';
import { PaymentForm } from './payment-form';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type PaginationState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    format, 
    parseISO, 
    startOfDay, 
    endOfDay, 
    isWithinInterval, 
    startOfWeek, 
    startOfMonth, 
    startOfYear,
    endOfMonth,
    endOfYear,
    getYear,
    getMonth,
    setMonth,
    setYear
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export function PaymentsClient() {
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(getMonth(now).toString());
  const [selectedYear, setSelectedYear] = useState(getYear(now).toString());
  
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  // Base Data Queries
  const paymentsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'payments'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawPayments, isLoading: paymentsLoading } = useCollection<Payment>(paymentsQuery);
  const { data: rawSales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: customers } = useCollection(customersQuery);

  const filterInterval = useMemo(() => {
    const start = startOfMonth(setMonth(setYear(new Date(), parseInt(selectedYear)), parseInt(selectedMonth)));
    const end = endOfMonth(start);
    return { start, end };
  }, [selectedMonth, selectedYear]);

  const paymentStats = useMemo(() => {
    if (!rawPayments) return null;
    
    const periodPayments = rawPayments.filter(p => {
        try {
            return isWithinInterval(parseISO(p.date), filterInterval);
        } catch { return false; }
    });

    const modeSummary: Record<string, number> = {
        'Cash': 0, 'M-Pesa': 0, 'Bank': 0, 'Card': 0, 'Till': 0, 'Paybill': 0, 'Cheque': 0
    };

    periodPayments.forEach(p => {
        const method = p.method || 'Cash';
        if (p.type === 'Payment') {
            modeSummary[method] = (modeSummary[method] || 0) + (Number(p.amount) || 0);
        } else {
            modeSummary[method] = (modeSummary[method] || 0) - (Number(p.amount) || 0);
        }
    });

    const chartData = Object.entries(modeSummary)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }));

    return { modeSummary, chartData, periodTotal: Object.values(modeSummary).reduce((a, b) => a + b, 0) };
  }, [rawPayments, filterInterval]);

  const filteredPayments = useMemo(() => {
    if (!rawPayments) return [];
    
    let results = rawPayments.filter(p => {
        try {
            return isWithinInterval(parseISO(p.date), filterInterval);
        } catch { return false; }
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    if (typeFilter !== 'all') {
        results = results.filter(p => p.type === typeFilter);
    }

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        results = results.filter(p => 
            p.customerName?.toLowerCase().includes(lowerSearch) ||
            p.reference?.toLowerCase().includes(lowerSearch)
        );
    }

    return results;
  }, [rawPayments, searchTerm, typeFilter, filterInterval]);

  const columns = useMemo(() => getPaymentColumns(), []);

  const table = useReactTable({
    data: filteredPayments,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  const COLORS = ['#10b981', '#4f46e5', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6366f1'];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026"];

  if (!isAdmin) {
      return (
          <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="bg-destructive/10 p-6 rounded-full"><HistoryIcon className="h-16 w-16 text-destructive" /></div>
              <div className="max-w-md space-y-2">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Access Forbidden</h1>
                  <p className="text-muted-foreground">The Payment Ledger is restricted to administrators only. Please contact your shop owner.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20">
      <PageHeader 
        title="Payment Ledger & Analytics" 
        description="Detailed mode-based cash flow monitoring and historical audits."
        actions={
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-9 w-32 border-none bg-transparent font-bold text-[10px] uppercase">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => <SelectItem key={m} value={i.toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-9 w-24 border-none bg-transparent font-bold text-[10px] uppercase">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> Record Entry
                </Button>
            </div>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="bg-primary p-2 rounded-xl shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Period Cash Holdings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard title="CASH ON HAND" value={formatKes(paymentStats?.modeSummary['Cash'] || 0)} icon={Banknote} className="border-l-4 border-l-green-500" />
                  <SummaryCard title="M-PESA POOL" value={formatKes((paymentStats?.modeSummary['M-Pesa'] || 0) + (paymentStats?.modeSummary['Till'] || 0) + (paymentStats?.modeSummary['Paybill'] || 0))} icon={Smartphone} className="border-l-4 border-l-green-600" />
                  <SummaryCard title="BANK BALANCE" value={formatKes(paymentStats?.modeSummary['Bank'] || 0)} icon={Landmark} className="border-l-4 border-l-blue-500" />
                  <SummaryCard title="CARD/VISA" value={formatKes(paymentStats?.modeSummary['Card'] || 0)} icon={CreditCard} />
                  <SummaryCard title="CHEQUES" value={formatKes(paymentStats?.modeSummary['Cheque'] || 0)} icon={Receipt} />
                  <SummaryCard title="PERIOD TOTAL" value={formatKes(paymentStats?.periodTotal || 0)} icon={DollarSign} className="bg-primary/5" />
              </div>
          </div>

          <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-card">
              <CardHeader className="bg-muted/10 border-b p-5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" /> Mode Distribution
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                  {paymentStats && paymentStats.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                data={paymentStats.chartData}
                                cx="50%" cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                  {paymentStats.chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => formatKes(v)} contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex items-center justify-center opacity-20 italic text-[10px] font-black uppercase">No Data for period</div>
                  )}
              </CardContent>
          </Card>
      </section>

      <Separator className="opacity-40" />

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-muted/10 py-6 px-8 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5 text-primary" />
                    Ledger Log Stream
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 w-40 font-bold text-[10px] uppercase bg-white border-2 rounded-xl">
                            <Filter className="h-3 w-3 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Entries</SelectItem>
                            <SelectItem value="Payment">Payments Only</SelectItem>
                            <SelectItem value="Credit Note">Credit Notes</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Find client or ref..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 w-64 bg-white font-bold rounded-xl border-2"
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {paymentsLoading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Synchronizing Ledger...
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader className="bg-muted/30">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (
                                        <TableHead key={h.id} className="text-[10px] font-black uppercase py-6 px-8">
                                            {flexRender(h.column.columnDef.header, h.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} className="h-16 hover:bg-muted/5 transition-colors border-b last:border-0">
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className="py-2 px-8">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center opacity-30 italic font-bold uppercase text-xs">
                                        No matching logs found in this monthly silo.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="px-8"><DataTablePagination table={table} /></div>
                </>
            )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="pb-4 border-b p-8">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <WalletCards className="h-6 w-6 text-primary" />
                Record Manual Entry
            </DialogTitle>
          </DialogHeader>
          <div className="px-8 pb-8">
            <PaymentForm customers={customers || []} onFinished={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
