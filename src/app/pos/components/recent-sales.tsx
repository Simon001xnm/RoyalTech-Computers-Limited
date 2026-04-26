'use client';

import { useState, useMemo } from 'react';
import type { Sale } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { getSaleColumns, type SaleColumnActions } from './sale-columns';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSaaS } from '@/components/saas/saas-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, setDoc } from 'firebase/firestore';

interface RecentSalesProps {
    onViewReceipt: (sale: Sale) => void;
}

export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { tenant } = useSaaS();
    const firestore = useFirestore();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

    // CLOUD QUERY
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
        
        const deliveryData = {
            tenantId: tenant.id,
            type: 'DeliveryNote' as const,
            title: `Delivery Note #DEL-${sale.id.slice(0, 5).toUpperCase()}`,
            generatedDate: new Date().toISOString(),
            relatedTo: `Sale to ${sale.customerName || 'Walk-in'}`,
            data: {
                customer: { 
                    id: sale.customerId || '', 
                    name: sale.customerName || 'Walk-in Client', 
                    phone: sale.customerPhone || sale.notes || '' 
                },
                items: (sale.items || []).map(item => ({
                    description: item.name || 'Unknown Item',
                    serialNumber: item.serialNumber || 'N/A',
                    quantity: item.quantity || 1
                })),
                details: `Generated from Sale RCL-${sale.id.slice(0, 4)}`,
            },
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(collection(firestore, 'documents'), deliveryData);
            toast({ title: "Success", description: "Delivery Note generated!" });
            router.push('/documents');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate delivery note." });
        }
    };

    const handleShareWhatsApp = (sale: Sale) => {
        const phone = sale.customerPhone || "";
        const text = `Hello! Thank you for your purchase of ${sale.amount.toLocaleString()} KES. Receipt RCL-${sale.id.slice(0,4)} is available.`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onGenerateDelivery: handleGenerateDelivery,
        onWhatsApp: handleShareWhatsApp
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
        <Card className="shadow-lg border-none">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Recent Workspace Sales</CardTitle>
                    <CardDescription>Direct access to receipts and delivery workflows.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-muted-foreground animate-pulse text-sm">Syncing transaction registry...</p>
                ) : (
                    <div className="border rounded-xl overflow-hidden bg-card/50">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {salesTable.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {salesTable.getRowModel().rows.length ? (
                                    salesTable.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/20">
                                            {row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No sales recorded yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DataTablePagination table={salesTable} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
