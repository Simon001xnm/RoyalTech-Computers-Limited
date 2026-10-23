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
        style: 'currency', 
        currency: 'KES', 
        maximumFractionDigits: 0 
    }).format(value);

    // Responsive alignment logic
    let rectX = x - 45;
    let textX = x;
    
    if (index >= 3) { 
        rectX = x - 85;
        textX = x - 40;
    } 
    else if (index === 0) { 
        rectX = x - 5;
        textX = x + 40;
    }

    return (
        <g>
            <rect 
                x={rectX} 
                y={y - 35} 
                width={90} 
                height={20} 
                rx={10} 
                fill="#10b981" 
                className="drop-shadow-lg"
            />
            <text 
                x={textX} 
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
            <span className="text-[10px] font-bold text-foreground">{format(date, 'dd MMM yyyy')}</span>
            <span className="text-[9px] font-mono opacity-50 text-muted-foreground">{format(date, 'hh:mm a')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "relatedTo",
      header: "Client",
      cell: ({ row }) => <span className="text-[10px] font-black truncate block max-w-[120px] sm:max-w-[200px] text-foreground">{row.original.relatedTo || 'Walk-in'}</span>
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
        <div className="text-right font-black text-xs text-foreground">
          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(row.original.data?.total || 0))}
        </div>
      )
    },
    {
        id: "actions",
        header: () => <div className="text-right pr-2 sm:pr-6">Ops</div>,
        cell: ({ row }) => {
            const docObj = row.original;
            return (
                <div className="flex justify-end pr-2 sm:pr-6 gap-1 sm:gap-2">
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
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] text-white space-y-8 animate-in fade-in duration-1000">
            <div className="relative h-24 w-24">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary fill-primary animate-pulse" />
                </div>
            </div>
            <div className="text-center px-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                    {tenant?.name || "Business Hub"}
                </h2>
            </div>
        </div>
      );
  }

  if (!stats) return null;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto overflow-x-hidden">
      <PageHeader 
        title={`Welcome, ${userProfile?.name || 'Partner'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-1 sm:px-0">
          <SummaryCard title="Period Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total money in" />
          <SummaryCard title="Period Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Money left after costs" />
          <SummaryCard title="Period Expenses" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Shop spend" />
          <SummaryCard title="Total Money Owed" value={formatKes(stats.totalDebt)} icon={FileWarning} description="Historical pending payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          {/* ANALYTICS SECTION */}
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
            <CardHeader className="bg-card p-6 sm:p-8 border-b-0">
                <div className="flex items-center gap-4 sm:gap-5">
                    <div className="bg-[#4f46e5] p-2.5 sm:p-3 rounded-2xl shadow-xl">
                        <ActivityIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                        <CardTitle className="text-xl sm:text-2xl font-bold leading-none text-card-foreground truncate">Intelligence Hub</CardTitle>
                        <CardDescription className="text-[9px] sm:text-[10px] font-bold text-[#4f46e5] tracking-widest uppercase truncate">Performance Data Flow</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 space-y-8 sm:space-y-12">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
                    <div className="space-y-4 px-6 sm:px-8 pb-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 text-muted-foreground">Revenue Trend</h4>
                            <div className="flex gap-2 sm:gap-4">
                                <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" /><span className="text-[8px] font-bold opacity-60">Rev</span></div>
                                <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /><span className="text-[8px] font-bold opacity-60">Exp</span></div>
                            </div>
                        </div>
                        <div className="h-[250px] sm:h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceStats} margin={{ top: 60, right: 30, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <YAxis fontSize={9} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3}>
                                        <LabelList dataKey="Revenue" content={<PriceRibbon />} />
                                    </Area>
                                    <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-4 px-6 sm:px-8 pb-8 border-t xl:border-t-0 xl:border-l border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center text-muted-foreground pt-6 xl:pt-0">Moving Inventory</h4>
                        <div className="h-[250px] sm:h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats.categoryData} 
                                        cx="50%" cy="50%" 
                                        innerRadius={50} 
                                        outerRadius={80} 
                                        paddingAngle={8} 
                                        dataKey="value"
                                        label={({ name }) => name.slice(0, 10)}
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', fontSize: '10px' }} />
                                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* QUICK SELL NODE */}
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] flex flex-col">
            <CardHeader className="bg-primary/5 border-b p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-3 text-card-foreground">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Quick Sell Node
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] font-black h-5 bg-background border-primary/20 uppercase tracking-widest">Live</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 flex-grow flex flex-col gap-6 sm:gap-8 overflow-hidden">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">1. Workflow</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Receipt', 'Invoice', 'Quotation'].map(type => (
                            <Button 
                                key={type}
                                variant={posAction === type ? 'default' : 'outline'} 
                                onClick={() => setPosAction(type as DocumentType)}
                                className="h-10 sm:h-12 text-[9px] sm:text-[10px] font-black uppercase rounded-xl border-2 px-1"
                            >
                                {type === 'Quotation' ? 'Quote' : type}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">2. Client Identity</Label>
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild disabled={!posAction}>
                            <Button 
                                variant="outline" 
                                className={cn(
                                    "w-full h-14 justify-between text-[11px] font-bold uppercase bg-background border-2 rounded-xl",
                                    !selectedCustomer && "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <UserIcon className="h-5 w-5 text-primary opacity-40" />
                                    <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Select Account...'}</span>
                                </div>
                                <Search className="h-4 w-4 opacity-20" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] sm:w-[420px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Find client..." className="h-12" />
                                <CommandList>
                                    <CommandEmpty>No matching accounts.</CommandEmpty>
                                    <CommandGroup heading="Recent Accounts">
                                        {customers?.slice(0, 50).map(c => (
                                            <CommandItem 
                                                key={c.id} 
                                                onSelect={() => { 
                                                    setSelectedCustomer({ id: c.id, name: c.alias ? `${c.alias} (${c.name})` : c.name }); 
                                                    setCustomerSearchOpen(false); 
                                                }} 
                                                className="p-4 cursor-pointer"
                                            >
                                                <div className="flex flex-col gap-1 w-full">
                                                    <p className="font-black uppercase text-xs truncate">{c.name}</p>
                                                    <p className="text-[9px] opacity-40 truncate">{c.phone || c.email}</p>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">3. Items</Label>
                        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                            <PopoverTrigger asChild disabled={!selectedCustomer}>
                                <Button variant="outline" size="sm" className="h-8 font-black uppercase text-[9px] tracking-widest bg-primary/5">
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] sm:w-[380px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search shop..." className="h-12" />
                                    <CommandList>
                                        <CommandEmpty>No stock found.</CommandEmpty>
                                        <CommandGroup>
                                            {assets?.filter(p => (p.quantity || 0) > 0).map(p => (
                                                <CommandItem key={p.id} onSelect={() => handleOpenConfigDialog(p)} className="p-4 cursor-pointer">
                                                    <div className="flex justify-between w-full items-center">
                                                        <div className="overflow-hidden">
                                                            <p className="font-black uppercase text-xs truncate">{p.model}</p>
                                                            <p className="text-[9px] opacity-40 truncate">S/N: {p.serialNumber}</p>
                                                        </div>
                                                        <p className="font-black text-primary text-xs shrink-0 ml-4">KES {p.sellingPrice?.toLocaleString()}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="min-h-[150px] sm:min-h-[180px] border-2 border-dashed rounded-[1.5rem] p-4 bg-muted/5 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                        {cart.length > 0 ? (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-card rounded-xl shadow-sm border border-black/5">
                                    <div className="overflow-hidden pr-2">
                                        <p className="text-[10px] font-black uppercase truncate text-foreground">{item.name}</p>
                                        <p className="text-[9px] font-bold opacity-40 text-muted-foreground">{item.quantity} Unit(s)</p>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                        <span className="text-xs font-black text-foreground">KES {item.total.toLocaleString()}</span>
                                        <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-red-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center opacity-20 py-8">
                                <Target className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                                <p className="text-[8px] font-black uppercase tracking-widest">Basket Empty</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t mt-auto">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">4. Settlement</Label>
                        <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                            <SelectTrigger className="h-12 font-bold bg-background border-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                    {paymentMode === 'Cash' && <Banknote className="h-4 w-4 text-green-600" />}
                                    {paymentMode === 'M-Pesa' && <Smartphone className="h-4 w-4 text-green-600" />}
                                    {paymentMode === 'Bank' && <Landmark className="h-4 w-4 text-blue-600" />}
                                    {paymentMode === 'Card' && <CreditCard className="h-4 w-4 text-purple-600" />}
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash Transaction</SelectItem>
                                <SelectItem value="M-Pesa">M-Pesa (Direct)</SelectItem>
                                <SelectItem value="Bank">Bank Deposit/Transfer</SelectItem>
                                <SelectItem value="Card">Visa/Mastercard</SelectItem>
                                <SelectItem value="Cheque">Physical Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Switch checked={applyVat} onCheckedChange={setApplyVat} id="vat-dash" className="scale-75 sm:scale-100" />
                            <Label htmlFor="vat-dash" className="text-[9px] sm:text-[10px] font-black uppercase opacity-60">Tax (16%)</Label>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase opacity-40">Total Payable</p>
                            <p className="text-xl sm:text-2xl font-black text-primary tracking-tighter">{formatKes(cartTotal)}</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleFinishSale} 
                        className="w-full h-14 sm:h-16 text-xs sm:text-sm font-black uppercase tracking-[0.2em] shadow-2xl rounded-2xl active:scale-95 transition-all"
                        disabled={isProcessingSale || cart.length === 0 || !selectedCustomer || !posAction}
                    >
                        {isProcessingSale ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : `Finish ${posAction || 'Process'}`}
                    </Button>
                </div>
            </CardContent>
          </Card>
      </div>

      {/* ACTIVITY LEDGER */}
      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-card mt-8 sm:mt-10 mx-1 sm:mx-0">
        <CardHeader className="bg-muted/10 py-5 sm:py-6 px-6 sm:px-10 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-black p-2 rounded-xl shadow-lg shrink-0">
                        <HistoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Recent Activity</CardTitle>
                </div>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                    <Input 
                        placeholder="Filter..." 
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="pl-10 h-10 text-xs font-bold uppercase bg-background rounded-xl"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/20">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-[9px] sm:text-[10px] font-black uppercase py-4 sm:py-5 px-6 sm:px-10 text-muted-foreground">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="h-14 sm:h-16 border-b last:border-0 hover:bg-muted/5 transition-colors group">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2 px-6 sm:px-10">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center opacity-30 text-xs font-black uppercase italic">
                                    No records found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="px-6 sm:px-10"><DataTablePagination table={table} /></div>
        </CardContent>
      </Card>
      
      {/* MODALS & OVERLAYS */}
      <Dialog open={!!configuringProduct} onOpenChange={(open) => !open && setConfiguringProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2rem] bg-card p-6">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Add to Basket</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground truncate">{configuringProduct?.model}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="p-4 sm:p-5 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center shadow-inner">
                    <div className="overflow-hidden">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Standard Rate</p>
                        <p className="text-lg font-black text-primary truncate">{formatKes(configuringProduct?.sellingPrice)}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Stock</p>
                        <p className="text-lg font-black">{configuringProduct?.quantity}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Qty</Label>
                        <Input 
                            type="number" 
                            value={configQty} 
                            onChange={e => setConfigQty(e.target.value)} 
                            className="h-12 sm:h-14 text-lg font-black rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Rate (KES)</Label>
                        <Input 
                            type="number" 
                            value={configPrice} 
                            onChange={e => setConfigPrice(e.target.value)} 
                            className="h-12 sm:h-14 text-lg font-black border-primary rounded-xl"
                            placeholder="Price"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t">
                    <div className="overflow-hidden">
                        <p className="text-[8px] sm:text-[9px] font-black uppercase opacity-40 mb-0.5">Subtotal</p>
                        <p className="text-2xl sm:text-3xl font-black text-primary tracking-tighter truncate">KES {((parseInt(configQty) || 0) * (parseFloat(configPrice) || 0)).toLocaleString()}</p>
                    </div>
                    <Button className="h-12 sm:h-16 px-6 sm:px-10 font-black uppercase tracking-widest shadow-xl rounded-xl sm:rounded-2xl shrink-0" onClick={handleAddToCart}>Apply</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="w-[100vw] sm:max-w-5xl h-[100vh] sm:h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-4 sm:p-6 bg-white border-b no-print flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">Preview Document</DialogTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!)} className="h-8 font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-2">
                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Download className="h-3 w-3 mr-2" />}
                    Download
                </Button>
            </div>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-2 sm:p-8">
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
