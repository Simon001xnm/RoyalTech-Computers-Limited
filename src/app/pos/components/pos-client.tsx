
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Asset, Accessory, SaleItem, Sale, Customer, Document as AppDocument } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, PlusCircle, Loader2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RecentSales } from './recent-sales';
import { useUser } from '@/firebase/provider';
import { useSaaS } from '@/components/saas/saas-provider';
import { SaleService } from '@/services/sale-service';

type Product = (Asset | Accessory) & { productType: 'asset' | 'accessory'; displayName: string; price?: number; };
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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Till' | 'M-Pesa' | 'Bank' | 'Paybill'>('Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [applyVat, setApplyVat] = useState(false);

  // Firestore Queries
  const assetsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'laptop_instances') : null, [firestore]);
  const customersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  
  const { data: assets } = useCollection<Asset>(assetsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const availableProducts = useMemo<Product[]>(() => {
    if (!assets) return [];
    return assets
      .filter(a => a.status === 'Available')
      .map(item => ({ 
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
    return { 
        subtotal, 
        vatAmount, 
        grandTotal, 
        changeDue: Math.max(0, parsedAmountPaid - grandTotal) 
    };
  }, [cart, amountPaid, applyVat]);

  const handleAddToCart = () => {
    if (!selectedProduct || !unitPrice) return;
    const price = parseFloat(unitPrice);
    setCart([...cart, {
      id: selectedProduct.id,
      name: selectedProduct.productType === 'asset' ? (selectedProduct as Asset).model : (selectedProduct as any).name,
      serialNumber: selectedProduct.serialNumber,
      price: price, unitPrice: price, quantity, discount: 0,
      type: selectedProduct.productType, productType: selectedProduct.productType
    }]);
    setSelectedProduct(null); setUnitPrice(''); setQuantity(1);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer || !user || !tenant || !firestore) return;

    setIsProcessing(true);
    try {
        const saleId = crypto.randomUUID();
        const saleDate = new Date().toISOString();
        
        const saleData: Sale = {
            id: saleId, tenantId: tenant.id, date: saleDate, amount: grandTotal, subtotal, vat: vatAmount,
            amountPaid: parseFloat(amountPaid) || grandTotal, changeDue, paymentMethod, referenceCode,
            items: cart.map(i => ({ ...i, price: i.unitPrice })), customerName: selectedCustomer.name, customerId: selectedCustomer.id,
            status: 'Paid', createdAt: saleDate, createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        const docData: AppDocument = {
            id: crypto.randomUUID(), tenantId: tenant.id, type: 'Receipt', title: `Receipt #RCL-${saleId.slice(0, 5).toUpperCase()}`,
            generatedDate: saleDate, relatedTo: `Sale to ${selectedCustomer.name}`, saleId: saleId, 
            data: { ...saleData, applyVat }, createdAt: saleDate, createdBy: { uid: user.uid, name: user.displayName || 'User' }
        };

        await SaleService.finalizeSale(firestore, saleData, docData);

        toast({ title: 'Sale Finalized in Firestore' });
        setIsSuccessOpen(true);
        setCart([]); setSelectedCustomer(null); setAmountPaid(''); setReferenceCode('');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Sale Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Point of Sale (Firestore)" description="Process cloud-synced transactions instantly." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Basket</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-11">{selectedCustomer ? selectedCustomer.name : "Search clients..."}</Button></PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Client name..." /><CommandList><CommandEmpty>None found.</CommandEmpty><CommandGroup>{(customers || []).map(c => <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setIsCustomerSearchOpen(false); }}>{c.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[2fr_80px_1fr_auto] gap-4 items-end bg-muted/30 p-4 rounded-xl">
                    <div className="space-y-2">
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full h-10 truncate">{selectedProduct ? selectedProduct.displayName : "Select product..."}</Button></PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Model/SN..." /><CommandList><CommandGroup>{availableProducts.map(p => <CommandItem key={p.id} onSelect={() => { setSelectedProduct(p); setUnitPrice((p.price || 0).toString()); setSearchOpen(false); }}>{p.displayName}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                        </Popover>
                    </div>
                    <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="h-10" />
                    <Input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="h-10" />
                    <Button onClick={handleAddToCart} disabled={!selectedProduct} className="h-10"><PlusCircle className="h-4 w-4 mr-2" /> Add</Button>
                </div>
                {cart.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden"><Table><TableHeader className="bg-muted/50"><TableRow><TableHead>Item</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>{cart.map(item => (<TableRow key={item.id} className="hover:bg-muted/20"><TableCell><p className="font-semibold text-sm">{item.name}</p><p className="text-[10px] opacity-60">S/N: {item.serialNumber}</p></TableCell><TableCell className="text-center text-sm">{item.quantity}</TableCell><TableCell className="text-right font-bold text-sm">KES {(item.unitPrice * item.quantity).toLocaleString()}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => setCart(cart.filter(c => c.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell></TableRow>))}</TableBody></Table></div>
                ) : <div className="py-12 border-2 border-dashed rounded-2xl text-center opacity-60"><p className="text-sm uppercase tracking-widest">Basket Empty</p></div>}
            </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-primary/5"><CardTitle className="text-lg">Payment Service</CardTitle></CardHeader>
            <CardContent className="space-y-5 pt-6">
                <Select onValueChange={(v: any) => setPaymentMethod(v)} value={paymentMethod}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Bank">Bank</SelectItem></SelectContent></Select>
                <Input placeholder="Reference..." value={referenceCode} onChange={e => setReferenceCode(e.target.value)} className="h-10 shadow-sm" />
                <div className="flex items-center space-x-2 pt-2"><Switch id="vat-pos" checked={applyVat} onCheckedChange={setApplyVat} /><Label htmlFor="vat-pos" className="text-xs">Apply 16% VAT</Label></div>
                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border"><div className="flex justify-between text-xl font-black"><span>Total Due:</span><span className="text-primary">KES {grandTotal.toLocaleString()}</span></div></div>
            </CardContent>
            <CardFooter className="pb-8"><Button onClick={handleFinalizeSale} className="w-full h-14 text-lg font-black" disabled={isProcessing || !selectedCustomer || cart.length === 0}>{isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finalize in Cloud'}</Button></CardFooter>
        </Card>
      </div>

      <RecentSales onViewReceipt={() => {}} />

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}><DialogContent className="sm:max-w-md text-center p-8"><Check className="h-12 w-12 text-green-600 mx-auto mb-4" /><DialogHeader><DialogTitle className="text-2xl font-black">Sale Completed!</DialogTitle></DialogHeader><DialogFooter className="pt-6"><Button className="w-full h-11" onClick={() => setIsSuccessOpen(false)}>Continue</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
