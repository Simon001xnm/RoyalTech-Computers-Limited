
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Laptop, Accessory, SaleItem, Sale, Customer } from '@/types';
import { collection, query, where, writeBatch, doc, orderBy, serverTimestamp } from 'firebase/firestore';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';

// --- DYNAMIC IMPORTS ---
const ReceiptPdf = dynamic(() => import('@/app/documents/components/pdfs/receipt-pdf').then(mod => mod.ReceiptPdf), {
  loading: () => <div className="flex items-center justify-center h-full"><p>Loading receipt preview...</p></div>,
  ssr: false
});
const RecentSales = dynamic(() => import('./recent-sales').then(mod => mod.RecentSales), {
  loading: () => <Card><CardHeader><CardTitle>Recent Receipts</CardTitle><CardDescription>Loading sales history...</CardDescription></CardHeader><CardContent><p>Please wait...</p></CardContent></Card>,
  ssr: false
});


// --- TYPE DEFINITIONS ---
type Product = (Laptop | Accessory) & { productType: 'laptop' | 'accessory'; displayName: string; price?: number; };
type CartItem = SaleItem & { productType: 'laptop' | 'accessory'; quantity: number; unitPrice: number; discount: number; };

const buildLaptopDisplayName = (laptop: Laptop): string => {
  const parts = [laptop.model];
  if (laptop.specifications?.processor) parts.push(laptop.specifications.processor);
  if (laptop.specifications?.ram) parts.push(laptop.specifications.ram);
  if (laptop.specifications?.storage) parts.push(laptop.specifications.storage);
  if (laptop.specifications?.touchscreen) parts.push('Touchscreen');
  return `${parts.join(' ')} (S/N: ${laptop.serialNumber})`;
};

const VAT_RATE = 0.16; // 16%

