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

    // CLOUD QUERY: Sync history (Index-free: sort in memory)
    const salesQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(
            collection(firestore, 'sales_transactions'),
            where('tenantId', '==', tenant.id)
        );
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
        toast({ title: "Generating Delivery Note..." });

        const deliveryData = {
            tenantId: tenant.id,
            type: 'DeliveryNote' as const,
            title: `Delivery Note #DEL-${sale.id.slice(0, 5).toUpperCase()}`,
            generatedDate: new Date().toISOString(),
            relatedTo: `Sale to ${sale.customerName}`,
            data: {
                customer: { id: sale.customerId, name: sale.customerName, phone: sale.customerPhone },
                items: sale.items.map(item => ({
                    description: item.name,
                    serialNumber: item.serialNumber,
                    quantity: item.quantity
                })),
                details: `Generated from Sale RCL-${sale.id.slice(0, 4)}`,
            },
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(collection(firestore, 'documents'), deliveryData);
            toast({ title: "Success", description: "Delivery Note generated!" });
            router.push('/documents');
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate delivery note." });
        }
    };

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onGenerateDelivery: handleGenerateDelivery
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Cloud Transaction History</CardTitle>
                    <CardDescription>A real-time log of sales transactions for this workspace.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-muted-foreground animate-pulse text-sm">Syncing transaction registry...</p>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {salesTable.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {salesTable.getRowModel().rows.length ? (
                                    salesTable.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={saleColumns.length} className="h-24 text-center text-muted-foreground">No sales recorded yet.</TableCell>
                                    </TableRow>
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
