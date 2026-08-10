'use client';

import { useState, useMemo } from 'react';
import type { Sale, Document as AppDocument, User as AppUser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { getSaleColumns, type SaleColumnActions } from './sale-columns';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useToast } from '@/hooks/use-toast';
import { useSaaS } from '@/components/saas/saas-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs } from 'firebase/firestore';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import { ThermalReceiptPdf } from '@/app/documents/components/pdfs/thermal-receipt-pdf';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RecentSalesProps {
    onViewReceipt: (doc: AppDocument) => void;
}

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN'
};

/**
 * @fileOverview Sales Journal for POS
 * Strictly isolates Today's transactions.
 */
export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const { toast } = useToast();
    const { tenant } = useSaaS();
    const { user } = useUser();
    const firestore = useFirestore();

    const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<AppUser>(profileRef);
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [isExporting, setIsExporting] = useState(false);
    const [exportDoc, setExportDoc] = useState<AppDocument | null>(null);
    const [exportType, setExportType] = useState<'A4' | 'Thermal'>('A4');
    const [docToDelete, setDocToDelete] = useState<AppDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const docsQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(
            collection(firestore, 'documents'), 
            where('tenantId', '==', tenant.id),
            where('type', 'in', ['Receipt', 'Invoice', 'Quotation'])
        );
    }, [firestore, tenant?.id]);
    
    const { data: rawDocs, isLoading } = useCollection<AppDocument>(docsQuery);

    const filteredDocs = useMemo(() => {
        if (!rawDocs) return [];
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        let results = rawDocs.filter(d => {
            try { 
                return format(parseISO(d.generatedDate), 'yyyy-MM-dd') === todayStr; 
            } catch { return false; }
        }).sort((a, b) => {
            const dateA = a.generatedDate ? new Date(a.generatedDate).getTime() : 0;
            const dateB = b.generatedDate ? new Date(b.generatedDate).getTime() : 0;
            return dateB - dateA;
        });

        if (searchTerm) {
            results = results.filter(d => 
                (d.relatedTo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return results;
    }, [rawDocs, searchTerm]);
    
    const handleDownloadPdf = async (docToDownload: AppDocument, type: 'A4' | 'Thermal' = 'A4') => {
        setIsExporting(true);
        setExportType(type);
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');

        try {
            setExportDoc(docToDownload);
            await new Promise(r => setTimeout(r, 800));

            const element = document.getElementById('recent-sale-export-target');
            if (!element) throw new Error("Export target not found");

            const isThermal = type === 'Thermal';
            const canvas = await html2canvas(element, { 
                scale: 3.5, 
                useCORS: true,
                backgroundColor: "#ffffff",
                width: isThermal ? 302 : 794,
                y: 0,
                scrollY: 0
            });
            
            const pdf = new jsPDF({ 
                orientation: 'p', 
                unit: 'mm', 
                format: isThermal ? [80, canvas.height * 0.264583 / 3.5] : 'a4' 
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            if (isThermal) {
                pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 0.264583 / 3.5, undefined, 'FAST');
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }
            
            const initials = TYPE_INITIALS[docToDownload.type] || 'DOC';
            const custPrefix = (docToDownload.relatedTo || 'VAL').slice(0, 3).toUpperCase();
            const now = new Date(docToDownload.generatedDate);
            const year = now.getFullYear();
            const day = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const suffix = isThermal ? '_TH' : '';
            const filename = `${initials} ${custPrefix}-${year}${day}${month}${suffix}.pdf`;

            pdf.save(filename);
            toast({ title: "Document Saved" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Export Failed" });
        } finally {
            setIsExporting(false);
            setExportDoc(null);
        }
    };

    const handleShareWhatsApp = (docObj: AppDocument) => {
        const phone = docObj.data?.customer?.phone || "";
        const text = `Hello! Your ${docObj.type} (${docObj.title}) is ready. Thank you!`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleDeleteSale = async () => {
        if (!docToDelete || !tenant || !isAdmin) return;
        setIsDeleting(true);

        try {
            const batch = writeBatch(firestore);
            batch.delete(doc(firestore, 'documents', docToDelete.id));

            const salesRef = collection(firestore, 'sales_transactions');
            const q = query(salesRef, where('tenantId', '==', tenant.id), where('documentId', '==', docToDelete.id));
            const salesSnap = await getDocs(q);
            salesSnap.forEach(s => batch.delete(doc(firestore, 'sales_transactions', s.id)));

            await batch.commit();
            toast({ title: "Transaction Purged" });
            setDocToDelete(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Delete Failed", description: e.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onWhatsApp: handleShareWhatsApp,
        onDownload: handleDownloadPdf,
        onDelete: isAdmin ? (d) => setDocToDelete(d) : undefined 
    };
    const saleColumns = useMemo<ColumnDef<AppDocument>[]>(() => getSaleColumns(saleColumnActions), [saleColumnActions]);
    
    const salesTable = useReactTable({
        data: filteredDocs,
        columns: saleColumns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <Card className="shadow-xl border-none overflow-hidden ring-1 ring-black/5 bg-white w-full">
            <CardHeader className="bg-muted/10 py-4 px-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Today's Sales Journal</CardTitle>
                    <div className="flex flex-wrap items-center gap-3">
                        {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                                placeholder="Search records..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-xs w-40 bg-white"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse text-[10px] font-black uppercase tracking-widest">Syncing Today's Ledger...</div>
                ) : (
                    <div className="w-full">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {salesTable.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map(header => (
                                            <TableHead key={header.id} className="text-[10px] font-black uppercase py-4">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {salesTable.getRowModel().rows.length ? (
                                    salesTable.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10">
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id} className="py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={saleColumns.length} className="h-32 text-center text-muted-foreground italic text-xs">
                                            No transactions processed today.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DataTablePagination table={salesTable} />
                    </div>
                )}
                
                <div className="fixed left-[-9999px] top-0 pointer-events-none overflow-visible">
                    <div id="recent-sale-export-target" className="bg-white inline-block h-fit" style={{ width: exportType === 'Thermal' ? '80mm' : '210mm' }}>
                        {exportDoc && (
                            exportType === 'Thermal' 
                            ? <ThermalReceiptPdf document={exportDoc} /> 
                            : <ReceiptPdf document={exportDoc} />
                        )}
                    </div>
                </div>
            </CardContent>

            <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Confirm Void Transaction</DialogTitle>
                        <DialogDescription className="font-medium text-base pt-2">
                            This will permanently remove <strong>{docToDelete?.title}</strong> and its financial record. Your dashboard metrics will be adjusted accordingly.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDocToDelete(null)} disabled={isDeleting} className="font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteSale} disabled={isDeleting} className="font-black uppercase tracking-widest">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Void Transaction"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
