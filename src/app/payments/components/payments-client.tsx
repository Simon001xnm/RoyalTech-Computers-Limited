
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    PlusCircle, 
    Search, 
    Filter, 
    WalletCards, 
    DollarSign, 
    ArrowDownLeft, 
    Loader2,
    Calendar as CalendarIcon,
    History as HistoryIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Payment, User as AppUser } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { getPaymentColumns } from './payment-columns';
import { PaymentForm } from './payment-form';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type PaginationState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export function PaymentsClient() {
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  const paymentsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'payments'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawPayments, isLoading: paymentsLoading } = useCollection<Payment>(paymentsQuery);
  const { data: customers } = useCollection(customersQuery);

  const filteredPayments = useMemo(() => {
    if (!rawPayments) return [];
    
    let results = [...rawPayments].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    if (typeFilter !== 'all') {
        results = results.filter(p => p.type === typeFilter);
    }

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        results = results.filter(p => 
            p.customerName?.toLowerCase().includes(lowerSearch) ||
            p.reference?.toLowerCase().includes(lowerSearch)
        );
    }

    return results;
  }, [rawPayments, searchTerm, typeFilter]);

  const columns = useMemo(() => getPaymentColumns(), []);

  const table = useReactTable({
    data: filteredPayments,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totals = useMemo(() => {
      const payments = filteredPayments.filter(p => p.type === 'Payment');
      const credits = filteredPayments.filter(p => p.type === 'Credit Note');
      
      const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const totalCredits = credits.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      
      return { totalPaid, totalCredits, count: filteredPayments.length };
  }, [filteredPayments]);

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (!isAdmin) {
      return (
          <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="bg-destructive/10 p-6 rounded-full"><HistoryIcon className="h-16 w-16 text-destructive" /></div>
              <div className="max-w-md space-y-2">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Access Forbidden</h1>
                  <p className="text-muted-foreground">The Payment Ledger is restricted to administrators only. Please contact your shop owner.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Payment Ledger" 
        description="Comprehensive log of all incoming payments and credit notes."
        actionLabel="Register Transaction"
        onAction={() => setIsFormOpen(true)}
        ActionIcon={PlusCircle}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Collected" value={formatKes(totals.totalPaid)} icon={DollarSign} description="Income recorded in period" />
          <SummaryCard title="Total Credits" value={formatKes(totals.totalCredits)} icon={ArrowDownLeft} className="border-l-4 border-l-red-500" description="Refunds & manual offsets" />
          <SummaryCard title="Logs Found" value={totals.count} icon={WalletCards} description="Matching entries in ledger" />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 py-4 px-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4 text-primary" />
                    Transaction Stream
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 w-40 font-bold text-[10px] uppercase bg-white">
                            <Filter className="h-3 w-3 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Entries</SelectItem>
                            <SelectItem value="Payment">Payments Only</SelectItem>
                            <SelectItem value="Credit Note">Credit Notes</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by client or ref..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 w-64 bg-white font-bold"
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {paymentsLoading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Ledger Data...
                </div>
            ) : (
                <>
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
                                    <TableRow key={row.id} className="h-14 hover:bg-muted/5 transition-colors border-b last:border-0">
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className="py-2">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center opacity-30 italic font-bold uppercase text-xs">
                                        No transaction logs found for this criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <DataTablePagination table={table} />
                </>
            )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <WalletCards className="h-6 w-6 text-primary" />
                Record Transaction
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Manual entry for shop financial logs</DialogDescription>
          </DialogHeader>
          <PaymentForm customers={customers || []} onFinished={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
