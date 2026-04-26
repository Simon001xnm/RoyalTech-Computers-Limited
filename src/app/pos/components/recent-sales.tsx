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
import { collection, query, where, addDoc } from 'firebase/firestore';

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
        
        // DEFENSIVE SANITIZATION: Ensure no undefined fields are passed to Firestore
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
                    phone: sale.customerPhone || '' 
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
            toast({ title: "Delivery Note Generated" });
            router.push('/documents');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: "Cloud sync failed. Check parameters." });
        }
    };

    const handleShareWhatsApp = (sale: Sale) => {
        const phone = sale.customerPhone || "";
        const text = `Hello! Your purchase of ${sale.amount.toLocaleString()} KES from RoyalTech is confirmed. Reference: RCL-${sale.id.slice(0,4)}. Thank you!`;
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
        <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl font-black uppercase tracking-tight">Recent Transactions</CardTitle>
                <CardDescription>Direct cloud-synced sale records.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <p className="text-muted-foreground animate-pulse p-8">Syncing transaction registry...</p>
                ) : (
                    <div className="border-t">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {salesTable.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase py-4">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {salesTable.getRowModel().rows.length ? (
                                    salesTable.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/20">
                                            {row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
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
