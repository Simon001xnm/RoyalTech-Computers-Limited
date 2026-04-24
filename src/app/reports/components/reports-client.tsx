'use client';

import { useState, useMemo } from 'react';
import type { Sale, Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PnlReport } from './pnl-report';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';

export interface PnlData {
  operatingIncome: {
    totalSales: number;
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
  const [isExporting, setIsExporting] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  // CLOUD QUERIES: Deriving P&L from Firestore
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id), orderBy('date', 'desc'));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id), orderBy('date', 'desc'));
  }, [firestore, tenant?.id]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const isLoading = salesLoading || expensesLoading;

  const filteredData = useMemo(() => {
    if (!sales || !expenses || !date?.from || !date?.to) return { filteredSales: [], filteredExpenses: [] };
    const interval = { start: date.from, end: date.to };
    
    const filteredSales = sales.filter(s => {
        try {
            return isWithinInterval(parseISO(s.date), interval);
        } catch { return false; }
    });
    
    const filteredExpenses = expenses.filter(e => {
        try {
            return isWithinInterval(parseISO(e.date), interval);
        } catch { return false; }
    });

    return { filteredSales, filteredExpenses };
  }, [sales, expenses, date]);

  const pnlData = useMemo<PnlData>(() => {
    const { filteredSales, filteredExpenses } = filteredData;
    const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const cogsBreakdown = filteredSales.reduce((acc, sale) => {
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach(item => {
                const cogs = item.cogs || 0;
                acc.totalCogs += cogs;
                let category = item.type === 'asset' ? 'Cost of Assets' : 'Cost of Accessories';
                acc.cogsByCategory[category] = (acc.cogsByCategory[category] || 0) + cogs;
            });
        }
        return acc;
    }, { totalCogs: 0, cogsByCategory: {} as Record<string, number> });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseByCategory = filteredExpenses.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
    }, {} as { [key: string]: number });

    const grossProfit = totalSales - cogsBreakdown.totalCogs;
    const netIncome = grossProfit - totalExpenses;

    return {
      operatingIncome: { totalSales },
      costOfGoodsSold: { totalCogs: cogsBreakdown.totalCogs, cogsByCategory: cogsBreakdown.cogsByCategory },
      operatingExpenses: { totalExpenses, expenseByCategory },
      grossProfit,
      netIncome,
    };
  }, [filteredData]);

  const handleDownloadPdf = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const reportElement = document.getElementById('pnl-report');
    if (!reportElement) return;

    setIsExporting(true);
    toast({ title: 'Preparing Cloud Report' });

    setTimeout(async () => {
        try {
            const canvas = await html2canvas(reportElement, { scale: 3, useCORS: true, windowWidth: 1200 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            pdf.save(`Financial_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast({ title: 'Download Successful' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'PDF Error' });
        } finally {
            setIsExporting(false);
        }
    }, 1000);
  };

  return (
    <>
      <PageHeader title="Financial Ledger (Cloud)" description="Aggregate profit and loss analysis synced across your workspace." />

      <Card className="mb-6 no-print shadow-sm">
        <CardContent className="pt-6 flex flex-wrap items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={'outline'} className={cn('w-[300px] justify-start text-left font-normal h-11', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (date.to ? <>{format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}</> : format(date.from, 'LLL dd, y')) : <span>Pick a date range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
          </Popover>
          <Button onClick={handleDownloadPdf} disabled={isLoading || isExporting} className="h-11 px-6 font-bold shadow-md">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Export Report
          </Button>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest">Aggregating Cloud Data...</p>
        </div>
      ) : (
        <div className="flex justify-center bg-muted/20 p-8 rounded-2xl border border-dashed overflow-auto">
            <div id="pnl-report" className="a4-document shadow-2xl relative">
                <PnlReport data={pnlData} dateRange={date} />
                {isExporting && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="font-black text-primary uppercase tracking-widest">Optimizing PDF...</p></div>}
            </div>
        </div>
      )}
    </>
  );
}
