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
    MapPin
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/command';
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
  const router = useRouter();

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
    const { x, y, value } = props;
    if (value === 0) return null;
    
    const formattedValue = new Intl.NumberFormat('en-KE', { 
        style: 'currency', 
        currency: 'KES', 
        maximumFractionDigits: 0 
    }).format(value);

    return (
        <g>
            <rect 
                x={x - 45} 
                y={y - 35} 
                width={90} 
                height={20} 
                rx={10} 
                fill="#10b981" 
                className="drop-shadow-lg"
            />
            <text 
                x={x} 
                y={y - 21} 
                fill="white" 
                fontSize={9} 
                fontWeight="900" 
                textAnchor="middle"
                className="uppercase tracking-tighter"
            >
                {formattedValue}
            </text>
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
  
  // Read filter from global search params
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

  // POS State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [posAction, setPosAction] = useState<DocumentType | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'M-Pesa' | 'Bank'>('Cash');
  const [applyVat, setApplyVat] = useState(false);

  // POS Selection Logic
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
        const cogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + saleCogs;
    }, 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalProfit = totalRevenue - (totalExpenses + totalCost);
    const totalDebt = sales.filter(s => (Number(s.balance) || 0) > 0).reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

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
        lowStockCount: lowStock.length,
        unpaidCount: sales.filter(s => (Number(s.balance) || 0) > 0).length,
        items: [...filteredDocs].sort((a,b) => parseISO(b.generatedDate).getTime() - parseISO(a.generatedDate).getTime()),
        viewLabel: filter === 'custom' && dateRange?.from ? `${format(dateRange.from, 'dd MMM')} - ${format(dateRange.to || now, 'dd MMM')}` : filter.charAt(0).toUpperCase() + filter.slice(1),
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
        const cogs = pSales.reduce((acc, s) => {
            const saleCogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
            return acc + saleCogs;
        }, 0);

        return {
            name: p.label,
            Revenue: revenue,
            Expenses: expense + cogs
        };
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

    if (qty > (configuringProduct.quantity || 0)) {
        toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${configuringProduct.quantity} units available.` });
        return;
    }

    const existing = cart.find(i => i.id === configuringProduct.id);
    if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > (configuringProduct.quantity || 0)) {
             toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${configuringProduct.quantity} total units available.` });
             return;
        }
        setCart(cart.map(i => i.id === configuringProduct.id ? { ...i, quantity: newQty, total: newQty * price, sellingPrice: price } : i));
    } else {
        setCart([...cart, {
            id: configuringProduct.id,
            name: configuringProduct.model || configuringProduct.name,
            quantity: qty,
            sellingPrice: price,
            total: qty * price,
            buyingPrice: configuringProduct.purchasePrice || 0
        }]);
    }
    setConfiguringProduct(null);
  };

  const subtotal = cart.reduce((acc, i) => acc + i.total, 0);
  const vatAmount = applyVat ? subtotal * VAT_RATE : 0;
  const cartTotal = subtotal + vatAmount;

  const handleFinishSale = async () => {
    if (!tenant || !user || !selectedCustomer || cart.length === 0 || !posAction) return;
    setIsProcessingSale(true);

    try {
        const batch = writeBatch(firestore);
        const timestamp = new Date().toISOString();

        const typeCount = documents?.filter(d => d.type === posAction).length || 0;
        const docTitle = `${posAction} #${String(typeCount + 1).padStart(3, '0')}`;
        
        const documentData = {
            tenantId: tenant.id,
            type: posAction,
            title: docTitle,
            generatedDate: timestamp,
            relatedTo: selectedCustomer.name,
            data: { 
                items: cart.map(i => ({ ...i, productId: i.id, type: 'asset' })),
                subtotal,
                vat: vatAmount,
                total: cartTotal,
                amountPaid: posAction === 'Receipt' ? cartTotal : 0,
                balance: posAction === 'Receipt' ? 0 : cartTotal,
                customer: selectedCustomer,
                applyVat,
                invoiceNumber: docTitle, 
                paymentMethod: posAction === 'Quotation' ? 'N/A' : paymentMode,
                workspace: workspaceProfile ? {
                    name: workspaceProfile.name || '',
                    address: workspaceProfile.address || '',
                    phone: workspaceProfile.phone || '',
                    email: workspaceProfile.email || '',
                    logoUrl: workspaceProfile.logoUrl || null
                } : null
            },
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        const docRef = doc(collection(firestore, 'documents'));
        batch.set(docRef, documentData);

        if (posAction === 'Receipt' || posAction === 'Invoice') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            const saleData = {
                tenantId: tenant.id,
                date: timestamp,
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                invoiceNumber: docTitle, 
                items: cart.map(i => ({ ...i, productId: i.id, type: 'asset' })),
                subtotal,
                vatAmount,
                total: cartTotal,
                amountPaid: posAction === 'Receipt' ? cartTotal : 0,
                balance: posAction === 'Receipt' ? 0 : cartTotal,
                status: posAction === 'Receipt' ? 'Paid' : 'Credit',
                paymentMethod: paymentMode,
                documentId: docRef.id,
                createdAt: timestamp,
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            };
            batch.set(saleRef, saleData);

            if (posAction === 'Receipt') {
                const payRef = doc(collection(firestore, 'payments'));
                batch.set(payRef, {
                    tenantId: tenant.id,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.name,
                    amount: cartTotal,
                    method: paymentMode,
                    type: 'Payment',
                    reference: docTitle,
                    date: timestamp,
                    saleId: saleRef.id,
                    documentId: docRef.id,
                    createdAt: timestamp,
                    createdBy: { uid: user.uid, name: user.displayName || 'User' }
                });
            }

            for (const item of cart) {
                const productRef = doc(firestore, 'assets', item.id);
                const currentProduct = assets?.find(p => p.id === item.id);
                if (currentProduct) {
                    batch.update(productRef, { 
                        quantity: (currentProduct.quantity || 0) - item.quantity,
                        updatedAt: timestamp 
                    });
                }
            }
        }

        await batch.commit();
        setCart([]);
        setSelectedCustomer(null);
        setPosAction(null);
        toast({ title: `Transaction Processed` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Process Failed", description: e.message });
    } finally {
        setIsProcessingSale(false);
    }
  };

  const handleViewDocument = (docObj: AppDocument) => {
    setSelectedDocument(docObj);
    setIsPdfPreviewOpen(true);
  };

  const handleDownloadPdf = async (docObj: AppDocument) => {
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    const wasPreviewOpen = isPdfPreviewOpen;
    if (!wasPreviewOpen) {
        setSelectedDocument(docObj);
        setIsPdfPreviewOpen(true);
        await new Promise(r => setTimeout(r, 1200));
    } else {
        await new Promise(r => setTimeout(r, 500));
    }

    try {
        const pages = document.querySelectorAll('.a4-pdf-page');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        if (pages.length === 0) {
            const element = document.getElementById('dashboard-export-target');
            if (!element) throw new Error("Export target element not found");
            const canvas = await html2canvas(element, { scale: 3.5, useCORS: true, backgroundColor: "#ffffff", width: 794 });
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        } else {
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const canvas = await html2canvas(pages[i] as HTMLElement, {
                    scale: 3.5,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794, 
                    height: 1123,
                    y: 0, scrollY: 0, windowWidth: 794
                });
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }
        }

        const initials = TYPE_INITIALS[docObj.type] || 'DOC';
        pdf.save(`${initials}_${(docObj.relatedTo || 'VAL').slice(0,3).toUpperCase()}.pdf`);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Export Failed' });
    } finally {
        if (!wasPreviewOpen) {
            setIsPdfPreviewOpen(false);
            setSelectedDocument(null);
        }
        setIsExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "generatedDate",
      header: "Date & Time",
      cell: ({ row }) => {
        const date = parseISO(row.original.generatedDate);
        return (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold">{format(date, 'dd MMM yyyy')}</span>
            <span className="text-[9px] font-mono opacity-50">{format(date, 'hh:mm a')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "relatedTo",
      header: "Client",
      cell: ({ row }) => <span className="text-[10px] font-black truncate block max-w-[150px]">{row.original.relatedTo || 'Walk-in'}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
          const type = row.original.type;
          return <Badge className={cn("text-[8px] font-black h-4 px-2 border-none", type === 'Receipt' ? "bg-green-100 text-green-700" : (type === 'Invoice' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"))}>{type}</Badge>;
      }
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-xs">
          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(row.original.data?.total || 0))}
        </div>
      )
    },
    {
        id: "actions",
        header: () => <div className="text-right pr-6">Ops</div>,
        cell: ({ row }) => {
            const docObj = row.original;
            return (
                <div className="flex justify-end pr-6 gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewDocument(docObj)} disabled={isExporting}>
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadPdf(docObj)} disabled={isExporting}>
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                </div>
            );
        }
    }
  ], [isExporting, workspaceProfile]);

  const table = useReactTable({
    data: stats?.items || [],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (salesLoading || stockLoading || expLoading || docsLoading || isProfileLoading) {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Data Stream...</p>
        </div>
      );
  }

  if (!stats) return null;

  const renderPdfPreview = () => {
    if (!selectedDocument) return null;
    switch(selectedDocument.type) {
      case 'Invoice': return <InvoicePdf document={selectedDocument} />;
      case 'Receipt': return <ReceiptPdf document={selectedDocument} />;
      case 'Proforma': return <ProformaInvoicePdf document={selectedDocument} />;
      case 'Quotation': return <QuotationPdf document={selectedDocument} />;
      case 'DeliveryNote': return <DeliveryNotePdf document={selectedDocument} />;
      default: return null;
    }
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Main Shop Dashboard" 
        description={`Analyzing records for period: ${stats.viewLabel}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Period Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total money in" />
          <SummaryCard title="Period Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Money left after costs" />
          <SummaryCard title="Period Expenses" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Shop spend" />
          <SummaryCard title="Total Money Owed" value={formatKes(stats.totalDebt)} icon={FileWarning} description="Historical pending payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-white overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white p-8 border-b-0">
                <div className="flex items-center gap-5">
                    <div className="bg-[#4f46e5] p-3 rounded-2xl shadow-xl">
                        <ActivityIcon className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold leading-none">Performance Intelligence</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-[#4f46e5] tracking-widest uppercase">Visual Insights & Data Flow</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-12">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Revenue Growth Trend</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#4f46e5]" /><span className="text-[9px] font-bold opacity-60">Revenue</span></div>
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#ef4444]" /><span className="text-[9px] font-bold opacity-60">Expenses</span></div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceStats} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#000', opacity: 0.5 }} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{ fill: '#000', opacity: 0.5 }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3}>
                                        <LabelList dataKey="Revenue" content={<PriceRibbon />} />
                                    </Area>
                                    <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40 text-center">Moving Products</h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats.categoryData} 
                                        cx="50%" cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={90} 
                                        paddingAngle={8} 
                                        dataKey="value"
                                        label={({ name }) => name.slice(0, 12) + '...'}
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontStyle: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-white overflow-hidden rounded-[2rem] flex flex-col">
            <CardHeader className="bg-primary/5 border-b p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Quick Sell Node
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] font-black h-5 bg-white border-primary/20 uppercase tracking-widest">Operational</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-8 flex-grow flex flex-col gap-8 overflow-hidden">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">1. Workflow Definition</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button 
                            variant={posAction === 'Receipt' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Receipt')}
                            className="h-12 text-[10px] font-black uppercase rounded-xl border-2"
                        >
                            Receipt
                        </Button>
                        <Button 
                            variant={posAction === 'Invoice' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Invoice')}
                            className="h-12 text-[10px] font-black uppercase rounded-xl border-2"
                        >
                            Invoice
                        </Button>
                        <Button 
                            variant={posAction === 'Quotation' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Quotation')}
                            className="h-12 text-[10px] font-black uppercase rounded-xl border-2"
                        >
                            Quote
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">2. Operator & Client Link</Label>
                    <div className="flex gap-2">
                        <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                            <PopoverTrigger asChild disabled={!posAction}>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-14 justify-between text-[11px] font-bold uppercase tracking-tight bg-white border-2 rounded-xl"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <UserIcon className="h-5 w-5 text-primary opacity-40" />
                                        <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Select Client Identity...'}</span>
                                    </div>
                                    <Search className="h-4 w-4 opacity-20" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[420px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Find by name, number, company or location..." className="h-12" />
                                    <CommandList>
                                        <CommandEmpty>No matching clients in CRM.</CommandEmpty>
                                        <CommandGroup heading="Available Customer Node Registry">
                                            {customers?.map(c => (
                                                <CommandItem 
                                                    key={c.id} 
                                                    value={`${c.name} ${c.alias || ''} ${c.phone || ''} ${c.address || ''}`}
                                                    onSelect={() => { 
                                                        setSelectedCustomer({ id: c.id, name: c.alias ? `${c.alias} (${c.name})` : c.name }); 
                                                        setCustomerSearchOpen(false); 
                                                    }} 
                                                    className="p-4 cursor-pointer"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <p className="font-black uppercase text-xs">{c.name}</p>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            {c.alias && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary bg-primary/5 uppercase font-black">{c.alias}</Badge>}
                                                            {c.phone && <span className="flex items-center gap-1 text-[9px] font-bold opacity-50 uppercase tracking-tighter"><Smartphone className="h-2 w-2" /> {c.phone}</span>}
                                                            {c.address && <span className="flex items-center gap-1 text-[9px] font-bold opacity-50 truncate max-w-[150px] uppercase tracking-tighter"><MapPin className="h-2 w-2" /> {c.address}</span>}
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">3. Hardware Matrix</Label>
                        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                            <PopoverTrigger asChild disabled={!selectedCustomer}>
                                <Button variant="outline" size="sm" className="h-8 font-black uppercase text-[9px] tracking-widest bg-primary/5 text-primary border-primary/20">
                                    <Plus className="h-3 w-3 mr-1" /> Browse
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[380px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search shop stock..." className="h-12" />
                                    <CommandList>
                                        <CommandEmpty>No products found.</CommandEmpty>
                                        <CommandGroup>
                                            {assets?.filter(p => (p.quantity || 0) > 0).map(p => (
                                                <CommandItem key={p.id} onSelect={() => handleOpenConfigDialog(p)} className="p-4 cursor-pointer">
                                                    <div className="flex justify-between w-full items-center">
                                                        <div>
                                                            <p className="font-black uppercase text-xs">{p.model}</p>
                                                            <p className="text-[9px] opacity-40">S/N: {p.serialNumber}</p>
                                                        </div>
                                                        <p className="font-black text-primary text-xs">{formatKes(p.sellingPrice)}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="min-h-[180px] border-2 border-dashed rounded-[1.5rem] p-4 bg-muted/5 flex flex-col gap-3">
                        {cart.length > 0 ? (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-black/5">
                                    <div>
                                        <p className="text-[10px] font-black uppercase truncate max-w-[150px]">{item.name}</p>
                                        <p className="text-[9px] font-bold opacity-40">{item.quantity} Unit(s)</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black">{formatKes(item.total)}</span>
                                        <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center opacity-20 py-8">
                                <Target className="h-10 w-10 mb-2" />
                                <p className="text-[8px] font-black uppercase tracking-widest">Basket Empty</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto space-y-5 pt-4 border-t">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <Switch checked={applyVat} onCheckedChange={setApplyVat} id="vat-dash" />
                            <Label htmlFor="vat-dash" className="text-[10px] font-black uppercase opacity-60">Add 16% VAT</Label>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase opacity-40">Total Payable</p>
                            <p className="text-2xl font-black text-primary tracking-tighter">{formatKes(cartTotal)}</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleFinishSale} 
                        className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] shadow-2xl rounded-2xl active:scale-95 transition-all"
                        disabled={isProcessingSale || cart.length === 0 || !selectedCustomer || !posAction}
                    >
                        {isProcessingSale ? <Loader2 className="h-6 w-6 animate-spin" /> : `Execute ${posAction || 'Process'}`}
                    </Button>
                </div>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden rounded-[2rem] bg-white mt-10">
        <CardHeader className="bg-muted/10 border-b py-6 px-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-black p-2.5 rounded-xl shadow-lg">
                        <HistoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Recent Activity Ledger</CardTitle>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                    <Input 
                        placeholder="Filter transactions..." 
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="pl-10 h-11 text-xs font-bold uppercase bg-white w-full sm:w-80 rounded-xl"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="text-[10px] font-black uppercase py-5 px-10">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="h-16 border-b last:border-0 hover:bg-muted/5 transition-colors group">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-2 px-10">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-40 text-center opacity-30 text-xs font-black uppercase italic">
                                No records found for this period
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="px-10"><DataTablePagination table={table} /></div>
        </CardContent>
      </Card>
      
      <Dialog open={!!configuringProduct} onOpenChange={(open) => !open && setConfiguringProduct(null)}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Add to Basket</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">{configuringProduct?.model}</DialogDescription>
            </DialogHeader>
            <div className="space-y-8 pt-6">
                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Standard Rate</p>
                        <p className="text-xl font-black text-primary">{formatKes(configuringProduct?.sellingPrice)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Available Units</p>
                        <p className="text-xl font-black">{configuringProduct?.quantity}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Quantity</Label>
                        <Input 
                            type="number" 
                            value={configQty} 
                            onChange={e => setConfigQty(e.target.value)} 
                            className="h-14 text-lg font-black rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Custom Rate (KES)</Label>
                        <Input 
                            type="number" 
                            value={configPrice} 
                            onChange={e => setConfigPrice(e.target.value)} 
                            className="h-14 text-lg font-black border-primary rounded-xl"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase opacity-40">Subtotal Calculation</p>
                        <p className="text-3xl font-black text-primary tracking-tighter">KES {((parseInt(configQty) || 0) * (parseFloat(configPrice) || 0)).toLocaleString()}</p>
                    </div>
                    <Button className="h-16 px-10 font-black uppercase tracking-widest shadow-xl rounded-2xl" onClick={handleAddToCart}>Apply Item</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-6 bg-white border-b no-print flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight">View Document</DialogTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!)} className="h-8 font-black uppercase text-[9px] tracking-widest border-2">
                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Download className="h-3 w-3 mr-2" />}
                    Download PDF
                </Button>
            </div>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-4 md:p-8">
            <div id="dashboard-export-target" className="shrink-0 relative overflow-visible origin-top scale-[0.4] sm:scale-[0.6] md:scale-100 bg-white shadow-2xl">
                {renderPdfPreview()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN',
    'Proforma': 'PRO',
    'DeliveryNote': 'DLV'
};

const VAT_RATE = 0.16;