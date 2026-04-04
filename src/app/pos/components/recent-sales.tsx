
'use client';

import { useState, useMemo } from 'react';
import type { Sale } from '@/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { getSaleColumns, type SaleColumnActions } from './sale-columns';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface RecentSalesProps {
    onViewReceipt: (sale: Sale) => void;
}

export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

    const salesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'sales'), orderBy('date', 'desc')) : null, [firestore, user]);
    const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);
    
    const isLoading = isUserLoading || salesLoading;
    
    const handleGenerateDelivery = async (sale: Sale) => {
        if (!user) return;

        toast({ title: "Generating Delivery Note..." });

        const deliveryData = {
            type: 'DeliveryNote',
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
            createdBy: { uid: user.uid, name: user.displayName || 'POS System' }
        };

        try {
            await addDoc(collection(firestore, 'documents'), deliveryData);
            toast({ title: "Success", description: "Delivery Note generated! Taking you to Documents..." });
            router.push('/documents');
        } catch (error) {
            console.error("Delivery note generation failed:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate delivery note." });
        }
    };

    const saleColumnActions: SaleColumnActions = { 
        onView: onViewReceipt,
        onGenerateDelivery: handleGenerateDelivery
    };
    const saleColumns = useMemo<ColumnDef<Sale>[]>(() => getSaleColumns(saleColumnActions), [saleColumnActions]);
    const salesTable = useReactTable({
        data: sales || [],
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
                    <CardTitle>Recent Receipts</CardTitle>
                    <CardDescription>A log of all completed sales. You can generate delivery notes from here.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Loading sales history...</p>}
                {!isLoading && sales && (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
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
                                        <TableCell colSpan={saleColumns.length} className="h-24 text-center">No sales recorded yet.</TableCell>
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
