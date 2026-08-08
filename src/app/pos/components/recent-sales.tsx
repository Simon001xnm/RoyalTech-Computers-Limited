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
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RecentSalesProps {
    onViewReceipt: (sale: Sale) => void;
}

/**
 * High-Density Transaction History for POS
 * Filterable by name and date, with 10/25/50/100 row pagination.
 */
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

    const salesQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
    }, [firestore, tenant?.id]);
    
    const { data: rawSales, isLoading } = useCollection(salesQuery);

    const filteredSales = useMemo(() => {
        if (!rawSales) return [];
        
        let results = [...rawSales].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        if (searchTerm) {
            results = results.filter(s => 
                (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter) {
            results = results.filter(s => 
                s.date.startsWith(dateFilter)
            );
        }

        return results;
    }, [rawSales, searchTerm, dateFilter]);
    
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
            await new Promise(r => setTimeout(r, 400));

            const element = document.getElementById('recent-sale-export-target');
            if (!element) throw new Error("Export target not found");

            const canvas = await html2canvas(element, { 
                scale: 2.5, 
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
            
            const initials = 'RCT';
            const compPrefix = (tenant?.name || 'HUB').slice(0, 3).toUpperCase();
            const now = new Date();
            const filename = `${initials} ${compPrefix}-${now.getFullYear()}${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}.pdf`;

            pdf.save(filename);
            toast({ title: "Receipt Saved" });
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
        data: filteredSales,
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
                
                {/* Hidden PDF Render Target */}
                <div className="fixed left-[-9999px] top-0 pointer-events-none">
                    <div id="recent-sale-export-target" className="bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                        {exportDoc && <ReceiptPdf document={exportDoc} />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
