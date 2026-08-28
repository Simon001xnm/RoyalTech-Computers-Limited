"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Loader2, Download, Filter } from "lucide-react";
import type { DocumentType, Document as AppDocument, DocumentLineItem, User as AppUser } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, getDocs, deleteDoc, writeBatch, setDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { InvoicePdf } from "./pdfs/invoice-pdf";
import { ReceiptPdf } from "./pdfs/receipt-pdf";
import { ThermalReceiptPdf } from "./pdfs/thermal-receipt-pdf";
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
  type PaginationState,
} from "@tanstack/react-table";
import { getDocumentColumns, type DocumentColumnActions } from "./document-columns";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSaaS } from "@/components/saas/saas-provider";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const VAT_RATE = 0.16;

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN',
    'Proforma': 'PRO',
    'RepairNote': 'RPN',
    'DeliveryNote': 'DLV',
    'LPO': 'LPO',
    'PurchaseOrder': 'LPO',
    'CreditNote': 'CRN',
    'DebitNote': 'DBN',
    'CustomerStatement': 'STM'
};

export function DocumentsClient() {
  const [activeTab, setActiveTab] = useState<DocumentType>("Invoice");
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isGeneratingDelivery, setIsGeneratingDelivery] = useState(false);

  const [exportType, setExportType] = useState<'A4' | 'Thermal'>('A4');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [docToDelete, setDocToDelete] = useState<AppDocument | null>(null);

  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<AppUser>(profileRef);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

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

  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: workspaceProfile } = useDoc(companyRef);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerBalance, setCustomerBalance] = useState(0);
  const [applyVat, setApplyVat] = useState(false);
  
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!selectedCustomerId || !tenant) {
      setCustomerBalance(0);
      return;
    }

    const fetchBalance = async () => {
      try {
        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(
          salesRef, 
          where('tenantId', '==', tenant.id), 
          where('customerId', '==', selectedCustomerId)
        );
        const snap = await getDocs(q);
        const totalBalance = snap.docs.reduce((acc, doc) => acc + (doc.data().balance || 0), 0);
        setCustomerBalance(totalBalance);
      } catch (e) {
        console.error("Balance fetch error:", e);
      }
    };

    fetchBalance();
  }, [selectedCustomerId, tenant, firestore]);

  const availableMonths = useMemo(() => {
    if (!rawDocuments) return [];
    const monthsSet = new Set<string>();
    rawDocuments.forEach(d => {
        try {
            monthsSet.add(format(parseISO(d.generatedDate), 'yyyy-MM'));
        } catch (e) {}
    });
    monthsSet.add(format(new Date(), 'yyyy-MM'));
    return Array.from(monthsSet).sort().reverse();
  }, [rawDocuments]);

  const filteredDocuments = useMemo(() => {
      if (!rawDocuments) return [];
      
      let results = [...rawDocuments];

      if (monthFilter !== 'all') {
          results = results.filter(d => {
              try { 
                  return format(parseISO(d.generatedDate), 'yyyy-MM') === monthFilter;
              } catch { return false; }
          });
      }

      return results.sort((a, b) => {
          const dateA = a.generatedDate ? new Date(a.generatedDate).getTime() : 0;
          const dateB = b.generatedDate ? new Date(b.generatedDate).getTime() : 0;
          return dateB - dateA;
      });
  }, [rawDocuments, monthFilter]);

  const handleGenerateDocument = async (type: DocumentType) => {
    if (!tenant || !user) return;

    const typeCount = rawDocuments?.filter(d => d.type === type).length || 0;
    const seq = typeCount + 1;
    const docTitle = `${type} #${String(seq).padStart(3, '0')}`;
    let relatedTo = "N/A";
    
    const documentData: any = { 
        applyVat,
        previousBalance: customerBalance, 
        workspace: workspaceProfile ? {
            name: workspaceProfile.name || '',
            address: workspaceProfile.address || '',
            phone: workspaceProfile.phone || '',
            email: workspaceProfile.email || '',
            website: workspaceProfile.website || '',
            logoUrl: workspaceProfile.logoUrl || null,
            primaryColor: workspaceProfile.primaryColor || null,
            secondaryColor: workspaceProfile.secondaryColor || null,
            taxPin: workspaceProfile.taxPin || null
        } : null
    };

    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    
    if (selectedCustomer) {
        documentData.customer = {
            id: selectedCustomer.id || '',
            name: selectedCustomer.name || 'Client',
            alias: selectedCustomer.alias || '',
            phone: selectedCustomer.phone || '',
            email: selectedCustomer.email || '',
            address: selectedCustomer.address || ''
        };
        relatedTo = selectedCustomer.alias ? `${selectedCustomer.alias} (${selectedCustomer.name})` : selectedCustomer.name;
    }

    const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
    documentData.items = validLineItems;
    const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const vat = applyVat ? subtotal * VAT_RATE : 0;
    documentData.subtotal = subtotal;
    documentData.vat = vat;
    documentData.total = subtotal + vat;

    const timestamp = new Date().toISOString();

    try {
        const batch = writeBatch(firestore);
        const docRef = doc(collection(firestore, 'documents'));
        
        batch.set(docRef, {
            tenantId: tenant.id,
            type: type,
            title: docTitle,
            generatedDate: timestamp,
            relatedTo: relatedTo,
            data: documentData,
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });

        if (type === 'Invoice' || type === 'Receipt') {
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            const saleStatus = type === 'Receipt' ? 'Paid' : 'Credit';
            
            batch.set(saleRef, {
                id: saleRef.id,
                documentId: docRef.id,
                tenantId: tenant.id,
                date: timestamp,
                customerId: selectedCustomerId || 'walk-in',
                customerName: relatedTo,
                items: validLineItems.map(i => ({ ...i, type: 'custom', id: crypto.randomUUID(), productId: 'custom', total: i.quantity * i.unitPrice, sellingPrice: i.unitPrice })),
                subtotal,
                vatAmount: vat,
                total: subtotal + vat,
                amountPaid: type === 'Receipt' ? (subtotal + vat) : 0,
                balance: type === 'Receipt' ? 0 : (subtotal + vat),
                status: saleStatus,
                paymentMethod: type === 'Receipt' ? 'Cash' : 'Credit',
                createdAt: timestamp,
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
        }

        await batch.commit();
        toast({ title: "Paperwork Saved & Synced" });
        setSelectedCustomerId('');
        setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving' });
    }
  };

  const handleGenerateDeliveryNote = async (sourceDoc: AppDocument) => {
    if (!tenant || !user) return;
    setIsGeneratingDelivery(true);

    try {
        const typeCount = rawDocuments?.filter(d => d.type === 'DeliveryNote').length || 0;
        const seq = typeCount + 1;
        const docTitle = `Delivery Note #${String(seq).padStart(3, '0')}`;

        const deliveryData = {
            ...sourceDoc.data,
            sourceDocumentId: sourceDoc.id,
            sourceTitle: sourceDoc.title,
            generatedDate: new Date().toISOString(),
            details: `Delivery for ${sourceDoc.title}`
        };

        await addDoc(collection(firestore, 'documents'), {
            tenantId: tenant.id,
            type: 'DeliveryNote',
            title: docTitle,
            generatedDate: new Date().toISOString(),
            relatedTo: sourceDoc.relatedTo,
            data: deliveryData,
            createdAt: new Date().toISOString(),
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });

        toast({ title: "Delivery Note Created" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error' });
    } finally {
        setIsGeneratingDelivery(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete || !tenant || !isAdmin) return;
    setIsDeleting(true);

    try {
        const batch = writeBatch(firestore);
        batch.delete(doc(firestore, 'documents', docToDelete.id));

        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(salesRef, where('tenantId', '==', tenant.id), where('documentId', '==', docToDelete.id));
        const salesSnap = await getDocs(q);
        
        salesSnap.forEach((saleDoc) => {
            batch.delete(doc(firestore, 'sales_transactions', saleDoc.id));
        });

        await batch.commit();
        toast({ title: "Record Deleted" });
        setDocToDelete(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Delete Failed" });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (docToDownload: AppDocument, type: 'A4' | 'Thermal' = 'A4') => {
    setIsExporting(true);
    setExportType(type);
    
    const originalScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    setSelectedDocument(docToDownload);
    setIsPdfPreviewOpen(true);

    await new Promise(r => setTimeout(r, 1000)); 

    const isThermal = type === 'Thermal';
    const pages = document.querySelectorAll('.a4-pdf-page');

    try {
        if (isThermal || pages.length === 0) {
            // SINGLE PAGE LOGIC (Thermal or simple doc)
            const element = document.getElementById('pdf-preview-target');
            if (!element) throw new Error("Element not found");

            const canvas = await html2canvas(element, { 
                scale: 3.0, 
                useCORS: true,
                backgroundColor: "#ffffff",
                width: isThermal ? 302 : 794, 
                y: 0,
                scrollY: 0
            });
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: isThermal ? [80, canvas.height * 0.264583 / 3.0] : 'a4',
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            if (isThermal) {
                pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 0.264583 / 3.0, undefined, 'FAST');
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }
            
            const initials = TYPE_INITIALS[docToDownload.type] || 'DOC';
            const filename = `${initials}_${(docToDownload.relatedTo || 'CLIENT').slice(0,3).toUpperCase()}.pdf`;
            pdf.save(filename);
        } else {
            // MULTI-PAGE LOGIC (A4 Document)
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
            });

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const canvas = await html2canvas(pages[i] as HTMLElement, {
                    scale: 3.0,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794,
                    height: 1123,
                    y: 0,
                    scrollY: 0
                });
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }

            const initials = TYPE_INITIALS[docToDownload.type] || 'DOC';
            const filename = `${initials}_${(docToDownload.relatedTo || 'CLIENT').slice(0,3).toUpperCase()}.pdf`;
            pdf.save(filename);
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'Export Failed' });
    } finally {
        setIsPdfPreviewOpen(false);
        setIsExporting(false);
        window.scrollTo({ top: originalScrollY, behavior: 'instant' });
    }
  };

  const columnActions: DocumentColumnActions = { 
    onView: (d) => { setExportType('A4'); setSelectedDocument(d); setIsPdfPreviewOpen(true); }, 
    onDownload: handleDownloadPdf,
    onDelete: isAdmin ? (d) => setDocToDelete(d) : undefined,
    onGenerateDelivery: handleGenerateDeliveryNote,
    onWhatsApp: (d) => {
        const phone = d.data?.customer?.phone || "";
        const msg = `Hello! Your ${d.type} (${d.title}) is ready. Thank you!`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    },
  };
  
  const customColumns = useMemo(() => getDocumentColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredDocuments,
    columns: customColumns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const renderPdfPreview = () => {
    if (!selectedDocument) return null;
    if (exportType === 'Thermal' && (selectedDocument.type === 'Receipt' || selectedDocument.type === 'Invoice')) {
        return <ThermalReceiptPdf document={selectedDocument} />;
    }
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
  };

  const handleLineItemChange = (index: number, field: keyof DocumentLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: field === 'description' ? value : Number(value) || 0 };
    setLineItems(updatedItems);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shop Paperwork" description="View and create documents for your clients." />
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1 bg-muted/50 border">
          <TabsTrigger value="Quotation" className="font-black uppercase text-[8px] md:text-[9px] py-3">Quotation</TabsTrigger>
          <TabsTrigger value="Invoice" className="font-black uppercase text-[8px] md:text-[9px] py-3">Invoice</TabsTrigger>
          <TabsTrigger value="Proforma" className="font-black uppercase text-[8px] md:text-[9px] py-3">Proforma</TabsTrigger>
          <TabsTrigger value="Receipt" className="font-black uppercase text-[8px] md:text-[9px] py-3">Receipt</TabsTrigger>
        </TabsList>
        <TabsContent value="Quotation">{renderForm("Quotation")}</TabsContent>
        <TabsContent value="Invoice">{renderForm("Invoice")}</TabsContent>
        <TabsContent value="Proforma">{renderForm("Proforma")}</TabsContent>
        <TabsContent value="Receipt">{renderForm("Receipt")}</TabsContent>
      </Tabs>
      
      <Card className="mt-8 shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-muted/50 py-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Past Paperwork</CardTitle>
                <div className="flex items-center gap-3">
                    <Label className="text-[10px] font-black uppercase opacity-40">Choose Month:</Label>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="h-9 w-40 bg-white font-bold text-[10px] uppercase">
                            <Filter className="h-3 w-3 mr-2 text-primary" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Records</SelectItem>
                            {availableMonths.map(m => (
                                <SelectItem key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            {docsLoading || isGeneratingDelivery ? (
                <div className="p-12 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking Records...
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader className="bg-muted/20">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase py-4">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={customColumns.length} className="h-32 text-center text-muted-foreground italic text-xs">No records for this month.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <DataTablePagination table={table} />
                </>
            )}
          </CardContent>
      </Card>

       <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-6 bg-white border-b no-print">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">View Paper</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!, 'A4')} className="h-8 font-black uppercase text-[9px] tracking-widest border-2">Download A4</Button>
                    {selectedDocument?.type !== 'Quotation' && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!, 'Thermal')} className="h-8 font-black uppercase text-[9px] tracking-widest border-2">Download Small</Button>
                    )}
                </div>
            </div>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-4 md:p-8">
            <div id="pdf-preview-target" className={cn(
                "shrink-0 relative overflow-visible origin-top scale-[0.4] sm:scale-[0.6] md:scale-100",
                exportType === 'Thermal' ? "w-[80mm] h-fit bg-white" : "w-[210mm] min-h-[297mm]"
            )}>
                {renderPdfPreview()}
            </div>
          </div>
          <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-3 bg-white no-print">
            {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)} className="font-bold w-full sm:w-auto">Close</Button>
            <Button onClick={() => handleDownloadPdf(selectedDocument!, 'A4')} className="font-black uppercase w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Delete for Good?</DialogTitle>
                <DialogDescription className="font-medium text-base pt-2">
                    This will remove <strong>{docToDelete?.title}</strong> and all its money details from the shop records. This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDocToDelete(null)} disabled={isDeleting} className="font-bold">Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteDocument} disabled={isDeleting} className="font-black uppercase tracking-widest">
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderForm(type: DocumentType) {
    const showsItemEntry = ['Invoice', 'Proforma', 'Quotation', 'LPO', 'Receipt'].includes(type);
    return (
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg font-black uppercase">Create {type.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
            <CardDescription>Enter details below to create your paper.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase opacity-60">Pick Client</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Pick a name..." /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.alias ? `${c.alias} (${c.name})` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-xl border h-11 self-end">
                <Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} />
                <Label htmlFor="vat-switch" className="cursor-pointer font-bold text-xs">Add 16% Tax (VAT)</Label>
              </div>
          </div>

          {showsItemEntry && (
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase opacity-60">Item Details</Label>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase min-w-[200px]">Item Description</TableHead>
                                <TableHead className="w-24 text-[10px] font-black uppercase">Qty</TableHead>
                                <TableHead className="w-32 text-[10px] font-black uppercase">Price</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell><Input className="h-9 border-none bg-transparent" placeholder="e.g. Laptop" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" className="h-9 border-none bg-transparent" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" className="h-9 border-none bg-transparent" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)} /></TableCell>
                                    <TableCell><Button variant="ghost" size="icon" onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} disabled={lineItems.length === 1}><Trash2 className="h-4 w-4 text-destructive/50" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])} className="h-8 font-bold"><PlusCircle className="mr-2 h-3 w-3"/>Add Another Row</Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 border-t py-4">
            <Button onClick={() => handleGenerateDocument(type)} className="w-full sm:w-auto ml-auto font-black uppercase" disabled={docsLoading}>
                Save and Sync Dashboard
            </Button>
        </CardFooter>
      </Card>
    );
  }
}
