'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Sale, Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, TrendingDown, ChevronsRight } from 'lucide-react';
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
      return all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [filteredData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  if (isLoading) {
    return <PageHeader title="Accounting" description="Syncing cloud ledger..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting (Cloud)"
        description={`Financial summary for ${format(new Date(), 'MMMM yyyy')}`}
        actionLabel="Record Transaction"
        onAction={() => setIsFormOpen(true)}
        ActionIcon={PlusCircle}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <SummaryCard title="Total Sales" value={formatCurrency(totalSales)} icon={DollarSign} />
        <SummaryCard title="Total COGS" value={formatCurrency(totalCogs)} icon={ChevronsRight} />
        <SummaryCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} />
        <SummaryCard title="Net Profit" value={formatCurrency(netProfit)} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {recentTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell><Badge variant={t.transactionType === 'Sale' ? 'default' : 'destructive'}>{t.transactionType}</Badge></TableCell>
                  <TableCell>{format(parseISO(t.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium">{'category' in t ? t.category : t.notes || 'N/A'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No records in this period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Record Cloud Transaction</DialogTitle></DialogHeader>
          <TransactionForm user={user} onFinished={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
