"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, Loader2, Download, Filter, DollarSign, Check, X, Save } from "lucide-react";
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
import { collection, query, where, addDoc, doc, getDocs, deleteDoc, writeBatch, updateDoc } from "firebase/firestore";
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
  const [isGenerating, setIsGenerating] = useState(false);

  const [exportType, setExportType] = useState<'A4' | 'Thermal'>('A4');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [docToDelete, setDocToDelete] = useState<AppDocument | null>(null);

  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<AppDocument | null>(null);

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
    if (editingDoc) {
        setSelectedCustomerId(editingDoc.data?.customer?.id || '');
        setApplyVat(editingDoc.data?.applyVat || false);
        
        const normalizedItems = (editingDoc.data?.items || []).map((item: any) => ({
            description: item.description ?? item.name ?? '',
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? item.sellingPrice ?? 0
        }));
        
        setLineItems(normalizedItems.length > 0 ? normalizedItems : [{ description: '', quantity: 1, unitPrice: 0 }]);
        setActiveTab(editingDoc.type);
    }
  }, [editingDoc]);

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
        
        const totalBalance = snap.docs.reduce((acc, saleDoc) => {
            if (editingDoc && saleDoc.data().documentId === editingDoc.id) {
                return acc;
            }
            return acc + (saleDoc.data().balance || 0);
        }, 0);
        
        setCustomerBalance(totalBalance);
      } catch (e) {
        console.error("Balance fetch error:", e);
      }
    };

    fetchBalance();
  }, [selectedCustomerId, tenant, firestore, editingDoc]);

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

  const handleConvertToInvoice = async (originDoc: AppDocument) => {
    if (!tenant || !user) return;
    setIsGenerating(true);
    try {
        const timestamp = new Date().toISOString();
        const typeCount = rawDocuments?.filter(d => d.type === 'Invoice').length || 0;
        const docTitle = `Invoice #${String(typeCount + 1).padStart(3, '0')}`;

        const batch = writeBatch(firestore);
        const docRef = doc(collection(firestore, 'documents'));
        
        const invoiceData = {
            ...originDoc.data,
            type: 'Invoice',
            title: docTitle,
            generatedDate: timestamp,
            status: 'Credit'
        };

        batch.set(docRef, {
            tenantId: tenant.id,
            type: 'Invoice',
            title: docTitle,
            generatedDate: timestamp,
            relatedTo: originDoc.relatedTo,
            data: invoiceData,
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });

        const saleRef = doc(collection(firestore, 'sales_transactions'));
        batch.set(saleRef, {
            id: saleRef.id,
            documentId: docRef.id,
            tenantId: tenant.id,
            date: timestamp,
            customerId: originDoc.data?.customer?.id || 'walk-in',
            customerName: originDoc.relatedTo,
            invoiceNumber: docTitle,
            items: originDoc.data?.items || [],
            subtotal: originDoc.data?.subtotal || 0,
            vatAmount: originDoc.data?.vat || 0,
            total: originDoc.data?.total || 0,
            amountPaid: 0,
            balance: originDoc.data?.total || 0,
            status: 'Credit',
            paymentMethod: 'Credit',
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || 'User' }
        });

        await batch.commit();
        toast({ title: "Invoice Generated from Quote" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Conversion Failed" });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleLogPayment = async () => {
    if (!targetInvoice || !tenant || !user) return;
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast({ variant: 'destructive', title: "Enter valid amount" });
        return;
    }

    setIsSubmittingPayment(true);
    try {
        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(salesRef, where('documentId', '==', targetInvoice.id));
        const snap = await getDocs(q);

        if (snap.empty) {
            toast({ variant: 'destructive', title: "Financial record not found" });
            return;
        }

        const saleDoc = snap.docs[0];
        const currentBal = Number(saleDoc.data().balance) || 0;
        const currentPaid = Number(saleDoc.data().amountPaid) || 0;
        
        const deduct = Math.min(currentBal, amountToPay);
        const newBal = currentBal - deduct;

        const timestamp = new Date().toISOString();

        await updateDoc(doc(firestore, 'sales_transactions', saleDoc.id), {
            balance: newBal,
            amountPaid: currentPaid + deduct,
            status: newBal <= 0 ? 'Paid' : 'Partial',
            updatedAt: timestamp
        });

        await addDoc(collection(firestore, 'payments'), {
            tenantId: tenant.id,
            customerId: saleDoc.data().customerId,
            customerName: saleDoc.data().customerName,
            amount: deduct,
            method: "Cash",
            type: 'Payment',
            reference: targetInvoice.title,
            date: timestamp,
            saleId: saleDoc.id,
            documentId: targetInvoice.id,
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || user.email }
        });

        toast({ title: "Payment Applied Successfully" });
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Action Failed" });
    } finally {
        setIsSubmittingPayment(false);
    }
  };

  const handleGenerateDocument = async (type: DocumentType) => {
    if (!tenant || !user) return;
    setIsGenerating(true);

    const isEditing = !!editingDoc;
    let docTitle = editingDoc?.title;
    
    if (!isEditing) {
        const typeCount = rawDocuments?.filter(d => d.type === type).length || 0;
        const seq = typeCount + 1;
        docTitle = `${type} #${String(seq).padStart(3, '0')}`;
    }

    let relatedTo = "N/A";
    
    const documentData: any = { 
        applyVat,
        isEdited: isEditing,
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
            taxPin: workspaceProfile.taxPin || null,
            bankName: workspaceProfile.bankName || '',
            bankAccName: workspaceProfile.bankAccName || '',
            bankAccNo: workspaceProfile.bankAccNo || '',
            paybillNumber: workspaceProfile.paybillNumber || '',
            paybillAccount: workspaceProfile.paybillAccount || '',
            tillNumber: workspaceProfile.tillNumber || '',
            mobileMoneyPhone: workspaceProfile.mobileMoneyPhone || '',
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

    const validLineItems = lineItems.filter(item => (item.description || '').trim() !== '' && (item.quantity || 0) > 0 && (item.unitPrice || 0) > 0);
    documentData.items = validLineItems;
    const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const vat = applyVat ? subtotal * VAT_RATE : 0;
    documentData.subtotal = subtotal;
    documentData.vat = vat;
    const currentDocTotal = subtotal + vat;
    documentData.total = currentDocTotal;

    const timestamp = new Date().toISOString();

    try {
        const batch = writeBatch(firestore);
        const docRef = isEditing ? doc(firestore, 'documents', editingDoc.id) : doc(collection(firestore, 'documents'));
        
        const mainDocData = {
            tenantId: tenant.id,
            type: type,
            title: docTitle,
            generatedDate: isEditing ? editingDoc.generatedDate : timestamp,
            relatedTo: relatedTo,
            data: documentData,
            createdAt: isEditing ? editingDoc.createdAt : timestamp,
            updatedAt: timestamp,
            createdBy: isEditing ? editingDoc.createdBy : { uid: user.uid, name: user.displayName || 'User' }
        };

        batch.set(docRef, mainDocData);

        if (type === 'Invoice' || type === 'Receipt') {
            const salesRef = collection(firestore, 'sales_transactions');
            
            let saleRef = doc(collection(firestore, 'sales_transactions'));
            let existingAmountPaid = 0;

            if (isEditing) {
                const q = query(salesRef, where('documentId', '==', editingDoc.id));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const saleDoc = snap.docs[0];
                    saleRef = doc(firestore, 'sales_transactions', saleDoc.id);
                    existingAmountPaid = Number(saleDoc.data().amountPaid) || 0;
                }
            }

            const newAmountPaid = type === 'Receipt' ? currentDocTotal : existingAmountPaid;
            const newBalance = Math.max(0, currentDocTotal - newAmountPaid);
            const saleStatus = newBalance <= 0 ? 'Paid' : (newAmountPaid > 0 ? 'Partial' : 'Credit');

            batch.set(saleRef, {
                id: saleRef.id,
                documentId: docRef.id,
                tenantId: tenant.id,
                date: isEditing ? editingDoc.generatedDate : timestamp,
                customerId: selectedCustomerId || 'walk-in',
                customerName: relatedTo,
                invoiceNumber: docTitle,
                items: validLineItems.map(i => ({ ...i, type: 'custom', id: crypto.randomUUID(), productId: 'custom', total: i.quantity * i.unitPrice, sellingPrice: i.unitPrice })),
                subtotal,
                vatAmount: vat,
                total: currentDocTotal,
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: saleStatus,
                paymentMethod: type === 'Receipt' ? 'Cash' : 'Credit',
                createdAt: isEditing ? editingDoc.createdAt : timestamp,
                updatedAt: timestamp,
                createdBy: isEditing ? editingDoc.createdBy : { uid: user.uid, name: user.displayName || 'User' }
            });

            if (type === 'Receipt') {
                const payRef = doc(collection(firestore, 'payments'));
                batch.set(payRef, {
                    tenantId: tenant.id,
                    customerId: selectedCustomerId || 'walk-in',
                    customerName: relatedTo,
                    amount: currentDocTotal,
                    method: 'Cash',
                    type: 'Payment',
                    reference: docTitle,
                    date: isEditing ? editingDoc.generatedDate : timestamp,
                    saleId: saleRef.id,
                    documentId: docRef.id,
                    createdAt: isEditing ? editingDoc.createdAt : timestamp,
                    updatedAt: timestamp,
                    createdBy: isEditing ? editingDoc.createdBy : { uid: user.uid, name: user.displayName || 'User' }
                });
            }
        }

        await batch.commit();
        toast({ title: isEditing ? "Document Updates Saved" : "Paperwork Saved & Synced" });
        
        handleCancelEdit();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving' });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDoc(null);
    setSelectedCustomerId('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setApplyVat(false);
  };

  const handleDownloadPdf = async (docToDownload: AppDocument, type: 'A4' | 'Thermal' = 'A4') => {
    setIsExporting(true);
    setExportType(type);
    
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    setSelectedDocument(docToDownload);
    setIsPdfPreviewOpen(true);

    await new Promise(r => setTimeout(r, 1200)); 

    const isThermal = type === 'Thermal';

    try {
        const pages = document.querySelectorAll('.a4-pdf-page');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: isThermal ? [80, 297] : 'a4',
        });

        if (pages.length === 0) {
            const element = document.getElementById('pdf-preview-target');
            if (!element) throw new Error("Element not found");
            const canvas = await html2canvas(element, { scale: 3.5, useCORS: true, backgroundColor: "#ffffff", width: isThermal ? 302 : 794 });
            const imgData = canvas.toDataURL('image/png', 1.0);
            if (isThermal) pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 0.264583 / 3.5);
            else pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        } else {
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const canvas = await html2canvas(pages[i] as HTMLElement, {
                    scale: 3.5,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794,
                    height: 1123,
                    y: 0,
                    scrollY: 0,
                    windowWidth: 794
                });
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }
        }
        
        const initials = TYPE_INITIALS[docToDownload.type] || 'DOC';
        pdf.save(`${initials}_${(docToDownload.relatedTo || 'VAL').slice(0,3).toUpperCase()}.pdf`);
    } catch (err) {
        console.error("PDF Export error:", err);
        toast({ variant: 'destructive', title: 'Export Failed' });
    } finally {
        setIsPdfPreviewOpen(false);
        setIsExporting(false);
    }
  };

  const columnActions: DocumentColumnActions = { 
    onView: (d) => { setExportType('A4'); setSelectedDocument(d); setIsPdfPreviewOpen(true); }, 
    onEdit: (d) => { setEditingDoc(d); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    onDownload: handleDownloadPdf,
    onDelete: isAdmin ? (d) => setDocToDelete(d) : undefined,
    onWhatsApp: (d) => {
        const phone = d.data?.customer?.phone || "";
        const msg = `Hello! Your ${d.type} (${d.title}) is ready. Thank you!`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    },
    onConvertToInvoice: handleConvertToInvoice,
    onMarkPaid: (d) => { setTargetInvoice(d); setIsPaymentDialogOpen(true); }
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
    <div className="space-y-3 sm:space-y-6 px-1 sm:px-0">
      <PageHeader title="Shop Paperwork" description="View and create documents for your clients." />
      
      <Tabs value={activeTab} onValueChange={(v) => !editingDoc && setActiveTab(v as DocumentType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-8 h-auto p-1 bg-muted/50 border overflow-x-auto no-scrollbar">
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
      
      <Card className="mt-4 sm:mt-8 shadow-2xl border-none overflow-hidden rounded-xl sm:rounded-[2rem]">
          <CardHeader className="bg-muted/50 py-3 sm:py-4 px-4 sm:px-6 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60">Past Paperwork</CardTitle>
                <div className="flex items-center gap-3">
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase opacity-40">Choose Month:</Label>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="h-8 sm:h-9 w-32 sm:w-40 bg-white font-bold text-[9px] sm:text-[10px] uppercase">
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
          <CardContent className="p-0">
            {docsLoading || isGenerating ? (
                <div className="p-12 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking Records...
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/20">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (
                                        <TableHead key={h.id} className="text-[9px] sm:text-[10px] font-black uppercase py-4 px-3 sm:px-4">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-2 sm:py-4 px-3 sm:px-4 text-[11px] sm:text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={customColumns.length} className="h-32 text-center text-muted-foreground italic text-xs">No records for this month.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <DataTablePagination table={table} />
                </div>
            )}
          </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md border-none shadow-2xl rounded-2xl">
              <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Record Payment
                  </DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                      Applying payment to {targetInvoice?.title}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Amount Received (KES)</p>
                      <Input 
                        type="number" 
                        value={paymentAmount ?? ''} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="h-14 text-2xl font-black border-2 border-primary rounded-xl"
                        autoFocus
                      />
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="font-bold h-12 rounded-xl">Cancel</Button>
                  <Button onClick={handleLogPayment} disabled={isSubmittingPayment} className="font-black uppercase tracking-widest h-12 px-8 shadow-lg rounded-xl">
                      {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Save Payment
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

       <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="w-full sm:max-w-5xl h-[100vh] sm:h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-4 sm:p-6 bg-white border-b no-print">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-base sm:text-xl font-black uppercase tracking-tight">View Paper</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!, 'A4')} className="h-8 font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-2">A4</Button>
                    {(selectedDocument?.type === 'Receipt' || selectedDocument?.type === 'Invoice') && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(selectedDocument!, 'Thermal')} className="h-8 font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-2">Small</Button>
                    )}
                </div>
            </div>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-2 sm:p-8">
            <div id="pdf-preview-target" className={cn(
                "shrink-0 relative overflow-visible origin-top scale-[0.35] sm:scale-[0.6] md:scale-100",
                exportType === 'Thermal' ? "w-[80mm] h-fit bg-white" : "" 
            )}>
                {renderPdfPreview()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Delete for Good?</DialogTitle>
                <DialogDescription className="font-medium text-base pt-2">
                    This will remove <strong>{docToDelete?.title}</strong> permanently.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDocToDelete(null)} disabled={isDeleting} className="font-bold h-12 rounded-xl">Cancel</Button>
                <Button variant="destructive" onClick={async () => { if (docToDelete) { await deleteDoc(doc(firestore, 'documents', docToDelete.id)); setDocToDelete(null); } }} disabled={isDeleting} className="font-black uppercase tracking-widest h-12 rounded-xl">
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderForm(type: DocumentType) {
    const showsItemEntry = ['Invoice', 'Proforma', 'Quotation', 'LPO', 'Receipt'].includes(type);
    const isEditing = !!editingDoc;

    return (
      <Card className={cn(
        "shadow-lg transition-all border-none ring-1 ring-black/5 rounded-xl sm:rounded-[2rem]",
        isEditing ? "border-amber-400 border-2 ring-4 ring-amber-50" : ""
      )}>
        <CardHeader className={cn(
            "border-b flex flex-row items-center justify-between p-4 sm:p-6",
            isEditing ? "bg-amber-50" : "bg-primary/5"
        )}>
            <div>
                <CardTitle className="text-sm sm:text-lg font-black uppercase">
                    {isEditing ? "Modifying Data" : `Create ${type.replace(/([A-Z])/g, ' $1').trim()}`}
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm">
                    {isEditing ? `Editing ${editingDoc.title}` : "Create your paper."}
                </CardDescription>
            </div>
            {isEditing && (
                <Badge className="bg-amber-600 text-white font-black uppercase text-[8px] sm:text-[10px] h-5 sm:h-6">Active</Badge>
            )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase opacity-60">Pick Client</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId ?? ''}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Pick a name..." /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.alias ? `${c.alias} (${c.name})` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 bg-muted/30 p-3 sm:p-4 rounded-xl border h-11 self-end">
                <Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} className="scale-75 sm:scale-100" />
                <Label htmlFor="vat-switch" className="cursor-pointer font-bold text-[10px] sm:text-xs">Add 16% VAT</Label>
              </div>
          </div>

          {showsItemEntry && (
            <div className="space-y-3">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase opacity-60">Item Details</Label>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[9px] font-black uppercase px-3 py-3">Description</TableHead>
                                <TableHead className="w-16 text-[9px] font-black uppercase px-1 py-3 text-center">Qty</TableHead>
                                <TableHead className="w-24 text-[9px] font-black uppercase px-1 py-3 text-right">Price</TableHead>
                                <TableHead className="w-10 px-1 py-3"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map((item, index) => (
                                <TableRow key={index} className="border-b last:border-0">
                                    <TableCell className="p-1 px-3"><Input className="h-9 border-none bg-transparent text-[11px] sm:text-sm p-0" placeholder="Item name..." value={item.description ?? ''} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} /></TableCell>
                                    <TableCell className="p-1"><Input type="number" className="h-9 border-none bg-transparent text-[11px] sm:text-sm p-0 text-center" value={item.quantity ?? ''} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} /></TableCell>
                                    <TableCell className="p-1"><Input type="number" className="h-9 border-none bg-transparent text-[11px] sm:text-sm p-0 text-right font-bold" value={item.unitPrice ?? ''} onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)} /></TableCell>
                                    <TableCell className="p-1 text-center"><Button variant="ghost" size="icon" onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} disabled={lineItems.length === 1} className="h-7 w-7 opacity-30 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])} className="h-8 font-black uppercase text-[8px] rounded-lg"><PlusCircle className="mr-1.5 h-3 w-3"/>Add Row</Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 border-t p-4 sm:p-6 gap-3 flex flex-col sm:flex-row justify-end">
            {isEditing && (
                <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto font-bold h-12 rounded-xl">
                    Cancel
                </Button>
            )}
            <Button 
                onClick={() => handleGenerateDocument(type)} 
                className={cn(
                    "w-full sm:w-auto font-black uppercase shadow-lg h-12 sm:h-14 px-10 rounded-xl sm:rounded-2xl",
                    isEditing ? "bg-amber-600 hover:bg-amber-700" : ""
                )} 
                disabled={docsLoading || isGenerating}
            >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Save className="mr-2 h-4 w-4" /> : null)}
                {isEditing ? "Save Changes" : "Save Document"}
            </Button>
        </CardFooter>
      </Card>
    );
  }
}
