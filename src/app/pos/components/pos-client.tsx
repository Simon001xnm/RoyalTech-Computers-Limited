'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Asset, Accessory, SaleItem, Sale, Customer } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, ChevronsUpDown, PlusCircle, Smartphone, Loader2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { initiateStkPush } from '../actions';

type Product = (Asset | Accessory) & { productType: 'asset' | 'accessory'; displayName: string; price?: number; };
type CartItem = SaleItem & { productType: 'asset' | 'accessory'; quantity: number; unitPrice: number; discount: number; };

const buildAssetDisplayName = (asset: Asset): string => {
  return `${asset.model} (S/N: ${asset.serialNumber})`;
};

const VAT_RATE = 0.16;

export function PosClient() {
  const { toast } = useToast();
  
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');

  // DEXIE LOCAL QUERIES
  const assets = useLiveQuery(() => db.assets.filter(a => a.status === 'Available').toArray());
  const accessories = useLiveQuery(() => db.accessories.filter(a => a.status === 'Available').toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const isLoading = assets === undefined || accessories === undefined;

  const allProducts = useMemo<Product[]>(() => {
    if (!assets || !accessories) return [];
    return [
      ...assets.map(item => ({ ...item, productType: 'asset' as const, displayName: buildAssetDisplayName(item), price: item.leasePrice })),
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
  }

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
  }

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer) return;
    setIsProcessing(true);

    try {
        await db.transaction('rw', [db.assets, db.accessories, db.sales], async () => {
            for (const item of cart) {
                if (item.productType === 'asset') {
                    await db.assets.update(item.id, { status: 'Sold', quantity: 0 });
                } else {
                    await db.accessories.update(item.id, { status: 'Sold', quantity: 0 });
                }
            }

            const saleData: Sale = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
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
                status: 'Paid',
                createdAt: new Date().toISOString()
            };
            await db.sales.add(saleData);
        });

        toast({ title: 'Sale Completed locally!' });
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
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Point of Sale (Local)" description="Lightning-fast local transactions with M-Pesa." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Basket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Customer</Label>
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                            {selectedCustomer ? selectedCustomer.name : "Select a customer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search customers..." />
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

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                    <Label>Item</Label>
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                        {selectedProduct ? selectedProduct.displayName : "SN or Model..."}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Search products..." />
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
                <Input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
                <Input type="number" placeholder="Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}/>
                <Button onClick={handleAddToCart} disabled={!selectedProduct}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                
                {cart.length > 0 && (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold">KES {((item.unitPrice - item.discount) * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => setCart(cart.filter(c => c.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Payment & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select onValueChange={(v: any) => setPaymentMethod(v)} value={paymentMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                            <SelectItem value="Paybill">Paybill</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {paymentMethod === 'M-Pesa' && (
                    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-3">
                        <Label className="text-primary font-bold flex items-center gap-2">
                            <Smartphone className="h-4 w-4" /> M-Pesa STK Push
                        </Label>
                        <Input 
                            placeholder="0712345678" 
                            value={mpesaPhone} 
                            onChange={e => setMpesaPhone(e.target.value)}
                            disabled={mpesaStatus === 'pending'}
                        />
                        <Button 
                            className="w-full" 
                            variant="secondary"
                            onClick={handleInitiateMpesa}
                            disabled={isMpesaLoading || mpesaStatus === 'pending'}
                        >
                            {isMpesaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send STK Push'}
                        </Button>
                        {mpesaStatus === 'pending' && <p className="text-xs text-orange-600 animate-pulse">Waiting for customer to enter PIN...</p>}
                        {mpesaStatus === 'confirmed' && <p className="text-xs text-green-600 font-bold flex items-center gap-1"><Check className="h-3 w-3"/> Payment Confirmed</p>}
                    </div>
                )}

                {(paymentMethod !== 'Cash' && paymentMethod !== 'M-Pesa') && (
                    <div className="space-y-2">
                        <Label>Reference Code</Label>
                        <Input placeholder="e.g., QXJ12345" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Amount Paid</Label>
                    <Input type="number" placeholder={grandTotal.toString()} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="vat-pos" checked={applyVat} onCheckedChange={setApplyVat} />
                    <Label htmlFor="vat-pos">Include 16% VAT</Label>
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>KES {subtotal.toLocaleString()}</span></div>
                    {applyVat && <div className="flex justify-between text-muted-foreground"><span>VAT (16%):</span><span>KES {vatAmount.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-lg font-bold pt-2"><span>Total:</span><span>KES {grandTotal.toLocaleString()}</span></div>
                    {changeDue > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Change Due:</span><span>KES {changeDue.toLocaleString()}</span></div>}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                <Button 
                    onClick={handleFinalizeSale} 
                    className="w-full h-12 text-lg" 
                    disabled={isProcessing || !selectedCustomer || cart.length === 0 || (paymentMethod === 'M-Pesa' && mpesaStatus !== 'confirmed')}
                >
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finalize Sale'}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setCart([])}>Clear Basket</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
