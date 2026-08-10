'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { PlusCircle, TrendingDown, ReceiptText, Wallet, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { TransactionForm } from './transaction-form';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Badge } from '@/components/ui/badge';
import { useSaaS } from '@/components/saas/saas-provider';

export function AccountingClient() {
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  
  const isLoading = isUserLoading || expensesLoading;

  const todayExpenses = useMemo(() => {
      if (!rawExpenses) return [];
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      return rawExpenses.filter(e => {
          try { return format(parseISO(e.date), 'yyyy-MM-dd') === todayStr; } catch { return false; }
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawExpenses]);

  const { totalExpenses, categoryCount } = useMemo(() => {
    const total = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const categories = new Set(todayExpenses.map(e => e.category)).size;
    return { totalExpenses: total, categoryCount: categories };
  }, [todayExpenses]);

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
        title="Today's Expense Feed"
        description={`Tracking outgoings for ${format(new Date(), 'PPPP')}`}
        actionLabel="Record Expense"
        onAction={() => setIsFormOpen(true)}
        ActionIcon={PlusCircle}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <SummaryCard 
            title="Today's Total Spend" 
            value={formatCurrency(totalExpenses)} 
            icon={TrendingDown} 
            className="border-l-4 border-l-red-500"
        />
        <SummaryCard 
            title="Active Categories" 
            value={categoryCount} 
            icon={Wallet} 
            description="Expense types tracked today" 
        />
        <SummaryCard 
            title="Reporting Window" 
            value="Today" 
            icon={CalendarIcon} 
            description="Strict daily reporting cycle" 
        />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-red-600">
                <ReceiptText className="h-4 w-4" />
                Operational Expense Ledger (Daily)
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-6 py-4">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Time</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Notes</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {todayExpenses.map(e => (
                <TableRow key={e.id} className="hover:bg-muted/5 transition-colors h-14 border-b last:border-0">
                  <TableCell className="pl-6">
                    <Badge variant="destructive" className="text-[8px] font-black uppercase h-4 px-2">Expense</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground">
                    {format(parseISO(e.date), 'p')}
                  </TableCell>
                  <TableCell className="font-black uppercase text-[10px] tracking-tight">
                    {e.category}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                    {e.notes || '—'}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-black text-red-600">
                    {formatCurrency(e.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {todayExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30">
                        <ReceiptText className="h-12 w-12" />
                        <p className="text-xs font-black uppercase tracking-widest">No expense records found for today.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Log Expense</DialogTitle>
          </DialogHeader>
          <TransactionForm user={user} onFinished={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
