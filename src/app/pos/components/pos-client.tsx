"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, PlusCircle, Loader2, Check, Search, Wallet, Banknote, Landmark, CreditCard, FileText, FilePlus2, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs, orderBy, limit } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { DocumentType, Sale } from '@/types';
import { useEffect } from 'react';
import { RecentSales } from './recent-sales';

const VAT_RATE = 0.16;

type PaymentSplit = {
    method: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit';
    amount: number;
    reference?: string;
};

type CartItem = {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    sellingPrice: number;
    buyingPrice: number; 
    total: number;
};

export function PosClient() {
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string} | null>(null);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [applyVat, setApplyVat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successType, setSuccessType] = useState<DocumentType | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Selection state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectionQty, setSelectionQty] = useState<string>('1');
  const [selectionPrice, setSelectionPrice] = useState<string>('');

  // Split Payment State
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentSplit['method'] | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState<string>('');

  // Inventory Query
  const productsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'products'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: products } = useCollection(productsQuery);

  // Customer Query
  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection(customersQuery);

  // Company Profile for branding
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: workspaceProfile } = useDoc(companyRef);

  // Existing Docs for sequential numbering
  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawDocuments } = useCollection(docsQuery);

  const [searchOpen, setSearchOpen] = useState(false);
  const [custSearchOpen, setCustSearchOpen] = useState(false);

  // Fetch Customer Balance
  useEffect(() => {
    if (!selectedCustomer?.id || !tenant) {
      setCustomerBalance(0);
      return;
    }

    const fetchBalance = async () => {
      try {
        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(
          salesRef, 
          where('tenantId', '==', tenant.id), 
          where('customerId', '==', selectedCustomer.id)
        );
        const snap = await getDocs(q);
        const totalBal = snap.docs.reduce((acc, d) => acc + (d.data().balance || 0), 0);
        setCustomerBalance(totalBal);
      } catch (e) {
        console.error("Balance fetch error:", e);
      }
    };

    fetchBalance();
  }, [selectedCustomer?.id, tenant, firestore]);

  // Calculations
  const { subtotal, vatAmount, total, amountPaid, remainingBalance, totalProfit } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.total, 0);
    const discountedSub = Math.max(0, sub - discount);
    const vat = applyVat ? discountedSub * VAT_RATE : 0;
    const tot = discountedSub + vat;
    
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    const profit = cart.reduce((acc, item) => acc + (item.total - (item.buyingPrice * item.quantity)), 0) - discount;
    
    return {
        subtotal: sub,
        vatAmount: vat,
        total: tot,
        amountPaid: paid,
        remainingBalance: tot - paid,
        totalProfit: profit
    };
  }, [cart, discount, payments, applyVat]);

  const handleSelectProduct = (product: any) => {
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Action Required', description: 'Please select a client first.' });
        return;
    }
    setSelectedProduct(product);
    setSelectionQty('1');
    setSelectionPrice(String(product.buyingPrice || 0)); 
    setSearchOpen(false);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(selectionQty) || 1;
    const price = parseFloat(selectionPrice) || 0;

    if (qty > (selectedProduct.currentStock || 0)) {
        toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${selectedProduct.currentStock} units available.` });
        return;
    }

    const existing = cart.find(i => i.productId === selectedProduct.id && i.sellingPrice === price);
    
    if (existing) {
        setCart(cart.map(i => i.productId === selectedProduct.id && i.sellingPrice === price 
            ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.sellingPrice } 
            : i));
    } else {
        setCart([...cart, {
            id: crypto.randomUUID(),
            productId: selectedProduct.id,
            name: selectedProduct.name,
            quantity: qty,
            sellingPrice: price,
            buyingPrice: selectedProduct.buyingPrice, 
            total: qty * price
        }]);
    }
    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const handleAddPayment = () => {
    if (!activePaymentMethod || !currentPaymentAmount) return;
    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPayments([...payments, {
        method: activePaymentMethod,
        amount: amount,
        reference: currentPaymentRef
    }]);
    
    setActivePaymentMethod(null);
    setCurrentPaymentAmount('');
    setCurrentPaymentRef('');
  };

  const handleProcessPOSAction = async (actionType: 'Receipt' | 'Invoice' | 'Quotation') => {
    if (cart.length === 0 || !tenant || !user || !selectedCustomer) return;
    setIsProcessing(true);

    try {
        const batch = writeBatch(firestore);
        const timestamp = new Date().toISOString();

        const effectiveDocType = (actionType === 'Receipt' && remainingBalance > 0) ? 'Invoice' : actionType;
        const saleStatus = remainingBalance <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Credit');

        const typeCount = rawDocuments?.filter(d => d.type === effectiveDocType).length || 0;
        const seq = typeCount + 1;
        const docTitle = `${effectiveDocType} #${String(seq).padStart(3, '0')}`;

        const baseData = {
            tenantId: tenant.id,
            date: timestamp,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            items: cart.map(item => ({...item, type: 'asset', cogs: item.buyingPrice * item.quantity})),
            subtotal,
            vatAmount,
            discount,
            total,
            totalProfit,
            amountPaid,
            balance: remainingBalance,
            previousBalance: customerBalance,
            payments,
            applyVat,
            status: saleStatus,
            paymentMethod: payments.length > 1 ? 'Split' : (payments[0]?.method || 'Cash'),
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        const docRef = doc(collection(firestore, 'documents'));
        batch.set(docRef, {
            tenantId: tenant.id,
            type: effectiveDocType,
            title: docTitle,
            generatedDate: timestamp,
            relatedTo: selectedCustomer.name,
            data: {
                ...baseData,
                customer: selectedCustomer,
                workspace: workspaceProfile ? {
                  name: workspaceProfile.name || '',
                  address: workspaceProfile.address || '',
                  phone: workspaceProfile.phone || '',
                  email: workspaceProfile.email || '',
                  website: workspaceProfile.website || '',
                  logoUrl: workspaceProfile.logoUrl || null,
                  taxPin: workspaceProfile.taxPin || null
                } : null
            },
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || user.email }
        });

        if (actionType === 'Receipt') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, { ...baseData, documentId: docRef.id });

            for (const item of cart) {
                const productRef = doc(firestore, 'products', item.productId);
                const product = products?.find(p => p.id === item.productId);
                
                if (product) {
                    const newStock = (product.currentStock || 0) - item.quantity;
                    batch.update(productRef, { currentStock: newStock, updatedAt: timestamp });

                    const movementRef = doc(collection(firestore, 'stock_movements'));
                    batch.set(movementRef, {
                        tenantId: tenant.id,
                        productId: item.productId,
                        type: "SALE",
                        quantity: -item.quantity,
                        previousStock: product.currentStock,
                        newStock: newStock,
                        reason: `Sale ${saleRef.id.slice(0, 5)}`,
                        referenceId: saleRef.id,
                        timestamp,
                        createdBy: { uid: user.uid, name: user.displayName }
                    });
                }
            }
        }

        await batch.commit();
        setSuccessType(effectiveDocType);
        setIsSuccessOpen(true);
        setCart([]);
        setPayments([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setApplyVat(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Process Failed`, description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        <div className="space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-muted/10 p-4 border-b">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Popover open={searchOpen} onOpenChange={(open) => {
                                if (open && !selectedCustomer) {
                                    toast({ variant: 'destructive', title: 'Wait!', description: 'Select a client before adding products.' });
                                    return;
                                }
                                setSearchOpen(open);
                            }}>
                                <PopoverTrigger asChild disabled={!selectedCustomer}>
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "w-full pl-10 h-12 justify-start font-normal bg-white",
                                            !selectedCustomer && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={!selectedCustomer}
                                    >
                                        {selectedCustomer ? 'Search product...' : 'Please select a client first...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Type Product Name..." />
                                        <CommandList>
                                            <CommandEmpty>No products found.</CommandEmpty>
                                            <CommandGroup heading="Inventory">
                                                {products?.filter(p => (p.currentStock || 0) > 0).map(p => (
                                                    <CommandItem key={p.id} onSelect={() => handleSelectProduct(p)} className="p-3">
                                                        <div className="flex justify-between w-full items-center">
                                                            <div>
                                                                <p className="font-bold uppercase text-xs">{p.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{p.category}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-black text-primary text-xs">Price: KES {p.buyingPrice.toLocaleString()}</p>
                                                                <Badge variant="secondary" className="text-[8px] h-4">{p.currentStock} {p.unit} available</Badge>
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
                        <Popover open={custSearchOpen} onOpenChange={setCustSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant={selectedCustomer ? "default" : "outline"} 
                                    className={cn(
                                        "h-12 px-6 font-black uppercase tracking-widest transition-all",
                                        selectedCustomer ? "shadow-lg scale-105" : "border-primary ring-2 ring-primary/20 animate-pulse"
                                    )}
                                >
                                    {selectedCustomer ? selectedCustomer.name : 'Select Client...'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                                <Command>
                                    <CommandInput placeholder="Search client..." />
                                    <CommandList>
                                        <CommandGroup heading="CRM Directory">
                                            {customers?.map(c => (
                                                <CommandItem key={c.id} onSelect={() => { setSelectedCustomer({id: c.id, name: c.name}); setCustSearchOpen(false); }}>{c.name}</CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="min-h-[500px]">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase">Product</TableHead>
                                    <TableHead className="w-24 text-center text-[10px] font-black uppercase">Qty</TableHead>
                                    <TableHead className="w-32 text-right text-[10px] font-black uppercase">Price</TableHead>
                                    <TableHead className="w-32 text-right text-[10px] font-black uppercase">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/5 group">
                                        <TableCell>
                                            <p className="font-bold text-sm uppercase tracking-tight">{item.name}</p>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-bold">{item.sellingPrice.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-black text-sm text-primary">
                                            {(item.total).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-4 w-4 text-destructive/50" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cart.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-[400px] text-center text-muted-foreground/30">
                                            <div className="space-y-2">
                                                <ShoppingCart className="h-12 w-12 mx-auto" />
                                                <p className="text-xs font-black uppercase tracking-widest">Basket Empty</p>
                                                {!selectedCustomer && <p className="text-[10px] font-bold text-primary animate-bounce">Select a client to start selling</p>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <RecentSales onViewReceipt={(s) => {}} />
        </div>

        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-black/5 flex flex-col h-full bg-white">
                <CardHeader className="bg-primary/5 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            Payment Details
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Switch checked={applyVat} onCheckedChange={setApplyVat} id="vat-mode" />
                            <Label htmlFor="vat-mode" className="text-[10px] font-black uppercase cursor-pointer">Apply 16% VAT</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-grow">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold opacity-60"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-xs font-bold opacity-60">Discount</span>
                            <Input 
                                type="number" 
                                value={discount} 
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                                className="h-8 w-24 text-right font-bold" 
                            />
                        </div>
                        {applyVat && (
                            <div className="flex justify-between text-xs font-bold text-primary">
                                <span>VAT (16%)</span>
                                <span>KES {vatAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t-2 border-black flex justify-between items-end">
                            <span className="text-sm font-black uppercase">Payable Total</span>
                            <span className="text-3xl font-black tracking-tighter">KES {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Payment Methods</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                            {(['Cash', 'M-Pesa', 'Bank', 'Card', 'Credit'] as const).map(m => (
                                <Button 
                                    key={m} 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                        "h-10 text-[10px] font-black uppercase tracking-tighter border-2",
                                        activePaymentMethod === m ? "border-primary bg-primary/5 text-primary" : "border-muted"
                                    )}
                                    onClick={() => setActivePaymentMethod(m)}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>

                        {activePaymentMethod && (
                            <div className="p-4 bg-muted/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase">Paying with {activePaymentMethod}</Label>
                                    <Button variant="ghost" size="icon" onClick={() => setActivePaymentMethod(null)} className="h-5 w-5"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                                <Input 
                                    type="number" 
                                    placeholder="Amount..." 
                                    value={currentPaymentAmount} 
                                    onChange={e => setCurrentPaymentAmount(e.target.value)}
                                    className="h-10 font-bold bg-white"
                                />
                                {['M-Pesa', 'Bank', 'Card'].includes(activePaymentMethod) && (
                                    <Input 
                                        placeholder="Reference / Transaction ID" 
                                        value={currentPaymentRef} 
                                        onChange={e => setCurrentPaymentRef(e.target.value)}
                                        className="h-10 font-mono text-[10px] bg-white"
                                    />
                                )}
                                <Button className="w-full h-10 font-black uppercase text-[10px]" onClick={handleAddPayment}>Apply Payment</Button>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[150px] overflow-auto">
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-muted/10 rounded-lg border border-black/5">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white p-1 rounded border shadow-sm">
                                            {p.method === 'Cash' && <Banknote className="h-3 w-3" />}
                                            {p.method === 'M-Pesa' && <Wallet className="h-3 w-3" />}
                                            {p.method === 'Bank' && <Landmark className="h-3 w-3" />}
                                            {p.method === 'Card' && <CreditCard className="h-3 w-3" />}
                                            {p.method === 'Credit' && <Landmark className="h-3 w-3 text-red-500" />}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">{p.method}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black">KES {p.amount.toLocaleString()}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPayments(payments.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 opacity-20 hover:opacity-100" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto space-y-4 pt-6 border-t">
                        <div className="flex justify-between items-center p-4 bg-black text-white rounded-2xl shadow-xl">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Remaining</p>
                                <p className="text-xl font-black">KES {remainingBalance.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Status</p>
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase px-2 h-5 border-none",
                                    remainingBalance <= 0 ? "bg-green-500" : (amountPaid > 0 ? "bg-orange-500" : "bg-red-500")
                                )}>
                                    {remainingBalance <= 0 ? 'Full Settlement' : (amountPaid > 0 ? 'Partial Payment' : 'Unpaid Credit')}
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={() => handleProcessPOSAction('Receipt')} 
                                className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95" 
                                disabled={isProcessing || cart.length === 0}
                            >
                                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalize & Pay'}
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    variant="outline"
                                    onClick={() => handleProcessPOSAction('Invoice')}
                                    disabled={isProcessing || cart.length === 0}
                                    className="h-12 font-black uppercase text-[10px] tracking-widest border-2"
                                >
                                    <FileText className="h-3 w-3 mr-2" /> Save as Invoice
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => handleProcessPOSAction('Quotation')}
                                    disabled={isProcessing || cart.length === 0}
                                    className="h-12 font-black uppercase text-[10px] tracking-widest border-2"
                                >
                                    <FilePlus2 className="h-3 w-3 mr-2" /> Save Quotation
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Configure Sale Item</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">{selectedProduct?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Cost Price</p>
                        <p className="text-lg font-black">KES {selectedProduct?.buyingPrice?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase opacity-40">Available</p>
                        <p className="text-lg font-black">{selectedProduct?.currentStock} {selectedProduct?.unit}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Quantity</Label>
                        <Input 
                            type="number" 
                            value={selectionQty} 
                            onChange={e => setSelectionQty(e.target.value)} 
                            className="h-12 text-lg font-black"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Selling Price (KES)</Label>
                        <Input 
                            type="number" 
                            value={selectionPrice} 
                            onChange={e => setSelectionPrice(e.target.value)} 
                            className="h-12 text-lg font-black border-primary ring-1 ring-primary/20"
                            placeholder="Enter Price"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Item Total</p>
                        <p className="text-2xl font-black text-primary">KES {((parseInt(selectionQty) || 0) * (parseFloat(selectionPrice) || 0)).toLocaleString()}</p>
                    </div>
                    <Button className="h-14 px-8 font-black uppercase tracking-widest shadow-xl" onClick={handleAddToCart}>Add to Cart</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={(open) => !open && setIsSuccessOpen(false)}>
        <DialogContent className="sm:max-w-md text-center p-10 border-none shadow-2xl">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="h-10 w-10 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                    {successType === 'Receipt' ? 'Sale Recorded' : `${successType} Saved`}
                </DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                    {successType === 'Receipt' 
                        ? 'Inventory updated & confirmation archived.' 
                        : 'Document archived. Inventory levels were not affected.'}
                </DialogDescription>
            </DialogHeader>
            <div className="pt-10 space-y-3">
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl" onClick={() => setIsSuccessOpen(false)}>Start New Session</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
