'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Loader2, Filter, FileSpreadsheet } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear, isWithinInterval, parseISO } from 'date-fns';
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
}

export function ReportsClient() {
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  const [vatFilter, setVatFilter] = useState<'all' | 'with-vat' | 'no-vat'>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'Receipt' | 'Invoice'>('all');

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawSales, isLoading: salesLoading } = useCollection(salesQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawDocs, isLoading: docsLoading } = useCollection(docsQuery);

  const isLoading = salesLoading || expensesLoading || docsLoading;

  const filteredData = useMemo(() => {
    if (!rawSales || !rawExpenses || !date?.from || !date?.to) return { filteredSales: [], filteredExpenses: [] };
    const interval = { start: date.from, end: date.to };
    
    const filteredSales = rawSales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; }
    });
    
    const filteredExpenses = rawExpenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; }
    });

    return { filteredSales, filteredExpenses };
  }, [rawSales, rawExpenses, date]);

  const pnlData = useMemo<PnlData>(() => {
    const { filteredSales, filteredExpenses } = filteredData;
    
    let totalSales = 0;
    let totalVat = 0;

    filteredSales.forEach(s => {
        totalSales += (Number(s.total) || Number(s.amount) || 0);
        totalVat += (Number(s.vatAmount) || 0);
    });
    
    const cogsBreakdown = filteredSales.reduce((acc, sale) => {
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach((item: any) => {
                const cogs = Number(item.buyingPrice || 0) * (Number(item.quantity) || 1);
                acc.totalCogs += cogs;
                
                let category = 'Shop Stock Cost';
                if (item.type === 'accessory') category = 'Accessory Costs';
                if (item.type === 'custom') category = 'Manual Costs';
                
                acc.cogsByCategory[category] = (acc.cogsByCategory[category] || 0) + cogs;
            });
        }
        return acc;
    }, { totalCogs: 0, cogsByCategory: {} as Record<string, number> });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expenseByCategory = filteredExpenses.reduce((acc, expense) => {
        const category = expense.category || 'Other Spend';
        acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
        return acc;
    }, {} as { [key: string]: number });

    const grossProfit = totalSales - cogsBreakdown.totalCogs - totalVat;
    const netIncome = grossProfit - totalExpenses;

    return {
      operatingIncome: { totalSales, totalVat },
      costOfGoodsSold: { totalCogs: cogsBreakdown.totalCogs, cogsByCategory: cogsBreakdown.cogsByCategory },
      operatingExpenses: { totalExpenses, expenseByCategory },
      grossProfit,
      netIncome,
    };
  }, [filteredData]);

  const handleDownloadDetailedCsv = () => {
    if (!rawDocs) return;

    let itemsToExport = rawDocs.filter(d => {
        if (!date?.from || !date?.to) return true;
        try {
            return isWithinInterval(parseISO(d.generatedDate), { start: date.from, end: date.to });
        } catch { return false; }
    });

    if (docTypeFilter !== 'all') {
        itemsToExport = itemsToExport.filter(d => d.type === docTypeFilter);
    }

    if (vatFilter !== 'all') {
        itemsToExport = itemsToExport.filter(d => {
            const hasVat = d.data?.applyVat === true || (Number(d.data?.vatAmount) || 0) > 0;
            return vatFilter === 'with-vat' ? hasVat : !hasVat;
        });
    }

    const mapping = {
        generatedDate: 'Date',
        title: 'Document Number',
        type: 'Type',
        relatedTo: 'Customer',
        'data.total': 'Total Value',
        'data.vatAmount': 'VAT Amount',
        'data.subtotal': 'Subtotal',
        'data.applyVat': 'Has VAT'
    };

    // Flatten data for CSV
    const flattened = itemsToExport.map(d => ({
        ...d,
        generatedDate: format(parseISO(d.generatedDate), 'yyyy-MM-dd HH:mm'),
        'data.total': d.data?.total || 0,
        'data.vatAmount': d.data?.vatAmount || 0,
        'data.subtotal': d.data?.subtotal || 0,
        'data.applyVat': d.data?.applyVat ? 'Yes' : 'No'
    }));

    exportToCsv(`Detailed_Analysis_${format(new Date(), 'yyyyMMdd')}.csv`, flattened, mapping);
    toast({ title: "Analysis Downloaded" });
  };

  const handleDownloadPdf = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const reportElement = document.getElementById('pnl-report');
    if (!reportElement) return;

    try {
        const canvas = await html2canvas(reportElement, { 
            scale: 2.5, 
            useCORS: true, 
            windowWidth: 1200,
            backgroundColor: '#ffffff'
        });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`Profit_Loss_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: "PDF Report Saved" });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Export Failed' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shop Profit Reports" description="Check how much money your shop is making." />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6 min-w-0">
            <Card className="no-print shadow-sm border-none ring-1 ring-black/5">
                <CardHeader className="bg-muted/10 py-4 px-6 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        Report Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-wrap items-center gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Pick Dates</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={'outline'} className={cn('w-full sm:w-[280px] justify-start text-left font-normal h-11 bg-white', !date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? <>{format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}</> : format(date.from, 'LLL dd, y')) : <span>Pick a date range</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-3 mt-auto w-full sm:w-auto">
                        <Button onClick={handleDownloadPdf} disabled={isLoading} className="flex-1 sm:flex-none h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg">
                            <Download className="mr-2 h-4 w-4" /> Save PDF Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Calculating Profit...</p>
                </div>
            ) : (
                <div className="flex justify-center bg-muted/20 p-4 md:p-8 rounded-2xl border-2 border-dashed overflow-x-auto">
                    <div className="shrink-0 origin-top transform scale-[0.45] sm:scale-[0.7] lg:scale-[0.85] xl:scale-100">
                        <div id="pnl-report" className="a4-document shadow-2xl relative">
                            <PnlReport data={pnlData} dateRange={date} />
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-primary text-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <FileSpreadsheet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">
                                Detailed Analysis
                            </CardTitle>
                            <CardDescription className="text-white/70 text-[10px] uppercase font-bold mt-1">Download specific record lists</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Document Type</Label>
                            <Select value={docTypeFilter} onValueChange={(v: any) => setDocTypeFilter(v)}>
                                <SelectTrigger className="h-11 font-bold bg-muted/30 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Paperwork</SelectItem>
                                    <SelectItem value="Receipt">Receipts Only</SelectItem>
                                    <SelectItem value="Invoice">Invoices Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">VAT Status</Label>
                            <Select value={vatFilter} onValueChange={(v: any) => setVatFilter(v)}>
                                <SelectTrigger className="h-11 font-bold bg-muted/30 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Combined (VAT + No VAT)</SelectItem>
                                    <SelectItem value="with-vat">With VAT Only</SelectItem>
                                    <SelectItem value="no-vat">Without VAT Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button 
                        onClick={handleDownloadDetailedCsv} 
                        disabled={isLoading}
                        variant="outline"
                        className="w-full h-14 border-2 border-primary text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <Download className="mr-2 h-4 w-4" /> Download Detailed CSV
                    </Button>

                    <div className="p-5 bg-primary/5 rounded-2xl border border-dashed border-primary/20 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                            "Use this tool to download raw data for your KRA tax returns or internal office audits."
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none ring-1 ring-black/5 shadow-sm bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest">Reporting Tip</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                        To see a full year analysis, pick "Jan 1st" to today. For tax filings, use the "With VAT Only" filter in the CSV tool.
                    </p>
                </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