export function PosClient() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // --- STATE MANAGEMENT ---
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Till' | 'M-Pesa' | 'Bank' | 'Paybill'>('Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [applyVat, setApplyVat] = useState(false);

  // Item entry state
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);


  // --- DATA FETCHING ---
  const availableLaptopsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'laptops'), where('status', '==', 'Available')) : null, [firestore, user]);
  const { data: laptops, isLoading: laptopsLoading } = useCollection<Laptop>(availableLaptopsQuery);
  const availableAccessoriesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'accessories'), where('status', '==', 'Available')) : null, [firestore, user]);
  const { data: accessories, isLoading: accessoriesLoading } = useCollection<Accessory>(availableAccessoriesQuery);
  const customersQuery = useMemoFirebase(() => user ? query(collection(firestore, 'customers')) : null, [firestore, user]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const isLoading = isUserLoading || laptopsLoading || accessoriesLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // --- MEMOIZED COMPUTATIONS ---
  const allProducts = useMemo<Product[]>(() => {
    if (!laptops || !accessories) return [];
    return [
      ...laptops.map(item => ({ ...item, productType: 'laptop' as const, displayName: buildLaptopDisplayName(item), price: item.leasePrice })),
      ...accessories.map(item => ({ ...item, productType: 'accessory' as const, displayName: `${item.name} (S/N: ${item.serialNumber})`, price: item.sellingPrice }))
    ].filter(p => p.status === 'Available');
  }, [laptops, accessories]);

  const { subtotal, totalDiscount, vatAmount, grandTotal, changeDue } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalDiscount = cart.reduce((acc, item) => acc + (item.discount || 0) * item.quantity, 0);
    const totalAfterDiscount = subtotal - totalDiscount;
    const vatAmount = applyVat ? totalAfterDiscount * VAT_RATE : 0;
    const grandTotal = totalAfterDiscount + vatAmount;
    const parsedAmountPaid = parseFloat(amountPaid) || grandTotal;
    const changeDue = parsedAmountPaid > grandTotal ? parsedAmountPaid - grandTotal : 0;
    return { subtotal, totalDiscount, vatAmount, grandTotal, changeDue };
  }, [cart, amountPaid, applyVat]);


  // --- FORM & CART LOGIC ---
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setUnitPrice((product.price || 0).toString());
    setDiscount('0');
    setSearchOpen(false);
  };
  
  const handleAddToCart = () => {
    if (!selectedProduct || !unitPrice) {
        toast({ variant: 'destructive', title: 'Please select an item and set a price.'});
        return;
    }
    const price = parseFloat(unitPrice);
    if(isNaN(price) || price <= 0) {
        toast({ variant: 'destructive', title: 'Invalid unit price.'});
        return;
    }
    const itemDiscount = parseFloat(discount) || 0;

    const newCartItem: CartItem = {
      id: selectedProduct.id,
      name: selectedProduct.productType === 'laptop' ? (selectedProduct as Laptop).model : (selectedProduct as Accessory).name,
      serialNumber: selectedProduct.serialNumber,
      price: price, // This is unit price now
      unitPrice: price,
      quantity: quantity,
      discount: itemDiscount,
      type: selectedProduct.productType,
      productType: selectedProduct.productType,
    };
    
    if (selectedProduct.productType === 'laptop') {
      const laptopProduct = selectedProduct as Laptop;
      if (laptopProduct.specifications) {
        newCartItem.specifications = laptopProduct.specifications;
      }
    }

    const existingCartItemIndex = cart.findIndex(item => item.id === selectedProduct.id);

    if (existingCartItemIndex > -1) {
        toast({ variant: 'destructive', title: 'Item already in cart'});
    } else {
        setCart([...cart, newCartItem]);
    }
    
    // Reset item form
    setSelectedProduct(null);
    setUnitPrice('');
    setQuantity(1);
    setDiscount('0');
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  const clearTransaction = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid('');
    setReferenceCode('');
    setSelectedProduct(null);
    setUnitPrice('');
    setQuantity(1);
    setDiscount('0');
    setApplyVat(false);
  };
  
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Cart is empty' });
      return;
    }
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'A registered customer must be selected.' });
      return;
    }
    if (!user) return;
    
    setIsProcessing(true);

    const batch = writeBatch(firestore);

    const saleItems: SaleItem[] = cart.map((cartItem) => {
        const { productType, unitPrice, ...saleItemData } = cartItem;
        const product = allProducts.find(p => p.id === cartItem.id);
        const itemCogs = (product?.purchasePrice || 0) * cartItem.quantity;
        return {
            ...saleItemData,
            price: unitPrice, 
            cogs: itemCogs,
        };
    });

    const totalCogs = saleItems.reduce((acc, item) => acc + (item.cogs || 0), 0);
    
    // 1. Update inventory
    for (const item of cart) {
        const collectionName = item.productType === 'laptop' ? 'laptops' : 'accessories';
        const itemRef = doc(firestore, collectionName, item.id);
        batch.update(itemRef, { status: 'Sold', quantity: 0 });
    }

    // 2. Use existing customer ID
    const customerId = selectedCustomer.id;

    // 3. Create Sale record
    const saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        date: new Date().toISOString(),
        amount: grandTotal,
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        vat: vatAmount,
        amountPaid: parseFloat(amountPaid) || grandTotal,
        changeDue: changeDue,
        cogs: totalCogs,
        paymentMethod: paymentMethod,
        referenceCode: referenceCode,
        items: saleItems,
        customerName: selectedCustomer.name,
        customerId: customerId,
        customerPhone: selectedCustomer.phone,
        status: 'Paid',
    };
    const newSaleRef = doc(collection(firestore, 'sales'));
    batch.set(newSaleRef, { ...saleData, createdBy: { uid: user.uid, name: user.displayName }, createdAt: serverTimestamp() });
    
    try {
        await batch.commit();
        toast({ title: 'Sale Completed!', description: `A new sale for ${formatCurrency(grandTotal)} has been recorded.` });
        clearTransaction();
    } catch (error) {
        console.error('Checkout failed:', error);
        toast({ variant: 'destructive', title: 'Checkout Failed', description: 'Could not complete the sale. Please try again.' });
    } finally {
        setIsProcessing(false);
    }
  }

  // --- RECENT SALES TABLE ---
  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptPreviewOpen(true);
  };

  const handleDownloadReceipt = async (saleToDownload: Sale) => {
    toast({ title: "Preparing PDF..." });
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    setSelectedSale(saleToDownload);
    setIsReceiptPreviewOpen(true);
    
    setTimeout(async () => {
      const receiptElement = document.getElementById('pdf-preview-content')?.firstElementChild as HTMLElement | null;
      if (!receiptElement) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find receipt content to download.' });
        setIsReceiptPreviewOpen(false);
        return;
      }
      
      const canvas = await html2canvas(receiptElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const MARGIN = 10; // Reduced margin
      const contentWidth = pdfWidth - MARGIN * 2;
      const contentHeight = pdfHeight - MARGIN * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let finalWidth = contentWidth;
      let finalHeight = finalWidth / aspectRatio;

      if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = finalHeight * aspectRatio;
      }
      
      const xOffset = MARGIN + (contentWidth - finalWidth) / 2;
      const yOffset = MARGIN; // Align to top
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      pdf.save(`Receipt-${saleToDownload.id.slice(0,5)}.pdf`);
      
      setIsReceiptPreviewOpen(false);
      setSelectedSale(null);
    }, 500);
  };
  
  const generateReceiptDocument = (sale: Sale): import('@/types').Document => ({
    id: sale.id,
    type: 'Receipt',
    title: `RCPT-${sale.id.slice(0,4).toUpperCase()}`,
    generatedDate: sale.date,
    relatedTo: `Sale to ${sale.customerName}`,
    data: {
      customer: { name: sale.customerName, phone: sale.customerPhone },
      ...sale
    },
    createdAt: sale.date,
  });

  return (
    <>
      <PageHeader title="Point of Sale" description="Process new sales and generate receipts." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />New Transaction</CardTitle>
            <CardDescription>Search for laptops and accessories to add to the cart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Customer *</Label>
                <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isCustomerSearchOpen} className="w-full max-w-lg justify-between font-normal">
                        {selectedCustomer ? selectedCustomer.name : "Select a registered customer..."}
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
                            <CommandItem key={customer.id} value={customer.name} onSelect={() => {
                                setSelectedCustomer(customer);
                                setIsCustomerSearchOpen(false);
                            }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0")}/>
                                {customer.name}
                            </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                    </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label>1. Search Item</Label>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={searchOpen} className="w-full justify-between font-normal">
                      {selectedProduct ? selectedProduct.displayName : "Name or S/N..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                          {allProducts.map((product) => (
                            <CommandItem key={product.id} value={product.displayName} onSelect={() => handleSelectProduct(product)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedProduct?.id === product.id ? "opacity-100" : "opacity-0")}/>
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
                <Label htmlFor="quantity">2. Quantity</Label>
                <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">3. Unit Price</Label>
                <Input id="unit-price" type="number" placeholder="e.g. 45000" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}/>
              </div>
               <div className="space-y-2">
                <Label htmlFor="discount">4. Discount</Label>
                <Input id="discount" type="number" placeholder="e.g. 1000" value={discount} onChange={e => setDiscount(e.target.value)}/>
              </div>
              <Button onClick={handleAddToCart} disabled={!selectedProduct || isProcessing}><PlusCircle className="mr-2 h-4 w-4" />Add</Button>
            </div>
            
            {cart.length > 0 && (
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Description</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}<p className="text-xs text-muted-foreground">S/N: {item.serialNumber}</p></TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency((item.unitPrice - item.discount) * item.quantity)}</TableCell>
                                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </CardContent>

          {cart.length > 0 && (
             <CardFooter className="flex flex-col items-stretch gap-6">
                <Separator/>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-grow space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Payment Method</Label>
                           <Select onValueChange={(v) => setPaymentMethod(v as any)} defaultValue={paymentMethod}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Till">Till</SelectItem>
                                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                    <SelectItem value="Bank">Bank</SelectItem>
                                    <SelectItem value="Paybill">Paybill</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reference-code">Reference Code</Label>
                            <Input id="reference-code" placeholder="e.g., ASSU" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
                        </div>
                      </div>
                       <div className="flex gap-2">
                         <Button onClick={handleFinalizeSale} className="w-full" disabled={isProcessing || !selectedCustomer || cart.length === 0}>{isProcessing ? 'Processing...' : 'Finalize Sale'}</Button>
                         <Button variant="outline" onClick={clearTransaction}><RefreshCw className="mr-2 h-4 w-4"/>Clear Sale</Button>
                      </div>
                  </div>
                  <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4 w-full md:w-80">
                      <div className="space-y-2 font-mono">
                        <div className="flex justify-between text-sm"><span>SUBTOTAL</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between text-sm"><span>DISCOUNT</span><span>{formatCurrency(totalDiscount)}</span></div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} />
                            <Label htmlFor="vat-switch">VAT ({(VAT_RATE * 100).toFixed(0)}%)</Label>
                          </div>
                          <span>{formatCurrency(vatAmount)}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between font-bold text-lg"><span>GRAND TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>
                        <div className="flex items-center gap-2">
                           <Label htmlFor='amount-paid' className='whitespace-nowrap'>AMOUNT PAID</Label>
                           <Input id='amount-paid' type='number' className='h-8 text-right font-bold' placeholder={formatCurrency(grandTotal)} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                        </div>
                        <Separator/>
                        <div className="flex justify-between text-sm"><span>CHANGE DUE</span><span>{formatCurrency(changeDue)}</span></div>
                      </div>
                  </div>
                </div>
             </CardFooter>
          )}
        </Card>
        
        <RecentSales onViewReceipt={handleViewReceipt} />
      </div>

       <Dialog open={isReceiptPreviewOpen} onOpenChange={setIsReceiptPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col print-this">
          <DialogHeader className="no-print">
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-grow h-full overflow-y-auto border rounded-md print-this-content bg-gray-200 p-4" id="pdf-preview-content">
             {selectedSale && <ReceiptPdf document={generateReceiptDocument(selectedSale)} />}
          </div>
          <DialogFooter className="pt-4 no-print">
            <Button onClick={() => selectedSale && handleDownloadReceipt(selectedSale)}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
