'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { PageHeader } from '@/components/layout/page-header';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    AlertTriangle, 
    ArrowUpRight, 
    DollarSign, 
    Package, 
    FileWarning, 
    TrendingUp,
    Wallet,
    Calendar as CalendarIcon,
    Filter,
    Clock,
    Download,
    Eye,
    Loader2,
    BarChart3,
    Search,
    ShoppingCart,
    Plus,
    Trash2,
    Check,
    X,
    User as UserIcon,
    FileText,
    Receipt,
    FilePlus2,
    Banknote,
    Smartphone,
    Landmark,
    Lock as LockIcon,
    Truck,
    UserPlus,
    ShieldAlert,
    ChevronRight,
    Target,
    History as HistoryIcon,
    PieChart as PieChartIcon,
    Activity as ActivityIcon,
    MapPin,
    Zap,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    format, 
    parseISO,
    isWithinInterval,
    endOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    endOfMonth,
    endOfWeek,
    endOfYear,
    startOfDay,
    isSameDay
} from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { InvoicePdf } from "./documents/components/pdfs/invoice-pdf";
import { ReceiptPdf } from "./documents/components/pdfs/receipt-pdf";
import { ProformaInvoicePdf } from "./documents/components/pdfs/proforma-pdf";
import { QuotationPdf } from "./documents/components/pdfs/quotation-pdf";
import { DeliveryNotePdf } from "./documents/components/pdfs/delivery-note-pdf";
import { useToast } from "@/hooks/use-toast";
import type { Document as AppDocument, DocumentType, User as AppUser, Customer } from "@/types";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
    AreaChart,
    Area,
    PieChart,
    Pie,
    LabelList
} from 'recharts';
import { LandingPage } from '@/components/marketing/landing-page';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  if (!isUserLoading && !user) {
      return (
        <MarketingWrapper>
          <LandingPage />
        </MarketingWrapper>
      );
  }

  return <DashboardPage />;
}

const PriceRibbon = (props: any) => {
    const { x, y, value, index } = props;
    if (value === 0 || value === undefined) return null;
    
    const formattedValue = new Intl.NumberFormat('en-KE', { 
        style: 'decimal', 
        maximumFractionDigits: 0 
    }).format(value);

    // Responsive alignment logic
    let rectX = x - 25;
    let textX = x;
    
    return (
        <g>
            <rect x={rectX} y={y - 25} width={50} height={14} rx={7} fill="#10b981" />
            <text x={textX} y={y - 15} fill="white" fontSize={7} fontWeight="900" textAnchor="middle" className="uppercase">{formattedValue}</text>
        </g>
    );
};

