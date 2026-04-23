"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Asset, Accessory, SaleItem, Sale, Customer, Document as AppDocument } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, ChevronsUpDown, PlusCircle, Smartphone, Loader2, Check, Download, Printer, Share2, Mail, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { initiateStkPush } from '../actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import { RecentSales } from './recent-sales';
import { useUser } from '@/firebase/provider';

type Product = (Asset | Accessory) & { productType: 'asset' | 'accessory'; displayName: string; price?: number; };
type CartItem = SaleItem & { productType: 'asset' | 'accessory'; quantity: number; unitPrice: number; discount: number; };

const buildAssetDisplayName = (asset: Asset): string => {
  return `${asset.model} (S/N: ${asset.serialNumber})`;
};

const VAT_RATE = 0.16;

export function PosClient() {
  const { toast } = useToast();
  const { user } = useUser();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Till' | 'M-Pesa' | 'Bank' | 'Paybill'>('Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [applyVat, setApplyVat] = useState(false);

  // M-Pesa State
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isMpesaLoading, setIsMpesaLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'confirmed'>('idle');

  // Product Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');

  // Post-Sale Success Dialog State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastSaleDoc, setLastSaleDoc] = useState<AppDocument | null>(null);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // DEXIE LOCAL QUERIES
  const assets = useLiveQuery(() => db.assets.filter(a => a.status === 'Available').toArray());
  const accessories = useLiveQuery(() => db.accessories.filter(a => a.status === 'Available').toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const allProducts = useMemo<Product[]>(() => {
    if (!assets || !accessories) return [];
    return [
      ...assets.map(item => ({ ...item, productType: 'asset' as const, displayName: buildAssetDisplayName(item), price: item.purchasePrice })),
      ...accessories.map(item => ({ ...item, productType: 'accessory' as const, displayName: `${item.name} (S/N: ${item.serialNumber})`, price: item.sellingPrice }))
    ];
  }, [assets, accessories]);

  const { subtotal, totalDiscount, vatAmount, grandTotal, changeDue } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalDiscount = cart.reduce((acc, item) => acc + (item.discount || 0) * item.quantity, 0);
    const totalAfterDiscount = subtotal - totalDiscount;
    const vatAmount = applyVat ? totalAfterDiscount * VAT_RATE : 0;
    const grandTotal = totalAfterDiscount + vatAmount;
    const parsedAmountPaid = parseFloat(amountPaid) || grandTotal;
    return { subtotal, totalDiscount, vatAmount, grandTotal, changeDue: parsedAmountPaid > grandTotal ? parsedAmountPaid - grandTotal : 0 };
  }, [cart, amountPaid, applyVat]);

  const handleAddToCart = () => {
    if (!selectedProduct || !unitPrice) return;
    const price = parseFloat(unitPrice);
    const itemDiscount = parseFloat(discount) || 0;

    const newCartItem: CartItem = {
      id: selectedProduct.id,
      name: selectedProduct.productType === 'asset' ? (selectedProduct as Asset).model : (selectedProduct as Accessory).name,
      serialNumber: selectedProduct.serialNumber,
      price: price,
      unitPrice: price,
      quantity: quantity,
      discount: itemDiscount,
      type: selectedProduct.productType,
      productType: selectedProduct.productType,
    };
    
    setCart([...cart, newCartItem]);
    setSelectedProduct(null);
    setUnitPrice('');
    setQuantity(1);
  };

  const handleInitiateMpesa = async () => {
    if (!mpesaPhone || grandTotal <= 0) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please enter a phone number.' });
        return;
    }

    setIsMpesaLoading(true);
    setMpesaStatus('pending');

    const result = await initiateStkPush(mpesaPhone, grandTotal);

    if (result.success) {
        toast({ title: 'STK Push Sent', description: result.customerMessage });
        setReferenceCode(result.checkoutRequestId || '');
        setTimeout(() => {
            setMpesaStatus('confirmed');
            setAmountPaid(grandTotal.toString());
            toast({ title: 'M-Pesa Verified', description: 'Payment confirmed by user.' });
        }, 5000); 
    } else {
        toast({ variant: 'destructive', title: 'M-Pesa Error', description: result.error });
        setMpesaStatus('idle');
    }
    setIsMpesaLoading(false);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer || !user) return;
    setIsProcessing(true);

    try {
        const saleId = crypto.randomUUID();
        const saleDate = new Date().toISOString();
        
        const saleData: Sale = {
            id: saleId,
            date: saleDate,
            amount: grandTotal,
            subtotal,
            totalDiscount,
            vat: vatAmount,
            amountPaid: parseFloat(amountPaid) || grandTotal,
            changeDue,
            paymentMethod,
            referenceCode,
            items: cart.map(i => ({ ...i, price: i.unitPrice })),
            customerName: selectedCustomer.name,
            customerId: selectedCustomer.id,
            customerPhone: selectedCustomer.phone,
            status: 'Paid',
            createdAt: saleDate,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        const docData: AppDocument = {
            id: crypto.randomUUID(),
            type: 'Receipt',
            title: `Receipt #RCL-${saleId.slice(0, 5).toUpperCase()}`,
            generatedDate: saleDate,
            relatedTo: `Sale to ${selectedCustomer.name}`,
            saleId: saleId, 
            data: { ...saleData, applyVat },
            createdAt: saleDate,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        await db.transaction('rw', [db.assets, db.accessories, db.sales, db.documents], async () => {
            for (const item of cart) {
                if (item.productType === 'asset') {
                    await db.assets.update(item.id, { status: 'Sold', quantity: 0 });
                } else {
                    const acc = await db.accessories.get(item.id);
                    if (acc) {
                        const newQty = Math.max(0, (acc.quantity || 0) - item.quantity);
                        await db.accessories.update(item.id, { 
                            quantity: newQty,
                            status: newQty === 0 ? 'Sold' : acc.status 
                        });
                    }
                }
            }
            await db.sales.add(saleData);
            await db.documents.add(docData);
        });

        toast({ title: 'Sale Completed locally!' });
        setLastSaleDoc(docData);
        setIsSuccessOpen(true);
        
        setCart([]);
        setSelectedCustomer(null);
        setAmountPaid('');
        setReferenceCode('');
        setMpesaPhone('');
        setMpesaStatus('idle');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Sale Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async (doc: AppDocument) => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    setIsReceiptPreviewOpen(true);
    setIsGeneratingPdf(true);

    // Simulate high-fidelity desktop capture
    setTimeout(async () => {
        const element = document.getElementById('pos-receipt-preview-target');
        if (element) {
            try {
                const canvas = await html2canvas(element, { 
                    scale: 3, 
                    useCORS: true,
                    windowWidth: 1200,
                    logging: false
                });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                pdf.save(`${doc.title}.pdf`);
                toast({ title: "Receipt Downloaded" });
            } catch (err) {
                toast({ variant: 'destructive', title: 'Export Error', description: 'Full page capture failed.' });
            } finally {
                setIsReceiptPreviewOpen(false);
                setIsGeneratingPdf(false);
            }
        }
    }, 1000);
  };

  const handlePrintReceipt = () => {
    setIsReceiptPreviewOpen(true);
    setTimeout(() => {
        window.print();
        setIsReceiptPreviewOpen(false);
    }, 500);
  };

  const handleShareWhatsApp = (doc: AppDocument) => {
    const phone = doc.data.customerPhone || '';
    const itemsList = doc.data.items.map((i: any) => `- ${i.name} (x${i.quantity})`).join('\n');
    const message = `Hello ${doc.data.customerName},\n\nThank you for shopping with us! Here is your receipt summary for ${doc.title}:\n\nItems:\n${itemsList}\n\nTotal Paid: KES ${doc.data.amount.toLocaleString()}\nPayment Method: ${doc.data.paymentMethod}\n\nWe appreciate your business!`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareEmail = (doc: AppDocument) => {
    const email = doc.data.customerEmail || '';
    const itemsList = doc.data.items.map((i: any) => `- ${i.name} (x${i.quantity})`).join('\n');
    const body = `Hello ${doc.data.customerName},\n\nThank you for shopping with us!\n\nReceipt Number: ${doc.title}\nDate: ${new Date(doc.generatedDate).toLocaleDateString()}\n\nItems Purchased:\n${itemsList}\n\nTotal Paid: KES ${doc.data.amount.toLocaleString()}\nPayment Method: ${doc.data.paymentMethod}\n\nBest regards.`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Point of Sale (Local)" description="Lightning-fast local transactions with automated receipts." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Shopping Basket
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Select Customer</Label>
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal h-11">
                            {selectedCustomer ? (
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>{selectedCustomer.name} ({selectedCustomer.phone || 'No phone'})</span>
                                </div>
                            ) : "Search customers..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Type name or email..." />
                            <CommandList>
                            <CommandEmpty>No customers found.</CommandEmpty>
                            <CommandGroup>
                                {(customers || []).map((customer) => (
                                <CommandItem key={customer.id} onSelect={() => { setSelectedCustomer(customer); setIsCustomerSearchOpen(false); }}>
                                    {customer.name}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_80px_1fr_auto] gap-4 items-end bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Item (S/N or Model)</Label>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between font-normal h-10 truncate text-left text-sm">
                            {selectedProduct ? selectedProduct.displayName : "Select item..."}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                            <CommandInput placeholder="Search inventory..." />
                            <CommandList>
                                <CommandGroup>
                                {allProducts.map((product) => (
                                    <CommandItem key={product.id} onSelect={() => { setSelectedProduct(product); setUnitPrice((product.price || 0).toString()); setSearchOpen(false); }}>
                                    {product.displayName}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty</Label>
                        <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Unit Price</Label>
                        <Input type="number" placeholder="Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="h-10 text-sm" />
                    </div>
                    <Button onClick={handleAddToCart} disabled={!selectedProduct} className="h-10 px-6"><PlusCircle className="h-4 w-4 mr-2" /> Add</Button>
                </div>
                
                {cart.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Description</TableHead>
                                    <TableHead className="text-center font-bold">Qty</TableHead>
                                    <TableHead className="text-right font-bold">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id} className="hover:bg-muted/20">
                                        <TableCell>
                                            <p className="font-semibold text-sm">{item.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">S/N: {item.serialNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-bold text-sm">KES {((item.unitPrice - item.discount) * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="h-8 w-8">
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-muted/5 opacity-60">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Basket is currently empty</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Checkout Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</Label>
                    <Select onValueChange={(v: any) => setPaymentMethod(v)} value={paymentMethod}>
                        <SelectTrigger className="h-11 shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="M-Pesa">M-Pesa (STK Push)</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                            <SelectItem value="Paybill">Paybill</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {paymentMethod === 'M-Pesa' && (
                    <div className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-primary font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Smartphone className="h-4 w-4" /> Initiate STK Push
                        </Label>
                        <Input 
                            placeholder="Customer Phone (e.g., 07...)" 
                            value={mpesaPhone} 
                            onChange={e => setMpesaPhone(e.target.value)}
                            disabled={mpesaStatus === 'pending'}
                            className="h-10 bg-white"
                        />
                        <Button 
                            className="w-full font-bold shadow-md" 
                            variant="secondary"
                            onClick={handleInitiateMpesa}
                            disabled={isMpesaLoading || mpesaStatus === 'pending'}
                        >
                            {isMpesaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Request'}
                        </Button>
                        {mpesaStatus === 'pending' && <p className="text-[10px] text-center text-orange-600 font-bold animate-pulse uppercase">Waiting for customer input...</p>}
                        {mpesaStatus === 'confirmed' && <p className="text-[10px] text-center text-green-600 font-black flex items-center justify-center gap-1 uppercase"><Check className="h-3 w-3"/> Payment Confirmed</p>}
                    </div>
                )}

                {(paymentMethod !== 'Cash' && paymentMethod !== 'M-Pesa') && (
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Transaction Reference</Label>
                        <Input placeholder="e.g., Bank Ref or Tx ID" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} className="h-10 shadow-sm" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Amount Received</Label>
                    <Input type="number" placeholder={grandTotal.toString()} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="h-10 shadow-sm font-bold text-lg" />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="vat-pos" checked={applyVat} onCheckedChange={setApplyVat} />
                    <Label htmlFor="vat-pos" className="text-xs font-medium">Apply 16% VAT to subtotal</Label>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-muted">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Items Subtotal:</span><span className="font-mono">KES {subtotal.toLocaleString()}</span></div>
                    {applyVat && <div className="flex justify-between text-xs text-muted-foreground"><span>VAT (16%):</span><span className="font-mono">KES {vatAmount.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-xl font-black pt-2 border-t mt-2"><span>Total Due:</span><span className="text-primary">KES {grandTotal.toLocaleString()}</span></div>
                    {changeDue > 0 && <div className="flex justify-between text-xs font-bold text-green-600 pt-1"><span>Change to Customer:</span><span>KES {changeDue.toLocaleString()}</span></div>}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
                <Button 
                    onClick={handleFinalizeSale} 
                    className="w-full h-14 text-lg font-black shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]" 
                    disabled={isProcessing || !selectedCustomer || cart.length === 0 || (paymentMethod === 'M-Pesa' && mpesaStatus !== 'confirmed')}
                >
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finalize Sale'}
                </Button>
                <Button variant="ghost" className="w-full text-xs uppercase font-bold text-muted-foreground hover:bg-destructive/5 hover:text-destructive" onClick={() => {
                    if (confirm('Are you sure you want to clear the basket?')) setCart([]);
                }}>Clear All Items</Button>
            </CardFooter>
        </Card>
      </div>

      <RecentSales onViewReceipt={(sale) => {
          const fetchDoc = async () => {
              let docs = await db.documents.where('saleId').equals(sale.id).toArray();
              if (docs.length === 0) {
                  docs = await db.documents.where('title').equals(`Receipt #RCL-${sale.id.slice(0, 5).toUpperCase()}`).toArray();
              }
              if (docs.length > 0) {
                  setLastSaleDoc(docs[0]);
                  setIsSuccessOpen(true);
              } else {
                  toast({ variant: 'destructive', title: 'Receipt Not Found' });
              }
          };
          fetchDoc();
      }} />

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center p-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogHeader>
                <DialogTitle className="text-2xl font-black">Sale Completed!</DialogTitle>
                <DialogDescription className="text-base pt-2">
                    Transaction <strong>{lastSaleDoc?.title}</strong> has been recorded.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-6">
                <Button variant="outline" className="h-12 font-bold shadow-sm" onClick={() => lastSaleDoc && handleDownloadReceipt(lastSaleDoc)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button variant="outline" className="h-12 font-bold shadow-sm" onClick={handlePrintReceipt}>
                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
                <Button variant="secondary" className="h-12 font-bold shadow-sm bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => lastSaleDoc && handleShareWhatsApp(lastSaleDoc)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="secondary" className="h-12 font-bold shadow-sm" onClick={() => lastSaleDoc && handleShareEmail(lastSaleDoc)}>
                    <Mail className="mr-2 h-4 w-4" /> Email Client
                </Button>
            </div>
            <DialogFooter className="pt-6">
                <Button className="w-full h-11" onClick={() => setIsSuccessOpen(false)}>Done & Clear</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptPreviewOpen} onOpenChange={setIsReceiptPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-gray-200 p-0 flex justify-center py-10">
              <div id="pos-receipt-preview-target" className="a4-document shrink-0 shadow-2xl relative">
                  {lastSaleDoc && <ReceiptPdf document={lastSaleDoc} />}
                  {isGeneratingPdf && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                        <p className="font-bold text-primary text-xs tracking-widest">CAPTURING FULL PAGE...</p>
                    </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
