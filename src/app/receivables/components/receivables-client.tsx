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
    DollarSign
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
import { format, parseISO } from 'date-fns';
import { CustomerStatementPdf } from '@/app/documents/components/pdfs/customer-statement-pdf';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Customer } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';

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

  // FETCH ALL SALES - Permanent history to track all-time debt
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

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const debtors = useMemo(() => {
    if (!sales || !customers) return [];
    
    const debtorMap: Record<string, { customer: Customer; sales: Sale[]; totalBalance: number; totalPaid: number; totalInvoiced: number }> = {};

    // Grouping all transactions by customer to get total account status across all time
    sales.forEach(sale => {
        if (!debtorMap[sale.customerId]) {
            const customer = customers.find(c => c.id === sale.customerId);
            if (customer) {
                debtorMap[sale.customerId] = {
                    customer,
                    sales: [],
                    totalBalance: 0,
                    totalPaid: 0,
                    totalInvoiced: 0
                };
            }
        }
        if (debtorMap[sale.customerId]) {
            debtorMap[sale.customerId].sales.push(sale);
            debtorMap[sale.customerId].totalBalance += (Number(sale.balance) || 0);
            debtorMap[sale.customerId].totalPaid += (Number(sale.amountPaid) || 0);
            debtorMap[sale.customerId].totalInvoiced += (Number(sale.total) || 0);
        }
    });

    return Object.values(debtorMap).sort((a, b) => b.totalBalance - a.totalBalance);
  }, [sales, customers]);

  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => 
        d.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer.alias?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [debtors, searchTerm]);

  const selectedAccount = useMemo(() => {
    if (!selectedCustomerId) return null;
    return debtors.find(d => d.customer.id === selectedCustomerId);
  }, [debtors, selectedCustomerId]);

  const totalOutstanding = debtors.reduce((acc, d) => acc + d.totalBalance, 0);
  const totalMoneyCollected = debtors.reduce((acc, d) => acc + d.totalPaid, 0);

  const handleLogPayment = async () => {
    if (!selectedAccount || !tenant || !user) return;
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast({ variant: 'destructive', title: "Enter amount first" });
        return;
    }

    setIsSubmittingPayment(true);
    try {
        await addDoc(collection(firestore, 'account_payments'), {
            tenantId: tenant.id,
            customerId: selectedAccount.customer.id,
            amount: amountToPay,
            method: "Cash",
            date: new Date().toISOString(),
            recordedBy: { uid: user.uid, name: user.displayName }
        });

        // Deduct from oldest unpaid sales first
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
                updatedAt: new Date().toISOString()
            });
            remainingToDeduct -= deduct;
        }

        toast({ title: "Payment Recorded", description: `Updated customer balance.` });
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
        pdf.save(`Statement_${debtor.customer.name.slice(0,3).toUpperCase()}.pdf`);
        toast({ title: "Statement Saved" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Export Failed" });
    } finally {
        setIsExporting(false);
    }
  };

  const formatKes = (val: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Money Customers Owe" 
        description="A list of everyone who has not finished paying for items, even from a long time ago."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Money Owed" value={formatKes(totalOutstanding)} icon={Wallet} trend={`${debtors.filter(d => d.totalBalance > 0).length} people owe money`} />
          <SummaryCard title="Total Money Collected" value={formatKes(totalMoneyCollected)} icon={TrendingDown} description="Total payments received to date" />
          <SummaryCard title="Registered Clients" value={debtors.length} icon={User} description="Total people on your list" />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 py-4 px-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest">List of Money Owed</CardTitle>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 w-64 bg-white"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {salesLoading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground">Checking Records...</div>
            ) : (
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase pl-6 py-4">Client Details</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Payment Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Lifetime Sales</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right pr-6">Money Owed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDebtors.map(debtor => (
                            <TableRow 
                                key={debtor.customer.id} 
                                className="hover:bg-muted/10 cursor-pointer group transition-colors"
                                onClick={() => setSelectedCustomerId(debtor.customer.id)}
                            >
                                <TableCell className="pl-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-xs tracking-tight">{debtor.customer.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{debtor.customer.alias || debtor.customer.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={debtor.totalBalance > 0 ? "destructive" : "default"} className="text-[8px] font-black uppercase border-none px-2 h-4">
                                        {debtor.totalBalance > 0 ? "Pending" : "Fully Paid"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold opacity-60">{formatKes(debtor.totalInvoiced)}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex items-center justify-end gap-3">
                                        <span className={debtor.totalBalance > 0 ? "font-black text-red-600" : "font-black text-green-600"}>
                                            {formatKes(debtor.totalBalance)}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredDebtors.length === 0 && (
                             <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs uppercase font-bold opacity-30">No records found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <SheetContent className="sm:max-w-3xl flex flex-col p-0 border-none shadow-2xl">
            {selectedAccount && (
                <div className="flex flex-col h-full overflow-hidden">
                    <SheetHeader className="p-8 border-b bg-muted/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase tracking-tighter">{selectedAccount.customer.name}</SheetTitle>
                                <SheetDescription className="font-bold text-[10px] uppercase tracking-widest text-primary mt-1">Permanent Account Records</SheetDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDownloadStatement(selectedAccount)} disabled={isExporting} className="h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2">
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Get Statement
                                </Button>
                                <Button onClick={() => setIsPaymentDialogOpen(true)} className="h-12 px-8 font-black uppercase tracking-widest shadow-xl">
                                    <DollarSign className="h-4 w-4 mr-2" /> Log Payment
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-card/50">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Lifetime Total</p>
                                <p className="text-xl font-black">{formatKes(selectedAccount.totalInvoiced)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Total Paid</p>
                                <p className="text-xl font-black text-green-700">{formatKes(selectedAccount.totalPaid)}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-2xl ring-1 ring-red-100 shadow-sm text-center border-b-4 border-red-500">
                                <p className="text-[10px] font-black uppercase text-red-600 mb-1">Money Still Owed</p>
                                <p className="text-xl font-black text-red-700">{formatKes(selectedAccount.totalBalance)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" /> Sale History
                            </h3>
                            <div className="space-y-4">
                                {selectedAccount.sales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(sale => {
                                    const bal = Number(sale.balance) || 0;
                                    return (
                                        <Card key={sale.id} className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/20 py-3 px-5 border-b">
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline" className="text-[8px] font-mono h-5 uppercase">DATE: {format(parseISO(sale.date), "dd MMM yyyy")}</Badge>
                                                    <Badge className={bal > 0 ? "bg-red-100 text-red-700 border-none text-[8px] font-black uppercase h-5" : "bg-green-100 text-green-700 border-none text-[8px] font-black uppercase h-5"}>
                                                        {bal > 0 ? `OWES: ${formatKes(bal)}` : "FULLY PAID"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 bg-white">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="truncate max-w-[200px]">Items: {sale.items?.map(i => i.name).join(", ")}</span>
                                                    <span className="text-green-600">Paid: {formatKes(Number(sale.amountPaid) || 0)}</span>
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
                  <DialogTitle className="text-xl font-black uppercase">Record Payment</DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Update Customer Balance</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Amount Received (KES)</p>
                      <Input 
                        type="number" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        placeholder="e.g. 5000" 
                        className="h-14 text-2xl font-black border-2 border-primary"
                        autoFocus
                      />
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="font-bold h-12">Cancel</Button>
                  <Button onClick={handleLogPayment} disabled={isSubmittingPayment} className="font-black uppercase tracking-widest h-12 px-8 shadow-lg">
                      {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="statement-export-target" className="bg-white">
             {selectedAccount && <CustomerStatementPdf customer={selectedAccount.customer} sales={selectedAccount.sales} workspace={company} />}
        </div>
      </div>
    </div>
  );
}
