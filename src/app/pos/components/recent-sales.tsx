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

interface RecentSalesProps {
    onViewReceipt: (sale: Sale) => void;
}

/**
 * High-Density Transaction History
 * Optimized for small mobile screens with microscopic fonts and fixed layouts.
 */
export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { tenant } = useSaaS();
    const firestore = useFirestore();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const [isExporting, setIsExporting] = useState(false);
    const [exportDoc, setExportDoc] = useState<AppDocument | null>(null);

    const salesQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
    }, [firestore, tenant?.id]);
    
    const { data: rawSales, isLoading } = useCollection(salesQuery);

    const sortedSales = useMemo(() => {
        if (!rawSales) return [];
        return [...rawSales].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [rawSales]);
    
    const handleGenerateDelivery = async (sale: Sale) => {
        if (!tenant) return;
        
        const saleIdStr = sale.id?.toString() || 'TEMP';
        const deliveryData = {
            tenantId: tenant.id,
            type: 'DeliveryNote' as const,
            title: `Delivery Note #DEL-${saleIdStr.slice(0, 5).toUpperCase()}`,
            generatedDate: new Date().toISOString(),
            relatedTo: `Sale to ${sale.customerName || 'Walk-in'}`,
            data: {
                customer: { 
                    id: sale.customerId || '', 
                    name: sale.customerName || 'Walk-in Client', 
                    phone: sale.customerPhone || '' 
                },
                items: (sale.items || []).map(item => ({
                    description: item.name || 'Unknown Item',
                    serialNumber: item.serialNumber || 'N/A',
                    quantity: item.quantity || 1
                })),
                details: `Generated from Sale ${saleIdStr.slice(0, 4)}`,
            },
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(collection(firestore, 'documents'), deliveryData);
            toast({ title: "Delivery Note Generated" });
            router.push('/documents');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: "Cloud sync failed." });
        }
    };

    const handleDownloadReceipt = async (sale: Sale) => {
        setIsExporting(true);
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');

        try {
            const docsRef = collection(firestore, 'documents');
            const q = query(docsRef, where('saleId', '==', sale.id), limit(1));
            const snap = await getDocs(q);
            
            let docToUse: AppDocument;

            if (snap.empty) {
                const saleIdStr = sale.id?.toString() || 'TEMP';
                docToUse = {
                    id: sale.id || 'temp',
                    tenantId: tenant?.id || '',
                    type: 'Receipt',
                    title: `Receipt #${saleIdStr.slice(0, 5).toUpperCase()}`,
                    generatedDate: sale.date || new Date().toISOString(),
                    data: { ...sale, applyVat: false },
                    createdAt: sale.createdAt || new Date().toISOString()
                };
            } else {
                docToUse = { ...snap.docs[0].data(), id: snap.docs[0].id } as AppDocument;
            }

            setExportDoc(docToUse);
            await new Promise(r => setTimeout(r, 300));

            const element = document.getElementById('recent-sale-export-target');
            if (!element) throw new Error("Export target not found");

            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: "#ffffff",
                width: 794,
                height: 1123,
                y: 0,
                scrollY: 0
            });
            
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            
            // CUSTOM FILENAME: RCT [CompPrefix]-[Year][Date][Month]
            const compPrefix = (tenant?.name || 'HUB').slice(0, 3).toUpperCase();
            const now = new Date();
            const year = now.getFullYear();
            const date = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const filename = `RCT ${compPrefix}-${year}${date}${month}.pdf`;

            pdf.save(filename);
            toast({ title: "Receipt Downloaded" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Export Failed" });
        } finally {
            setIsExporting(false);
            setExportDoc(null);
        }
    };

    const handleShareWhatsApp = (sale: Sale) => {
        const phone = sale.customerPhone || "";
        const text = `Hello! Your purchase of ${sale.amount.toLocaleString()} KES is confirmed. Thank you!`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onGenerateDelivery: handleGenerateDelivery,
        onWhatsApp: handleShareWhatsApp,
        onDownload: handleDownloadReceipt
    };
    const saleColumns = useMemo<ColumnDef<Sale>[]>(() => getSaleColumns(saleColumnActions), [saleColumnActions]);
    
    const salesTable = useReactTable({
        data: sortedSales,
        columns: saleColumns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <Card className="shadow-lg border-none overflow-hidden ring-1 ring-black/5 bg-white mx-auto w-full max-w-full">
            <CardHeader className="bg-muted/30 py-2 px-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest">History</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                {isLoading ? (
                    <p className="text-muted-foreground animate-pulse p-4 text-[8px] font-bold uppercase text-center">Syncing...</p>
                ) : (
                    <div className="w-full overflow-hidden">
                        <Table className="w-full table-fixed border-collapse">
                            <TableHeader className="bg-muted/50">
                                {salesTable.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id} className="h-7 border-b border-muted">
                                        {hg.headers.map(header => (
                                            <TableHead key={header.id} className="text-[8px] font-black uppercase py-0 h-7 px-2" style={{ width: header.getSize() }}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {salesTable.getRowModel().rows.length ? (
                                    salesTable.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10 h-9 border-b last:border-0 border-muted">
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id} className="py-0 px-2 overflow-hidden truncate">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={saleColumns.length} className="h-16 text-center text-muted-foreground italic text-[8px]">No records found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="px-1 py-1 border-t border-muted">
                            <DataTablePagination table={salesTable} />
                        </div>
                    </div>
                )}
                
                <div className="fixed left-[-9999px] top-0 pointer-events-none">
                    <div id="recent-sale-export-target" className="bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                        {exportDoc && <ReceiptPdf document={exportDoc} />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
