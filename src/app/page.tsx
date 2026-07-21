'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  Zap,
  Loader2,
  Activity,
  TrendingUp,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSaaS } from '@/components/saas/saas-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { LandingPage } from '@/components/marketing/landing-page';
import { PosClient } from './pos/components/pos-client';
import { RecentSales } from './pos/components/recent-sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import type { Sale, Document as AppDocument } from '@/types';

/**
 * @fileOverview Main Shop Dashboard
 * Simplified language and mobile-first density.
 */
export default function DashboardPage() {
  const { tenant, isLoading: isSaaSLoading } = useSaaS();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id), limit(100));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const earnings = useMemo(() => {
    if (!sales) return { day: 0, week: 0, month: 0 };
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    sales.forEach(sale => {
      try {
        const saleDate = parseISO(sale.date);
        const amount = sale.amount || 0;

        if (isSameDay(saleDate, today)) dayTotal += amount;
        if (isWithinInterval(saleDate, { start: weekStart, end: weekEnd })) weekTotal += amount;
        if (isWithinInterval(saleDate, { start: monthStart, end: monthEnd })) monthTotal += amount;
      } catch (e) {}
    });

    return { day: dayTotal, week: weekTotal, month: monthTotal };
  }, [sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isUserLoading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background">
            <Loader2 className="h-6 w-6 animate-spin opacity-20 text-primary" />
        </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const showMetricsLoading = isSaaSLoading || salesLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black uppercase tracking-tight">Home</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold h-6 text-[10px]">
            <Zap className="h-2.5 w-2.5 mr-1 fill-green-700" /> Online
        </Badge>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {showMetricsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
        ) : (
            <>
                <SummaryCard 
                  title="Today" 
                  value={formatCurrency(earnings.day)} 
                  icon={Activity} 
                  className="border-l-4 border-l-blue-500 shadow-sm"
                />
                <SummaryCard 
                  title="Week" 
                  value={formatCurrency(earnings.week)} 
                  icon={TrendingUp} 
                  className="border-l-4 border-l-purple-500 shadow-sm"
                />
                <SummaryCard 
                  title="Month" 
                  value={formatCurrency(earnings.month)} 
                  icon={BarChart3} 
                  className="border-l-4 border-l-emerald-500 shadow-sm"
                />
            </>
        )}
      </div>

      <div className="space-y-6">
          <Card className="border-none shadow-xl overflow-hidden ring-1 ring-black/5 bg-white">
              <CardHeader className="bg-primary/5 border-b p-3">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Sale
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                  <PosClient />
              </CardContent>
          </Card>

          <div className="px-1">
            <RecentSales onViewReceipt={(sale) => setViewingSale(sale)} />
          </div>
      </div>

      <Dialog open={!!viewingSale} onOpenChange={(o) => !o && setViewingSale(null)}>
        <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-4 border-b bg-white no-print">
            <DialogTitle className="text-lg font-black uppercase">Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/20 p-2 md:p-8 flex justify-center">
            <div className="bg-white shadow-2xl overflow-hidden scale-[0.4] sm:scale-[0.6] md:scale-100 origin-top" style={{ width: '210mm', minHeight: '297mm' }}>
                {viewingSale && (
                    <ReceiptPdf document={{
                        id: viewingSale.id,
                        tenantId: tenant?.id || '',
                        type: 'Receipt',
                        title: `Receipt #${viewingSale.id.slice(0, 5).toUpperCase()}`,
                        generatedDate: viewingSale.date,
                        data: { ...viewingSale, applyVat: !!viewingSale.vat },
                        createdAt: viewingSale.createdAt || new Date().toISOString()
                    } as AppDocument} />
                )}
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-3 bg-white no-print">
            <Button variant="outline" onClick={() => setViewingSale(null)} className="font-bold">Close</Button>
            <Button onClick={() => window.print()} className="font-black uppercase">Print</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}