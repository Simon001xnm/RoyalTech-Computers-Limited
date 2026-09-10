'use client';

import { useState, useMemo } from 'react';
import type { Expense } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { PlusCircle, TrendingDown, ReceiptText, Wallet, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { TransactionForm } from './transaction-form';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { useSaaS } from '@/components/saas/saas-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';

/**
 * @fileOverview Expense Feed with Smart Time Filtering
 * Optimized for local-day accuracy to ensure "Today" entries are always visible.
 */
export function AccountingClient() {
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  
  const isLoading = isUserLoading || expensesLoading;

  const filteredExpenses = useMemo(() => {
      if (!rawExpenses) return [];
      
      const now = new Date();
      let results = [...rawExpenses];
      
      if (filter !== 'all') {
          results = results.filter(e => {
              try {
                  const expenseDate = parseISO(e.date);
                  if (filter === 'today') {
                      return isSameDay(expenseDate, now);
                  }
                  
                  let interval: { start: Date; end: Date };
                  switch (filter) {
                      case 'week': interval = { start: startOfWeek(now), end: endOfDay(now) }; break;
                      case 'month': interval = { start: startOfMonth(now), end: endOfMonth(now) }; break;
                      case 'year': interval = { start: startOfYear(now), end: endOfYear(now) }; break;
                      default: return true;
                  }
                  return isWithinInterval(expenseDate, interval);
              } catch {
                  return false;
              }
          });
      }

      return results.sort((a,b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
      });
  }, [rawExpenses, filter]);

  const { totalExpenses, categoryCount } = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const categories = new Set(filteredExpenses.map(e => e.category)).size;
    return { totalExpenses: total, categoryCount: categories };
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
        accessorKey: "date",
        header: "Date & Time",
        cell: ({ row }) => (
            <span className="text-[10px] font-bold text-muted-foreground">
                {row.original.date ? format(parseISO(row.original.date), 'dd MMM, HH:mm') : 'Recently'}
            </span>
        )
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span className="font-black uppercase text-[10px] tracking-tight">{row.original.category}</span>
    },
    {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => <span className="text-[10px] text-muted-foreground max-w-[250px] truncate">{row.original.notes || '—'}</span>
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right pr-6">Amount</div>,
        cell: ({ row }) => <div className="text-right pr-6 font-black text-red-600">{formatCurrency(row.original.amount)}</div>
    }
  ], []);

  const table = useReactTable({
    data: filteredExpenses,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Money Spent" description="Checking records..." />
        <div className="flex items-center justify-center h-64">
           <p className="text-muted-foreground animate-pulse font-black uppercase text-[10px] tracking-widest">Syncing expense list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Money Spent (Expense Feed)"
        description="A live record of all shop expenditures saved to the cloud."
        actions={
            <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                    <SelectTrigger className="h-10 w-40 bg-white font-black uppercase text-[10px] tracking-widest border-2">
                        <Filter className="h-3 w-3 mr-2 text-primary" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Lifetime History</SelectItem>
                        <SelectItem value="today">Today's Spend</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => setIsFormOpen(true)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> Record New Spend
                </Button>
            </div>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <SummaryCard 
            title="Total Spend" 
            value={formatCurrency(totalExpenses)} 
            icon={TrendingDown} 
            className="border-l-4 border-l-red-500"
            description={`Total for ${filter.toUpperCase()}`}
        />
        <SummaryCard 
            title="Categories" 
            value={categoryCount} 
            icon={Wallet} 
            description="Active expense types" 
        />
        <SummaryCard 
            title="Records" 
            value={filteredExpenses.length} 
            icon={CalendarIcon} 
            description={`Transactions in ${filter}`} 
        />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b py-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-red-600">
                    <ReceiptText className="h-4 w-4" />
                    Expenditure Ledger
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-black uppercase bg-white">Showing: {filter}</Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                        {hg.headers.map(h => (
                            <TableHead key={h.id} className="text-[10px] font-black uppercase py-4">
                                {flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/5 transition-colors h-14 border-b last:border-0">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30">
                        <ReceiptText className="h-12 w-12" />
                        <p className="text-xs font-black uppercase tracking-widest">No spending records found for this period.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Record Spending</DialogTitle>
          </DialogHeader>
          <TransactionForm user={user} onFinished={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
