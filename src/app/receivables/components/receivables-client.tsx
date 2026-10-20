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
    TrendingDown, 
    User,
    Loader2,
    DollarSign,
    ArrowUpDown,
    PieChart as PieIcon,
    BarChart3
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

    sales.forEach(sale => {
        if (!debtorMap[sale.customerId]) {
            const customer = customers.find(c => c.id === sale.customerId);
            if (customer) {
                debtorMap[sale.customerId] = {
                    customer,
                    sales: [],
                    payments: [],
                    totalBalance: 0,
                    totalPaid: 0,
                    totalInvoiced: 0,
                    lastModified: sale.updatedAt || sale.date || sale.createdAt || new Date().toISOString()
                };
            }
        }
        if (debtorMap[sale.customerId]) {
            debtorMap[sale.customerId].sales.push(sale);
            debtorMap[sale.customerId].totalInvoiced += (Number(sale.total) || 0);
            
            const saleDate = sale.updatedAt || sale.date || sale.createdAt;
            if (saleDate && isAfter(parseISO(saleDate), parseISO(debtorMap[sale.customerId].lastModified))) {
                debtorMap[sale.customerId].lastModified = saleDate;
            }
        }
    });

    // Aggregate Payments
    allPayments?.forEach(pay => {
      if (debtorMap[pay.customerId]) {
        debtorMap[pay.customerId].payments.push(pay);
        debtorMap[pay.customerId].totalPaid += (Number(pay.amount) || 0);
      }
    });

    // Compute Final Balances
    return Object.values(debtorMap).map(d => ({
      ...d,
      totalBalance: d.totalInvoiced - d.totalPaid
    }));
  }, [sales, customers, allPayments]);

  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => 
        d.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer.alias?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [debtors, searchTerm]);

  const topDebtorsData = useMemo(() => {
    return filteredDebtors
      .filter(d => d.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 5)
      .map(d => ({
        name: d.customer.name.split(' ')[0],
        balance: d.totalBalance
      }));
  }, [filteredDebtors]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
        accessorKey: "customer.name",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent p-0 font-black uppercase text-[10px]">
                Client Details
                <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    <User className="h-4 w-4" />
                </div>
                <div>
                    <p className="font-black uppercase text-xs tracking-tight">{row.original.customer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{row.original.customer.alias || row.original.customer.email}</p>
                </div>
            </div>
        )
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.original.totalBalance > 0 ? "destructive" : "default"} className="text-[8px] font-black uppercase border-none px-2 h-4">
                {row.original.totalBalance > 0 ? "Pending" : (row.original.totalBalance < 0 ? "Credit Balance" : "Fully Paid")}
            </Badge>
        )
    },
    {
        accessorKey: "totalInvoiced",
        header: () => <div className="text-right font-black uppercase text-[10px]">Lifetime Sales</div>,
        cell: ({ row }) => <div className="text-right text-xs font-bold opacity-60">{formatKes(row.original.totalInvoiced)}</div>
    },
    {
        accessorKey: "totalBalance",
        header: ({ column }) => (
            <div className="text-right">
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[10px]">
                    Current Balance
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-3">
                <span className={cn(
                  "font-black text-sm",
                  row.original.totalBalance > 0 ? "text-red-600" : "text-green-600"
                )}>
                    {formatKes(row.original.totalBalance)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20" />
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
        toast({ variant: 'destructive', title: "Enter amount first" });
        return;
    }

    setIsSubmittingPayment(true);
    try {
        const timestamp = new Date().toISOString();
        
        // Log to Unified Payment Ledger
        await addDoc(collection(firestore, 'payments'), {
            tenantId: tenant.id,
            customerId: selectedAccount.customer.id,
            customerName: selectedAccount.customer.name,
            amount: amountToPay,
            method: "Cash",
            type: 'Payment',
            reference: 'MANUAL_LEDGER_ADJ',
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

        toast({ title: "Payment Recorded" });
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Payment Failed" });
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
        if (!element) throw new Error("Target not found");
        const canvas = await html2canvas(element, { scale: 3.0, useCORS: true, backgroundColor: "#ffffff" });
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`Statement_${debtor.customer.name.replace(/\s+/g, '_').toUpperCase()}.pdf`);
        toast({ title: "Statement Saved" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Export Failed" });
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Money Owed (Receivables)" 
        description="Comprehensive account oversight for shop nodes."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Money Owed" value={formatKes(totalOutstanding)} icon={Wallet} trend={`${debtors.filter(d => d.totalBalance > 0).length} active debtors`} />
          <SummaryCard title="Total Overpaid" value={formatKes(totalOverpaid)} icon={TrendingDown} className="border-l-4 border-l-green-500" description="Credit balances we owe clients" />
          <SummaryCard title="Total Accounts" value={debtors.length} icon={User} description="Registered customer identity nodes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 py-4 px-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Client Account Ledger</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Find client..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 w-full sm:w-64 bg-white font-bold"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {salesLoading ? (
                    <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground">Initializing Silo Matrix...</div>
                ) : (
                    <>
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
                                            className="hover:bg-muted/10 cursor-pointer group transition-colors"
                                            onClick={() => setSelectedCustomerId(row.original.customer.id)}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id} className="py-4">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic text-xs font-bold opacity-30 uppercase">
                                            No account flows found
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

        <div className="space-y-6">
          <Card className="shadow-xl border-none ring-1 ring-black/5 bg-[#1a1a1a] text-white overflow-hidden">
            <CardHeader className="border-b border-white/5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Top Debt Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
                {topDebtorsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topDebtorsData} layout="vertical" margin={{ left: -20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={9} fontStyle="bold" axisLine={false} tickLine={false} tick={{ fill: 'white', opacity: 0.6 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#000', color: '#fff', fontSize: '10px' }}
                            formatter={(v: number) => formatKes(v)}
                          />
                          <Bar dataKey="balance" radius={[0, 4, 4, 0]} barSize={20}>
                              {topDebtorsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20"><p className="text-[10px] font-black uppercase">No active debt matrix</p></div>
                )}
            </CardContent>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 bg-primary/5">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <History className="h-3 w-3" /> System Integrity
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">
                    All customer payments are logged to a permanent audit ledger and paired with their respective document identifiers for financial reconciliation.
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-primary/10 flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase opacity-40">Matrix Sync</span>
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[8px] font-black h-5">VERIFIED</Badge>
                  </div>
              </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <SheetContent className="sm:max-w-3xl flex flex-col p-0 border-none shadow-2xl">
            {selectedAccount && (
                <div className="flex flex-col h-full overflow-hidden">
                    <SheetHeader className="p-8 border-b bg-muted/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase tracking-tighter">{selectedAccount.customer.name}</SheetTitle>
                                <SheetDescription className="font-bold text-[10px] uppercase tracking-widest text-primary mt-1">Cloud Silo Financial History</SheetDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDownloadStatement(selectedAccount)} disabled={isExporting} className="h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2">
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download Statement
                                </Button>
                                <Button onClick={() => setIsPaymentDialogOpen(true)} className="h-12 px-8 font-black uppercase tracking-widest shadow-xl">
                                    <DollarSign className="h-4 w-4 mr-2" /> Adjust Balance
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-card/50">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Lifetime Invoiced</p>
                                <p className="text-xl font-black">{formatKes(selectedAccount.totalInvoiced)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Total Collected</p>
                                <p className="text-xl font-black text-green-700">{formatKes(selectedAccount.totalPaid)}</p>
                            </div>
                            <div className={cn(
                                "p-6 rounded-2xl ring-1 shadow-sm text-center border-b-4",
                                selectedAccount.totalBalance > 0 ? "bg-red-50 ring-red-100 border-red-500" : "bg-green-50 ring-green-100 border-green-500"
                            )}>
                                <p className={cn("text-[10px] font-black uppercase mb-1", selectedAccount.totalBalance > 0 ? "text-red-600" : "text-green-600")}>
                                  {selectedAccount.totalBalance >= 0 ? 'Current Balance' : 'Account Credit'}
                                </p>
                                <p className={cn("text-xl font-black", selectedAccount.totalBalance > 0 ? "text-red-700" : "text-green-700")}>
                                  {formatKes(selectedAccount.totalBalance)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" /> Permanent Record Stream
                            </h3>
                            <div className="space-y-4">
                                {selectedAccount.sales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(sale => {
                                    const bal = Number(sale.balance) || 0;
                                    return (
                                        <Card key={sale.id} className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/20 py-3 px-5 border-b">
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline" className="text-[8px] font-mono h-5 uppercase">{sale.invoiceNumber || `REF: ${sale.id.slice(0,8)}`}</Badge>
                                                    <Badge className={bal > 0 ? "bg-red-100 text-red-700 border-none text-[8px] font-black uppercase h-5" : "bg-green-100 text-green-700 border-none text-[8px] font-black uppercase h-5"}>
                                                        {bal > 0 ? `BAL: ${formatKes(bal)}` : "SETTLED"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 bg-white">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="truncate max-w-[200px]">{format(parseISO(sale.date), "dd MMM yyyy, HH:mm")}</span>
                                                    <span className="text-green-600 font-black">Sale Total: {formatKes(Number(sale.total) || 0)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
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
          <DialogContent className="sm:max-w-md border-none shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase">Ledger Adjustment</DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Manual entry for shop financial flows</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Amount (KES)</p>
                      <Input 
                        type="number" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="h-14 text-2xl font-black border-2 border-primary"
                        autoFocus
                      />
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="font-bold h-12">Cancel</Button>
                  <Button onClick={handleLogPayment} disabled={isSubmittingPayment} className="font-black uppercase tracking-widest h-12 px-8 shadow-lg">
                      {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Entry"}
                  </Button>
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
