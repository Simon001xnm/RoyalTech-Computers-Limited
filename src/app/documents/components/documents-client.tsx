"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Loader2, Info, Wallet } from "lucide-react";
import type { DocumentType, Document as AppDocument, DocumentLineItem, Sale } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, getDocs, orderBy, limit } from "firebase/firestore";
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
import { LeaseAgreementPdf } from "./pdfs/lease-agreement-pdf";
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
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Badge } from "@/components/ui/badge";

const VAT_RATE = 0.16;

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN',
    'Proforma': 'PRO',
    'RepairNote': 'RPN',
    'DeliveryNote': 'DLV',
    'LPO': 'LPO',
    'LeaseAgreement': 'LSE',
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
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [applyVat, setApplyVat] = useState(false);
  
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [isExporting, setIsExporting] = useState(false);

  // Lease Specific
  const [clientType, setClientType] = useState<'Individual' | 'Corporate'>('Individual');
  const [leaseDuration, setLeaseDuration] = useState('1');
  const [leaseUnit, setLeaseUnit] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');
  const [isStudent, setIsStudent] = useState(false);
  const [verification, setVerification] = useState<any>({});

  // Fetch Customer Balance
  useEffect(() => {
    if (!selectedCustomerId || !tenant) {
      setCustomerBalance(0);
      return;
    }

    const fetchBalance = async () => {
      setIsBalanceLoading(true);
      try {
        const salesRef = collection(firestore, 'sales_transactions');
        const q = query(
          salesRef, 
          where('tenantId', '==', tenant.id), 
          where('customerId', '==', selectedCustomerId)
        );
        const snap = await getDocs(q);
        const sales = snap.docs.map(d => d.data() as Sale);
        const totalBalance = sales.reduce((acc, sale) => acc + (sale.balance || 0), 0);
        setCustomerBalance(totalBalance);
      } catch (e) {
        console.error("Balance fetch error:", e);
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [selectedCustomerId, tenant, firestore]);

  const sortedDocuments = useMemo(() => {
      if (!rawDocuments) return [];
      return [...rawDocuments].sort((a, b) => {
          const dateA = a.generatedDate ? new Date(a.generatedDate).getTime() : 0;
          const dateB = b.generatedDate ? new Date(b.generatedDate).getTime() : 0;
          return dateB - dateA;
      });
  }, [rawDocuments]);

  const handleGenerateDocument = async (type: DocumentType) => {
    if (!tenant || !user) return;

    // SEQUENTIAL LOGIC: Find count of this specific type
    const typeCount = rawDocuments?.filter(d => d.type === type).length || 0;
    const seq = typeCount + 1;
    const initials = TYPE_INITIALS[type] || 'DOC';
    let title = `${type} #${String(seq).padStart(3, '0')}`;
    let relatedTo = "N/A";
    
    const documentData: any = { 
        details: details || '', 
        applyVat,
        previousBalance: customerBalance, 
        workspace: workspaceProfile ? {
            name: workspaceProfile.name || '',
            address: workspaceProfile.address || '',
            phone: workspaceProfile.phone || '',
            email: workspaceProfile.email || '',
            logoUrl: workspaceProfile.logoUrl || null,
            primaryColor: workspaceProfile.primaryColor || null,
            secondaryColor: workspaceProfile.secondaryColor || null
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

    if (type === 'Receipt') {
        const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
        
        if (validLineItems.length > 0) {
            documentData.items = validLineItems.map(i => ({
                id: `manual_${Date.now()}`,
                name: i.description,
                price: i.unitPrice,
                quantity: i.quantity,
                type: 'custom'
            }));
            const subtotal = validLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            const vat = applyVat ? subtotal * VAT_RATE : 0;
            documentData.amount = subtotal + vat;
            documentData.subtotal = subtotal;
            documentData.vat = vat;
        } else {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                toast({ variant: 'destructive', title: 'Check the price or items' });
                return;
            }
            documentData.amount = parsedAmount;
        }
    } else if (['Quotation', 'Invoice', 'Proforma', 'LeaseAgreement'].includes(type)) {
        const validLineItems = lineItems.filter(item => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
        documentData.items = validLineItems;
        
        const dur = parseInt(leaseDuration) || 1;
        const subtotal = validLineItems.reduce((acc, item) => {
            const base = item.quantity * item.unitPrice;
            return acc + (type === 'LeaseAgreement' ? (base * dur) : base);
        }, 0);

        const vat = applyVat ? subtotal * VAT_RATE : 0;
        documentData.subtotal = subtotal;
        documentData.vat = vat;
        documentData.total = subtotal + vat;

        if (type === 'LeaseAgreement') {
            const startDate = new Date();
            let endDate = new Date(startDate);
            if (leaseUnit === "Day") endDate = addDays(startDate, dur);
            if (leaseUnit === "Week") endDate = addWeeks(startDate, dur);
            if (leaseUnit === "Month") endDate = addMonths(startDate, dur);
            if (leaseUnit === "Year") endDate = addYears(startDate, dur);

            documentData.lease = {
                duration: leaseDuration,
                unit: leaseUnit,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };
            documentData.clientType = clientType;
            documentData.verification = verification;
        }
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
        toast({ title: "Done! Paper is ready." });
        setSelectedCustomerId('');
        setDetails('');
        setAmount('');
        setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Something went wrong', description: error.message });
    }
  };

  const handleGenerateDeliveryFromExisting = async (sourceDoc: AppDocument) => {
    if (!tenant || !user) return;

    const normalizedItems = (sourceDoc.data.items || []).map((i: any) => ({
        description: i.description || i.name || "Item",
        quantity: i.quantity || 1,
        serialNumber: i.serialNumber || "N/A"
    }));

    const typeCount = rawDocuments?.filter(d => d.type === 'DeliveryNote').length || 0;
    const seq = typeCount + 1;

    const deliveryData = {
        tenantId: tenant.id,
        type: 'DeliveryNote' as const,
        title: `Delivery Note #${String(seq).padStart(3, '0')}`,
        generatedDate: new Date().toISOString(),
        relatedTo: sourceDoc.relatedTo,
        data: {
            customer: sourceDoc.data.customer,
            items: normalizedItems,
            details: `From ${sourceDoc.type}: ${sourceDoc.title}`,
            workspace: sourceDoc.data.workspace
        },
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'User' }
    };

    try {
        await addDoc(collection(firestore, 'documents'), deliveryData);
        toast({ title: "Delivery note created!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create note', description: error.message });
    }
  };
  
  const handleLineItemChange = (index: number, field: keyof DocumentLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: field === 'description' ? value : Number(value) || 0 };
    setLineItems(updatedItems);
  };

  const handleDownloadPdf = async (docToDownload: AppDocument) => {
    setIsExporting(true);
    
    const originalScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    setSelectedDocument(docToDownload);
    setIsPdfPreviewOpen(true);

    await new Promise(r => setTimeout(r, 400)); 

    const element = document.getElementById('pdf-preview-target');
    if (!element) {
        window.scrollTo({ top: originalScrollY, behavior: 'instant' });
        setIsExporting(false);
        return;
    }

    try {
        const canvas = await html2canvas(element, { 
            scale: 3, 
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 794,
            height: 1123,
            y: 0,
            scrollY: 0
        });
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        
        // CUSTOM FILENAME: [Initials] [CustPrefix]-[Year][Day][Month]
        const initials = TYPE_INITIALS[docToDownload.type] || 'DOC';
        const custPrefix = (docToDownload.relatedTo || 'VAL').slice(0, 3).toUpperCase();
        const now = new Date(docToDownload.generatedDate);
        const year = now.getFullYear();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const filename = `${initials} ${custPrefix}-${year}${day}${month}.pdf`;
        
        pdf.save(filename);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to save PDF' });
    } finally {
        setIsPdfPreviewOpen(false);
        setIsExporting(false);
        window.scrollTo({ top: originalScrollY, behavior: 'instant' });
    }
  };

  const columnActions: DocumentColumnActions = { 
    onView: (d) => { setSelectedDocument(d); setIsPdfPreviewOpen(true); }, 
    onDownload: handleDownloadPdf,
    onPrint: (d) => { 
        setSelectedDocument(d); 
        setIsPdfPreviewOpen(true); 
        setTimeout(() => window.print(), 300); 
    },
    onWhatsApp: (d) => {
        const phone = d.data?.customer?.phone || "";
        const msg = `Hello! Your ${d.type} (${d.title}) is ready. Thank you!`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    },
    onGenerateDelivery: handleGenerateDeliveryFromExisting
  };
  
  const customColumns = useMemo(() => getDocumentColumns(columnActions), [columnActions]);

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
      case 'LeaseAgreement': return <LeaseAgreementPdf document={selectedDocument} />;
      default: return null;
    }
  };

  const renderForm = (type: DocumentType) => {
    const showsItemEntry = ['Invoice', 'Proforma', 'Quotation', 'LPO', 'LeaseAgreement', 'Receipt'].includes(type);
    return (
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg font-black uppercase">Create a {type.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
            <CardDescription>Fill in the info below to make your document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase opacity-60">Select Client</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Pick a client..." /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.alias ? `${c.alias} (${c.name})` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomerId && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                    <Wallet className="h-4 w-4 text-orange-600" />
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase text-orange-600">Previous Account Balance</p>
                      <p className="text-sm font-black text-orange-900">
                        {isBalanceLoading ? "..." : `KES ${customerBalance.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-xl border h-11 self-end">
                <Switch id="vat-switch" checked={applyVat} onCheckedChange={setApplyVat} />
                <Label htmlFor="vat-switch" className="cursor-pointer font-bold text-xs">Add 16% Tax (VAT)</Label>
              </div>
          </div>

          {type === 'LeaseAgreement' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Who is hiring?</Label>
                          <Select onValueChange={(v: any) => setClientType(v)} value={clientType}>
                              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Individual">Person</SelectItem>
                                  <SelectItem value="Corporate">Company</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase opacity-60">How long?</Label>
                              <Input type="number" value={leaseDuration} onChange={e => setLeaseDuration(e.target.value)} className="h-11" />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase opacity-60">Time Unit</Label>
                              <Select onValueChange={(v: any) => setLeaseUnit(v)} value={leaseUnit}>
                                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="Day">Days</SelectItem>
                                      <SelectItem value="Week">Weeks</SelectItem>
                                      <SelectItem value="Month">Months</SelectItem>
                                      <SelectItem value="Year">Years</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Info className="h-4 w-4" /> Client ID Info
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-muted/20">
                          {clientType === 'Individual' ? (
                              <>
                                  <Input placeholder="National ID Card Number" className="h-10" onChange={e => setVerification({...verification, nationalId: e.target.value})} />
                                  <Input placeholder="Guarantor/Friend ID Number" className="h-10" onChange={e => setVerification({...verification, guarantorId: e.target.value})} />
                                  <div className="md:col-span-2 flex items-center gap-4 p-3 bg-white rounded-lg border">
                                      <Switch id="student-toggle" checked={isStudent} onCheckedChange={setIsStudent} />
                                      <Label htmlFor="student-toggle" className="text-xs font-bold">This is a student</Label>
                                  </div>
                                  {isStudent && (
                                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <Input placeholder="Student ID Number" className="h-10" onChange={e => setVerification({...verification, studentId: e.target.value})} />
                                          <Input placeholder="Parent/Guardian Name" className="h-10" onChange={e => setVerification({...verification, parentName: e.target.value})} />
                                          <Input placeholder="Parent/Guardian Phone" className="h-10" onChange={e => setVerification({...verification, parentPhone: e.target.value})} />
                                      </div>
                                  )}
                              </>
                          ) : (
                              <>
                                  <Input placeholder="Business Permit Number" className="h-10" onChange={e => setVerification({...verification, businessPermit: e.target.value})} />
                                  <Input placeholder="Company Registration Number" className="h-10" onChange={e => setVerification({...verification, cr12Reference: e.target.value})} />
                                  <Input placeholder="Boss/Signatory ID Number" className="h-10" onChange={e => setVerification({...verification, directorId: e.target.value})} />
                                  <Input placeholder="Contact Person Name" className="h-10" onChange={e => setVerification({...verification, contactPerson: e.target.value})} />
                              </>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {showsItemEntry && (
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase opacity-60">List Items Below</Label>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase min-w-[200px]">Item Description</TableHead>
                                <TableHead className="w-24 text-[10px] font-black uppercase">Qty</TableHead>
                                <TableHead className="w-32 text-[10px] font-black uppercase">{type === 'LeaseAgreement' ? 'Rate' : 'Price'}</TableHead>
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
          
          {type === 'Receipt' && lineItems.length === 1 && lineItems[0].description === '' && (
            <div className="max-w-xs space-y-2">
                <Label>Total Paid (KES)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11" placeholder="0.00" />
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 border-t py-4"><Button onClick={() => handleGenerateDocument(type)} className="w-full sm:w-auto ml-auto font-black uppercase" disabled={docsLoading}>Save and Create Document</Button></CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Make Papers" description="Create professional invoices and receipts for your shop." />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 h-auto p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="Quotation" className="font-black uppercase text-[8px] md:text-[9px] py-3">Quotation</TabsTrigger>
          <TabsTrigger value="Invoice" className="font-black uppercase text-[8px] md:text-[9px] py-3">Invoice</TabsTrigger>
          <TabsTrigger value="LeaseAgreement" className="font-black uppercase text-[8px] md:text-[9px] py-3">Lease Hire</TabsTrigger>
          <TabsTrigger value="Proforma" className="font-black uppercase text-[8px] md:text-[9px] py-3">Proforma</TabsTrigger>
          <TabsTrigger value="Receipt" className="font-black uppercase text-[8px] md:text-[9px] py-3">Receipt</TabsTrigger>
        </TabsList>
        <TabsContent value="Quotation">{renderForm("Quotation")}</TabsContent>
        <TabsContent value="Invoice">{renderForm("Invoice")}</TabsContent>
        <TabsContent value="LeaseAgreement">{renderForm("LeaseAgreement")}</TabsContent>
        <TabsContent value="Proforma">{renderForm("Proforma")}</TabsContent>
        <TabsContent value="Receipt">{renderForm("Receipt")}</TabsContent>
      </Tabs>
      
      <Card className="mt-8 shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-muted/50 py-4"><CardTitle className="text-xs font-black uppercase">Papers already made</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
                <TableHeader className="bg-muted/20">
                    {table.getHeaderGroups().map(hg => (
                        <TableRow key={hg.id}>
                            {hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase min-w-[120px]">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No papers found yet.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
          </CardContent>
      </Card>

       <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 border-none shadow-none bg-transparent">
          <DialogHeader className="p-6 bg-white border-b no-print">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Paper Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto bg-slate-400/30 flex justify-center p-4 md:p-8">
            <div id="pdf-preview-target" className="shrink-0 shadow-2xl relative bg-white overflow-hidden origin-top scale-[0.4] sm:scale-[0.6] md:scale-100" style={{ width: '210mm', minHeight: '297mm' }}>
                {renderPdfPreview()}
            </div>
          </div>
          <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-3 bg-white no-print">
            {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)} className="font-bold w-full sm:w-auto">Close Preview</Button>
            <Button onClick={() => window.print()} className="font-black uppercase w-full sm:w-auto">Print Now</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
