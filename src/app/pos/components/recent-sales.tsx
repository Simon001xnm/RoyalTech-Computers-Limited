
'use client';

import { useState, useMemo } from 'react';
import type { Sale } from '@/types';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { getSaleColumns, type SaleColumnActions } from './sale-columns';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSaaS } from '@/components/saas/saas-provider';

interface RecentSalesProps {
    onViewReceipt: (sale: Sale) => void;
}

export function RecentSales({ onViewReceipt }: RecentSalesProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { tenant } = useSaaS();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

    // SaaS Isolated Query
    const sales = useLiveQuery(async () => {
        if (!tenant) return [];
        // Filter by tenantId and then sort in memory (or use a composite index in production)
        const tenantSales = await db.sales.where('tenantId').equals(tenant.id).toArray();
        return tenantSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [tenant?.id]);
    
    const isLoading = sales === undefined;
    
    const handleGenerateDelivery = async (sale: Sale) => {
        if (!tenant) return;
        toast({ title: "Generating Delivery Note..." });

        const deliveryData = {
            id: crypto.randomUUID(),
            tenantId: tenant.id, // SaaS Injection
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
            await db.documents.add(deliveryData);
            toast({ title: "Success", description: "Delivery Note generated! Taking you to Documents..." });
            router.push('/documents');
        } catch (error) {
            console.error("Delivery note generation failed:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate delivery note locally." });
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
                    <CardTitle>Workspace Sale History</CardTitle>
                    <CardDescription>A siloed log of sales transactions for this business.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-muted-foreground animate-pulse">Filtering workspace transactions...</p>}
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
                                        <TableCell colSpan={saleColumns.length} className="h-24 text-center">No sales recorded in this workspace yet.</TableCell>
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
