"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    Wallet, 
    Search, 
    ArrowRight, 
    FileText, 
    Download, 
    History, 
    TrendingDown, 
    User,
    Package,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { CustomerStatementPdf } from '@/app/documents/components/pdfs/customer-statement-pdf';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Customer, Document as AppDocument } from '@/types';
import { SummaryCard } from '@/components/dashboard/summary-card';

export function ReceivablesClient() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch all sales with balances
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

  // 2. Fetch all customers
  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  // 3. Fetch Company Branding for PDF
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  // 4. Aggregate Debtors
  const debtors = useMemo(() => {
    if (!sales || !customers) return [];
    
    const debtorMap: Record<string, { customer: Customer; sales: Sale[]; totalBalance: number; totalPaid: number; totalInvoiced: number }> = {};

    sales.forEach(sale => {
        const bal = Number(sale.balance) || 0;
        if (bal >= 0 && sale.customerId !== 'walk-in') {
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
                debtorMap[sale.customerId].totalBalance += bal;
                debtorMap[sale.customerId].totalPaid += (Number(sale.amountPaid) || 0);
                debtorMap[sale.customerId].totalInvoiced += (Number(sale.total) || 0);
            }
        }
    });

    return Object.values(debtorMap)
        .filter(d => d.totalBalance > 0)
        .sort((a, b) => b.totalBalance - a.totalBalance);
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

  const handleDownloadStatement = async (debtor: any) => {
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    try {
        const element = document.getElementById('statement-export-target');
        if (!element) throw new Error("Target not found");

        const canvas = await html2canvas(element, { 
            scale: 2.5, 
            useCORS: true,
            backgroundColor: "#ffffff",
            width: 794,
            height: 1123,
            y: 0,
            scrollY: 0
        });
        
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        
        const compPrefix = (tenant?.name || 'HUB').slice(0, 3).toUpperCase();
        const filename = `STM ${compPrefix}-${debtor.customer.name.slice(0,3).toUpperCase()}-${new Date().getFullYear()}.pdf`;

        pdf.save(filename);
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
        title="Receivables (Debt Ledger)" 
        description="Consolidated overview of clients with outstanding account balances."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Ledger Debt" value={formatKes(totalOutstanding)} icon={Wallet} trend={`${debtors.length} active debtors`} />
          <SummaryCard title="Collection Velocity" value={formatKes(debtors.reduce((acc,d) => acc + d.totalPaid, 0))} icon={TrendingDown} description="Total aggregate settlements" />
          <SummaryCard title="Risk Node" value={debtors.filter(d => d.totalBalance > 50000).length} icon={History} description="Clients owing > 50,000 KES" />
      </div>

      <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 py-4 px-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest">Client Balances</CardTitle>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search debtor name..." 
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
                            <TableHead className="text-[10px] font-black uppercase pl-6 py-4">Client Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Last Activity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Invoiced</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Settled</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right pr-6">Outstanding</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDebtors.map(debtor => (
                            <TableRow 
                                key={debtor.customer.id} 
                                className="hover:bg-muted/10 cursor-pointer group transition-colors"
                                onClick={() => setSelectedCustomerId(debtor.customer.id)}
                            >
                                <TableCell className="pl-6">
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
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {format(parseISO(debtor.sales[debtor.sales.length - 1].date), "dd MMM yy")}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold opacity-60">{formatKes(debtor.totalInvoiced)}</TableCell>
                                <TableCell className="text-right text-xs font-bold text-green-600">{formatKes(debtor.totalPaid)}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="font-black text-red-600">{formatKes(debtor.totalBalance)}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredDebtors.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-xs">
                                    No clients with outstanding balances found.
                                </TableCell>
                            </TableRow>
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
                                <SheetDescription className="font-bold text-[10px] uppercase tracking-widest text-primary mt-1">Detailed Debt Analysis Node</SheetDescription>
                            </div>
                            <Button 
                                onClick={() => handleDownloadStatement(selectedAccount)} 
                                disabled={isExporting}
                                className="h-12 px-8 font-black uppercase tracking-widest shadow-xl"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                Export Statement
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-card/50">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Invoiced</p>
                                <p className="text-xl font-black">{formatKes(selectedAccount.totalInvoiced)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl ring-1 ring-black/5 shadow-sm text-center">
                                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Total Settled</p>
                                <p className="text-xl font-black text-green-700">{formatKes(selectedAccount.totalPaid)}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-2xl ring-1 ring-red-100 shadow-sm text-center border-b-4 border-red-500">
                                <p className="text-[10px] font-black uppercase text-red-600 mb-1">Current Balance</p>
                                <p className="text-xl font-black text-red-700">{formatKes(selectedAccount.totalBalance)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Payment History & Itemization
                            </h3>
                            
                            <div className="space-y-4">
                                {selectedAccount.sales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(sale => {
                                    const balance = (Number(sale.total) || 0) - (Number(sale.amountPaid) || 0);
                                    return (
                                        <Card key={sale.id} className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/20 py-3 px-5 border-b">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[8px] font-mono h-5">REF: {sale.id.slice(0,8).toUpperCase()}</Badge>
                                                        <span className="text-[10px] font-black uppercase opacity-40">{format(parseISO(sale.date), "dd MMM yyyy, HH:mm")}</span>
                                                    </div>
                                                    <Badge className={balance > 0 ? "bg-red-100 text-red-700 border-none text-[8px] font-black uppercase h-5" : "bg-green-100 text-green-700 border-none text-[8px] font-black uppercase h-5"}>
                                                        {balance > 0 ? `PENDING: ${formatKes(balance)}` : "SETTLED"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 bg-white">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Included Products</p>
                                                            <div className="space-y-2">
                                                                {sale.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <Package className="h-3 w-3 opacity-30" />
                                                                        <span className="text-[10px] font-bold uppercase truncate">{item.name} ({item.quantity} units)</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="text-right space-y-1 border-l pl-4">
                                                            <div className="flex justify-between items-center text-[10px] font-bold opacity-60"><span>Order Total:</span><span>{formatKes(Number(sale.total) || 0)}</span></div>
                                                            <div className="flex justify-between items-center text-[10px] font-black text-green-600"><span>Paid:</span><span>{formatKes(Number(sale.amountPaid) || 0)}</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Hidden PDF Render Target */}
                    <div className="fixed left-[-9999px] top-0 pointer-events-none">
                        <div id="statement-export-target" className="bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                            <CustomerStatementPdf 
                                customer={selectedAccount.customer} 
                                sales={selectedAccount.sales} 
                                workspace={company} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