function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
        router.push('/super-admin');
    }
  }, [userProfile, router]);
  
  const filter = (searchParams.get('period') as TimeFilter) || 'month';
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [posAction, setPosAction] = useState<DocumentType | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Cheque' | 'Till' | 'Paybill'>('Cash');
  const [applyVat, setApplyVat] = useState(false);

  const [configuringProduct, setConfiguringProduct] = useState<any>(null);
  const [configQty, setConfigQty] = useState('1');
  const [configPrice, setConfigPrice] = useState('');

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const stockQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: assets, isLoading: stockLoading } = useCollection(stockQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);
  const { data: documents, isLoading: docsLoading } = useCollection<AppDocument>(docsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: workspaceProfile } = useDoc(companyRef);

  const stats = useMemo(() => {
    if (!sales || !assets || !expenses || !documents) return null;

    const now = new Date();
    let interval: { start: Date; end: Date };

    switch (filter) {
        case 'today': interval = { start: startOfDay(now), end: endOfDay(now) }; break;
        case 'week': interval = { start: startOfWeek(now), end: endOfDay(now) }; break;
        case 'month': interval = { start: startOfMonth(now), end: endOfDay(now) }; break;
        case 'year': interval = { start: startOfYear(now), end: endOfDay(now) }; break;
        case 'custom': interval = { start: dateRange?.from || startOfMonth(now), end: endOfDay(dateRange?.to || now) }; break;
        default: interval = { start: startOfMonth(now), end: endOfDay(now) };
    }

    const filteredSales = sales.filter(s => { try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; } });
    const filteredExp = expenses.filter(e => { try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; } });
    let filteredDocs = documents.filter(d => { try { return isWithinInterval(parseISO(d.generatedDate), interval); } catch { return false; } });

    if (ledgerSearch.trim()) {
        const searchLower = ledgerSearch.toLowerCase();
        filteredDocs = filteredDocs.filter(d => (d.relatedTo || '').toLowerCase().includes(searchLower));
    }

    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalCost = filteredSales.reduce((acc, s) => {
        const saleCogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + saleCogs;
    }, 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalProfit = totalRevenue - (totalExpenses + totalCost);
    const totalDebt = sales.filter(s => (Number(s.balance) || 0) > 0).reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    const productCounts: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const name = item.name || item.description || 'Unknown Item';
        const qty = Number(item.quantity) || 1;
        productCounts[name] = (productCounts[name] || 0) + qty;
      });
    });

    const categoryData = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
        totalRevenue, totalProfit, totalExpenses, totalDebt,
        items: [...filteredDocs].sort((a,b) => parseISO(b.generatedDate).getTime() - parseISO(a.generatedDate).getTime()),
        categoryData: categoryData.length > 0 ? categoryData : [{ name: 'Empty', value: 1 }]
    };
  }, [sales, assets, expenses, documents, filter, dateRange, ledgerSearch]);

  const performanceStats = useMemo(() => {
    if (!sales || !expenses) return [];
    const now = new Date();
    const periods = [
        { label: 'Today', start: startOfDay(now), end: endOfDay(now) },
        { label: 'Week', start: startOfWeek(now), end: endOfWeek(now) },
        { label: 'Month', start: startOfMonth(now), end: endOfMonth(now) },
        { label: 'Year', start: startOfYear(now), end: endOfYear(now) },
    ];
    return periods.map(p => {
        const pSales = sales.filter(s => { try { return isWithinInterval(parseISO(s.date), p); } catch { return false; } });
        const pExp = expenses.filter(e => { try { return isWithinInterval(parseISO(e.date), p); } catch { return false; } });
        const revenue = pSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const expense = pExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        return { name: p.label, Revenue: revenue, Expenses: expense };
    });
  }, [sales, expenses]);

  const handleOpenConfigDialog = (product: any) => {
    setConfiguringProduct(product);
    setConfigQty('1');
    setConfigPrice(String(product.sellingPrice || 0));
    setProductSearchOpen(false);
  };

  const handleAddToCart = () => {
    if (!configuringProduct) return;
    const qty = parseInt(configQty) || 1;
    const price = parseFloat(configPrice) || 0;
    const existing = cart.find(i => i.id === configuringProduct.id);
    if (existing) {
        const newQty = existing.quantity + qty;
        setCart(cart.map(i => i.id === configuringProduct.id ? { ...i, quantity: newQty, total: newQty * price, sellingPrice: price } : i));
    } else {
        setCart([...cart, { id: configuringProduct.id, name: configuringProduct.model || configuringProduct.name, quantity: qty, sellingPrice: price, total: qty * price, buyingPrice: configuringProduct.purchasePrice || 0 }]);
    }
    setConfiguringProduct(null);
  };

  const cartSubtotal = cart.reduce((acc, i) => acc + i.total, 0);
  const cartVat = applyVat ? cartSubtotal * VAT_RATE : 0;
  const cartTotal = cartSubtotal + cartVat;

  const handleFinishSale = async () => {
    if (!tenant || !user || !selectedCustomer || cart.length === 0 || !posAction) return;
    setIsProcessingSale(true);
    try {
        const batch = writeBatch(firestore);
        const timestamp = new Date().toISOString();
        const typeCount = documents?.filter(d => d.type === posAction).length || 0;
        const docTitle = `${posAction} #${String(typeCount + 1).padStart(3, '0')}`;
        const documentData = {
            tenantId: tenant.id, type: posAction, title: docTitle, generatedDate: timestamp, relatedTo: selectedCustomer.name,
            data: { items: cart.map(i => ({ ...i, productId: i.id, type: 'asset' })), subtotal: cartSubtotal, vat: cartVat, total: cartTotal, amountPaid: posAction === 'Receipt' ? cartTotal : 0, balance: posAction === 'Receipt' ? 0 : cartTotal, customer: selectedCustomer, applyVat, invoiceNumber: docTitle, paymentMethod: posAction === 'Quotation' ? 'N/A' : paymentMode,
                workspace: workspaceProfile ? { name: workspaceProfile.name || '', address: workspaceProfile.address || '', phone: workspaceProfile.phone || '', email: workspaceProfile.email || '', logoUrl: workspaceProfile.logoUrl || null } : null },
            createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };
        const docRef = doc(collection(firestore, 'documents'));
        batch.set(docRef, documentData);
        if (posAction === 'Receipt' || posAction === 'Invoice') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, { tenantId: tenant.id, date: timestamp, customerId: selectedCustomer.id, customerName: selectedCustomer.name, invoiceNumber: docTitle, items: cart.map(i => ({ ...i, productId: i.id, type: 'asset' })), subtotal: cartSubtotal, vatAmount: cartVat, total: cartTotal, amountPaid: posAction === 'Receipt' ? cartTotal : 0, balance: posAction === 'Receipt' ? 0 : cartTotal, status: posAction === 'Receipt' ? 'Paid' : 'Credit', paymentMethod: paymentMode, documentId: docRef.id, createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' } });
            if (posAction === 'Receipt') {
                const payRef = doc(collection(firestore, 'payments'));
                batch.set(payRef, { tenantId: tenant.id, customerId: selectedCustomer.id, customerName: selectedCustomer.name, amount: cartTotal, method: paymentMode, type: 'Payment', reference: docTitle, date: timestamp, saleId: saleRef.id, documentId: docRef.id, createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' } });
            }
            for (const item of cart) {
                const productRef = doc(firestore, 'assets', item.id);
                const currentProduct = assets?.find(p => p.id === item.id);
                if (currentProduct) batch.update(productRef, { quantity: (currentProduct.quantity || 0) - item.quantity, updatedAt: timestamp });
            }
        }
        await batch.commit();
        setCart([]); setSelectedCustomer(null); setPosAction(null);
        toast({ title: `Transaction Processed` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Process Failed", description: e.message });
    } finally {
        setIsProcessingSale(false);
    }
  };

  const handleDownloadPdf = async (docObj: AppDocument) => {
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    setSelectedDocument(docObj); setIsPdfPreviewOpen(true);
    await new Promise(r => setTimeout(r, 1000));
    try {
        const pages = document.querySelectorAll('.a4-pdf-page');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();
            const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297);
        }
        pdf.save(`DOC_${docObj.title.replace(/\s+/g, '_')}.pdf`);
    } finally { setIsPdfPreviewOpen(false); setIsExporting(false); }
  };

  const renderPdfPreview = () => {
    if (!selectedDocument) return null;
    const props = { document: selectedDocument };
    switch(selectedDocument.type) {
      case 'Invoice': return <InvoicePdf {...props} />;
      case 'Receipt': return <ReceiptPdf {...props} />;
      case 'Proforma': return <ProformaInvoicePdf {...props} />;
      case 'Quotation': return <QuotationPdf {...props} />;
      case 'DeliveryNote': return <DeliveryNotePdf {...props} />;
      default: return null;
    }
  };

  const tableColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: "generatedDate", header: "Date", cell: ({ row }) => <span className="text-[9px] font-bold uppercase">{format(parseISO(row.original.generatedDate), 'dd MMM HH:mm')}</span> },
    { accessorKey: "relatedTo", header: "Client", cell: ({ row }) => <span className="text-[9px] font-black truncate block max-w-[80px] sm:max-w-none">{row.original.relatedTo || 'Walk-in'}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge className="text-[7px] font-black h-3.5 px-1.5 border-none bg-primary/5 text-primary">{row.original.type}</Badge> },
    { accessorKey: "total", header: () => <div className="text-right">Amt</div>, cell: ({ row }) => <div className="text-right font-black text-[10px]">{Number(row.original.data?.total || 0).toLocaleString()}</div> },
    { id: "actions", header: () => <div className="text-right pr-2">Ops</div>, cell: ({ row }) => <div className="flex justify-end gap-1.5 pr-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedDocument(row.original); setIsPdfPreviewOpen(true); }}><Eye className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownloadPdf(row.original)}><Download className="h-3 w-3" /></Button></div> }
  ], []);

  const activityTable = useReactTable({ data: stats?.items || [], columns: tableColumns, state: { pagination }, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (salesLoading || stockLoading || expLoading || docsLoading || isProfileLoading) return null;

  return (
    <div className="space-y-3 sm:space-y-6 max-w-[1600px] mx-auto overflow-x-hidden">
      <PageHeader title={`Hello, ${userProfile?.name?.split(' ')[0] || 'Partner'}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
          <SummaryCard title="Revenue" value={formatKes(stats!.totalRevenue)} icon={DollarSign} />
          <SummaryCard title="Profit" value={formatKes(stats!.totalProfit)} icon={TrendingUp} />
          <SummaryCard title="Expenses" value={formatKes(stats!.totalExpenses)} icon={Wallet} className="border-l-2 border-l-red-500" />
          <SummaryCard title="Owed" value={formatKes(stats!.totalDebt)} icon={FileWarning} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 sm:gap-8">
          <div className="space-y-3 sm:space-y-8">
            <Card className="shadow-xl border-none ring-1 ring-black/5 bg-card overflow-hidden rounded-xl sm:rounded-[2rem]">
                <CardHeader className="p-3 sm:p-6 border-b-0 flex flex-row items-center gap-3">
                    <div className="bg-[#4f46e5] p-2 rounded-lg shadow-lg"><ActivityIcon className="h-4 w-4 text-white" /></div>
                    <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">Intelligence Node</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[200px] sm:h-[300px] w-full px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceStats} margin={{ top: 20, right: 10, left: -30, bottom: 0 }}>
                                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                <XAxis dataKey="name" fontSize={8} axisLine={false} tickLine={false} />
                                <YAxis fontSize={8} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '9px' }} />
                                <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2}><LabelList dataKey="Revenue" content={<PriceRibbon />} /></Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden rounded-xl sm:rounded-[2rem]">
                <CardHeader className="p-3 sm:p-6 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2"><HistoryIcon className="h-4 w-4" /> Activity Feed</CardTitle>
                    <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-20" /><Input placeholder="Filter..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} className="pl-6 h-7 text-[8px] font-bold uppercase w-32 bg-muted/20" /></div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/10"><TableRow className="hover:bg-transparent">{activityTable.getHeaderGroups()[0].headers.map(h => (<TableHead key={h.id} className="text-[8px] font-black uppercase py-2 px-3">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow></TableHeader>
                        <TableBody>{activityTable.getRowModel().rows.map(row => (<TableRow key={row.id} className="h-10 border-b hover:bg-muted/5 transition-colors">{row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-1 px-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))}</TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>

          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-card overflow-hidden rounded-xl sm:rounded-[2rem] flex flex-col h-fit">
            <CardHeader className="bg-primary/5 border-b p-3 sm:p-5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Quick Sell</CardTitle>
                <Badge variant="outline" className="text-[7px] font-black px-1.5 h-4 uppercase">Live Node</Badge>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-1.5">
                    {['Receipt', 'Invoice', 'Quotation'].map(type => (<Button key={type} variant={posAction === type ? 'default' : 'outline'} onClick={() => setPosAction(type as DocumentType)} className="h-8 text-[8px] font-black uppercase rounded-lg border-2 px-0">{type === 'Quotation' ? 'Quote' : type}</Button>))}
                </div>
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild disabled={!posAction}><Button variant="outline" className="w-full h-10 justify-between text-[9px] font-black uppercase bg-background border-2 rounded-lg"><span className="truncate">{selectedCustomer ? selectedCustomer.name : '1. Link Account'}</span><Search className="h-3 w-3 opacity-20" /></Button></PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start"><Command><CommandInput placeholder="Find client..." /><CommandList><CommandEmpty>No nodes.</CommandEmpty><CommandGroup>{customers?.slice(0, 20).map(c => (<CommandItem key={c.id} onSelect={() => { setSelectedCustomer({ id: c.id, name: c.name }); setCustomerSearchOpen(false); }} className="p-3 font-bold uppercase text-[10px]">{c.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                    <PopoverTrigger asChild disabled={!selectedCustomer}><Button variant="outline" className="w-full h-10 justify-between text-[9px] font-black uppercase bg-background border-2 rounded-lg"><span className="truncate">2. Add Hardware</span><Plus className="h-3 w-3 opacity-20" /></Button></PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start"><Command><CommandInput placeholder="Search inventory..." /><CommandList><CommandEmpty>Out of stock.</CommandEmpty><CommandGroup>{assets?.filter(p => (p.quantity || 0) > 0).map(p => (<CommandItem key={p.id} onSelect={() => handleOpenConfigDialog(p)} className="p-3"><div className="flex justify-between w-full font-bold uppercase text-[9px]"><span>{p.model}</span><span className="text-primary">{p.sellingPrice?.toLocaleString()}</span></div></CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
                <div className="min-h-[100px] border-2 border-dashed rounded-xl p-2 bg-muted/5 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                    {cart.length > 0 ? cart.map(item => (<div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm border border-black/5"><div className="overflow-hidden"><p className="text-[9px] font-black uppercase truncate">{item.name}</p><p className="text-[7px] font-bold opacity-40">{item.quantity} Unit(s)</p></div><button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-muted-foreground"><Trash2 className="h-3 w-3" /></button></div>)) : <div className="flex-grow flex flex-col items-center justify-center opacity-10 py-6"><Target className="h-6 w-6 mb-1" /><p className="text-[7px] font-black uppercase">Basket Empty</p></div>}
                </div>
                <div className="pt-3 border-t space-y-3">
                    <div className="flex justify-between items-end"><span className="text-[8px] font-black uppercase opacity-40">Net Payable</span><span className="text-xl font-black tracking-tighter">{formatKes(cartTotal)}</span></div>
                    <Button onClick={handleFinishSale} className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl rounded-xl" disabled={isProcessingSale || cart.length === 0 || !selectedCustomer || !posAction}>{isProcessingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : `Execute ${posAction || 'Entry'}`}</Button>
                </div>
            </CardContent>
          </Card>
      </div>

      <Dialog open={!!configuringProduct} onOpenChange={(o) => !o && setConfiguringProduct(null)}>
        <DialogContent className="w-[98vw] sm:max-w-md p-4 border-none shadow-2xl rounded-xl">
            <DialogHeader><DialogTitle className="text-sm font-black uppercase">Item Configuration</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-60">Qty</Label><Input type="number" value={configQty} onChange={e => setConfigQty(e.target.value)} className="h-10 text-sm font-black" /></div><div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-60">Rate</Label><Input type="number" value={configPrice} onChange={e => setConfigPrice(e.target.value)} className="h-10 text-sm font-black border-primary" /></div></div>
                <Button className="w-full h-12 font-black uppercase text-[10px] tracking-widest shadow-xl rounded-xl" onClick={handleAddToCart}>Apply to Basket</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="w-[100vw] sm:max-w-5xl h-[100vh] sm:h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-3 sm:p-6 bg-white border-b no-print flex flex-row items-center justify-between shrink-0"><DialogTitle className="text-sm sm:text-xl font-black uppercase">Document Node</DialogTitle><Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!)} className="h-8 font-black uppercase text-[8px] tracking-widest border-2">{isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />} Save PDF</Button></DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-2"><div id="dashboard-export-target" className="shrink-0 relative origin-top scale-[0.4] sm:scale-[0.7] md:scale-100 bg-white shadow-2xl">{renderPdfPreview()}</div></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';
const VAT_RATE = 0.16;
