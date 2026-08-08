"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, PlusCircle, Loader2, Check, Download, Search, CreditCard, Wallet, Banknote, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, writeBatch, getDocs, limit } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type PaymentSplit = {
    method: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit';
    amount: number;
    reference?: string;
};

type CartItem = {
    id: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    type: 'retail' | 'wholesale';
};

export function PosClient() {
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string} | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [custSearchOpen, setCustSearchOpen] = useState(false);

  // Calculations
  const { subtotal, total, amountPaid, remainingBalance } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.total, 0);
    const tot = Math.max(0, sub - discount);
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    return {
        subtotal: sub,
        total: tot,
        amountPaid: paid,
        remainingBalance: tot - paid
    };
  }, [cart, discount, payments]);

  const handleAddToCart = (product: any) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
        setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
        setCart([...cart, {
            id: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.sellingPriceRetail,
            total: product.sellingPriceRetail,
            type: 'retail'
        }]);
    }
    setSearchOpen(false);
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

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !tenant || !user) return;
    setIsProcessing(true);

    try {
        const batch = writeBatch(firestore);
        const saleId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const saleData = {
            tenantId: tenant.id,
            date: timestamp,
            customerId: selectedCustomer?.id || 'walk-in',
            customerName: selectedCustomer?.name || 'Walk-in Client',
            items: cart,
            subtotal,
            discount,
            total,
            amountPaid,
            balance: remainingBalance,
            payments,
            status: remainingBalance <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Credit'),
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName }
        };

        // 1. Save Sale
        const saleRef = doc(collection(firestore, 'sales_transactions'));
        batch.set(saleRef, saleData);

        // 2. Update Inventory & Log Movements
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

        await batch.commit();
        setIsSuccessOpen(true);
        setCart([]);
        setPayments([]);
        setSelectedCustomer(null);
        setDiscount(0);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Sale Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const paymentIcons = {
    Cash: Banknote,
    'M-Pesa': Wallet,
    Bank: Landmark,
    Card: CreditCard,
    Credit: Landmark
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Left: Basket & Search */}
        <div className="space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-muted/10 p-4 border-b">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full pl-10 h-12 justify-start font-normal bg-white">
                                        Scan barcode or search product...
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Type SKU or Name..." />
                                        <CommandList>
                                            <CommandEmpty>No products found.</CommandEmpty>
                                            <CommandGroup heading="Inventory">
                                                {products?.filter(p => p.currentStock > 0).map(p => (
                                                    <CommandItem key={p.id} onSelect={() => handleAddToCart(p)} className="p-3">
                                                        <div className="flex justify-between w-full items-center">
                                                            <div>
                                                                <p className="font-bold uppercase text-xs">{p.name}</p>
                                                                <p className="text-[10px] font-mono text-muted-foreground">{p.sku}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-black text-primary">KES {p.sellingPriceRetail.toLocaleString()}</p>
                                                                <Badge variant="secondary" className="text-[8px] h-4">{p.currentStock} {p.unit} left</Badge>
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
                                <Button variant="secondary" className="h-12 px-6 font-bold">
                                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Client'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                                <Command>
                                    <CommandInput placeholder="Search client..." />
                                    <CommandList>
                                        <CommandItem onSelect={() => { setSelectedCustomer(null); setCustSearchOpen(false); }}>Walk-in Client</CommandItem>
                                        <CommandGroup heading="CRM Directory">
                                            {customers?.map(c => (
                                                <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setCustSearchOpen(false); }}>{c.name}</CommandItem>
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
                                            <p className="text-[10px] font-mono text-muted-foreground">{item.sku}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => {
                                                        const q = parseInt(e.target.value) || 1;
                                                        setCart(cart.map(i => i.id === item.id ? { ...i, quantity: q, total: q * i.unitPrice } : i));
                                                    }}
                                                    className="h-8 w-16 text-center font-bold"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Input 
                                                type="number" 
                                                value={item.unitPrice} 
                                                onChange={(e) => {
                                                    const p = parseFloat(e.target.value) || 0;
                                                    setCart(cart.map(i => i.id === item.id ? { ...i, unitPrice: p, total: p * i.quantity } : i));
                                                }}
                                                className="h-8 w-24 text-right font-bold ml-auto"
                                            />
                                        </TableCell>
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
                                        <TableCell colSpan={5} className="h-96 text-center text-muted-foreground/30">
                                            <div className="space-y-2">
                                                <ShoppingCart className="h-12 w-12 mx-auto" />
                                                <p className="text-xs font-black uppercase tracking-widest">Basket Empty</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right: Checkout & Settlement */}
        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-black/5 flex flex-col h-full bg-white">
                <CardHeader className="bg-primary/5 py-4 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <LANDMARK className="h-3.5 w-3.5" /> Settlement Mix
                    </CardTitle>
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
                        <div className="pt-3 border-t-2 border-black flex justify-between items-end">
                            <span className="text-sm font-black uppercase">Payable Total</span>
                            <span className="text-3xl font-black tracking-tighter">KES {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Payment Allocation</p>
                        
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
                                    <Label className="text-[10px] font-black uppercase">Allocating {activePaymentMethod}</Label>
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
                        
                        <Button 
                            onClick={handleFinalizeSale} 
                            className="w-full h-20 text-2xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95" 
                            disabled={isProcessing || cart.length === 0}
                        >
                            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Finalize Sale'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center p-10 border-none shadow-2xl">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="h-10 w-10 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Sale Recorded</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Transaction synced to cloud ledger</DialogDescription>
            </DialogHeader>
            <div className="pt-10 space-y-3">
                <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest shadow-sm border-2">
                    <Download className="mr-2 h-5 w-5" />
                    Print Receipt
                </Button>
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl" onClick={() => setIsSuccessOpen(false)}>Start New Sale</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LANDMARK(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="2" x2="22" y1="20" y2="20" />
        <line x1="18" x2="18" y1="14" y2="11" />
        <line x1="14" x2="14" y1="14" y2="11" />
        <line x1="10" x2="10" y1="14" y2="11" />
        <line x1="6" x2="6" y1="14" y2="11" />
        <path d="m2 7 10-5 10 5v4H2Z" />
      </svg>
    )
  }
