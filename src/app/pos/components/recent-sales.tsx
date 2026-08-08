'use client';

import { useState, useMemo } from 'react';
import type { Sale, Document as AppDocument } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { getSaleColumns, type SaleColumnActions } from './sale-columns';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSaaS } from '@/components/saas/saas-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, getDocs, limit } from 'firebase/firestore';
import { ReceiptPdf } from '@/app/documents/components/pdfs/receipt-pdf';
import { ThermalReceiptPdf } from '@/app/documents/components/pdfs/thermal-receipt-pdf';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecentSalesProps {
    onViewReceipt: (doc: AppDocument) => void;
}

const TYPE_INITIALS: Record<string, string> = {
    'Invoice': 'INV',
    'Receipt': 'RCT',
    'Quotation': 'QTN'
};

export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { tenant } = useSaaS();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [isExporting, setIsExporting] = useState(false);
    const [exportDoc, setExportDoc] = useState<AppDocument | null>(null);
    const [exportType, setExportType] = useState<'A4' | 'Thermal'>('A4');

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
        
        let results = [...rawDocs].sort((a, b) => {
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

        if (dateFilter) {
            results = results.filter(d => 
                d.generatedDate.startsWith(dateFilter)
            );
        }

        return results;
    }, [rawDocs, searchTerm, dateFilter]);
    
    const handleDownloadPdf = async (docToDownload: AppDocument, type: 'A4' | 'Thermal' = 'A4') => {
        setIsExporting(true);
        setExportType(type);
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');

        try {
            setExportDoc(docToDownload);
            await new Promise(r => setTimeout(r, 450));

            const element = document.getElementById('recent-sale-export-target');
            if (!element) throw new Error("Export target not found");

            const isThermal = type === 'Thermal';
            const canvas = await html2canvas(element, { 
                scale: 3, 
                useCORS: true,
                backgroundColor: "#ffffff",
                width: isThermal ? 302 : 794,
                height: isThermal ? 800 : 1123,
                y: 0,
                scrollY: 0
            });
            
            const pdf = new jsPDF({ 
                orientation: 'p', 
                unit: 'mm', 
                format: isThermal ? [80, 200] : 'a4' 
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            if (isThermal) {
                pdf.addImage(imgData, 'PNG', 0, 0, 80, 200, undefined, 'FAST');
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

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onWhatsApp: handleShareWhatsApp,
        onDownload: handleDownloadPdf
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
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Transaction History</CardTitle>
                    <div className="flex items-center gap-2">
                        {isExporting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                                placeholder="Filter by client..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-xs w-48 bg-white"
                            />
                        </div>
                        <div className="relative">
                            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                                type="date"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="pl-8 h-9 text-xs w-40 bg-white"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse text-[10px] font-black uppercase tracking-widest">Syncing Cloud Ledger...</div>
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
                                            No matching records found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DataTablePagination table={salesTable} />
                    </div>
                )}
                
                <div className="fixed left-[-9999px] top-0 pointer-events-none">
                    <div id="recent-sale-export-target" className="bg-white" style={{ width: exportType === 'Thermal' ? '80mm' : '210mm' }}>
                        {exportDoc && (
                            exportType === 'Thermal' 
                            ? <ThermalReceiptPdf document={exportDoc} /> 
                            : <ReceiptPdf document={exportDoc} />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
