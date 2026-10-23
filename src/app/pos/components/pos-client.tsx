"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, Loader2, Check, Search, Wallet, Banknote, Landmark, CreditCard, FileText, FilePlus2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { DocumentType, Sale } from '@/types';
import { RecentSales } from './recent-sales';

const VAT_RATE = 0.16;

type PaymentSplit = {
    method: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit' | 'Till' | 'Paybill' | 'Cheque';
    amount: number;
    reference?: string;
};

type CartItem = {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    sellingPrice: number;
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

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectionQty, setSelectionQty] = useState<string>('1');
  const [selectionPrice, setSelectionPrice] = useState<string>('');

  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentSplit['method'] | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState<string>('');

  const productsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: products } = useCollection(productsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection(customersQuery);

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: workspaceProfile } = useDoc(companyRef);

  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawDocuments } = useCollection(docsQuery);

  const [searchOpen, setSearchOpen] = useState(false);
  const [custSearchOpen, setCustSearchOpen] = useState(false);

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

  const { subtotal, vatAmount, total, amountPaid, remainingBalance } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.total, 0);
    const discountedSub = Math.max(0, sub - discount);
    const vat = applyVat ? discountedSub * VAT_RATE : 0;
    const tot = discountedSub + vat;
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    
    return {
        subtotal: sub,
        vatAmount: vat,
        total: tot,
        amountPaid: paid,
        remainingBalance: tot - paid
    };
  }, [cart, discount, payments, applyVat]);

  const handleSelectProduct = (product: any) => {
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Identity Link Required', description: 'Please select a customer identity before adding hardware.' });
        return;
    }
    setSelectedProduct(product);
    setSelectionQty('1');
    setSelectionPrice(String(product.sellingPrice || 0)); 
    setSearchOpen(false);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(selectionQty) || 1;
    const price = parseFloat(selectionPrice) || 0;

    const existing = cart.find(i => i.productId === selectedProduct.id && i.sellingPrice === price);
    
    if (existing) {
        setCart(cart.map(i => i.productId === selectedProduct.id && i.sellingPrice === price 
            ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.sellingPrice } 
            : i));
    } else {
        setCart([...cart, {
            id: crypto.randomUUID(),
            productId: selectedProduct.id,
            name: selectedProduct.model || selectedProduct.name,
            quantity: qty,
            sellingPrice: price,
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
            invoiceNumber: docTitle, 
            items: cart.map(item => ({...item, type: 'asset'})),
            subtotal,
            vatAmount,
            discount,
            total,
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

        if (actionType === 'Receipt' || actionType === 'Invoice') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, { ...baseData, documentId: docRef.id });

            for (const p of payments) {
              const payRef = doc(collection(firestore, 'payments'));
              batch.set(payRef, {
                  tenantId: tenant.id,
                  customerId: selectedCustomer.id,
                  customerName: selectedCustomer.name,
                  amount: p.amount,
                  method: p.method,
                  type: 'Payment',
                  reference: p.reference || docTitle,
                  date: timestamp,
                  saleId: saleRef.id,
                  documentId: docRef.id,
                  createdAt: timestamp,
                  createdBy: { uid: user.uid, name: user.displayName || user.email }
              });
            }

            for (const item of cart) {
                const productRef = doc(firestore, 'assets', item.productId);
                const product = products?.find(p => p.id === item.productId);
                
                if (product) {
                    const newStock = (product.quantity || 0) - item.quantity;
                    batch.update(productRef, { quantity: newStock, updatedAt: timestamp });
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
        toast({ title: `Transaction Protocol Executed` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: `System Save Error`, description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 px-1 sm:px-0">
        
        <div className="space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-black/5 overflow-hidden bg-white rounded-2xl">
                <CardHeader className="bg-muted/10 p-4 border-b">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Popover open={searchOpen} onOpenChange={(open) => {
                                if (open && !selectedCustomer) {
                                    toast({ variant: 'destructive', title: 'Access Denied', description: 'Select a customer node before browsing hardware.' });
                                    return;
                                }
                                setSearchOpen(open);
                            }}>
                                <PopoverTrigger asChild disabled={!selectedCustomer}>
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "w-full pl-10 h-12 justify-start font-normal bg-white rounded-xl",
                                            !selectedCustomer && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={!selectedCustomer}
                                    >
                                        <span className="truncate">{selectedCustomer ? 'Scan or search hardware...' : 'Select account to begin...'}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[95vw] sm:w-[600px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Type Model or Serial Number..." />
                                        <CommandList>
                                            <CommandEmpty>No matching inventory in silo.</CommandEmpty>
                                            <CommandGroup heading="Hardware Matrix">
                                                {products?.filter(p => (p.quantity || 0) > 0).map(p => (
                                                    <CommandItem key={p.id} onSelect={() => handleSelectProduct(p)} className="p-3">
                                                        <div className="flex justify-between w-full items-center">
                                                            <div className="overflow-hidden">
                                                                <p className="font-bold uppercase text-xs truncate">{p.model}</p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">S/N: {p.serialNumber}</p>
                                                            </div>
                                                            <div className="text-right shrink-0 ml-4">
                                                                <p className="font-black text-primary text-xs">KES {p.sellingPrice?.toLocaleString()}</p>
                                                                <Badge variant="secondary" className="text-[8px] h-4 uppercase">{p.quantity} units</Badge>
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
                                        "h-12 px-6 font-black uppercase tracking-widest transition-all rounded-xl",
                                        selectedCustomer ? "shadow-lg bg-primary text-white" : "border-primary"
                                    )}
                                >
                                    <span className="truncate max-w-[150px]">{selectedCustomer ? selectedCustomer.name : 'Account Link'}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[90vw] sm:w-80 p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search accounts..." />
                                    <CommandList>
                                        <CommandGroup heading="Client Nodes">
                                            {customers?.map(c => (
                                                <CommandItem key={c.id} onSelect={() => { setSelectedCustomer({id: c.id, name: c.name}); setCustSearchOpen(false); }} className="p-3 cursor-pointer">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold uppercase text-xs">{c.name}</span>
                                                        <span className="text-[10px] opacity-40">{c.phone || c.email}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="min-h-[300px] sm:min-h-[500px] overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase">Hardware Item</TableHead>
                                    <TableHead className="w-16 sm:w-24 text-center text-[10px] font-black uppercase">Qty</TableHead>
                                    <TableHead className="w-24 sm:w-32 text-right text-[10px] font-black uppercase">Rate</TableHead>
                                    <TableHead className="w-24 sm:w-32 text-right text-[10px] font-black uppercase">Total</TableHead>
                                    <TableHead className="w-10 sm:w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/5 group border-b">
                                        <TableCell className="py-4">
                                            <p className="font-bold text-xs sm:text-sm uppercase tracking-tight">{item.name}</p>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-xs sm:text-sm">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-bold text-xs sm:text-sm">{item.sellingPrice.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-black text-xs sm:text-sm text-primary">
                                            {(item.total).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)} className="h-8 w-8 text-destructive/40 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cart.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-[300px] sm:h-[400px] text-center text-muted-foreground/30">
                                            <div className="space-y-4">
                                                <ShoppingCart className="h-12 w-12 mx-auto opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Hardware Basket Empty</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="hidden sm:block">
                <RecentSales onViewReceipt={() => {}} />
            </div>
        </div>

        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-black/5 flex flex-col h-full bg-white rounded-2xl sm:rounded-[2rem]">
                <CardHeader className="bg-primary/5 py-5 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            Settlement Ledger
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Switch checked={applyVat} onCheckedChange={setApplyVat} id="vat-mode-pos" className="scale-75" />
                            <Label htmlFor="vat-mode-pos" className="text-[9px] font-black uppercase cursor-pointer">Tax (16%)</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-grow">
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs font-bold opacity-60"><span>Basket Sum</span><span>KES {subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-xs font-bold opacity-60">Manual Discount</span>
                            <Input 
                                type="number" 
                                value={discount || ''} 
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                                className="h-9 w-24 text-right font-bold rounded-lg" 
                            />
                        </div>
                        {applyVat && (
                            <div className="flex justify-between text-xs font-black text-primary">
                                <span>VAT Component</span>
                                <span>KES {vatAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-4 border-t-2 border-black flex justify-between items-end">
                            <span className="text-sm font-black uppercase tracking-widest">NET PAYABLE</span>
                            <span className="text-2xl sm:text-3xl font-black tracking-tighter">KES {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <Separator className="opacity-10" />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Payment Split Matrix</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(['Cash', 'M-Pesa', 'Bank', 'Card'] as const).map(m => (
                                <Button 
                                    key={m} 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                        "h-10 text-[9px] font-black uppercase tracking-tight border-2 rounded-xl transition-all",
                                        activePaymentMethod === m ? "border-primary bg-primary/5 text-primary scale-[0.98]" : "border-muted"
                                    )}
                                    onClick={() => setActivePaymentMethod(m)}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>

                        {activePaymentMethod && (
                            <div className="p-4 bg-muted/30 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-primary/10 shadow-inner">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase text-primary">Entry: {activePaymentMethod}</Label>
                                    <Button variant="ghost" size="icon" onClick={() => setActivePaymentMethod(null)} className="h-6 w-6"><X className="h-3 w-3" /></Button>
                                </div>
                                <Input 
                                    type="number" 
                                    placeholder="Enter amount..." 
                                    value={currentPaymentAmount} 
                                    onChange={e => setCurrentPaymentAmount(e.target.value)}
                                    className="h-10 font-bold bg-white text-base rounded-xl"
                                    autoFocus
                                />
                                {['M-Pesa', 'Bank', 'Card'].includes(activePaymentMethod) && (
                                    <Input 
                                        placeholder="Reference / Transaction ID" 
                                        value={currentPaymentRef} 
                                        onChange={e => setCurrentPaymentRef(e.target.value)}
                                        className="h-10 font-mono text-[10px] bg-white rounded-xl uppercase"
                                    />
                                )}
                                <Button className="w-full h-10 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg" onClick={handleAddPayment}>Apply Settlement</Button>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2.5 bg-card rounded-xl border border-black/5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted p-1.5 rounded-lg">
                                            {p.method === 'Cash' && <Banknote className="h-3.5 w-3.5" />}
                                            {p.method === 'M-Pesa' && <Wallet className="h-3.5 w-3.5" />}
                                            {p.method === 'Bank' && <Landmark className="h-3.5 w-3.5" />}
                                            {p.method === 'Card' && <CreditCard className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase leading-none">{p.method}</span>
                                            {p.reference && <span className="text-[8px] font-mono opacity-40 uppercase truncate max-w-[80px] mt-1">{p.reference}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black">KES {p.amount.toLocaleString()}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/30 hover:text-destructive" onClick={() => setPayments(payments.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto space-y-4 pt-6 border-t border-black/5">
                        <div className="flex justify-between items-center p-4 bg-black text-white rounded-[1.25rem] shadow-xl">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">UNSETTLED</p>
                                <p className={cn("text-xl font-black tabular-nums", remainingBalance > 0 ? "text-red-400" : "text-green-400")}>KES {remainingBalance.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase px-2 h-5 border-none shadow-sm",
                                    remainingBalance <= 0 ? "bg-green-500" : (amountPaid > 0 ? "bg-orange-500" : "bg-red-600")
                                )}>
                                    {remainingBalance <= 0 ? 'Fully Paid' : (amountPaid > 0 ? 'Partial' : 'On Credit')}
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={() => handleProcessPOSAction('Receipt')} 
                                className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 rounded-2xl" 
                                disabled={isProcessing || cart.length === 0}
                            >
                                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Commit Transaction'}
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    variant="outline"
                                    onClick={() => handleProcessPOSAction('Invoice')}
                                    disabled={isProcessing || cart.length === 0}
                                    className="h-12 font-black uppercase text-[10px] tracking-widest border-2 rounded-xl"
                                >
                                    <FileText className="h-4 w-4 mr-2" /> Invoice
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => handleProcessPOSAction('Quotation')}
                                    disabled={isProcessing || cart.length === 0}
                                    className="h-12 font-black uppercase text-[10px] tracking-widest border-2 rounded-xl"
                                >
                                    <FilePlus2 className="h-4 w-4 mr-2" /> Quote
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* ITEM CONFIGURATION DIALOG */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md border-none shadow-2xl rounded-2xl sm:rounded-[2rem] bg-card p-6">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Configure Item</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground truncate">{selectedProduct?.model}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="p-4 sm:p-5 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center shadow-inner">
                    <div className="overflow-hidden">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">List Price</p>
                        <p className="text-lg font-black text-primary truncate">KES {selectedProduct?.sellingPrice?.toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Available</p>
                        <p className="text-lg font-black">{selectedProduct?.quantity} Units</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Quantity</Label>
                        <Input 
                            type="number" 
                            value={selectionQty} 
                            onChange={e => setSelectionQty(e.target.value)} 
                            className="h-12 sm:h-14 text-lg font-black rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Custom Rate</Label>
                        <Input 
                            type="number" 
                            value={selectionPrice} 
                            onChange={e => setSelectionPrice(e.target.value)} 
                            className="h-12 sm:h-14 text-lg font-black border-primary rounded-xl"
                            placeholder="Price"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t">
                    <div className="overflow-hidden">
                        <p className="text-[8px] sm:text-[9px] font-black uppercase opacity-40 mb-0.5">SUBTOTAL</p>
                        <p className="text-2xl sm:text-3xl font-black text-primary tracking-tighter truncate">KES {((parseInt(selectionQty) || 0) * (parseFloat(selectionPrice) || 0)).toLocaleString()}</p>
                    </div>
                    <Button className="h-12 sm:h-16 px-6 sm:px-10 font-black uppercase tracking-widest shadow-xl rounded-xl sm:rounded-2xl shrink-0" onClick={handleAddToCart}>Apply Item</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={(open) => !open && setIsSuccessOpen(false)}>
        <DialogContent className="w-[90vw] sm:max-w-md text-center p-8 sm:p-10 border-none shadow-2xl rounded-[2rem]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                    {successType === 'Receipt' ? 'Sale Finalized' : `${successType} Created`}
                </DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                    RECORDS ARCHIVED IN CLOUD
                </DialogDescription>
            </DialogHeader>
            <div className="pt-8 sm:pt-10 space-y-3">
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl rounded-xl" onClick={() => setIsSuccessOpen(false)}>Next Transaction</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
