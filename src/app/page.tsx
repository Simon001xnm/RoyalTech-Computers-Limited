'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { PageHeader } from '@/components/layout/page-header';
import { SummaryCard } from '@/components/dashboard/summary-card';
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
    UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    startOfDay
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
import type { Document as AppDocument, DocumentType } from "@/types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN',
    'Proforma': 'PRO',
    'DeliveryNote': 'DLV'
};

const VAT_RATE = 0.16;

export default function DashboardPage() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<TimeFilter>('month');
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
  const [currentTime, setCurrentTime] = useState<string>('');

  // POS State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [posAction, setPosAction] = useState<DocumentType | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'M-Pesa' | 'Bank'>('Cash');
  const [applyVat, setApplyVat] = useState(false);

  // New Customer State
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // New POS Selection Logic
  const [configuringProduct, setConfiguringProduct] = useState<any>(null);
  const [configQty, setConfigQty] = useState('1');
  const [configPrice, setConfigPrice] = useState('');

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
        setCurrentTime(`${dayStr}, ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const { data: customers } = useCollection(customersQuery);

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
        return acc + cogs;
    }, 0);
    const totalExpenses = filteredExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalProfit = totalRevenue - (totalExpenses + totalCost);
    const totalDebt = sales.filter(s => (Number(s.balance) || 0) > 0).reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
    const lowStock = assets.filter(a => Number(a.quantity) <= (Number(a.minStock) || 5));

    return {
        totalRevenue, totalProfit, totalExpenses, totalDebt,
        lowStockCount: lowStock.length,
        unpaidCount: sales.filter(s => (Number(s.balance) || 0) > 0).length,
        items: [...filteredDocs].sort((a,b) => parseISO(b.generatedDate).getTime() - parseISO(a.generatedDate).getTime()),
        viewLabel: filter === 'custom' && dateRange?.from ? `${format(dateRange.from, 'dd MMM')} - ${format(dateRange.to || now, 'dd MMM')}` : filter.toUpperCase()
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
            Expenses: expense + cogs,
            Surplus: revenue - (expense + cogs)
        };
    });
  }, [sales, expenses]);

  // POS Logic
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

        // Sequential document logic
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
                invoiceNumber: docTitle, // Tracking user-friendly reference for statements
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
                invoiceNumber: docTitle, // Storing for statement reference
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

  const handleCreateCustomer = async () => {
    if (!tenant || !user || !newCustName) return;
    setIsSavingCustomer(true);
    try {
        const docRef = await addDoc(collection(firestore, 'customers'), {
            tenantId: tenant.id,
            name: newCustName,
            phone: newCustPhone,
            registrationDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });
        setSelectedCustomer({ id: docRef.id, name: newCustName });
        setIsNewCustomerOpen(false);
        setNewCustName('');
        setNewCustPhone('');
        toast({ title: "Client Registered" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Registration Failed" });
    } finally {
        setIsSavingCustomer(false);
    }
  };

  const handleGenerateDelivery = async (originDoc: AppDocument) => {
    if (!tenant || !user) return;
    try {
        const timestamp = new Date().toISOString();
        const docRef = await addDoc(collection(firestore, 'documents'), {
            tenantId: tenant.id,
            type: 'DeliveryNote',
            title: `Delivery Note #${Math.floor(Math.random() * 1000)}`,
            generatedDate: timestamp,
            relatedTo: originDoc.relatedTo,
            data: {
                ...originDoc.data,
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
        });
        toast({ title: "Delivery Note Created" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Generation Failed" });
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
      cell: ({ row }) => <span className="text-[10px] font-black uppercase truncate block max-w-[150px]">{row.original.relatedTo || 'Walk-in'}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
          const type = row.original.type;
          return <Badge className={cn("text-[8px] font-black uppercase h-4 px-2 border-none", type === 'Receipt' ? "bg-green-100 text-green-700" : (type === 'Invoice' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"))}>{type}</Badge>;
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
        header: () => <div className="text-right pr-6">Action</div>,
        cell: ({ row }) => {
            const docObj = row.original;
            const canGenerateDelivery = ['Invoice', 'Receipt'].includes(docObj.type);
            return (
                <div className="flex justify-end pr-6 gap-2">
                    {canGenerateDelivery && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700" onClick={() => handleGenerateDelivery(docObj)}>
                            <Truck className="h-3.5 w-3.5" />
                        </Button>
                    )}
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

  if (salesLoading || stockLoading || expLoading || docsLoading) {
      return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground">Checking Shop Records...</div>;
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

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Main Shop Dashboard" 
        description={`Analyzing records for period: ${stats.viewLabel}`}
        actions={
            <div className="flex items-center gap-3">
                {currentTime && (
                    <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-xl border border-primary/20 font-mono text-[11px] font-black uppercase tracking-widest text-primary shadow-sm">
                        <Clock className="h-3 w-3" /> {currentTime}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="h-9 w-32 font-bold text-[10px] uppercase"><Filter className="h-3 w-3 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem><SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Date Range</SelectItem>
                        </SelectContent>
                    </Select>
                    {filter === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-9 text-[10px] font-bold"><CalendarIcon className="h-3 w-3 mr-2" />Custom Range</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus numberOfMonths={2} /></PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockCount > 0 && (
            <Link href="/stock">
                <Card className="border-l-4 border-l-orange-500 hover:bg-orange-50 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-orange-600">Stock Alert</p><p className="text-sm font-bold">{stats.lowStockCount} items almost finished</p></div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-orange-300" />
                    </CardContent>
                </Card>
            </Link>
          )}
          {stats.unpaidCount > 0 && (
            <Link href="/receivables">
                <Card className="border-l-4 border-l-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-red-100 p-2.5 rounded-xl"><FileWarning className="h-5 w-5 text-red-600" /></div>
                        <div><p className="text-[10px] font-black uppercase text-red-600">Total Money Owed</p><p className="text-sm font-bold">{stats.unpaidCount} people owe money ({formatKes(stats.totalDebt)})</p></div>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-red-300" />
                    </CardContent>
                </Card>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Period Revenue" value={formatKes(stats.totalRevenue)} icon={DollarSign} description="Total money in" />
          <SummaryCard title="Period Profit" value={formatKes(stats.totalProfit)} icon={TrendingUp} description="Money left after costs" />
          <SummaryCard title="Period Expenses" value={formatKes(stats.totalExpenses)} icon={Wallet} className="border-l-4 border-l-red-500" description="Shop spend" />
          <SummaryCard title="Total Money Owed" value={formatKes(stats.totalDebt)} icon={FileWarning} description="Historical pending payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* ANALYTICS */}
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-xl shadow-sm">
                        <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Performance Intelligence</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase text-primary">Cross-Period Comparative Analysis</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#000000' }} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(v) => `Ksh ${v/1000}k`} tick={{ fill: '#000000' }} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                            <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    {performanceStats.map((p) => (
                        <div key={p.name} className="p-3 bg-muted/20 rounded-2xl border space-y-2">
                            <p className="text-[9px] font-black uppercase text-center border-b pb-2">{p.name}</p>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-[8px] font-bold">
                                    <span className="opacity-40">REV</span>
                                    <span className="text-primary">{formatKes(p.Revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] font-bold">
                                    <span className="opacity-40">EXP</span>
                                    <span className="text-red-600">{formatKes(p.Expenses)}</span>
                                </div>
                                <div className="pt-1 mt-1 border-t flex justify-between items-center">
                                    <span className="text-[7px] font-black uppercase">NET</span>
                                    <span className={cn("text-[10px] font-black", p.Surplus >= 0 ? "text-green-600" : "text-red-600")}>
                                        {formatKes(p.Surplus)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>

          {/* DASHBOARD POS TERMINAL */}
          <Card className="shadow-2xl border-none ring-1 ring-black/5 bg-white overflow-hidden flex flex-col">
            <CardHeader className="bg-primary/5 border-b py-3 px-5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ShoppingCart className="h-3 w-3" />
                        Quick Sell
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-5 bg-white">v3.0</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col gap-5 overflow-hidden">
                {/* 1. Action */}
                <div className="space-y-2">
                    <Label className="text-[8px] font-black uppercase opacity-50">1. Select Document Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button 
                            variant={posAction === 'Receipt' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Receipt')}
                            className="h-10 text-[9px] font-black uppercase px-0"
                        >
                            <Receipt className="h-3 w-3 mr-1" /> Receipt
                        </Button>
                        <Button 
                            variant={posAction === 'Invoice' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Invoice')}
                            className="h-10 text-[9px] font-black uppercase px-0"
                        >
                            <FileText className="h-3 w-3 mr-1" /> Invoice
                        </Button>
                        <Button 
                            variant={posAction === 'Quotation' ? 'default' : 'outline'} 
                            onClick={() => setPosAction('Quotation')}
                            className="h-10 text-[9px] font-black uppercase px-0"
                        >
                            <FilePlus2 className="h-3 w-3 mr-1" /> Quote
                        </Button>
                    </div>
                </div>

                {/* 2. Customer */}
                <div className="space-y-2">
                    <Label className={cn("text-[8px] font-black uppercase opacity-50", !posAction && "text-destructive")}>
                        2. Identify Customer {!posAction && "(Unlock Step 1 First)"}
                    </Label>
                    <div className="flex gap-2">
                        <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                            <PopoverTrigger asChild disabled={!posAction}>
                                <Button 
                                    variant="outline" 
                                    className={cn(
                                        "flex-1 h-11 justify-between text-[10px] font-bold uppercase tracking-tight bg-white",
                                        !posAction && "opacity-40 cursor-not-allowed border-dashed"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {!posAction ? <LockIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4 text-primary" />}
                                        <span>{selectedCustomer ? selectedCustomer.name : 'Select Client...'}</span>
                                    </div>
                                    <Search className="h-3 w-3 opacity-30" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Find client..." className="h-9" />
                                    <CommandList>
                                        <CommandGroup>
                                            {customers?.map(c => (
                                                <CommandItem key={c.id} onSelect={() => { setSelectedCustomer({ id: c.id, name: c.name }); setCustomerSearchOpen(false); }} className="text-[10px] uppercase font-bold p-3">
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-11 w-11 border-2 border-primary text-primary"
                            onClick={() => setIsNewCustomerOpen(true)}
                            disabled={!posAction}
                        >
                            <UserPlus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* 3. Add Products */}
                <div className="space-y-2">
                    <Label className={cn("text-[8px] font-black uppercase opacity-50", !selectedCustomer && "text-destructive")}>
                        3. Add Items to Cart {!selectedCustomer && "(Unlock Step 2 First)"}
                    </Label>
                    <Popover open={productSearchOpen} onOpenChange={(open) => {
                        if (open && !selectedCustomer) {
                            toast({ variant: 'destructive', title: 'Action Error', description: 'Please select a customer before browsing inventory.' });
                            return;
                        }
                        setProductSearchOpen(open);
                    }}>
                        <PopoverTrigger asChild disabled={!selectedCustomer}>
                            <Button variant="outline" className={cn(
                                "w-full justify-between h-11 text-[10px] font-black uppercase tracking-widest bg-primary/5 border-primary/20 text-primary border-2",
                                !selectedCustomer && "opacity-40 cursor-not-allowed border-muted text-muted-foreground bg-muted/5"
                            )}>
                                <span>{productSearchOpen ? 'Selecting...' : 'Add Products...'}</span>
                                {selectedCustomer ? <Plus className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[340px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search inventory..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No stock found.</CommandEmpty>
                                    <CommandGroup heading="Available Inventory">
                                        {assets?.map(p => {
                                            const qty = p.quantity || 0;
                                            const isOut = qty <= 0;
                                            return (
                                                <CommandItem 
                                                    key={p.id} 
                                                    onSelect={() => !isOut && handleOpenConfigDialog(p)} 
                                                    disabled={isOut}
                                                    className={cn("p-3 cursor-pointer", isOut && "opacity-40 cursor-not-allowed")}
                                                >
                                                    <div className="flex justify-between w-full items-center">
                                                        <div>
                                                            <p className="font-bold text-[10px] uppercase truncate max-w-[150px]">{p.model}</p>
                                                            <p className="text-[8px] font-mono opacity-50">S/N: {p.serialNumber?.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-primary text-[10px] block">{formatKes(p.sellingPrice)}</span>
                                                            <span className={cn("text-[8px] font-black uppercase", isOut ? "text-red-500" : "text-green-600")}>
                                                                {isOut ? 'OUT OF STOCK' : `${qty} IN STOCK`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="min-h-[140px] max-h-[220px] overflow-y-auto border rounded-xl p-2 bg-muted/5">
                        {cart.length > 0 ? (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2.5 bg-white rounded-lg shadow-sm border group">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase truncate max-w-[130px]">{item.name}</span>
                                            <span className="text-[8px] font-bold opacity-50">{item.quantity} x {formatKes(item.sellingPrice)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black">{formatKes(item.total)}</span>
                                            <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-red-600 transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 py-12">
                                <ShoppingCart className="h-10 w-10 mb-2" />
                                <p className="text-[8px] font-black uppercase tracking-widest">Basket Empty</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Options */}
                <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                        <Label className="text-[8px] font-black uppercase opacity-50">4. Finalize Details</Label>
                        <div className="flex items-center gap-2">
                            <Switch checked={applyVat} onCheckedChange={setApplyVat} id="pos-vat" />
                            <Label htmlFor="pos-vat" className="text-[10px] font-black uppercase cursor-pointer">16% VAT</Label>
                        </div>
                    </div>

                    {posAction !== 'Quotation' && (
                        <div className="grid grid-cols-3 gap-2">
                            <Button 
                                variant={paymentMode === 'Cash' ? 'default' : 'outline'} 
                                onClick={() => setPaymentMode('Cash')}
                                className="h-10 text-[9px] font-black uppercase px-0 border-2"
                            >
                                <Banknote className="h-3 w-3 mr-1" /> Cash
                            </Button>
                            <Button 
                                variant={paymentMode === 'M-Pesa' ? 'default' : 'outline'} 
                                onClick={() => setPaymentMode('M-Pesa')}
                                className="h-10 text-[9px] font-black uppercase px-0 border-2"
                            >
                                <Smartphone className="h-3 w-3 mr-1" /> M-Pesa
                            </Button>
                            <Button 
                                variant={paymentMode === 'Bank' ? 'default' : 'outline'} 
                                onClick={() => setPaymentMode('Bank')}
                                className="h-10 text-[9px] font-black uppercase px-0 border-2"
                            >
                                <Landmark className="h-3 w-3 mr-1" /> Bank
                            </Button>
                        </div>
                    )}

                    <div className="p-4 bg-black text-white rounded-2xl shadow-xl flex justify-between items-center mt-2">
                        <div>
                            <span className="text-[8px] font-black uppercase opacity-50 block">Grand Total</span>
                            <span className="text-2xl font-black tracking-tighter leading-none">{formatKes(cartTotal)}</span>
                        </div>
                        <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase">{posAction || 'Pending'}</Badge>
                    </div>

                    <Button 
                        onClick={handleFinishSale} 
                        className="w-full h-14 font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm"
                        disabled={isProcessingSale || cart.length === 0 || !selectedCustomer || !posAction}
                    >
                        {isProcessingSale ? <Loader2 className="h-5 w-5 animate-spin" /> : `Finish ${posAction || 'Process'}`}
                    </Button>
                </div>
            </CardContent>
          </Card>
      </div>

      {/* NEW ITEM CONFIGURATION DIALOG */}
      <Dialog open={!!configuringProduct} onOpenChange={(open) => !open && setConfiguringProduct(null)}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Add to Basket</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">{configuringProduct?.model}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Shop Price</p>
                        <p className="text-lg font-black text-primary">KES {configuringProduct?.sellingPrice?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase opacity-40">In Shop</p>
                        <p className="text-lg font-black">{configuringProduct?.quantity} Units</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Quantity</Label>
                        <Input 
                            type="number" 
                            value={configQty} 
                            onChange={e => setConfigQty(e.target.value)} 
                            className="h-12 text-lg font-black"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Final Price (KES)</Label>
                        <Input 
                            type="number" 
                            value={configPrice} 
                            onChange={e => setConfigPrice(e.target.value)} 
                            className="h-12 text-lg font-black border-primary"
                            placeholder="Enter Price"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Subtotal</p>
                        <p className="text-2xl font-black text-primary">KES {((parseInt(configQty) || 0) * (parseFloat(configPrice) || 0)).toLocaleString()}</p>
                    </div>
                    <Button className="h-14 px-8 font-black uppercase tracking-widest shadow-xl" onClick={handleAddToCart}>Add to Cart</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* NEW CUSTOMER DIALOG */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase">Register Client</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add a new account to your shop database.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Full Name / Business</Label>
                    <Input 
                        value={newCustName} 
                        onChange={e => setNewCustName(e.target.value)} 
                        placeholder="e.g. John Doe"
                        className="h-11 font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Phone Number</Label>
                    <Input 
                        value={newCustPhone} 
                        onChange={e => setNewCustPhone(e.target.value)} 
                        placeholder="e.g. 0712345678"
                        className="h-11 font-bold"
                    />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t">
                    <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)} className="h-11 font-bold">Cancel</Button>
                    <Button onClick={handleCreateCustomer} disabled={isSavingCustomer || !newCustName} className="h-11 px-8 font-black uppercase tracking-widest">
                        {isSavingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Client"}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b py-4 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Activity Ledger</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by customer..." 
                            value={ledgerSearch}
                            onChange={(e) => setLedgerSearch(e.target.value)}
                            className="pl-8 h-9 text-[10px] font-bold uppercase bg-white w-full sm:w-64 border-muted"
                        />
                    </div>
                    {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id} className="text-[10px] font-black uppercase py-4">{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} className="h-12 border-b last:border-0 hover:bg-muted/5 transition-colors">{row.getVisibleCells().map((cell) => (<TableCell key={cell.id} className="py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : (<TableRow><TableCell colSpan={columns.length} className="h-32 text-center opacity-30 text-xs font-bold uppercase italic">No documents found for this criteria</TableCell></TableRow>)}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </CardContent>
      </Card>
      
      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-6 bg-white border-b no-print flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">View Document</DialogTitle>
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
