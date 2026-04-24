
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
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
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

  // FIRESTORE QUERIES: Siloed by tenantId
  const salesQuery = useMemoFirebase(() => {
    if (!tenant || !dateRange) return null;
    return query(
      collection(firestore, 'sales_transactions'),
      where('tenantId', '==', tenant.id),
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end),
      orderBy('date', 'desc')
    );
  }, [firestore, tenant?.id, dateRange]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant || !dateRange) return null;
    return query(
      collection(firestore, 'expenses'),
      where('tenantId', '==', tenant.id),
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end),
      orderBy('date', 'desc')
    );
  }, [firestore, tenant?.id, dateRange]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  
  const isLoading = isUserLoading || salesLoading || expensesLoading || !dateRange;

  const { totalSales, totalCogs, totalExpenses, netProfit } = useMemo(() => {
    const totalSales = sales?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
    const totalCogs = sales?.reduce((sum, s) => sum + (s.cogs || 0), 0) ?? 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
    return { totalSales, totalCogs, totalExpenses, netProfit: totalSales - totalCogs - totalExpenses };
  }, [sales, expenses]);
  
  const recentTransactions = useMemo(() => {
      const all: Transaction[] = [
        ...(sales || []).map(s => ({...s, transactionType: 'Sale' as const })),
        ...(expenses || []).map(e => ({...e, transactionType: 'Expense' as const })),
      ];
      return all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [sales, expenses]);

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
    <>
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
    </>
  );
}
