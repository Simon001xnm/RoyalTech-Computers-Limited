'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Loader2, Filter, FileSpreadsheet, TrendingUp, DollarSign, Activity, Users, ShoppingCart, Percent, ReceiptText, Wallet, ArrowRight, ArrowUpDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear, isWithinInterval, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, startOfDay, endOfDay, endOfYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, exportToCsv } from '@/lib/utils';
import { PnlReport } from './pnl-report';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface PnlData {
  operatingIncome: {
    totalSales: number;
    totalVat: number;
  };
  costOfGoodsSold: {
    totalCogs: number;
    cogsByCategory: { [key: string]: number };
  };
  operatingExpenses: {
    totalExpenses: number;
    expenseByCategory: { [key: string]: number };
  };
  grossProfit: number;
  netIncome: number;
  sales: any[];
  expenses: any[];
}

type FilterPreset = 'today' | 'month' | 'year' | 'custom';

export function ReportsClient() {
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [filterPreset, setFilterPreset] = useState<FilterPreset>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'official'>('dashboard');

  // Pagination States
  const [customerPagination, setCustomerPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [ledgerPagination, setLedgerPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [ledgerSorting, setLedgerSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  // DATA FETCHING
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

  const { data: rawSales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: rawCustomers, isLoading: customersLoading } = useCollection(customersQuery);

  const isLoading = salesLoading || expensesLoading || customersLoading;

  // P&L COMPUTATION
  const pnlData = useMemo<PnlData>(() => {
    if (!rawSales || !rawExpenses || !date?.from || !date?.to) {
        return { 
            operatingIncome: { totalSales: 0, totalVat: 0 }, 
            costOfGoodsSold: { totalCogs: 0, cogsByCategory: {} }, 
            operatingExpenses: { totalExpenses: 0, expenseByCategory: {} },
            grossProfit: 0, netIncome: 0, sales: [], expenses: []
        };
    }
    const interval = { start: startOfDay(date.from), end: endOfDay(date.to) };
    const filteredSales = rawSales.filter(s => { try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; } });
    const filteredExpenses = rawExpenses.filter(e => { try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; } });

    let totalSales = 0;
    let totalVat = 0;
    filteredSales.forEach(s => {
        totalSales += (Number(s.total) || 0);
        totalVat += (Number(s.vatAmount) || 0);
    });
    
    const cogsBreakdown = filteredSales.reduce((acc, sale) => {
        sale.items?.forEach((item: any) => {
            const cogs = Number(item.buyingPrice || 0) * (Number(item.quantity) || 1);
            acc.totalCogs += cogs;
            let cat = item.type === 'asset' ? 'Stock Cost' : 'Other Cost';
            acc.cogsByCategory[cat] = (acc.cogsByCategory[cat] || 0) + cogs;
        });
        return acc;
    }, { totalCogs: 0, cogsByCategory: {} as any });

    const totalExp = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expByCat = filteredExpenses.reduce((acc, e) => {
        const cat = e.category || 'General';
        acc[cat] = (acc[cat] || 0) + Number(e.amount);
        return acc;
    }, {} as any);

    const grossProfit = totalSales - cogsBreakdown.totalCogs - totalVat;
    return {
      operatingIncome: { totalSales, totalVat },
      costOfGoodsSold: cogsBreakdown,
      operatingExpenses: { totalExpenses: totalExp, expenseByCategory: expByCat },
      grossProfit,
      netIncome: grossProfit - totalExp,
      sales: filteredSales,
      expenses: filteredExpenses
    };
  }, [rawSales, rawExpenses, date]);

  // ANALYTICS DASHBOARD ENGINE
  const analytics = useMemo(() => {
    if (!rawSales || !rawExpenses || !rawCustomers || !date?.from || !date?.to) return null;

    const interval = { start: startOfDay(date.from), end: endOfDay(date.to) };
    const filteredSalesForPeriod = rawSales.filter(s => { try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; } });
    const filteredExpensesForPeriod = rawExpenses.filter(e => { try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; } });

    const months = eachMonthOfInterval({ start: startOfYear(date.from), end: endOfYear(date.to) });

    const monthlyData = months.map(month => {
        const monthSales = rawSales.filter(s => isSameMonth(parseISO(s.date), month));
        const monthExp = rawExpenses.filter(e => isSameMonth(parseISO(e.date), month));
        const rev = monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const exp = monthExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        return { name: format(month, 'MMM'), revenue: rev, costs: exp, transactions: monthSales.length };
    });

    const totalRevenue = filteredSalesForPeriod.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalExpenses = filteredExpensesForPeriod.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // Product Distribution Logic (Top 5 + Others)
    const productCounts: Record<string, number> = {};
    filteredSalesForPeriod.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const name = item.name || item.description || 'Unknown Product';
        const qty = Number(item.quantity) || 1;
        productCounts[name] = (productCounts[name] || 0) + qty;
      });
    });

    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const top5 = sortedProducts.slice(0, 5);
    const rest = sortedProducts.slice(5);
    const othersValue = rest.reduce((acc, p) => acc + p.value, 0);

    const categoryData = [...top5];
    if (othersValue > 0) {
      categoryData.push({ name: 'Others', value: othersValue });
    }
    
    return {
        monthlyData,
        metrics: {
            successRate: 85,
            totalTrans: filteredSalesForPeriod.length,
            totalRevenue,
            expenseRatio: totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0
        },
        categoryData: categoryData.length > 0 ? categoryData : [{ name: 'No Sales Data', value: 1 }]
    };
  }, [rawSales, rawExpenses, rawCustomers, date]);

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilterPreset(preset);
    const now = new Date();
    switch (preset) {
        case 'today': setDate({ from: startOfDay(now), to: endOfDay(now) }); break;
        case 'month': setDate({ from: startOfMonth(now), to: endOfMonth(now) }); break;
        case 'year': setDate({ from: startOfYear(now), to: endOfYear(now) }); break;
    }
  };

  const handleDownloadPdf = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const pages = document.querySelectorAll('.a4-pdf-page');
    if (!pages.length) return;
    setIsExporting(true);
    try {
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();
            const canvas = await html2canvas(pages[i] as HTMLElement, { 
                scale: 3.5, 
                useCORS: true, 
                backgroundColor: "#ffffff", 
                width: 794, 
                height: 1123, 
                y: 0, 
                scrollY: 0, 
                windowWidth: 794 
            });
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        }
        pdf.save(`Profit_Loss_Report_${format(date?.from || new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: 'PDF Export Complete' });
    } finally { setIsExporting(false); }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  const customerSummaryData = useMemo(() => {
    const summaryMap: Record<string, any> = {};
    pnlData.sales.forEach(s => {
        const cId = s.customerId || 'walk-in';
        if (!summaryMap[cId]) {
            summaryMap[cId] = { name: s.customerName || 'GENERAL WALK-IN', opening: Number(s.previousBalance || 0), sales: 0, paid: 0 };
        }
        summaryMap[cId].sales += Number(s.total || 0);
        summaryMap[cId].paid += Number(s.amountPaid || 0);
    });
    return Object.values(summaryMap).sort((a,b) => b.sales - a.sales);
  }, [pnlData.sales]);

  const unifiedLedgerData = useMemo(() => {
    return [
      ...pnlData.sales.map(s => ({...s, ledgerType: 'INFLOW', label: s.customerName || 'Sale'})),
      ...pnlData.expenses.map(e => ({...e, ledgerType: 'OUTFLOW', label: e.category || 'Expense'}))
    ];
  }, [pnlData.sales, pnlData.expenses]);

  // TABLE COLUMNS - CUSTOMER SUMMARY
  const customerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Client Identity",
      cell: ({ row }) => <span className="font-bold uppercase text-xs">{row.original.name}</span>
    },
    {
      accessorKey: "opening",
      header: () => <div className="text-right">Opening</div>,
      cell: ({ row }) => <div className="text-right text-xs opacity-50">{formatCurrency(row.original.opening)}</div>
    },
    {
      accessorKey: "sales",
      header: () => <div className="text-right">Period Sales</div>,
      cell: ({ row }) => <div className="text-right font-black text-xs text-blue-600">{formatCurrency(row.original.sales)}</div>
    },
    {
      accessorKey: "paid",
      header: () => <div className="text-right">Collected</div>,
      cell: ({ row }) => <div className="text-right font-black text-xs text-green-600">{formatCurrency(row.original.paid)}</div>
    },
    {
      id: "closing",
      header: () => <div className="text-right">Closing Bal</div>,
      cell: ({ row }) => <div className="text-right font-black text-sm bg-muted/30 px-2 py-1 rounded">{formatCurrency(row.original.opening + row.original.sales - row.original.paid)}</div>
    }
  ], []);

  // TABLE COLUMNS - LEDGER
  const ledgerColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "date",
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 font-black uppercase text-[10px]">Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => <span className="text-[10px] font-mono font-bold opacity-40">{format(parseISO(row.original.date), 'dd/MM/yyyy')}</span>
    },
    {
      accessorKey: "label",
      header: "Transaction Details",
      cell: ({ row }) => <span className="font-bold uppercase text-xs truncate block max-w-xs">{row.original.label}</span>
    },
    {
      accessorKey: "ledgerType",
      header: () => <div className="text-center">Protocol</div>,
      cell: ({ row }) => {
        const type = row.original.ledgerType;
        return (
          <div className="flex justify-center">
            <Badge className={cn("text-[8px] font-black uppercase border-none", type === 'INFLOW' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{type}</Badge>
          </div>
        )
      }
    },
    {
      id: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const type = row.original.ledgerType;
        const amt = Number(row.original.total || row.original.amount);
        return <div className={cn("text-right font-black text-xs", type === 'INFLOW' ? "text-green-700" : "text-red-700")}>{formatCurrency(amt)}</div>
      }
    }
  ], []);

  const customerTable = useReactTable({
    data: customerSummaryData,
    columns: customerColumns,
    state: { pagination: customerPagination },
    onPaginationChange: setCustomerPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const ledgerTable = useReactTable({
    data: unifiedLedgerData,
    columns: ledgerColumns,
    state: { pagination: ledgerPagination, sorting: ledgerSorting },
    onPaginationChange: setLedgerPagination,
    onSortingChange: setLedgerSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest opacity-20">Analyzing Node Intelligence...</div>;

  const COLORS = ['#00c853', '#263238', '#546e7a', '#78909c', '#b0bec5', '#cfd8dc'];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Business Intelligence Center" 
        description="Unified analytics for sales, costs, and customer loyalty." 
        actions={
            <div className="flex gap-2">
                <Button variant={viewMode === 'dashboard' ? 'default' : 'outline'} onClick={() => setViewMode('dashboard')} className="h-9 font-black uppercase text-[9px] tracking-widest">Dashboard View</Button>
                <Button variant={viewMode === 'official' ? 'default' : 'outline'} onClick={() => setViewMode('official')} className="h-9 font-black uppercase text-[9px] tracking-widest">Auditor Statement</Button>
            </div>
        }
      />

      {viewMode === 'dashboard' ? (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><Activity className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.successRate}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Success Rate</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><ShoppingCart className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.totalTrans}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Transactions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><DollarSign className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{formatCurrency(analytics?.metrics.totalRevenue || 0)}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Gross Revenue</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><Percent className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.expenseRatio}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Expense Ratio</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center"><CardTitle className="text-xs font-black uppercase tracking-widest">Monthly Sales Performance</CardTitle></CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics?.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="transactions" stroke="#00c853" strokeWidth={3} dot={{ r: 4, fill: '#00c853' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center"><CardTitle className="text-xs font-black uppercase tracking-widest">Revenue Flow</CardTitle></CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#00c853" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center"><CardTitle className="text-xs font-black uppercase tracking-widest">Moving Products Split</CardTitle></CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                  data={analytics?.categoryData} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={60} 
                                  outerRadius={80} 
                                  dataKey="value"
                                  label={({ name }) => name}
                                >
                                    {analytics?.categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="shadow-xl border-none ring-1 ring-black/5 bg-white">
                <CardHeader className="bg-muted/10 border-b py-4 px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <ReceiptText className="h-4 w-4 text-primary" />
                                Auditor Data Engine
                            </CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Filter and generate period-specific financial audits.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border">
                                {['today', 'month', 'year', 'custom'].map((p: any) => (
                                    <Button key={p} variant={filterPreset === p ? 'default' : 'ghost'} size="sm" onClick={() => handleApplyPreset(p)} className="h-8 text-[9px] font-black uppercase px-4">{p}</Button>
                                ))}
                            </div>
                            {filterPreset === 'custom' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-10 text-[10px] font-black border-2"><CalendarIcon className="mr-2 h-4 w-4" />Pick Dates</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                                </Popover>
                            )}
                            <Button onClick={handleDownloadPdf} disabled={isExporting} className="h-10 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl">
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download Auditor PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 border-l-4 border-blue-600 rounded-xl space-y-1">
                            <p className="text-[10px] font-black uppercase text-blue-600 opacity-60">Net Period Sales</p>
                            <p className="text-2xl font-black">{formatCurrency(pnlData.operatingIncome.totalSales)}</p>
                        </div>
                        <div className="p-6 bg-red-50 border-l-4 border-red-600 rounded-xl space-y-1">
                            <p className="text-[10px] font-black uppercase text-red-600 opacity-60">Total Cost of Sales</p>
                            <p className="text-2xl font-black">{formatCurrency(pnlData.costOfGoodsSold.totalCogs + pnlData.operatingExpenses.totalExpenses)}</p>
                        </div>
                        <div className={cn("p-6 rounded-xl space-y-1 border-l-4", pnlData.netIncome >= 0 ? "bg-green-50 border-green-600" : "bg-red-50 border-red-600")}>
                            <p className={cn("text-[10px] font-black uppercase opacity-60", pnlData.netIncome >= 0 ? "text-green-600" : "text-red-600")}>Net Period Surplus</p>
                            <p className="text-2xl font-black">{formatCurrency(pnlData.netIncome)}</p>
                        </div>
                    </div>

                    {/* PAGINATED CUSTOMER SUMMARY */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Customer Financial Summary</h3>
                        </div>
                        <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {customerTable.getHeaderGroups().map(hg => (
                                        <TableRow key={hg.id}>
                                            {hg.headers.map(h => (
                                                <TableHead key={h.id} className="text-[10px] font-black uppercase py-4">
                                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {customerTable.getRowModel().rows.length ? (
                                        customerTable.getRowModel().rows.map(row => (
                                            <TableRow key={row.id} className="hover:bg-muted/10 h-14">
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id} className="py-2">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={customerColumns.length} className="h-32 text-center text-muted-foreground italic text-xs">No customer activity recorded.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <DataTablePagination table={customerTable} />
                        </div>
                    </div>

                    {/* PAGINATED DETAILED LEDGER */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Period Transaction Ledger</h3>
                        </div>
                        <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {ledgerTable.getHeaderGroups().map(hg => (
                                        <TableRow key={hg.id}>
                                            {hg.headers.map(h => (
                                                <TableHead key={h.id} className="text-[10px] font-black uppercase py-4">
                                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {ledgerTable.getRowModel().rows.length ? (
                                        ledgerTable.getRowModel().rows.map(row => (
                                            <TableRow key={row.id} className="h-12 hover:bg-muted/10">
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id} className="py-2">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={ledgerColumns.length} className="h-32 text-center text-muted-foreground italic text-xs">No transactions found for this period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <DataTablePagination table={ledgerTable} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="pnl-export-target" className="bg-white">
            <PnlReport data={pnlData} dateRange={date} />
        </div>
      </div>
    </div>
  );
}
