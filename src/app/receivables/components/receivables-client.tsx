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
    Package,
    Loader2,
    DollarSign,
    Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { CustomerStatementPdf } from '@/app/documents/components/pdfs/customer-statement-pdf';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Customer } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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
    
    const now = new Date();
    const todayInterval = { start: startOfDay(now), end: endOfDay(now) };

    const debtorMap: Record<string, { customer: Customer; sales: Sale[]; totalBalance: number; totalPaid: number; totalInvoiced: number }> = {};

    // ONLY FILTER DEBT FROM TODAY'S TRANSACTIONS
    sales.filter(sale => {
        try { return isWithinInterval(parseISO(sale.date), todayInterval); } catch { return false; }
    }).forEach(sale => {
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

  const handleLogPayment = async () => {
    if (!selectedAccount || !tenant || !user) return;
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast({ variant: 'destructive', title: "Invalid Amount" });
        return;
    }

    setIsSubmittingPayment(true);
    try {
        await addDoc(collection(firestore, 'account_payments'), {
            tenantId: tenant.id,
            customerId: selectedAccount.customer.id,
            amount: amountToPay,
            method: paymentMethod,
            date: new Date().toISOString(),
            recordedBy: { uid: user.uid, name: user.displayName }
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
                updatedAt: new Date().toISOString()
            });
            remainingToDeduct -= deduct;
        }

        toast({ title: "Payment Recorded", description: `Deducted KES ${amountToPay.toLocaleString()} from today's balance.` });
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Payment Failed", description: e.message });
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
        pdf.save(`Today_STM_${debtor.customer.name.slice(0,3).toUpperCase()}.pdf`);
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
        title="Today's Debt Ledger" 
        description="Monitoring outstanding balances generated within the current cycle."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Today's Outstanding" value={formatKes(totalOutstanding)} icon={Wallet} trend={`${debtors.filter(d => d.totalBalance > 0).length} active debtors`} />
          <SummaryCard title="Settled Today" value={formatKes(debtors.reduce((acc,d) => acc + d.totalPaid, 0))} icon={TrendingDown} description="Lifetime payments ignored" />
          <SummaryCard title="Today's Client Count" value={debtors.length} icon={User} description="Active today" />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 py-4 px-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest">Daily Ledger Feed</CardTitle>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search today's debtors..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 w-64 bg-white"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {salesLoading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest">Syncing Cloud Ledger...</div>
            ) : (
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase pl-6 py-4">Client Details</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Today's Total</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right pr-6">Current Debt</TableHead>
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
                                        {debtor.totalBalance > 0 ? "Outstanding" : "Settled"}
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
                             <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs">No active debt from today's transactions.</TableCell></TableRow>
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
                                <SheetDescription className="font-bold text-[10px] uppercase tracking-widest text-primary mt-1">Today's Financial Node</SheetDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDownloadStatement(selectedAccount)} disabled={isExporting} className="h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2">
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Statement
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
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Today's Invoiced</p>
                                <p className="text-xl font-black">{formatKes(selectedAccount.totalInvoiced)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Today's Settled</p>
                                <p className="text-xl font-black text-green-700">{formatKes(selectedAccount.totalPaid)}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-2xl ring-1 ring-red-100 shadow-sm text-center border-b-4 border-red-500">
                                <p className="text-[10px] font-black uppercase text-red-600 mb-1">Net Balance</p>
                                <p className="text-xl font-black text-red-700">{formatKes(selectedAccount.totalBalance)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" /> Today's Activity
                            </h3>
                            <div className="space-y-4">
                                {selectedAccount.sales.map(sale => {
                                    const bal = Number(sale.balance) || 0;
                                    return (
                                        <Card key={sale.id} className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/20 py-3 px-5 border-b">
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline" className="text-[8px] font-mono h-5 uppercase">TIME: {format(parseISO(sale.date), "HH:mm")}</Badge>
                                                    <Badge className={bal > 0 ? "bg-red-100 text-red-700 border-none text-[8px] font-black uppercase h-5" : "bg-green-100 text-green-700 border-none text-[8px] font-black uppercase h-5"}>
                                                        {bal > 0 ? `UNPAID: ${formatKes(bal)}` : "FULL SETTLEMENT"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 bg-white">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span>Order Total: {formatKes(Number(sale.total) || 0)}</span>
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
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Log Payment</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">Apply payment to today's pending invoices for {selectedAccount?.customer.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Settlement Amount (KES)</Label>
                    <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" className="h-14 text-2xl font-black border-primary ring-1 ring-primary/20" autoFocus />
                </div>
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl" onClick={handleLogPayment} disabled={isSubmittingPayment || !paymentAmount}>
                    {isSubmittingPayment ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Confirm Receipt</>}
                </Button>
            </div>
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
