
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, ListChecks, Receipt, FileWarning, Truck, Check, ChevronsUpDown, Trash2, PlusCircle, ShoppingCart, ArrowRightLeft } from "lucide-react";
import type { DocumentType, Document as AppDocument, Lease, Customer, Laptop, DocumentLineItem } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, writeBatch } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { InvoicePdf } from "./pdfs/invoice-pdf";
import { ReceiptPdf } from "./pdfs/receipt-pdf";
import { ProformaInvoicePdf } from "./pdfs/proforma-pdf";
import { RepairNotePdf } from "./pdfs/repair-note-pdf";
import { DeliveryNotePdf } from "./pdfs/delivery-note-pdf";
import { QuotationPdf } from "./pdfs/quotation-pdf";
import { LpoPdf } from "./pdfs/lpo-pdf";
import { LeaseAgreementPdf } from "./pdfs/lease-agreement-pdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { getDocumentColumns, type DocumentColumnActions } from "./document-columns";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad } from "@/components/ui/signature-pad";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const VAT_RATE = 0.16;

export function DocumentsClient() {
  const [activeTab, setActiveTab] = useState<DocumentType>("Invoice");
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  // Data fetching
  const documentsCollection = useMemoFirebase(() => user ? collection(firestore, 'documents') : null, [firestore, user]);
  const { data: generatedDocuments, isLoading: isLoadingDocuments } = useCollection<AppDocument>(documentsCollection);
  
  const customersCollection = useMemoFirebase(() => user ? collection(firestore, 'customers') : null, [firestore, user]);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollection);

  const laptopsCollection = useMemoFirebase(() => user ? collection(firestore, 'laptops') : null, [firestore, user]);
  const { data: laptops, isLoading: isLoadingLaptops } = useCollection<Laptop>(laptopsCollection);

  const leasesCollection = useMemoFirebase(() => user ? collection(firestore, 'leaseAgreements') : null, [firestore, user]);
  const { data: leases } = useCollection<Lease>(leasesCollection);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedLaptopId, setSelectedLaptopId] = useState<string>('');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [applyVat, setApplyVat] = useState(false);
  
  // Delivery specific fields
  const [deliveredBy, setDeliveredBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [delivererSignature, setDelivererDelivererSignature] = useState('');
  const [recipientSignature, setRecipientSignature] = useState('');
  const [signature, setSignature] = useState(''); // Shared/Generic signature
  
  // New state for Invoice/Quotation type and lease fields
  const [invoiceType, setInvoiceType] = useState<'standard' | 'lease'>('standard');
  const [leaseDescription, setLeaseDescription] = useState('');
  const [leaseQuantity, setLeaseQuantity] = useState('1');
  const [leaseDuration, setLeaseDuration] = useState('1');
  const [leaseDurationUnit, setLeaseDurationUnit] = useState<'Days' | 'Weeks' | 'Months' | 'Years'>('Months');
  const [leaseRate, setLeaseRate] = useState('');


  // Line Items State for manual entry
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  // PDF Preview State
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);

  // Combobox State
  const [isLaptopComboboxOpen, setIsLaptopComboboxOpen] = useState(false);
  
  // Table State
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const anyDataLoading = isUserLoading || isLoadingDocuments || isLoadingCustomers || isLoadingLaptops;
  
  const resetFormState = () => {
    setSelectedCustomerId('');
    setSelectedLaptopId('');
    setSelectedLeaseId('');
    setDetails('');
    setAmount('');
    setApplyVat(false);
    setSignature('');
    setDeliveredBy('');
    setReceivedBy('');
    setDelivererDelivererSignature('');
    setRecipientSignature('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setInvoiceType('standard');
    setLeaseDescription('');
    setLeaseQuantity('1');
    setLeaseDuration('1');
    setLeaseDurationUnit('Months');
    setLeaseRate('');
  };

  const handleGenerateDocument = async (type: DocumentType) => {
    let title = `${type.replace(/([A-Z])/g, ' $1').trim()} #${type.slice(0,3).toUpperCase()}-2026-${String((generatedDocuments?.length || 0) + 1).padStart(3,'0')}`;
    let relatedTo = "N/A";
    const documentData: any = { details, applyVat, signature };

    // --- Validation and Data Gathering ---
    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    let selectedLaptop = laptops?.find(l => l.id === selectedLaptopId);
    
    if (selectedCustomer) {
        documentData.customer = selectedCustomer;
        relatedTo = `Customer: ${selectedCustomer.name}`;
    }

    if (type === 'Receipt') {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid payment amount for the receipt.' });
            return;
        }
        if (!selectedCustomerId) {
            toast({ variant: 'destructive', title: 'Customer Required', description: 'A customer must be selected to generate a receipt.' });
            return;
        }
        documentData.amount = parsedAmount;
        documentData.applyVat = applyVat;
    } else if (['Quotation', 'Invoice', 'Proforma'].includes(type)) {
        if (invoiceType === 'standard') {
            const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
            if (validLineItems.length === 0) {
                toast({ variant: 'destructive', title: 'No Items', description: 'Please add at least one valid line item.' });
                return;
            }
            documentData.items = validLineItems;
            const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            const vat = applyVat ? subtotal * VAT_RATE : 0;
            const total = subtotal + vat;
            
            documentData.subtotal = subtotal;
            documentData.vat = vat;
            documentData.total = total;
            documentData.applyVat = applyVat;
            documentData.invoiceType = 'standard';
        } else { // invoiceType === 'lease'
            const quantity = parseInt(leaseQuantity);
            const duration = parseInt(leaseDuration);
            const rate = parseFloat(leaseRate);
            if (!leaseDescription.trim() || isNaN(duration) || duration <= 0 || isNaN(rate) || rate <= 0 || isNaN(quantity) || quantity <= 0) {
                toast({ variant: 'destructive', title: 'Invalid Lease Details', description: 'Please fill out all lease fields correctly.' });
                return;
            }
            const subtotal = duration * rate * quantity;
            const vat = applyVat ? subtotal * VAT_RATE : 0;
            const total = subtotal + vat;

            documentData.leaseDetails = {
                description: leaseDescription,
                quantity,
                duration,
                durationUnit: leaseDurationUnit,
                rate,
            };
            documentData.subtotal = subtotal;
            documentData.vat = vat;
            documentData.total = total;
            documentData.applyVat = applyVat;
            documentData.invoiceType = 'lease';
        }
    } else if (type === 'LeaseAgreement') {
        const selectedLease = leases?.find(l => l.id === selectedLeaseId);
        if (!selectedLease) {
            toast({ variant: 'destructive', title: 'Lease Required', description: 'Please select a valid lease to generate an agreement.' });
            return;
        }
        const leaseLaptop = laptops?.find(l => l.id === selectedLease.laptopId);
        documentData.lease = selectedLease;
        documentData.laptop = leaseLaptop;
        relatedTo = `Lease: ${leaseLaptop?.model || 'Laptop'} - ${selectedCustomer?.name || 'Customer'}`;
    } else if (type === 'DeliveryNote') {
        if (!selectedCustomerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'A customer must be selected for delivery.' });
            return;
        }
        documentData.deliveredBy = deliveredBy;
        documentData.receivedBy = receivedBy;
        documentData.delivererSignature = delivererSignature;
        documentData.recipientSignature = recipientSignature;
        
        if (selectedLaptop) {
            documentData.laptop = selectedLaptop;
            relatedTo = `Delivery: ${selectedLaptop.model} to ${selectedCustomer?.name}`;
        } else {
            // Support itemized deliveries from invoices
            const validLineItems = lineItems.filter(item => item.description.trim() !== '');
            if (validLineItems.length > 0) {
                documentData.items = validLineItems;
                relatedTo = `Delivery to ${selectedCustomer?.name}`;
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'A laptop or items must be specified for delivery.' });
                return;
            }
        }
    } else if (['LPO'].includes(type)) { // LPO specific logic
         const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
        if (validLineItems.length === 0) {
            toast({ variant: 'destructive', title: 'No Items', description: 'Please add at least one valid line item for the LPO.' });
            return;
        }
        documentData.items = validLineItems;
        const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        documentData.subtotal = subtotal;
        documentData.total = subtotal; // LPOs typically don't have VAT applied this way
        documentData.applyVat = false;
        documentData.supplier = { name: details }; // Use details field for supplier name in LPO
        relatedTo = `Supplier: ${details}`;
    } else { // For other document types like RepairNote
      if (selectedLaptop) {
          documentData.laptop = selectedLaptop;
          relatedTo = `Laptop: ${selectedLaptop.model}`;
      }
       if (['RepairNote'].includes(type) && !selectedLaptop) {
          toast({ variant: 'destructive', title: 'Error', description: 'A laptop must be selected to generate this document.' });
          return;
      }
    }
    
    if (!['LPO'].includes(type) && !documentData.customer) {
        toast({ variant: 'destructive', title: 'Error', description: 'A customer must be selected to generate this document.' });
        return;
    }

    const newDoc: Omit<AppDocument, 'id'> = {
      type: type,
      title: title,
      generatedDate: new Date().toISOString(),
      relatedTo: relatedTo,
      data: documentData,
      createdAt: new Date().toISOString(),
      createdBy: {uid: user!.uid, name: user!.displayName || 'N/A' }
    };

    try {
        const batch = writeBatch(firestore);
        const newDocRef = doc(collection(firestore, 'documents'));
        batch.set(newDocRef, newDoc);

        await batch.commit();
        toast({
            title: `${type} Generated`,
            description: `A new document has been created.`,
        });

    } catch (error) {
        console.error("Error generating document: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the document.' });
    }
    
    resetFormState();
  };
  
  // Line Item Handlers
  const handleLineItemChange = (index: number, field: keyof DocumentLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    const item = { ...updatedItems[index] };
    if (field === 'description') {
      item[field] = value as string;
    } else {
      item[field] = Number(value) || 0;
    }
    updatedItems[index] = item;
    setLineItems(updatedItems);
  };
  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const handleDownloadPdf = async (docToDownload: AppDocument) => {
    toast({
      title: "Downloading PDF",
      description: `Preparing ${docToDownload.title}.pdf...`,
    });
    
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    setSelectedDocument(docToDownload);
    setIsPdfPreviewOpen(true);

    setTimeout(async () => {
        const elementToPrint = document.getElementById('pdf-preview-content')?.firstElementChild as HTMLElement | null;
        
        if (!elementToPrint) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find preview content to download.'});
            setIsPdfPreviewOpen(false);
            return;
        }
        
        const canvas = await html2canvas(elementToPrint, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const MARGIN = 10;
        const contentWidth = pdfWidth - (MARGIN * 2);
        const contentHeight = pdfHeight - (MARGIN * 2);

        const imgProps = pdf.getImageProperties(imgData);
        const aspectRatio = imgProps.width / imgProps.height;

        let finalWidth = contentWidth;
        let finalHeight = finalWidth / aspectRatio;

        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = finalHeight * aspectRatio;
        }
        
        const xOffset = MARGIN + (contentWidth - finalWidth) / 2;
        const yOffset = MARGIN + (contentHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        
        pdf.save(`${docToDownload.title}.pdf`);
        
        setIsPdfPreviewOpen(false);
        setSelectedDocument(null);
    }, 500);
  };

  const handleViewPdf = (doc: AppDocument) => {
    setSelectedDocument(doc);
    setIsPdfPreviewOpen(true);
  }

  const handleConvertDocument = (sourceDoc: AppDocument, targetType: DocumentType) => {
    resetFormState();
    setActiveTab(targetType);
    
    // Pre-populate form based on source data
    if (sourceDoc.data.customer) {
        setSelectedCustomerId(sourceDoc.data.customer.id);
    }
    if (sourceDoc.data.items) {
        setLineItems(sourceDoc.data.items.map((i: any) => ({
            description: i.description || i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice || i.price
        })));
    }
    if (sourceDoc.data.laptop) {
        setSelectedLaptopId(sourceDoc.data.laptop.id);
    }
    if (sourceDoc.data.applyVat) {
        setApplyVat(true);
    }
    if (sourceDoc.data.invoiceType) {
        setInvoiceType(sourceDoc.data.invoiceType);
    }
    if (sourceDoc.data.leaseDetails) {
        setLeaseDescription(sourceDoc.data.leaseDetails.description);
        setLeaseQuantity(sourceDoc.data.leaseDetails.quantity.toString());
        setLeaseDuration(sourceDoc.data.leaseDetails.duration.toString());
        setLeaseDurationUnit(sourceDoc.data.leaseDetails.durationUnit);
        setLeaseRate(sourceDoc.data.leaseDetails.rate.toString());
    }

    toast({
        title: "Document Converted",
        description: `Form pre-populated from ${sourceDoc.type}. Review and generate the new ${targetType}.`,
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columnActions: DocumentColumnActions = {
    onView: handleViewPdf,
    onDownload: handleDownloadPdf,
  };

  const customColumns = useMemo<ColumnDef<AppDocument, any>[]>(() => {
      const base = getDocumentColumns(columnActions);
      // Replace actions column with conversion logic
      const actionsCol = base.find(c => c.id === 'actions');
      if (actionsCol) {
          actionsCol.cell = ({ row }) => {
              const doc = row.original;
              return (
                <div className="text-right space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewPdf(doc)}>View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(doc)}>Download PDF</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Convert To</DropdownMenuLabel>
                            {doc.type === 'Quotation' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'Proforma')}>Proforma Invoice</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'Invoice')}>Invoice</DropdownMenuItem>
                                </>
                            )}
                            {doc.type === 'Proforma' && (
                                <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'Invoice')}>Invoice</DropdownMenuItem>
                            )}
                            {['Invoice', 'Receipt'].includes(doc.type) && (
                                <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'DeliveryNote')}>Delivery Note</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={() => handleViewPdf(doc)}>View</Button>
                </div>
              );
          };
      }
      return base;
  }, [columnActions]);

  const table = useReactTable({
    data: generatedDocuments || [],
    columns: customColumns,
    state: {
        pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const renderPdfPreview = () => {
    if (!selectedDocument) return null;
    switch(selectedDocument.type) {
      case 'Invoice': return <InvoicePdf document={selectedDocument} />;
      case 'Receipt': return <ReceiptPdf document={selectedDocument} />;
      case 'Proforma': return <ProformaInvoicePdf document={selectedDocument} />;
      case 'RepairNote': return <RepairNotePdf document={selectedDocument} />;
      case 'DeliveryNote': return <DeliveryNotePdf document={selectedDocument} />;
      case 'Quotation': return <QuotationPdf document={selectedDocument} />;
      case 'LPO': return <LpoPdf document={selectedDocument} />;
      case 'LeaseAgreement': return <LeaseAgreementPdf document={selectedDocument} />;
      default: return <p>Unsupported document type for preview.</p>;
    }
  }

  const renderManualItemEntry = () => (
    <div className="space-y-4">
      <Label>Line Items</Label>
      <div className="border rounded-lg">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Quantity</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-16"></TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {lineItems.map((item, index) => (
                      <TableRow key={index}>
                          <TableCell>
                              <Input placeholder="Item or service description" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} />
                          </TableCell>
                          <TableCell>
                              <Input type="number" placeholder="1" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} />
                          </TableCell>
                          <TableCell>
                              <Input type="number" placeholder="0.00" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)} />
                          </TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addLineItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button>
    </div>
  );
  
  const renderLeaseEntry = () => (
    <div className="space-y-4 rounded-md border p-4">
        <h4 className="font-medium">Lease Details</h4>
         <div className="space-y-2">
            <Label htmlFor="lease-description">Lease Description</Label>
            <Textarea id="lease-description" placeholder="e.g., Lease of HP Elitebook for company project" value={leaseDescription} onChange={e => setLeaseDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label htmlFor="lease-quantity">Quantity</Label>
                <Input id="lease-quantity" type="number" value={leaseQuantity} onChange={e => setLeaseQuantity(e.target.value)} placeholder="e.g. 5" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="lease-duration">Duration</Label>
                <Input id="lease-duration" type="number" value={leaseDuration} onChange={e => setLeaseDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="lease-unit">Unit</Label>
                 <Select onValueChange={(v: any) => setLeaseDurationUnit(v)} value={leaseDurationUnit}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Days">Days</SelectItem>
                        <SelectItem value="Weeks">Weeks</SelectItem>
                        <SelectItem value="Months">Months</SelectItem>
                        <SelectItem value="Years">Years</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="lease-rate">Rate per Unit (KES)</Label>
                <Input id="lease-rate" type="number" placeholder="e.g., 5000" value={leaseRate} onChange={e => setLeaseRate(e.target.value)} />
            </div>
        </div>
    </div>
  );


  const renderForm = (type: DocumentType) => {
    const showsLaptopSelector = ['RepairNote', 'DeliveryNote'].includes(type);
    const availableLaptops = laptops?.filter(l => l.status === 'Available' || l.status === 'Leased' || l.status === 'Repair');
    const showsInvoiceTypeSelector = ['Invoice', 'Proforma', 'Quotation'].includes(type);
    const showsLeaseSelector = type === 'LeaseAgreement';
    const showsSignaturePad = ['RepairNote', 'LeaseAgreement'].includes(type);
    const isDelivery = type === 'DeliveryNote';

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Generate {type.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
          <CardDescription>Fill in the details to generate a new {type.toLowerCase().replace(/ /g, '')}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          { type !== 'LPO' ? (
              <div>
                <Label>Related Customer</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
          ) : (
              <div>
                <Label htmlFor="supplier-name">Supplier Name</Label>
                <Input id="supplier-name" placeholder="Enter supplier name for the LPO" value={details} onChange={e => setDetails(e.target.value)} />
              </div>
          )}
          
           {showsLaptopSelector && (
             <div>
                <Label>Related Laptop (Optional if using Itemized List)</Label>
                 <Popover open={isLaptopComboboxOpen} onOpenChange={setIsLaptopComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isLaptopComboboxOpen}
                        className="w-full justify-between"
                        >
                        {selectedLaptopId
                            ? availableLaptops?.find((laptop) => laptop.id === selectedLaptopId)?.serialNumber
                            : "Select a laptop..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Search laptop by S/N or model..." />
                        <CommandEmpty>No laptop found.</CommandEmpty>
                        <CommandGroup>
                            {availableLaptops?.map((laptop) => (
                            <CommandItem
                                key={laptop.id}
                                value={`${laptop.serialNumber} ${laptop.model}`}
                                onSelect={() => {
                                setSelectedLaptopId(laptop.id);
                                setIsLaptopComboboxOpen(false);
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedLaptopId === laptop.id ? "opacity-100" : "opacity-0"
                                )}
                                />
                                {laptop.serialNumber} ({laptop.model})
                            </CommandItem>
                            ))}
                        </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
             </div>
          )}

          {showsLeaseSelector && (
              <div>
                <Label>Select Active Lease</Label>
                <Select onValueChange={setSelectedLeaseId} value={selectedLeaseId} disabled={!selectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCustomerId ? "Select a lease agreement" : "Select a customer first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {leases?.filter(l => l.customerId === selectedCustomerId).map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.laptopModel} ({format(new Date(l.startDate), 'MMM yyyy')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          )}

          {['Quotation', 'Receipt', 'Invoice', 'Proforma'].includes(type) && (
              <div className="flex items-center space-x-2">
                  <Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} />
                  <Label htmlFor="vat-switch">Apply 16% VAT</Label>
              </div>
          )}

          {type === 'Receipt' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="receipt-amount">Payment Amount</Label>
                <Input id="receipt-amount" type="number" placeholder="Enter amount received" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
          )}
          
          {showsInvoiceTypeSelector && (
            <RadioGroup value={invoiceType} onValueChange={(v: any) => setInvoiceType(v)} className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="standard" id="type-standard" className="peer sr-only" />
                    <Label htmlFor="type-standard" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Standard Itemized
                    </Label>
                </div>
                 <div>
                    <RadioGroupItem value="lease" id="type-lease" className="peer sr-only" />
                    <Label htmlFor="type-lease" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Lease-based
                    </Label>
                </div>
            </RadioGroup>
          )}

          {showsInvoiceTypeSelector && invoiceType === 'standard' && renderManualItemEntry()}
          {showsInvoiceTypeSelector && invoiceType === 'lease' && renderLeaseEntry()}

          {isDelivery && !selectedLaptopId && (
              <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Specify items for delivery if no single laptop is selected.</p>
                  {renderManualItemEntry()}
              </div>
          )}

          {type === 'LPO' && renderManualItemEntry()}


          {!showsInvoiceTypeSelector && !['Receipt', 'LPO'].includes(type) && (
            <div>
              <Label htmlFor={`${type}-details`}>Additional Details / Notes</Label>
              <Textarea id={`${type}-details`} placeholder={`Enter specific details for the ${type.toLowerCase().replace(/ /g, '')}...`} value={details} onChange={e => setDetails(e.target.value)} />
            </div>
           )}

           {isDelivery && (
               <div className="space-y-6 pt-4 border-t">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <Label>Person Delivering</Label>
                           <Input placeholder="Full Name" value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)} />
                           <SignaturePad onSave={setDelivererDelivererSignature} defaultValue={delivererSignature} label="Deliverer Signature" />
                       </div>
                       <div className="space-y-4">
                           <Label>Person Receiving</Label>
                           <Input placeholder="Full Name" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
                           <SignaturePad onSave={setRecipientSignature} defaultValue={recipientSignature} label="Recipient Signature" />
                       </div>
                   </div>
               </div>
           )}

           {showsSignaturePad && (
               <div className="pt-4 border-t">
                   <SignaturePad onSave={setSignature} defaultValue={signature} />
               </div>
           )}

        </CardContent>
        <CardFooter>
          <Button onClick={() => handleGenerateDocument(type)} className="ml-auto" disabled={anyDataLoading}>
            <Download className="mr-2 h-4 w-4" /> Generate {type.replace(/([A-Z])/g, ' $1').trim()}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Document Generation"
        description="Create and manage receipts, invoices, and other documents."
      />
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-6 overflow-x-auto">
          <TabsTrigger value="Quotation">Quotation</TabsTrigger>
          <TabsTrigger value="Invoice">Invoice</TabsTrigger>
          <TabsTrigger value="Proforma">Proforma</TabsTrigger>
          <TabsTrigger value="LeaseAgreement">Lease Agreement</TabsTrigger>
          <TabsTrigger value="Receipt">Receipt</TabsTrigger>
          <TabsTrigger value="RepairNote">Repair Note</TabsTrigger>
          <TabsTrigger value="DeliveryNote">Delivery Note</TabsTrigger>
        </TabsList>
        <TabsContent value="Quotation">{renderForm("Quotation")}</TabsContent>
        <TabsContent value="Invoice">{renderForm("Invoice")}</TabsContent>
        <TabsContent value="Proforma">{renderForm("Proforma")}</TabsContent>
        <TabsContent value="LeaseAgreement">{renderForm("LeaseAgreement")}</TabsContent>
        <TabsContent value="Receipt">{renderForm("Receipt")}</TabsContent>
        <TabsContent value="RepairNote">{renderForm("RepairNote")}</TabsContent>
        <TabsContent value="DeliveryNote">{renderForm("DeliveryNote")}</TabsContent>
      </Tabs>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle>Generated Documents</CardTitle>
            <CardDescription>List of recently generated documents.</CardDescription>
        </CardHeader>
        <CardContent>
            {anyDataLoading && <p>Loading documents...</p>}
            {!anyDataLoading && generatedDocuments?.length === 0 ? (
                <p className="text-muted-foreground">No documents generated yet.</p>
            ) : (
                <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={customColumns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <DataTablePagination table={table} />
                </div>
            )}
        </CardContent>
      </Card>
       <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col print-this">
          <DialogHeader className="no-print">
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
                PDF preview. You can print (Ctrl+P) or download from here.
            </DialogDescription>
          </DialogHeader>
          <div 
            id="pdf-preview-content"
            className="flex-grow overflow-y-auto border rounded-md bg-gray-200 p-4 print:p-0 print:border-0 print:bg-white"
          >
             {renderPdfPreview()}
          </div>
          <DialogFooter className="pt-4 no-print">
            <Button onClick={() => window.print()}>Print</Button>
            <Button onClick={() => selectedDocument && handleDownloadPdf(selectedDocument)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
