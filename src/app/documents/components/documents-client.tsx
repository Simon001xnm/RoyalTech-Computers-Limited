
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import type { DocumentType, Document as AppDocument, DocumentLineItem } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoicePdf } from "./pdfs/invoice-pdf";
import { ReceiptPdf } from "./pdfs/receipt-pdf";
import { ProformaInvoicePdf } from "./pdfs/proforma-pdf";
import { RepairNotePdf } from "./pdfs/repair-note-pdf";
import { DeliveryNotePdf } from "./pdfs/delivery-note-pdf";
import { QuotationPdf } from "./pdfs/quotation-pdf";
import { LpoPdf } from "./pdfs/lpo-pdf";
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
import { SignaturePad } from "@/components/ui/signature-pad";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSaaS } from "@/components/saas/saas-provider";

const VAT_RATE = 0.16;

export function DocumentsClient() {
  const [activeTab, setActiveTab] = useState<DocumentType>("Invoice");
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const docsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'documents'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawDocuments, isLoading: docsLoading } = useCollection(docsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection(customersQuery);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [applyVat, setApplyVat] = useState(false);
  
  const [deliveredBy, setDeliveredBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [delivererSignature, setDelivererDelivererSignature] = useState('');
  const [recipientSignature, setRecipientSignature] = useState('');
  const [signature, setSignature] = useState(''); 

  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const sortedDocuments = useMemo(() => {
      if (!rawDocuments) return [];
      return [...rawDocuments].sort((a, b) => {
          const dateA = a.generatedDate ? new Date(a.generatedDate).getTime() : 0;
          const dateB = b.generatedDate ? new Date(b.generatedDate).getTime() : 0;
          return dateB - dateA;
      });
  }, [rawDocuments]);

  const isLoading = docsLoading;
  
  const resetFormState = () => {
    setSelectedCustomerId('');
    setDetails('');
    setAmount('');
    setApplyVat(false);
    setSignature('');
    setDeliveredBy('');
    setReceivedBy('');
    setDelivererDelivererSignature('');
    setRecipientSignature('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleGenerateDocument = async (type: DocumentType) => {
    if (!tenant || !user) return;

    const docCount = rawDocuments?.length || 0;
    let title = `${type.replace(/([A-Z])/g, ' $1').trim()} #${type.slice(0,3).toUpperCase()}-2026-${String(docCount + 1).padStart(3,'0')}`;
    let relatedTo = "N/A";
    const documentData: any = { details, applyVat, signature };

    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    
    if (selectedCustomer) {
        documentData.customer = selectedCustomer;
        relatedTo = `Customer: ${selectedCustomer.name}`;
    }

    if (type === 'Receipt') {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount' });
            return;
        }
        documentData.amount = parsedAmount;
    } else if (['Quotation', 'Invoice', 'Proforma'].includes(type)) {
        const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
        documentData.items = validLineItems;
        const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const vat = applyVat ? subtotal * VAT_RATE : 0;
        documentData.subtotal = subtotal;
        documentData.vat = vat;
        documentData.total = subtotal + vat;
    } else if (type === 'DeliveryNote') {
        documentData.deliveredBy = deliveredBy;
        documentData.receivedBy = receivedBy;
        documentData.delivererSignature = delivererSignature;
        documentData.recipientSignature = recipientSignature;
        documentData.items = lineItems.filter(i => i.description.trim() !== '');
    }

    try {
        await addDoc(collection(firestore, 'documents'), {
            tenantId: tenant.id,
            type: type,
            title: title,
            generatedDate: new Date().toISOString(),
            relatedTo: relatedTo,
            data: documentData,
            createdAt: new Date().toISOString(),
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });
        toast({ title: `${type} Generated` });
        resetFormState();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleLineItemChange = (index: number, field: keyof DocumentLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: field === 'description' ? value : Number(value) || 0 };
    setLineItems(updatedItems);
  };
  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const handleDownloadPdf = async (docToDownload: AppDocument) => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    // Mount the component instantly for capture
    setSelectedDocument(docToDownload);
    setIsPdfPreviewOpen(true);

    requestAnimationFrame(async () => {
        const element = document.getElementById('pdf-preview-target');
        if (!element) return;

        try {
            const captureContainer = element.closest('.overflow-auto');
            if (captureContainer) captureContainer.scrollTo(0, 0);

            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: "#ffffff",
                width: element.scrollWidth,
                height: element.scrollHeight,
                scrollY: 0,
                x: 0,
                y: 0
            });
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            pdf.save(`${docToDownload.title}.pdf`);
        } catch (err) {
            toast({ variant: 'destructive', title: 'PDF Generation Failed' });
        } finally {
            setIsPdfPreviewOpen(false);
        }
    });
  };

  const handleViewPdf = (doc: AppDocument) => {
    setSelectedDocument(doc);
    setIsPdfPreviewOpen(true);
  }

  const handleConvertDocument = (sourceDoc: AppDocument, targetType: DocumentType) => {
    resetFormState();
    setActiveTab(targetType);
    if (sourceDoc.data.customer) setSelectedCustomerId(sourceDoc.data.customer.id);
    if (sourceDoc.data.items) setLineItems(sourceDoc.data.items);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columnActions: DocumentColumnActions = { onView: handleViewPdf, onDownload: handleDownloadPdf };
  const customColumns = useMemo<ColumnDef<AppDocument, any>[]>(() => {
      const base = getDocumentColumns(columnActions);
      const actionsCol = base.find(c => c.id === 'actions');
      if (actionsCol) {
          actionsCol.cell = ({ row }) => {
              const doc = row.original;
              return (
                <div className="text-right space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewPdf(doc)}>View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(doc)}>Download PDF</DropdownMenuItem>
                            <DropdownMenuSeparator /><DropdownMenuLabel>Convert To</DropdownMenuLabel>
                            {doc.type === 'Quotation' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'Proforma')}>Proforma</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'Invoice')}>Invoice</DropdownMenuItem>
                                </>
                            )}
                            {['Invoice', 'Receipt'].includes(doc.type) && <DropdownMenuItem onClick={() => handleConvertDocument(doc, 'DeliveryNote')}>Delivery Note</DropdownMenuItem>}
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
    data: sortedDocuments,
    columns: customColumns,
    state: { pagination },
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
      default: return null;
    }
  }

  const renderManualItemEntry = () => (
    <div className="space-y-4">
      <Label>Line Items</Label>
      <div className="border rounded-lg">
          <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="w-24">Qty</TableHead><TableHead className="w-32">Price</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
              <TableBody>
                  {lineItems.map((item, index) => (
                      <TableRow key={index}>
                          <TableCell><Input placeholder="Item description" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)} /></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addLineItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button>
    </div>
  );

  const renderForm = (type: DocumentType) => {
    const isDelivery = type === 'DeliveryNote';
    const showsItemEntry = ['Invoice', 'Proforma', 'Quotation', 'DeliveryNote', 'LPO'].includes(type);
    return (
      <Card className="shadow-lg border-primary/10">
        <CardHeader><CardTitle>Generate Branded {type}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Customer</Label>
            <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {['Quotation', 'Invoice', 'Proforma'].includes(type) && (
              <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg"><Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} /><Label htmlFor="vat-switch" className="cursor-pointer">Apply 16% VAT</Label></div>
          )}
          {type === 'Receipt' && (
            <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11" /></div>
          )}
          {showsItemEntry && renderManualItemEntry()}
          {isDelivery && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                   <div className="space-y-4"><Label>Delivered By</Label><Input value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)} /><SignaturePad onSave={setDelivererDelivererSignature} /></div>
                   <div className="space-y-4"><Label>Received By</Label><Input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} /><SignaturePad onSave={setRecipientSignature} /></div>
               </div>
           )}
        </CardContent>
        <CardFooter><Button onClick={() => handleGenerateDocument(type)} className="ml-auto h-11 px-8 font-bold" disabled={isLoading}>Generate Document</Button></CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Branded Documents (Cloud)" description="Professional invoices and quotations synchronized globally." />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-6 overflow-x-auto h-auto p-1 bg-muted/50 border">
          <TabsTrigger value="Quotation" className="py-2">Quotation</TabsTrigger>
          <TabsTrigger value="Invoice" className="py-2">Invoice</TabsTrigger>
          <TabsTrigger value="Proforma" className="py-2">Proforma</TabsTrigger>
          <TabsTrigger value="Receipt" className="py-2">Receipt</TabsTrigger>
          <TabsTrigger value="DeliveryNote" className="py-2">Delivery</TabsTrigger>
        </TabsList>
        <TabsContent value="Quotation">{renderForm("Quotation")}</TabsContent>
        <TabsContent value="Invoice">{renderForm("Invoice")}</TabsContent>
        <TabsContent value="Proforma">{renderForm("Proforma")}</TabsContent>
        <TabsContent value="Receipt">{renderForm("Receipt")}</TabsContent>
        <TabsContent value="DeliveryNote">{renderForm("DeliveryNote")}</TabsContent>
      </Tabs>
      <Card className="mt-8 shadow-md"><CardContent className="pt-6">
        <div className="rounded-lg border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map(hg => (
                        <TableRow key={hg.id}>
                            {hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No documents archived yet.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </div>
      </CardContent></Card>

       <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <div className="flex-grow overflow-auto bg-slate-200/50 backdrop-blur-md flex justify-center p-4 py-8">
            <div id="pdf-preview-target" className="shrink-0 shadow-2xl relative bg-white overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
                {renderPdfPreview()}
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-3 bg-white no-print">
            <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)}>Close Preview</Button>
            <Button onClick={() => window.print()} className="font-bold">
                Print Document (A4)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
