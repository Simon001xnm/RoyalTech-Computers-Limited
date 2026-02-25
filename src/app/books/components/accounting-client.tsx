
'use client';

import { useState, useMemo } from 'react';
import type { Sale, Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, TrendingDown, ChevronsRight, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { TransactionForm } from './transaction-form';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Badge } from '@/components/ui/badge';

type Transaction = (Sale | Expense) & { transactionType: 'Sale' | 'Expense' };

export function AccountingClient() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { start, end } = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const salesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'sales'), where('date', '>=', start.toISOString()), where('date', '<=', end.toISOString())) : null, [firestore, user, start, end]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);
  
  const expensesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'expenses'), where('date', '>=', start.toISOString()), where('date', '<=', end.toISOString())) : null, [firestore, user, start, end]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);
  
  const isLoading = isUserLoading || salesLoading || expensesLoading;

  const { totalSales, totalCogs, totalExpenses, netProfit } = useMemo(() => {
    const totalSales = sales?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
    const totalCogs = sales?.reduce((sum, s) => sum + (s.cogs || 0), 0) ?? 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
    const netProfit = totalSales - totalCogs - totalExpenses;
    return { totalSales, totalCogs, totalExpenses, netProfit };
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
    return (
      <>
        <PageHeader title="Accounting" description="Manage your sales, expenses, and financial health." />
        <p>Loading financial data for {format(new Date(), 'MMMM yyyy')}...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Accounting"
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
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>The last 10 transactions recorded this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant={t.transactionType === 'Sale' ? 'default' : 'destructive'}>
                        {t.transactionType}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-medium">
                      {'category' in t ? t.category : t.notes || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No transactions recorded for this month yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record a New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            user={user}
            onFinished={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
