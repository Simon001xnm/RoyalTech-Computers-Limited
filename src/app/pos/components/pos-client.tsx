"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import type { Asset, SaleItem, Sale, Customer, Document as AppDocument } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, PlusCircle, Loader2, Check, Download, Phone, Clock, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RecentSales } from './recent-sales';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { SaleService } from '@/services/sale-service';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import { initiateStkPush } from '../actions';

type Product = Asset & { productType: 'asset'; displayName: string; price?: number; };
type CartItem = SaleItem & { productType: 'asset' | 'accessory'; quantity: number; unitPrice: number; discount: number; };

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

  // M-Pesa Waiting States
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null);

  // Success Dialog & PDF Export State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<AppDocument | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // CLOUD QUERY
  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id), where('status', '==', 'Available'));
  }, [firestore, tenant?.id]);
  const { data: assets } = useCollection(assetsQuery);

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

  const availableProducts = useMemo<Product[]>(() => {
    if (!assets) return [];
    return assets.map(item => ({ 
        ...item, 
        productType: 'asset' as const, 
        displayName: `${item.model} (S/N: ${item.serialNumber})`, 
        price: item.purchasePrice 
    }));
  }, [assets]);

  const { subtotal, grandTotal, vatAmount, changeDue } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const vatAmount = applyVat ? subtotal * VAT_RATE : 0;
    const grandTotal = subtotal + vatAmount;
    const parsedAmountPaid = parseFloat(amountPaid) || grandTotal;
    return { subtotal, vatAmount, grandTotal, changeDue: Math.max(0, parsedAmountPaid - grandTotal) };
  }, [cart, amountPaid, applyVat]);

  // PAYMENT CONFIRMATION LISTENER
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
          toast({ title: 'Payment Confirmed!', description: 'Transaction completed successfully.' });
        } else if (data.status === 'Failed') {
          setIsWaitingForConfirmation(false);
          setPendingSaleId(null);
          setIsProcessing(false);
          toast({ 
            variant: 'destructive', 
            title: 'Payment Failed', 
            description: data.paymentError || 'Safaricom declined the transaction.' 
          });
        }
      }
    });

    const timeout = setTimeout(() => {
        if (isWaitingForConfirmation) {
            setIsWaitingForConfirmation(false);
            setPendingSaleId(null);
            setIsProcessing(false);
            toast({ variant: 'destructive', title: 'Payment Timeout', description: 'No confirmation received. Check M-Pesa manually.' });
        }
    }, 120000); // 2 minute timeout

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [pendingSaleId, isWaitingForConfirmation, firestore, toast]);

  const handleAddToCart = () => {
    if (!selectedProduct || !unitPrice) return;
    const price = parseFloat(unitPrice);
    setCart([...cart, {
      id: selectedProduct.id,
      name: selectedProduct.model,
      serialNumber: selectedProduct.serialNumber,
      price: price, unitPrice: price, quantity, discount: 0,
      type: 'asset', productType: 'asset'
    }]);
    setSelectedProduct(null); setUnitPrice(''); setQuantity(1);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer || !user || !tenant) return;
    setIsProcessing(true);
    let mpesaCheckoutId = referenceCode;

    if (paymentMethod === 'M-Pesa') {
        if (!customerPhone || customerPhone.length < 10) {
            toast({ variant: 'destructive', title: 'Phone Required', description: 'Enter a valid number.' });
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
        toast({ title: 'STK Push Initiated', description: 'Waiting for PIN entry...' });
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
            toast({ title: 'Sale Finalized' });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Sale Failed', description: e.message });
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
    <div className="space-y-6 md:space-y-8">
      <PageHeader title="Point of Sale" description="Process transactions instantly with cloud synchronization." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Basket</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-11 text-left font-normal">{selectedCustomer ? selectedCustomer.name : "Search clients..."}</Button></PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Client name..." /><CommandList><CommandEmpty>None found.</CommandEmpty><CommandGroup>{(customers || []).map(c => <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setCustomerPhone(c.phone || ''); setIsCustomerSearchOpen(false); }}>{c.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[2fr_80px_1fr_auto] gap-4 items-end bg-muted/30 p-4 rounded-xl">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black opacity-50">Select Product</Label>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full h-10 truncate text-left font-normal">{selectedProduct ? selectedProduct.displayName : "Select item..."}</Button></PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Model/SN..." /><CommandList><CommandGroup>{availableProducts.map(p => <CommandItem key={p.id} onSelect={() => { setSelectedProduct(p); setUnitPrice((p.price || 0).toString()); setSearchOpen(false); }}>{p.displayName}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-4 w-full">
                        <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-black opacity-50">Qty</Label>
                             <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="h-10" />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-black opacity-50">Price</Label>
                             <Input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="h-10" />
                        </div>
                    </div>
                    <Button onClick={handleAddToCart} disabled={!selectedProduct} className="h-10 w-full md:w-auto"><PlusCircle className="h-4 w-4 mr-2" /> Add to Basket</Button>
                </div>
                {cart.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="min-w-[150px]">Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id} className="hover:bg-muted/20">
                                        <TableCell>
                                            <p className="font-semibold text-sm">{item.name}</p>
                                            <p className="text-[10px] opacity-60">S/N: {item.serialNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-bold text-sm">KES {(item.unitPrice * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => setCart(cart.filter(c => c.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-12 border-2 border-dashed rounded-2xl text-center opacity-60">
                        <p className="text-sm uppercase tracking-widest">Basket Empty</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10 flex flex-col">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Payment Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 flex-grow">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black opacity-50">Method</Label>
                    <Select onValueChange={(v: any) => setPaymentMethod(v)} value={paymentMethod}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="M-Pesa">M-Pesa STK Push</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {paymentMethod === 'M-Pesa' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                         <Label className="text-[10px] uppercase font-black opacity-50 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> M-Pesa Number
                         </Label>
                         <Input 
                            placeholder="0712345678" 
                            value={customerPhone} 
                            onChange={e => setCustomerPhone(e.target.value)} 
                            className="h-11 font-bold tracking-widest border-primary/20 bg-primary/5" 
                         />
                         <p className="text-[9px] text-muted-foreground italic">Customer will receive a popup to enter their PIN.</p>
                    </div>
                )}

                {(paymentMethod === 'Bank' || paymentMethod === 'Till') && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] uppercase font-black opacity-50">Ref Code</Label>
                        <Input placeholder="Reference..." value={referenceCode} onChange={e => setReferenceCode(e.target.value)} className="h-10 shadow-sm" />
                    </div>
                )}

                <div className="flex items-center space-x-2 pt-2"><Switch id="vat-pos" checked={applyVat} onCheckedChange={setApplyVat} /><Label htmlFor="vat-pos" className="text-xs font-bold cursor-pointer">Apply 16% VAT</Label></div>
                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border mt-auto">
                    <div className="flex justify-between text-xl font-black">
                        <span>Total Due:</span>
                        <span className="text-primary">KES {grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pb-8">
                <Button onClick={handleFinalizeSale} className="w-full h-14 text-lg font-black shadow-xl active:scale-95 transition-all" disabled={isProcessing || isWaitingForConfirmation || !selectedCustomer || cart.length === 0}>
                    {isProcessing ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            {paymentMethod === 'M-Pesa' ? 'Initiating...' : 'Finalizing...'}
                        </div>
                    ) : (
                        paymentMethod === 'M-Pesa' ? 'Initiate M-Pesa' : 'Finalize Sale'
                    )}
                </Button>
            </CardFooter>
        </Card>
      </div>

      <RecentSales onViewReceipt={() => {}} />

      {/* WAITING FOR PAYMENT DIALOG */}
      <Dialog open={isWaitingForConfirmation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md text-center p-12">
            <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-primary" />
                </div>
            </div>
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Awaiting PIN...</DialogTitle>
                <DialogDescription className="text-base font-medium">
                    The STK Push has been sent to <strong>{customerPhone}</strong>.<br/>
                    Please ask the customer to enter their M-Pesa PIN.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-8 flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground animate-bounce">Listening for Safaricom Confirmation...</p>
                <Button variant="ghost" className="text-xs text-destructive mt-4" onClick={() => { setIsWaitingForConfirmation(false); setIsProcessing(false); }}>Cancel and Go Back</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={(open) => {
          if (!open) {
              setCart([]); setSelectedCustomer(null); setAmountPaid(''); setReferenceCode(''); setCustomerPhone(''); setLastGeneratedDoc(null);
          }
          setIsSuccessOpen(open);
      }}>
        <DialogContent className="sm:max-w-md text-center p-8 max-h-[90vh] overflow-y-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Sale Completed!</DialogTitle>
                <DialogDescription className="font-medium">The transaction has been recorded and inventory updated.</DialogDescription>
            </DialogHeader>
            <div className="pt-8 space-y-3">
                <Button variant="outline" className="w-full h-12 font-bold shadow-sm" onClick={handleDownloadReceipt} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download Receipt PDF
                </Button>
                <Button className="w-full h-12 font-black uppercase" onClick={() => {
                    setIsSuccessOpen(false);
                    setCart([]); setSelectedCustomer(null); setAmountPaid(''); setReferenceCode(''); setCustomerPhone('');
                }}>Process Next Sale</Button>
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
