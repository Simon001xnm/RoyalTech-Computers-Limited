'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Laptop, Accessory, SaleItem, Sale, Customer } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, RefreshCw, ChevronsUpDown, Check, PlusCircle, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';

const ReceiptPdf = dynamic(() => import('@/app/documents/components/pdfs/receipt-pdf').then(mod => mod.ReceiptPdf), {
  loading: () => <div className="flex items-center justify-center h-full"><p>Loading receipt...</p></div>,
  ssr: false
});

type Product = (Laptop | Accessory) & { productType: 'laptop' | 'accessory'; displayName: string; price?: number; };
type CartItem = SaleItem & { productType: 'laptop' | 'accessory'; quantity: number; unitPrice: number; discount: number; };

const buildLaptopDisplayName = (laptop: Laptop): string => {
  return `${laptop.model} (S/N: ${laptop.serialNumber})`;
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // DEXIE LOCAL QUERIES
  const laptops = useLiveQuery(() => db.laptops.filter(l => l.status === 'Available').toArray());
  const accessories = useLiveQuery(() => db.accessories.filter(a => a.status === 'Available').toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const isLoading = laptops === undefined || accessories === undefined;

  const allProducts = useMemo<Product[]>(() => {
    if (!laptops || !accessories) return [];
    return [
      ...laptops.map(item => ({ ...item, productType: 'laptop' as const, displayName: buildLaptopDisplayName(item), price: item.leasePrice })),
      ...accessories.map(item => ({ ...item, productType: 'accessory' as const, displayName: `${item.name} (S/N: ${item.serialNumber})`, price: item.sellingPrice }))
    ];
  }, [laptops, accessories]);

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
      name: selectedProduct.productType === 'laptop' ? (selectedProduct as Laptop).model : (selectedProduct as Accessory).name,
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

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomer) return;
    setIsProcessing(true);

    try {
        await db.transaction('rw', [db.laptops, db.accessories, db.sales, db.expenses], async () => {
            // 1. Update Inventory
            for (const item of cart) {
                if (item.productType === 'laptop') {
                    await db.laptops.update(item.id, { status: 'Sold', quantity: 0 });
                } else {
                    await db.accessories.update(item.id, { status: 'Sold', quantity: 0 });
                }
            }

            // 2. Create Sale Record
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
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Sale Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Point of Sale (Local)" description="Lightning-fast local transactions." />
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
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
        <CardFooter className="flex flex-col gap-4 border-t pt-6">
            <div className="flex w-full justify-between text-xl font-bold">
                <span>Grand Total:</span>
                <span>KES {grandTotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <Button onClick={handleFinalizeSale} className="w-full" disabled={isProcessing || !selectedCustomer || cart.length === 0}>Finalize Sale</Button>
                <Button variant="outline" onClick={() => setCart([])}>Clear</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
