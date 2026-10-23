"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    Wallet, 
    Search, 
    ArrowRight, 
    Download, 
    History, 
    TrendingUp,
    TrendingDown, 
    User,
    Loader2,
    DollarSign,
    ArrowUpDown,
    BarChart3,
    MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { format, parseISO, isAfter } from 'date-fns';
import { CustomerStatementPdf } from '@/app/documents/components/pdfs/customer-statement-pdf';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Customer, Payment } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { cn } from '@/lib/utils';

export function ReceivablesClient() {
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalBalance", desc: true }
  ]);

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'payments'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: allPayments } = useCollection<Payment>(paymentsQuery);

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const formatKes = (val: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  const debtors = useMemo(() => {
    if (!sales || !customers) return [];
    
    const debtorMap: Record<string, { 
        customer: Customer; 
        sales: Sale[]; 
        payments: Payment[];
        totalBalance: number; 
        totalPaid: number; 
        totalInvoiced: number;
        lastModified: string;
    }> = {};

    customers.forEach(customer => {
        debtorMap[customer.id] = {
            customer,
            sales: [],
            payments: [],
            totalBalance: 0,
            totalPaid: 0,
            totalInvoiced: 0,
            lastModified: customer.updatedAt || customer.registrationDate || new Date().toISOString()
        };
    });

    sales.forEach(sale => {
        if (debtorMap[sale.customerId]) {
            debtorMap[sale.customerId].sales.push(sale);
            debtorMap[sale.customerId].totalInvoiced += (Number(sale.total) || 0);
            debtorMap[sale.customerId].totalPaid += (Number(sale.amountPaid) || 0);
            debtorMap[sale.customerId].totalBalance += (Number(sale.balance) || 0);
            
            const saleDate = sale.updatedAt || sale.date || sale.createdAt;
            if (saleDate && isAfter(parseISO(saleDate), parseISO(debtorMap[sale.customerId].lastModified))) {
                debtorMap[sale.customerId].lastModified = saleDate;
            }
        }
    });

    allPayments?.forEach(pay => {
      if (debtorMap[pay.customerId]) {
        debtorMap[pay.customerId].payments.push(pay);
      }
    });

    return Object.values(debtorMap).filter(d => d.totalInvoiced > 0 || d.totalPaid > 0);
  }, [sales, customers, allPayments]);

  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => 
        d.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.customer.alias || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [debtors, searchTerm]);

  const topDebtorsData = useMemo(() => {
    return filteredDebtors
      .filter(d => d.totalBalance > 100)
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 5)
      .map(d => ({
        name: (d.customer.alias || d.customer.name).split(' ')[0],
        balance: d.totalBalance
      }));
  }, [filteredDebtors]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
        accessorKey: "customer.name",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent p-0 font-black uppercase text-[9px] sm:text-[10px]">
                Identity
                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-primary/5 p-1.5 sm:p-2 rounded-lg shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="overflow-hidden">
                    <p className="font-black uppercase text-[11px] sm:text-xs tracking-tight text-foreground truncate">{row.original.customer.name}</p>
                    <p className="text-[9px] text-muted-foreground opacity-60 font-medium truncate">
                        {row.original.customer.alias || row.original.customer.email}
                    </p>
                </div>
            </div>
        )
    },
    {
        accessorKey: "totalBalance",
        header: ({ column }) => (
            <div className="text-right">
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[9px] sm:text-[10px]">
                    Balance
                    <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3" />
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1 sm:gap-3">
                <span className={cn(
                  "font-black text-xs sm:text-sm",
                  row.original.totalBalance > 0 ? "text-red-600" : "text-green-600"
                )}>
                    {formatKes(row.original.totalBalance)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-20 hidden sm:block" />
            </div>
        )
    }
  ], []);

  const table = useReactTable({
    data: filteredDebtors,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedAccount = useMemo(() => {
    if (!selectedCustomerId) return null;
    return debtors.find(d => d.customer.id === selectedCustomerId);
  }, [debtors, selectedCustomerId]);

  const totalOutstanding = debtors.filter(d => d.totalBalance > 0).reduce((acc, d) => acc + d.totalBalance, 0);
  const totalOverpaid = Math.abs(debtors.filter(d => d.totalBalance < 0).reduce((acc, d) => acc + d.totalBalance, 0));

  const handleLogPayment = async () => {
    if (!selectedAccount || !tenant || !user) return;
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast({ variant: 'destructive', title: "Amount Required" });
        return;
    }

    setIsSubmittingPayment(true);
    try {
        const timestamp = new Date().toISOString();
        
        await addDoc(collection(firestore, 'payments'), {
            tenantId: tenant.id,
            customerId: selectedAccount.customer.id,
            customerName: selectedAccount.customer.name,
            amount: amountToPay,
            method: "Cash",
            type: 'Payment',
            reference: 'MANUAL_SETTLEMENT',
            date: timestamp,
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || user.email }
        });

        const unpaidSales = [...selectedAccount.sales]
            .filter(s => (Number(s.balance) || 0) > 0)
            .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

        let remainingToDeduct = amountToPay;
        for (const sale of unpaidSales) {
            if (remainingToDeduct <= 0) break;
            const currentBal = Number(sale.balance) || 0;
            const deduct = Math.min(currentBal, remainingToDeduct);
            const saleRef = doc(firestore, 'sales_transactions', sale.id);
            await updateDoc(saleRef, {
                balance: currentBal - deduct,
                amountPaid: (Number(sale.amountPaid) || 0) + deduct,
                status: (currentBal - deduct) <= 0 ? 'Paid' : 'Partial',
                updatedAt: timestamp
            });
            remainingToDeduct -= deduct;
        }

        toast({ title: "Payment Recorded & Balanced" });
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Sync Failed" });
    } finally {
        setIsSubmittingPayment(false);
    }
  };

  const handleDownloadStatement = async (debtor: any) => {
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    try {
        const element = document.getElementById('statement-export-target');
        if (!element) throw new Error("Target node not found");
        await new Promise(r => setTimeout(r, 800));
        const canvas = await html2canvas(element, { scale: 3.5, useCORS: true, backgroundColor: "#ffffff" });
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`Statement_${debtor.customer.name.replace(/\s+/g, '_').toUpperCase()}.pdf`);
        toast({ title: "Statement Downloaded" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Export Failed" });
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6 px-1 sm:px-0 pb-20">
      <PageHeader 
        title="Owed Capital" 
        description="Debt Matrix Logic."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-6">
          <SummaryCard title="DEBT LOAD" value={formatKes(totalOutstanding)} icon={Wallet} />
          <SummaryCard title="CREDITS" value={formatKes(totalOverpaid)} icon={TrendingUp} className="border-l-2 border-l-green-500" />
          <div className="hidden md:block">
              <SummaryCard title="ACCOUNTS" value={debtors.length} icon={User} />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-8">
        <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-card rounded-xl sm:rounded-[2rem]">
            <CardHeader className="bg-muted/10 py-3 sm:py-4 px-4 sm:px-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-[10px] sm:text-sm font-black uppercase tracking-widest">Client Balances</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-30" />
                        <Input 
                            placeholder="Find account..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full bg-background font-bold rounded-xl border-2 text-xs"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (
                                        <TableHead key={h.id} className="p-0">
                                            {flexRender(h.column.columnDef.header, h.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow 
                                        key={row.id} 
                                        className="hover:bg-muted/10 cursor-pointer group transition-colors h-14"
                                        onClick={() => setSelectedCustomerId(row.original.customer.id)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className="py-2 px-3 sm:px-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={columns.length} className="h-40 text-center opacity-30 font-black uppercase text-[10px]">No records found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="px-4"><DataTablePagination table={table} /></div>
            </CardContent>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-xl border-none ring-1 ring-black/5 bg-card overflow-hidden rounded-xl sm:rounded-[2rem]">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/10">
                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" /> Debt Intensity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 h-[250px] sm:h-[300px]">
                {topDebtorsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topDebtorsData} layout="vertical" margin={{ left: -10 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={8} fontStyle="bold" axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v: number) => formatKes(v)} contentStyle={{ borderRadius: '12px', fontSize: '9px' }} />
                          <Bar dataKey="balance" radius={[0, 4, 4, 0]} barSize={15}>
                              {topDebtorsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center opacity-10 uppercase font-black text-[9px]">Silo Empty</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <SheetContent className="w-full sm:max-w-3xl flex flex-col p-0 border-none shadow-2xl">
            {selectedAccount && (
                <div className="flex flex-col h-full overflow-hidden bg-background">
                    <SheetHeader className="p-6 sm:p-8 border-b bg-muted/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="overflow-hidden">
                                <SheetTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate">{selectedAccount.customer.name}</SheetTitle>
                                <SheetDescription className="font-bold text-[9px] sm:text-[10px] uppercase tracking-widest text-primary mt-1">Workspace Identity Resume</SheetDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDownloadStatement(selectedAccount)} disabled={isExporting} className="h-10 px-4 font-black uppercase text-[9px] tracking-widest border-2 rounded-xl">
                                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />} Statement
                                </Button>
                                <Button onClick={() => setIsPaymentDialogOpen(true)} className="h-10 px-6 font-black uppercase tracking-widest shadow-xl rounded-xl text-[9px]">
                                    Log Settlement
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-muted/5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground mb-1">Billed</p>
                                <p className="text-sm sm:text-xl font-black">{formatKes(selectedAccount.totalInvoiced)}</p>
                            </div>
                            <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[8px] sm:text-[9px] font-black uppercase text-green-600 mb-1">Paid</p>
                                <p className="text-sm sm:text-xl font-black text-green-700">{formatKes(selectedAccount.totalPaid)}</p>
                            </div>
                            <div className={cn("p-4 sm:p-6 rounded-xl sm:rounded-2xl ring-1 shadow-sm text-center border-b-4 col-span-2 sm:col-span-1", selectedAccount.totalBalance > 0 ? "bg-red-50 ring-red-100 border-red-500" : "bg-green-50 ring-green-100 border-green-500")}>
                                <p className={cn("text-[8px] sm:text-[9px] font-black uppercase mb-1", selectedAccount.totalBalance > 0 ? "text-red-600" : "text-green-600")}>Balance</p>
                                <p className={cn("text-lg sm:text-xl font-black", selectedAccount.totalBalance > 0 ? "text-red-700" : "text-green-700")}>{formatKes(selectedAccount.totalBalance)}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50"><History className="h-3 w-3" /> Ledger Stream</h3>
                            <div className="space-y-2">
                                {selectedAccount.sales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(sale => {
                                    const bal = Number(sale.balance) || 0;
                                    return (
                                        <div key={sale.id} className="p-3 sm:p-4 bg-card rounded-xl border flex justify-between items-center group shadow-sm transition-all hover:ring-2 hover:ring-primary/5">
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-black uppercase truncate">{sale.invoiceNumber || 'Sale'}</p>
                                                <p className="text-[8px] font-bold opacity-40 uppercase">{format(parseISO(sale.date), "dd MMM yy")}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs sm:text-sm font-black text-primary">{formatKes(Number(sale.total) || 0)}</p>
                                                {bal > 0 && <p className="text-[8px] font-black text-red-600 uppercase">UNPAID: {formatKes(bal)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md border-none shadow-2xl rounded-2xl bg-card">
              <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase">Record Settlement</DialogTitle>
                  <DialogDescription className="font-bold text-[9px] sm:text-[10px] uppercase text-muted-foreground">Applying flow to account</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground">Settlement (KES)</p>
                      <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" className="h-14 text-2xl font-black border-2 border-primary rounded-xl" autoFocus />
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="font-bold h-12 rounded-xl">Cancel</Button>
                  <Button onClick={handleLogPayment} disabled={isSubmittingPayment} className="font-black uppercase tracking-widest h-12 px-8 shadow-lg rounded-xl flex-1 sm:flex-none">Verify Entry</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="statement-export-target" className="bg-white">
             {selectedAccount && <CustomerStatementPdf customer={selectedAccount.customer} sales={selectedAccount.sales} payments={selectedAccount.payments} workspace={company} />}
        </div>
      </div>
    </div>
  );
}
