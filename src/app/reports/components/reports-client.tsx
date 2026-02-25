
'use client';

import { useState, useMemo } from 'react';
import type { Sale, Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear } from 'date-fns';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PnlReport } from './pnl-report';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  const salesQuery = useMemoFirebase(() => {
    if (!user || !date?.from || !date?.to) return null;
    return query(
      collection(firestore, 'sales'),
      where('date', '>=', date.from.toISOString()),
      where('date', '<=', date.to.toISOString())
    );
  }, [firestore, user, date]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !date?.from || !date?.to) return null;
    return query(
      collection(firestore, 'expenses'),
      where('date', '>=', date.from.toISOString()),
      where('date', '<=', date.to.toISOString())
    );
  }, [firestore, user, date]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const isLoading = isUserLoading || salesLoading || expensesLoading;

  const pnlData = useMemo<PnlData>(() => {
    const totalSales = sales?.reduce((sum, s) => sum + s.amount, 0) ?? 0;

    const cogsBreakdown = sales?.reduce((acc, sale) => {
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach(item => {
                const cogs = item.cogs || 0;
                acc.totalCogs += cogs;

                let category = 'Other Goods';
                if (item.type === 'laptop') {
                    category = 'Cost of Laptops';
                } else if (item.type === 'accessory') {
                    category = 'Cost of Accessories';
                }
                
                acc.cogsByCategory[category] = (acc.cogsByCategory[category] || 0) + cogs;
            });
        } else if (sale.cogs && sale.cogs > 0) {
             const cogs = sale.cogs;
            acc.totalCogs += cogs;
            // For manual entries from the 'Books' page, categorize them under Cost of Laptops
            // as per the user's request to focus on laptop COGS.
            const category = 'Cost of Laptops'; 
            acc.cogsByCategory[category] = (acc.cogsByCategory[category] || 0) + cogs;
        }
        return acc;
    }, { totalCogs: 0, cogsByCategory: {} as Record<string, number> }) ?? { totalCogs: 0, cogsByCategory: {} };


    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

    const expenseByCategory =
      expenses?.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as { [key: string]: number }) ?? {};

    const grossProfit = totalSales - cogsBreakdown.totalCogs;
    const netIncome = grossProfit - totalExpenses;

    return {
      operatingIncome: { totalSales },
      costOfGoodsSold: { 
          totalCogs: cogsBreakdown.totalCogs,
          cogsByCategory: cogsBreakdown.cogsByCategory
      },
      operatingExpenses: { totalExpenses, expenseByCategory },
      grossProfit,
      netIncome,
    };
  }, [sales, expenses]);

  const handleDownloadPdf = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const reportElement = document.getElementById('pnl-report');
    if (!reportElement) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find the report element to download.',
      });
      return;
    }

    toast({
      title: 'Generating PDF...',
      description: 'Your report is being prepared for download.',
    });

    try {
        const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const MARGIN = 12; // 12mm margin
        const contentWidth = pdfWidth - (MARGIN * 2);
        const contentHeight = pdfHeight - (MARGIN * 2);

        const imgProps = pdf.getImageProperties(imgData);
        const aspectRatio = imgProps.width / imgProps.height;

        let finalWidth = contentWidth;
        let finalHeight = finalWidth / aspectRatio;

        // If the calculated height is greater than the available content height,
        // we scale based on height to fit on one page.
        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = finalHeight * aspectRatio;
        }
        
        // Center the image within the margined area
        const xOffset = MARGIN + (contentWidth - finalWidth) / 2;
        const yOffset = MARGIN + (contentHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        
        const datePart = date?.from && date.to ? `${format(date.from, 'yyyy-MM-dd')}_to_${format(date.to, 'yyyy-MM-dd')}` : 'report';
        pdf.save(`Profit_and_Loss_${datePart}.pdf`);

        toast({
            title: 'Download Ready',
            description: 'Your PDF report has been downloaded.',
        });
    } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({
            variant: 'destructive',
            title: 'PDF Generation Failed',
            description: 'There was an error while creating the PDF file.',
        });
    }
  };

  return (
    <>
      <PageHeader
        title="Profit and Loss Report"
        description="An overview of your company's revenues and expenses during a specific period of time."
      />

      <Card className="mb-6 no-print">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <p>Loading report data...</p>
      ) : (
        <PnlReport data={pnlData} dateRange={date} />
      )}
    </>
  );
}
