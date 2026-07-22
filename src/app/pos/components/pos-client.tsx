
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import type { SaleItem, Sale, Customer, Document as AppDocument } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, PlusCircle, Loader2, Check, Download, Phone, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { SaleService } from '@/services/sale-service';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import { initiateStkPush } from '../actions';
import { Badge } from '@/components/ui/badge';

type Product = { 
  id: string; 
  displayName: string; 
  price: number; 
  serialNumber: string; 
  type: 'asset' | 'accessory' | 'custom';
  model?: string;
  description?: string;
};

type CartItem = SaleItem & { productType: 'asset' | 'accessory' | 'custom'; quantity: number; unitPrice: number; discount: number; };

const VAT_RATE = 0.16;

export function PosClient() {
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Till' | 'M-Pesa' | 'Bank' | 'Paybill'>('M-Pesa');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [applyVat, setApplyVat] = useState(false);

  // Quick Add Customer State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [isSavingCust, setIsSavingCust] = useState(false);

  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<AppDocument | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // CLOUD QUERIES
  const accessoriesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'accessories'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawAccessories } = useCollection(accessoriesQuery);

  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawAssets } = useCollection(assetsQuery);

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [customName, setCustomName] = useState('');

  const availableProducts = useMemo<Product[]>(() => {
    const list: Product[] = [];
    
    if (rawAssets) {
        rawAssets.filter(a => a.status === 'Available').forEach(asset => {
            const description = [
              asset.specifications?.ram,
              asset.specifications?.storage,
              asset.specifications?.processor
            ].filter(Boolean).join(' • ');

            list.push({
                id: asset.id,
                displayName: `ITEM: ${asset.model} (${asset.serialNumber})`,
                price: asset.leasePrice || asset.purchasePrice || 0,
                serialNumber: asset.serialNumber,
                type: 'asset',
                model: asset.model,
                description: description || undefined
            });
        });
    }

    if (rawAccessories) {
      rawAccessories.filter(a => a.status === 'Available').forEach(acc => list.push({
        id: acc.id,
        displayName: `ACC: ${acc.name} (${acc.serialNumber})`,
        price: acc.sellingPrice || 0,
        serialNumber: acc.serialNumber,
        type: 'accessory',
        model: acc.name
      }));
    }
    return list;
  }, [rawAccessories, rawAssets]);

  const { subtotal, grandTotal, vatAmount, changeDue } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const vatAmount = applyVat ? subtotal * VAT_RATE : 0;
    const grandTotal = subtotal + vatAmount;
    const parsedAmountPaid = parseFloat(amountPaid) || grandTotal;
    return { subtotal, vatAmount, grandTotal, changeDue: Math.max(0, parsedAmountPaid - grandTotal) };
  }, [cart, amountPaid, applyVat]);

  useEffect(() => {
    if (!pendingSaleId || !isWaitingForConfirmation) return;

    const unsubscribe = onSnapshot(doc(firestore, 'sales_transactions', pendingSaleId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Sale;
        if (data.status === 'Paid') {
          setIsWaitingForConfirmation(false);
          setPendingSaleId(null);
          setIsSuccessOpen(true);
          setIsProcessing(false);
          toast({ title: 'Payment Confirmed!' });
        } else if (data.status === 'Failed') {
          setIsWaitingForConfirmation(false);
          setPendingSaleId(null);
          setIsProcessing(false);
          toast({ variant: 'destructive', title: 'Payment Failed', description: data.paymentError });
        }
      }
    });

    const timeout = setTimeout(() => {
        if (isWaitingForConfirmation) {
            setIsWaitingForConfirmation(false);
            setPendingSaleId(null);
            setIsProcessing(false);
            toast({ variant: 'destructive', title: 'Payment Timeout' });
        }
    }, 120000); 

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [pendingSaleId, isWaitingForConfirmation, firestore, toast]);

  const handleAddToCart = () => {
    if (!selectedProduct && !customName) return;
    if (!unitPrice) return;
    
    const price = parseFloat(unitPrice);
    const newItem: CartItem = {
      id: selectedProduct?.id || `custom_${Date.now()}`,
      name: selectedProduct?.model || customName,
      description: selectedProduct?.description,
      serialNumber: selectedProduct?.serialNumber || 'N/A',
      price: price, 
      unitPrice: price, 
      quantity: selectedProduct?.type === 'asset' ? 1 : quantity, 
      discount: 0,
      type: selectedProduct?.type || 'custom', 
      productType: selectedProduct?.type || 'custom'
    };

    setCart([...cart, newItem]);
    setSelectedProduct(null); 
    setUnitPrice(''); 
    setQuantity(1);
    setCustomName('');
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustName || !tenant || !user) return;
    setIsSavingCust(true);
    try {
        const docRef = await addDoc(collection(firestore, 'customers'), {
            name: newCustName,
            phone: newCustPhone,
            tenantId: tenant.id,
            registrationDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });
        const newCust = { id: docRef.id, name: newCustName, phone: newCustPhone } as Customer;
        setSelectedCustomer(newCust);
        setCustomerPhone(newCustPhone);
        setIsQuickAddOpen(false);
        setNewCustName('');
        setNewCustPhone('');
        toast({ title: "Customer Registered" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Registration Failed' });
    } finally {
        setIsSavingCust(false);
    }
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer || !user || !tenant) return;
    setIsProcessing(true);
    let mpesaCheckoutId = referenceCode;

    if (paymentMethod === 'M-Pesa') {
        if (!customerPhone || customerPhone.length < 10) {
            toast({ variant: 'destructive', title: 'Phone Required' });
            setIsProcessing(false);
            return;
        }
        const mpesaResult = await initiateStkPush(customerPhone, grandTotal);
        if (!mpesaResult.success) {
            toast({ variant: 'destructive', title: 'M-Pesa Failed', description: mpesaResult.error });
            setIsProcessing(false);
            return;
        }
        mpesaCheckoutId = mpesaResult.checkoutRequestId || '';
    }

    try {
        const saleId = crypto.randomUUID();
        const saleDate = new Date().toISOString();
        const prefix = (tenant.name || 'DOC').slice(0, 3).toUpperCase();
        
        const workspaceMetadata = workspaceProfile ? {
            name: workspaceProfile.name || '', 
            address: workspaceProfile.address || '',
            phone: workspaceProfile.phone || '', 
            email: workspaceProfile.email || '',
            logoUrl: workspaceProfile.logoUrl || null, 
            primaryColor: workspaceProfile.primaryColor || null,
            secondaryColor: workspaceProfile.secondaryColor || null
        } : null;

        const saleData: Sale = {
            id: saleId, tenantId: tenant.id, date: saleDate, amount: grandTotal, subtotal, vat: vatAmount,
            amountPaid: parseFloat(amountPaid) || grandTotal, changeDue, paymentMethod, referenceCode: mpesaCheckoutId,
            items: cart.map(i => ({ ...i, price: i.unitPrice })), 
            customerName: selectedCustomer.name, 
            customerId: selectedCustomer.id, 
            customerPhone: customerPhone || selectedCustomer.phone,
            status: paymentMethod === 'M-Pesa' ? 'Pending' : 'Paid', createdAt: saleDate, 
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        const docData: AppDocument = {
            id: crypto.randomUUID(), tenantId: tenant.id, type: 'Receipt', 
            title: `Receipt #${prefix}-${saleId.slice(0, 5).toUpperCase()}`,
            generatedDate: saleDate, relatedTo: `Sale to ${selectedCustomer.name}`, saleId: saleId, 
            data: { 
              ...saleData, 
              customer: {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                phone: customerPhone || selectedCustomer.phone || '',
                email: selectedCustomer.email || '',
                address: selectedCustomer.address || ''
              },
              applyVat, 
              workspace: workspaceMetadata 
            }, 
            createdAt: saleDate, 
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        await SaleService.finalizeSale(firestore, saleData, docData);
        setLastGeneratedDoc(docData);

        if (paymentMethod === 'M-Pesa') {
            setPendingSaleId(saleId);
            setIsWaitingForConfirmation(true);
        } else {
            setIsSuccessOpen(true);
            setIsProcessing(false);
            setCart([]); setSelectedCustomer(null); setAmountPaid(''); setReferenceCode(''); setCustomerPhone('');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Cloud Sync Failed', description: e.message });
        setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!lastGeneratedDoc) return;
    setIsExporting(true);
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const originalScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    const element = document.getElementById('pos-receipt-target');
    if (!element) {
        window.scrollTo({ top: originalScrollY });
        setIsExporting(false);
        return;
    }
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 794, height: 1123, y: 0, scrollY: 0 });
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`${lastGeneratedDoc.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) { toast({ variant: 'destructive', title: 'Export Failed' }); } finally {
        setIsExporting(false);
        window.scrollTo({ top: originalScrollY });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
            <CardHeader className="bg-muted/10 py-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Basket
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsQuickAddOpen(true)} className="h-8 text-[10px] font-black uppercase tracking-widest border-2">
                        <UserPlus className="h-3 w-3 mr-1.5" /> Quick Register Client
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-11 text-left font-normal">{selectedCustomer ? selectedCustomer.name : "Select Client..."}</Button></PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search directory..." /><CommandList><CommandEmpty>No matching clients.</CommandEmpty><CommandGroup>{(customers || []).map(c => <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setCustomerPhone(c.phone || ''); setIsCustomerSearchOpen(false); }}>{c.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                    </Popover>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-black/5">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black opacity-50">Find Item / Accessory</Label>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-11 truncate text-left font-normal bg-white">
                              {selectedProduct ? selectedProduct.displayName : customName || "Scan serial or type manual..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Model or S/N..." 
                                value={customName}
                                onValueChange={(v) => setCustomName(v)}
                              />
                              <CommandList>
                                <CommandGroup heading="In Stock">
                                  {availableProducts.map(p => (
                                    <CommandItem key={p.id} onSelect={() => { setSelectedProduct(p); setUnitPrice(p.price.toString()); setSearchOpen(false); }}>
                                      {p.displayName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {customName && (
                                  <CommandGroup heading="Manual">
                                    <CommandItem onSelect={() => { setSelectedProduct(null); setSearchOpen(false); }}>
                                      Register "{customName}" Sale
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-black opacity-50">Qty</Label>
                             <Input 
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(parseInt(e.target.value) || 1)} 
                                className="h-11 bg-white" 
                                disabled={selectedProduct?.type === 'asset'}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-black opacity-50">Price</Label>
                             <Input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="h-11 font-black bg-white" />
                        </div>
                    </div>
                  </div>
                  <Button onClick={handleAddToCart} disabled={!selectedProduct && !customName} className="w-full h-11 font-black uppercase tracking-widest"><PlusCircle className="h-4 w-4 mr-2" /> Add to Sale</Button>
                </div>

                {cart.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="min-w-[150px] text-[10px] font-black uppercase">Item</TableHead>
                                    <TableHead className="text-center w-20 text-[10px] font-black uppercase">Qty</TableHead>
                                    <TableHead className="text-right w-32 text-[10px] font-black uppercase">Price</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map((item, idx) => (
                                    <TableRow key={item.id} className="hover:bg-muted/20">
                                        <TableCell>
                                            <p className="font-bold text-sm uppercase tracking-tight">{item.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.serialNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                          <Input 
                                            type="number" 
                                            value={item.unitPrice} 
                                            onChange={(e) => {
                                                const updated = [...cart];
                                                updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                updated[idx].price = updated[idx].unitPrice;
                                                setCart(updated);
                                            }}
                                            className="h-8 w-24 text-right text-xs font-bold"
                                          />
                                        </TableCell>
                                        <TableCell className="text-right font-black text-sm text-primary">KES {(item.unitPrice * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => setCart(cart.filter(c => c.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive/40 hover:text-destructive"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-20 border-2 border-dashed rounded-3xl text-center opacity-30">
                        <ShoppingCart className="h-10 w-10 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Basket Empty</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10 flex flex-col overflow-hidden">
            <CardHeader className="bg-primary/5 py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Payment Protocol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex-grow">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black opacity-50">Method</Label>
                    <Select onValueChange={(v: any) => setPaymentMethod(v)} value={paymentMethod}>
                        <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="M-Pesa">M-Pesa STK Push</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                            <SelectItem value="Paybill">Paybill</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {paymentMethod === 'M-Pesa' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                         <Label className="text-[10px] uppercase font-black opacity-50 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Customer Number
                         </Label>
                         <Input 
                            placeholder="07XXXXXXXX" 
                            value={customerPhone} 
                            onChange={e => setCustomerPhone(e.target.value)} 
                            className="h-11 font-black tracking-widest border-primary/20 bg-primary/5" 
                         />
                    </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="vat-pos" checked={applyVat} onCheckedChange={setApplyVat} />
                    <Label htmlFor="vat-pos" className="text-xs font-bold cursor-pointer">Apply 16% VAT</Label>
                </div>

                <div className="space-y-2 p-6 rounded-2xl bg-black text-white shadow-xl mt-auto">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Settlement</p>
                    <div className="text-3xl font-black tracking-tighter">KES {grandTotal.toLocaleString()}</div>
                </div>
            </CardContent>
            <CardFooter className="pb-8">
                <Button onClick={handleFinalizeSale} className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all" disabled={isProcessing || isWaitingForConfirmation || !selectedCustomer || cart.length === 0}>
                    {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Finalize Sale'}
                </Button>
            </CardFooter>
        </Card>
      </div>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Quick Register</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Add new client to CRM node</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Full Name</Label>
                    <Input value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="e.g. John Doe" className="h-11 font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Phone Number</Label>
                    <Input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="07XXXXXXXX" className="h-11 font-bold tracking-widest" />
                </div>
            </div>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsQuickAddOpen(false)} className="font-bold h-12">Cancel</Button>
                <Button onClick={handleQuickAddCustomer} disabled={isSavingCust || !newCustName} className="font-black uppercase tracking-widest h-12 px-8">
                    {isSavingCust ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Save and Select
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWaitingForConfirmation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md text-center p-12 border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Awaiting PIN</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">STK Push transmitted to {customerPhone}</DialogDescription>
            </DialogHeader>
            <div className="pt-10 flex flex-col gap-2">
                <div className="relative h-20 w-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <Button variant="ghost" className="text-xs text-destructive mt-8 font-black uppercase tracking-widest" onClick={() => { setIsWaitingForConfirmation(false); setIsProcessing(false); }}>Abort Transaction</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={(open) => {
          if (!open) {
              setCart([]); setSelectedCustomer(null); setAmountPaid(''); setReferenceCode(''); setCustomerPhone(''); setLastGeneratedDoc(null);
          }
          setIsSuccessOpen(open);
      }}>
        <DialogContent className="sm:max-w-md text-center p-10 border-none shadow-2xl">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="h-10 w-10 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Transaction Success</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Receipt encrypted and archived</DialogDescription>
            </DialogHeader>
            <div className="pt-10 space-y-3">
                <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest shadow-sm border-2" onClick={handleDownloadReceipt} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                    Download A4 Receipt
                </Button>
                <Button className="w-full h-14 font-black uppercase tracking-widest shadow-xl" onClick={() => setIsSuccessOpen(false)}>Start New Sale</Button>
            </div>
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <div id="pos-receipt-target" className="bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                    {lastGeneratedDoc && <ReceiptPdf document={lastGeneratedDoc} />}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
