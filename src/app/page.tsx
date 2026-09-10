'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
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
    Clock,
    Download,
    Eye,
    Loader2,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    endOfMonth,
    endOfWeek,
    endOfYear
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { DateRange } from 'react-day-picker';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvoicePdf } from "./documents/components/pdfs/invoice-pdf";
import { ReceiptPdf } from "./documents/components/pdfs/receipt-pdf";
import { ProformaInvoicePdf } from "./documents/components/pdfs/proforma-pdf";
import { QuotationPdf } from "./documents/components/pdfs/quotation-pdf";
import { useToast } from "@/hooks/use-toast";
import type { Document as AppDocument } from "@/types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN',
    'Proforma': 'PRO'
};

export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<TimeFilter>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
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

  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: assets, isLoading: stockLoading } = useCollection(stockQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);
  const { data: documents, isLoading: docsLoading } = useCollection<AppDocument>(docsQuery);

  const stats = useMemo(() => {
    if (!sales || !assets || !expenses || !documents) return null;

    const now = new Date();
    let interval: { start: Date; end: Date };

    switch (filter) {
        case 'today': interval = { start: startOfDay(now), end: endOfDay(now) }; break;
        case 'week': interval = { start: startOfWeek(now), end: endOfDay(now) }; break;
        case 'month': interval = { start: startOfMonth(now), end: endOfDay(now) }; break;
        case 'year': interval = { start: startOfYear(now), end: endOfDay(now) }; break;
        case 'custom': interval = { start: dateRange?.from || startOfMonth(now), end: endOfDay(dateRange?.to || now) }; break;
        default: interval = { start: startOfMonth(now), end: endOfDay(now) };
    }

    const filteredSales = sales.filter(s => { try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; } });
    const filteredExp = expenses.filter(e => { try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; } });
    const filteredDocs = documents.filter(d => { try { return isWithinInterval(parseISO(d.generatedDate), interval); } catch { return false; } });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalCost = filteredSales.reduce((acc, s) => {
        const cogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + cogs;
    }, 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalProfit = totalRevenue - (totalExpenses + totalCost);
    const totalDebt = sales.filter(s => (Number(s.balance) || 0) > 0).reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

    const productMap: Record<string, number> = {};
    filteredSales.forEach(s => s.items?.forEach((i: any) => {
        const name = i.name || 'Other';
        productMap[name] = (productMap[name] || 0) + (Number(i.quantity) || 1);
    }));
    const topSelling = Object.entries(productMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        totalRevenue, totalProfit, totalExpenses, totalDebt,
        lowStockCount: lowStock.length,
        unpaidCount: sales.filter(s => (Number(s.balance) || 0) > 0).length,
        items: [...filteredDocs].sort((a,b) => parseISO(b.generatedDate).getTime() - parseISO(a.generatedDate).getTime()),
        topSelling,
        viewLabel: filter === 'custom' && dateRange?.from ? `${format(dateRange.from, 'dd MMM')} - ${format(dateRange.to || now, 'dd MMM')}` : filter.toUpperCase()
    };
  }, [sales, assets, expenses, documents, filter, dateRange]);

  const performanceStats = useMemo(() => {
    if (!sales || !expenses) return [];
    const now = new Date();

    const periods = [
        { label: 'Today', start: startOfDay(now), end: endOfDay(now) },
        { label: 'Week', start: startOfWeek(now), end: endOfWeek(now) },
        { label: 'Month', start: startOfMonth(now), end: endOfMonth(now) },
        { label: 'Year', start: startOfYear(now), end: endOfYear(now) },
    ];

    return periods.map(p => {
        const pSales = sales.filter(s => { try { return isWithinInterval(parseISO(s.date), p); } catch { return false; } });
        const pExp = expenses.filter(e => { try { return isWithinInterval(parseISO(e.date), p); } catch { return false; } });

        const revenue = pSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const expense = pExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        const cogs = pSales.reduce((acc, s) => {
            const saleCogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
            return acc + saleCogs;
        }, 0);

        return {
            name: p.label,
            Revenue: revenue,
            Expenses: expense + cogs,
            Surplus: revenue - (expense + cogs)
        };
    });
  }, [sales, expenses]);

  const handleDownloadPdf = async (docObj: AppDocument) => {
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    setSelectedDocument(docObj);
    setIsPdfPreviewOpen(true);

    await new Promise(r => setTimeout(r, 1200));

    try {
        const pages = document.querySelectorAll('.a4-pdf-page');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        if (pages.length === 0) {
            const element = document.getElementById('dashboard-export-target');
            if (!element) throw new Error("Element not found");
            const canvas = await html2canvas(element, { scale: 3.5, useCORS: true, backgroundColor: "#ffffff", width: 794 });
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        } else {
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const canvas = await html2canvas(pages[i] as HTMLElement, {
                    scale: 3.5,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794, 
                    height: 1123,
                    y: 0, scrollY: 0, windowWidth: 794
                });
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }
        }

        const initials = TYPE_INITIALS[docObj.type] || 'DOC';
        pdf.save(`${initials}_${(docObj.relatedTo || 'VAL').slice(0,3).toUpperCase()}.pdf`);
        toast({ title: "Document Saved" });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Export Failed' });
    } finally {
        setIsPdfPreviewOpen(false);
        setIsExporting(false);
        setSelectedDocument(null);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "generatedDate",
      header: "Date & Time",
      cell: ({ row }) => {
        const date = parseISO(row.original.generatedDate);
        return (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold">{format(date, 'dd MMM yyyy')}</span>
            <span className="text-[9px] font-mono opacity-50">{format(date, 'hh:mm a')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "relatedTo",
      header: "Client",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase truncate block max-w-[150px]">{row.original.relatedTo || 'Walk-in'}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
          const type = row.original.type;
          return <Badge className={cn("text-[8px] font-black uppercase h-4 px-2 border-none", type === 'Receipt' ? "bg-green-100 text-green-700" : (type === 'Invoice' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"))}>{type}</Badge>;
      }
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-xs">
          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(row.original.data?.total || 0))}
        </div>
      )
    },
    {
        id: "actions",
        header: () => <div className="text-right pr-6">Action</div>,
        cell: ({ row }) => (
            <div className="flex justify-end pr-6 gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadPdf(row.original)} disabled={isExporting}>
                    <Download className="h-3.5 w-3.5" />
                </Button>
            </div>
        )
    }
  ], [isExporting]);

  const table = useReactTable({
    data: stats?.items || [],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (salesLoading || stockLoading || expLoading || docsLoading) {
      return <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground">Checking Shop Records...</div>;
  }

  if (!stats) return null;

  const renderPdfPreview = () => {
    if (!selectedDocument) return null;
    switch(selectedDocument.type) {
      case 'Invoice': return <InvoicePdf document={selectedDocument} />;
      case 'Receipt': return <ReceiptPdf document={selectedDocument} />;
      case 'Proforma': return <ProformaInvoicePdf document={selectedDocument} />;
      case 'Quotation': return <QuotationPdf document={selectedDocument} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Main Shop Dashboard" 
        description={`Analyzing records for period: ${stats.viewLabel}`}
        actions={
            <div className="flex items-center gap-3">
                {currentTime && (
                    <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-xl border border-primary/20 font-mono text-[11px] font-black uppercase tracking-widest text-primary shadow-sm">
                        <Clock className="h-3 w-3" /> {currentTime}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="h-9 w-32 font-bold text-[10px] uppercase"><Filter className="h-3 w-3 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem><SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Date Range</SelectItem>
                        </SelectContent>
                    </Select>
                    {filter === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-9 text-[10px] font-bold"><CalendarIcon className="h-3 w-3 mr-2" />Custom Range</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus numberOfMonths={2} /></PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockCount > 0 && (
            <Link href="/stock">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-orange-600">Stock Alert</p><p className="text-sm font-bold">{stats.lowStockCount} items almost finished</p></div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-orange-300" />
                    </CardContent>
                </Card>
            </Link>
          )}
          {stats.unpaidCount > 0 && (
            <Link href="/receivables">
                <Card className="border-l-4 border-l-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-red-100 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-red-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-red-600">Total Money Owed</p><p className="text-sm font-bold">{stats.unpaidCount} people owe money ({formatKes(stats.totalDebt)})</p></div>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          {/* PERFORMANCE BREAKDOWN REDESIGN */}
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-xl shadow-sm">
                            <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Performance Intelligence</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase text-primary">Cross-Period Comparative Analysis</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={10} 
                                fontWeight="bold"
                                tick={{ fill: '#000000' }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={10} 
                                tickFormatter={(v) => `Ksh ${v/1000}k`}
                                tick={{ fill: '#000000' }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                            <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* COLLECTED FIGURES GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                    {performanceStats.map((p) => (
                        <div key={p.name} className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                            <p className="text-[10px] font-black uppercase text-center border-b pb-2">{p.name} Report</p>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-bold">
                                    <span className="opacity-40">REVENUE</span>
                                    <span className="text-primary">{formatKes(p.Revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold">
                                    <span className="opacity-40">EXPENSES</span>
                                    <span className="text-red-600">{formatKes(p.Expenses)}</span>
                                </div>
                                <div className="pt-2 mt-1 border-t flex justify-between items-center">
                                    <span className="text-[8px] font-black uppercase">SURPLUS</span>
                                    <span className={cn("text-xs font-black", p.Surplus >= 0 ? "text-green-600" : "text-red-600")}>
                                        {formatKes(p.Surplus)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5"><CardTitle className="text-xs font-black uppercase tracking-widest">Popular Items (Selected Period)</CardTitle></CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {stats.topSelling.map(([name, qty]) => (
                        <div key={name} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/5 p-2 rounded-lg text-primary">
                                    <Package className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-bold uppercase truncate max-w-[180px]">{name}</p>
                            </div>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Activity Ledger</CardTitle>
                </div>
                {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id} className="text-[10px] font-black uppercase py-4">{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} className="h-12 border-b last:border-0 hover:bg-muted/5 transition-colors">{row.getVisibleCells().map((cell) => (<TableCell key={cell.id} className="py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : (<TableRow><TableCell colSpan={columns.length} className="h-32 text-center opacity-30 text-xs font-bold uppercase italic">No documents found for this period</TableCell></TableRow>)}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </CardContent>
      </Card>
      
      <div className="fixed left-[-9999px] top-0 pointer-events-none overflow-visible">
        <div id="dashboard-export-target" className="bg-white">{selectedDocument && renderPdfPreview()}</div>
      </div>
    </div>
  );
}

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
