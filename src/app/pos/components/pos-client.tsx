"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, Loader2, Check, Search, Wallet, Banknote, Landmark, CreditCard, FileText, FilePlus2, X, Barcode, Zap, Package, Plus, ArrowDown } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import type { DocumentType, Sale } from '@/types';
import { RecentSales } from './recent-sales';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    buyingPrice: number;
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

  const [localSearch, setLocalSearch] = useState("");

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

  const [custSearchOpen, setCustSearchOpen] = useState(false);

  useEffect(() => {
      const handleGlobalScan = (e: any) => {
          if (!selectedCustomer) {
              toast({ variant: 'destructive', title: "Identity Missing", description: "Link an account node first." });
              return;
          }
          const code = e.detail;
          const found = products?.find(p => p.barcode === code || p.sku === code || p.serialNumber === code);
          if (found) handleAutoAdd(found);
          else toast({ variant: 'destructive', title: "Entry Failed", description: `Hardware not found: ${code}` });
      };
      window.addEventListener('erp-barcode-scan', handleGlobalScan);
      return () => window.removeEventListener('erp-barcode-scan', handleGlobalScan);
  }, [products, selectedCustomer]);

  useEffect(() => {
    if (!selectedCustomer?.id || !tenant) { setCustomerBalance(0); return; }
    const fetchBalance = async () => {
      try {
        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(salesRef, where('tenantId', '==', tenant.id), where('customerId', '==', selectedCustomer.id));
        const snap = await getDocs(q);
        const totalBal = snap.docs.reduce((acc, d) => acc + (d.data().balance || 0), 0);
        setCustomerBalance(totalBal);
      } catch (e) {}
    };
    fetchBalance();
  }, [selectedCustomer?.id, tenant, firestore]);

  const { subtotal, vatAmount, total, amountPaid, remainingBalance } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.total, 0);
    const discountedSub = Math.max(0, sub - discount);
    const vat = applyVat ? discountedSub * VAT_RATE : 0;
    const tot = discountedSub + vat;
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    return { subtotal: sub, vatAmount: vat, total: tot, amountPaid: paid, remainingBalance: tot - paid };
  }, [cart, discount, payments, applyVat]);

  const filteredCatalog = useMemo(() => {
      if (!products) return [];
      const available = products.filter(p => (p.quantity || 0) > 0);
      if (!localSearch.trim()) return available;
      const searchLower = localSearch.toLowerCase();
      return available.filter(p => 
        (p.model || '').toLowerCase().includes(searchLower) ||
        (p.sku || '').toLowerCase().includes(searchLower) ||
        (p.serialNumber || '').toLowerCase().includes(searchLower)
      );
  }, [products, localSearch]);

  const handleSelectProduct = (product: any) => {
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Identity Link Required', description: 'Select an account node first.' });
        return;
    }
    setSelectedProduct(product);
    setSelectionQty('1');
    setSelectionPrice(String(product.sellingPrice || 0)); 
  };

  const handleAutoAdd = (product: any) => {
      const existing = cart.find(i => i.productId === product.id && i.sellingPrice === product.sellingPrice);
      if (existing) {
          setCart(cart.map(i => i.productId === product.id && i.sellingPrice === product.sellingPrice ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.sellingPrice } : i));
      } else {
          setCart([...cart, { id: crypto.randomUUID(), productId: product.id, name: product.model || product.name, quantity: 1, sellingPrice: product.sellingPrice || 0, total: product.sellingPrice || 0, buyingPrice: product.purchasePrice || 0 }]);
      }
      toast({ title: "Hardware Added", description: `1x ${product.model} added to basket.` });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(selectionQty) || 1;
    const price = parseFloat(selectionPrice) || 0;
    const existing = cart.find(i => i.productId === selectedProduct.id && i.sellingPrice === price);
    if (existing) {
        setCart(cart.map(i => i.productId === selectedProduct.id && i.sellingPrice === price ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.sellingPrice } : i));
    } else {
        setCart([...cart, { id: crypto.randomUUID(), productId: selectedProduct.id, name: selectedProduct.model || selectedProduct.name, quantity: qty, sellingPrice: price, total: qty * price, buyingPrice: selectedProduct.purchasePrice || 0 }]);
    }
    setSelectedProduct(null);
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
        const baseData = { tenantId: tenant.id, date: timestamp, customerId: selectedCustomer.id, customerName: selectedCustomer.name, invoiceNumber: docTitle, items: cart.map(item => ({...item, type: 'asset'})), subtotal, vatAmount, discount, total, amountPaid, balance: remainingBalance, previousBalance: customerBalance, payments, applyVat, status: saleStatus, paymentMethod: payments.length > 1 ? 'Split' : (payments[0]?.method || 'Cash'), createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' } };
        const docRef = doc(collection(firestore, 'documents'));
        batch.set(docRef, { tenantId: tenant.id, type: effectiveDocType, title: docTitle, generatedDate: timestamp, relatedTo: selectedCustomer.name, data: { ...baseData, customer: selectedCustomer, workspace: workspaceProfile ? { name: workspaceProfile.name || '', address: workspaceProfile.address || '', phone: workspaceProfile.phone || '', email: workspaceProfile.email || '', website: workspaceProfile.website || '', logoUrl: workspaceProfile.logoUrl || null, taxPin: workspaceProfile.taxPin || null } : null }, createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' } });
        if (actionType === 'Receipt' || actionType === 'Invoice') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, { ...baseData, documentId: docRef.id });
            for (const p of payments) {
              const payRef = doc(collection(firestore, 'payments'));
              batch.set(payRef, { tenantId: tenant.id, customerId: selectedCustomer.id, customerName: selectedCustomer.name, amount: p.amount, method: p.method, type: 'Payment', reference: p.reference || docTitle, date: timestamp, saleId: saleRef.id, documentId: docRef.id, createdAt: timestamp, createdBy: { uid: user.uid, name: user.displayName || 'User' } });
            }
            for (const item of cart) {
                const productRef = doc(firestore, 'assets', item.productId);
                const product = products?.find(p => p.id === item.productId);
                if (product) batch.update(productRef, { quantity: (product.quantity || 0) - item.quantity, updatedAt: timestamp });
            }
        }
        await batch.commit();
        setSuccessType(effectiveDocType); setIsSuccessOpen(true); setCart([]); setPayments([]); setSelectedCustomer(null); setDiscount(0); setApplyVat(false);
        toast({ title: `Transaction Protocol Executed` });
    } catch (e: any) { toast({ variant: 'destructive', title: `System Save Error` }); } finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-2 sm:space-y-6 overflow-x-hidden pb-10 px-1 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-2 sm:gap-8">
        <div className="space-y-2 sm:space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-black/5 overflow-hidden bg-white rounded-xl sm:rounded-[2rem]">
                <CardHeader className="bg-muted/10 p-3 sm:p-5 border-b">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Badge variant="outline" className="h-7 px-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-2 shrink-0">
                                <Zap className="h-3 w-3 mr-1 text-primary" /> Live Node
                            </Badge>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] font-black uppercase truncate text-primary">{selectedCustomer ? selectedCustomer.name : 'NO CLIENT LINKED'}</span>
                                {selectedCustomer && <p className="text-[7px] font-bold opacity-40 uppercase">Account Linked</p>}
                            </div>
                        </div>
                        <Popover open={custSearchOpen} onOpenChange={setCustSearchOpen}>
                            <PopoverTrigger asChild><Button variant={selectedCustomer ? "default" : "outline"} className={cn("h-9 px-4 font-black uppercase text-[8px] sm:text-[10px] tracking-widest rounded-xl transition-all", selectedCustomer ? "bg-primary text-white" : "border-primary")}>Link Account</Button></PopoverTrigger>
                            <PopoverContent className="w-[90vw] sm:w-80 p-0" align="end"><Command><CommandInput placeholder="Find identity..." /><CommandList><CommandGroup heading="Active Nodes">{customers?.map(c => (<CommandItem key={c.id} onSelect={() => { setSelectedCustomer({id: c.id, name: c.name}); setCustSearchOpen(false); }} className="p-3 cursor-pointer"><div className="flex flex-col"><span className="font-bold uppercase text-xs">{c.name}</span></div></CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent className="p-0 space-y-0">
                    <div className="p-3 sm:p-5 border-b bg-muted/5 sticky top-0 z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                            <Input 
                                placeholder="Hardware Inventory Search..." 
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                className="pl-10 h-10 sm:h-12 bg-white border-2 border-primary/10 font-bold rounded-xl text-sm shadow-sm"
                                disabled={!selectedCustomer}
                            />
                        </div>
                    </div>
                    <ScrollArea className="h-[250px] sm:h-[400px] w-full p-3 sm:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {filteredCatalog.map(p => (
                                <button key={p.id} onClick={() => handleSelectProduct(p)} className="flex flex-col items-start p-2 bg-white rounded-lg border border-black/5 shadow-sm hover:ring-2 hover:ring-primary/20 transition-all text-left group overflow-hidden relative">
                                    <div className="absolute top-1 right-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /></div>
                                    <p className="text-[9px] font-black uppercase truncate w-full mb-1">{p.model}</p>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[10px] font-black text-primary">KES {p.sellingPrice?.toLocaleString()}</span>
                                        <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                            {filteredCatalog.length === 0 && <div className="col-span-full h-32 flex items-center justify-center opacity-20 uppercase font-black text-[9px] tracking-[0.3em]">Silo Empty</div>}
                        </div>
                    </ScrollArea>
                    <div className="border-t">
                        <div className="min-h-[150px] sm:min-h-[250px] overflow-x-auto no-scrollbar">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[8px] font-black uppercase whitespace-nowrap px-3 py-4">Hardware</TableHead><TableHead className="w-10 text-center text-[8px] font-black uppercase px-1 py-4">Qty</TableHead><TableHead className="w-16 text-right text-[8px] font-black uppercase px-1 py-4">Rate</TableHead><TableHead className="w-20 text-right text-[8px] font-black uppercase px-3 py-4">Net</TableHead><TableHead className="w-8 py-4"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {cart.map((item) => (
                                        <TableRow key={item.id} className="border-b h-12 hover:bg-muted/5 transition-colors"><TableCell className="px-3"><p className="font-bold text-[10px] uppercase truncate max-w-[120px] sm:max-w-none">{item.name}</p></TableCell><TableCell className="text-center font-bold text-[10px] px-1">{item.quantity}</TableCell><TableCell className="text-right font-bold text-[10px] px-1">{item.sellingPrice.toLocaleString()}</TableCell><TableCell className="text-right font-black text-[10px] text-primary px-3">{(item.total).toLocaleString()}</TableCell><TableCell className="text-right pr-2"><button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-destructive/30 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell></TableRow>
                                    ))}
                                    {cart.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center opacity-10"><ShoppingCart className="h-8 w-8 mx-auto mb-2" /><p className="text-[8px] font-black uppercase tracking-[0.2em]">Basket Empty</p></TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="hidden sm:block"><RecentSales onViewReceipt={() => {}} /></div>
        </div>
        <div className="space-y-2 sm:space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-black/5 flex flex-col h-fit bg-white rounded-xl sm:rounded-[2rem]">
                <CardHeader className="bg-primary/5 py-4 px-4 sm:px-6 border-b"><div className="flex items-center justify-between"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Summary</CardTitle><div className="flex items-center gap-2"><Switch checked={applyVat} onCheckedChange={setApplyVat} id="vat-mode-main" className="scale-75" /><Label htmlFor="vat-mode-main" className="text-[8px] font-black uppercase cursor-pointer">16% VAT</Label></div></div></CardHeader>
                <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-tighter"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center gap-4"><span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Discount</span><Input type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-right font-black rounded-lg text-xs" placeholder="0.00" /></div>
                        {applyVat && <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-tighter"><span>VAT Component</span><span>KES {vatAmount.toLocaleString()}</span></div>}
                        <div className="pt-4 border-t border-black/5 flex justify-between items-end"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Net Due</span><span className="text-2xl sm:text-4xl font-black tracking-tighter">KES {total.toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center opacity-60">Payment Matrix</p>
                        <div className="grid grid-cols-2 gap-1.5">{(['Cash', 'M-Pesa', 'Bank', 'Card'] as const).map(m => (<Button key={m} variant={activePaymentMethod === m ? 'default' : 'outline'} size="sm" className="h-10 text-[9px] font-black uppercase rounded-xl border-2" onClick={() => setActivePaymentMethod(m)}>{m}</Button>))}</div>
                        {activePaymentMethod && (<div className="p-3 bg-muted/30 rounded-2xl space-y-3 border-2 border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner"><div className="flex justify-between items-center"><Label className="text-[9px] font-black uppercase">{activePaymentMethod} Detail</Label><button onClick={() => setActivePaymentMethod(null)}><X className="h-4 w-4 opacity-30" /></button></div><Input type="number" placeholder="Amount" value={currentPaymentAmount} onChange={e => setCurrentPaymentAmount(e.target.value)} className="h-10 font-black bg-white text-sm rounded-xl" autoFocus />{['M-Pesa', 'Bank', 'Card'].includes(activePaymentMethod) && <Input placeholder="Ref Code" value={currentPaymentRef} onChange={e => setCurrentPaymentRef(e.target.value)} className="h-9 font-mono text-[9px] bg-white rounded-xl uppercase" />}<Button className="w-full h-10 font-black uppercase text-[10px] tracking-widest shadow-md rounded-xl" onClick={handleAddPayment}>Allocate Flow</Button></div>)}
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar">{payments.map((p, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-card rounded-xl border border-black/5 shadow-sm group hover:ring-2 hover:ring-primary/5 transition-all"><div className="flex flex-col"><span className="text-[9px] font-black uppercase">{p.method}</span>{p.reference && <span className="text-[7px] opacity-40 font-mono uppercase truncate max-w-[100px]">{p.reference}</span>}</div><div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary">KES {p.amount.toLocaleString()}</span><button onClick={() => setPayments(payments.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive/30 hover:text-destructive transition-colors" /></button></div></div>))}</div>
                    </div>
                    <div className="pt-4 mt-auto border-t border-black/5 space-y-2.5">
                        <div className="flex justify-between items-center p-3 bg-black text-white rounded-2xl shadow-xl"><div><p className="text-[7px] font-black uppercase opacity-40 mb-0.5 tracking-widest">Unsettled</p><p className={cn("text-lg font-black tabular-nums tracking-tighter", remainingBalance > 0 ? "text-red-400" : "text-green-400")}>KES {remainingBalance.toLocaleString()}</p></div><Badge className={cn("text-[8px] font-black uppercase h-5 border-none", remainingBalance <= 0 ? "bg-green-500" : "bg-red-600")}>{remainingBalance <= 0 ? 'Settled' : 'Credit'}</Badge></div>
                        <Button onClick={() => handleProcessPOSAction('Receipt')} className="w-full h-14 sm:h-16 text-base font-black uppercase tracking-widest shadow-2xl rounded-2xl active:scale-95 transition-all" disabled={isProcessing || cart.length === 0}>Finalize Sale</Button>
                        <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => handleProcessPOSAction('Invoice')} disabled={isProcessing || cart.length === 0} className="h-10 font-black uppercase text-[9px] border-2 rounded-xl active:scale-95"><FileText className="h-3.5 w-3.5 mr-1.5" /> Invoice</Button><Button variant="outline" onClick={() => handleProcessPOSAction('Quotation')} disabled={isProcessing || cart.length === 0} className="h-10 font-black uppercase text-[9px] border-2 rounded-xl active:scale-95"><FilePlus2 className="h-3.5 w-3.5 mr-1.5" /> Quote</Button></div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 border-none shadow-2xl rounded-2xl sm:rounded-[2rem] bg-card">
            <DialogHeader><DialogTitle className="text-lg font-black uppercase tracking-tight truncate">{selectedProduct?.model}</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Quantity</Label><Input type="number" value={selectionQty} onChange={e => setSelectionQty(e.target.value)} className="h-12 text-lg font-black rounded-xl" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60 text-primary">Rate</Label><Input type="number" value={selectionPrice} onChange={e => setSelectionPrice(e.target.value)} className="h-12 text-lg font-black border-2 border-primary/20 rounded-xl" /></div>
                </div>
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl rounded-2xl active:scale-95 transition-all" onClick={handleAddToCart}>Add to Cart</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="w-[90vw] sm:max-w-md text-center p-10 rounded-[2.5rem] border-none shadow-2xl">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Check className="h-10 w-10 text-green-600" /></div>
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Success</DialogTitle><DialogDescription className="text-[10px] font-bold uppercase mt-2 tracking-[0.2em] opacity-40">TRANSACTION SECURED</DialogDescription></DialogHeader>
            <div className="pt-8"><Button className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl bg-black text-white" onClick={() => setIsSuccessOpen(false)}>Next Sale</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}