'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Sale, Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, TrendingDown, ChevronsRight, ReceiptText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { TransactionForm } from './transaction-form';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Badge } from '@/components/ui/badge';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';

type Transaction = (Sale | Expense) & { transactionType: 'Sale' | 'Expense' };

export function AccountingClient() {
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    setDateRange({
      start: startOfMonth(now).toISOString(),
      end: endOfMonth(now).toISOString(),
    });
  }, []);

  // FIRESTORE QUERIES: Index-free (sorting in memory)
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawSales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  
  const isLoading = isUserLoading || salesLoading || expensesLoading || !dateRange;

  const filteredData = useMemo(() => {
      if (!rawSales || !rawExpenses || !dateRange) return { sales: [], expenses: [] };
      const interval = { start: parseISO(dateRange.start), end: parseISO(dateRange.end) };
      
      const sales = rawSales.filter(s => {
          try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; }
      });
      const expenses = rawExpenses.filter(e => {
          try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; }
      });
      return { sales, expenses };
  }, [rawSales, rawExpenses, dateRange]);

  const { totalSales, totalCogs, totalExpenses, netProfit } = useMemo(() => {
    const totalSales = filteredData.sales.reduce((sum, s) => sum + s.amount, 0);
    const totalCogs = filteredData.sales.reduce((sum, s) => sum + (s.cogs || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    return { totalSales, totalCogs, totalExpenses, netProfit: totalSales - totalCogs - totalExpenses };
  }, [filteredData]);
  
  const recentTransactions = useMemo(() => {
      const all: Transaction[] = [
        ...filteredData.sales.map(s => ({...s, transactionType: 'Sale' as const })),
        ...filteredData.expenses.map(e => ({...e, transactionType: 'Expense' as const })),
      ];
      return all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [filteredData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expense Feed" description="Syncing cloud ledger..." />
        <div className="flex items-center justify-center h-64">
           <p className="text-muted-foreground animate-pulse font-black uppercase text-[10px] tracking-widest">Aggregating Transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Expense Feed (Cloud)"
        description={`Transaction flow for ${format(new Date(), 'MMMM yyyy')}`}
        actionLabel="Log Transaction"
        onAction={() => setIsFormOpen(true)}
        ActionIcon={PlusCircle}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <SummaryCard title="Monthly Revenue" value={formatCurrency(totalSales)} icon={DollarSign} />
        <SummaryCard title="Inventory Costs" value={formatCurrency(totalCogs)} icon={ChevronsRight} />
        <SummaryCard title="Operating Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} />
        <SummaryCard title="Estimated Net" value={formatCurrency(netProfit)} icon={DollarSign} />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-primary" />
                Live Cloud Ledger
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-6 py-4">Type</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Details</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/5 transition-colors h-14 border-b last:border-0">
                  <TableCell className="pl-6">
                    <Badge 
                        variant={t.transactionType === 'Sale' ? 'default' : 'destructive'}
                        className="text-[8px] font-black uppercase h-4 px-2"
                    >
                        {t.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground">
                    {format(parseISO(t.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="font-black uppercase text-[10px] tracking-tight">
                    {'category' in t ? t.category : t.customerName || 'POS Sale'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right pr-6 font-black",
                    t.transactionType === 'Sale' ? "text-primary" : "text-red-600"
                  )}>
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30">
                        <ReceiptText className="h-12 w-12" />
                        <p className="text-xs font-black uppercase tracking-widest">No ledger records in this period.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Record Cloud Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm user={user} onFinished={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
