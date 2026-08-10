'use client';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package } from "lucide-react";
import { LaptopForm } from "./laptop-form";
import { getLaptopColumns } from "./laptop-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

export function StockClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { tenant } = useSaaS();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawAssets, isLoading } = useCollection(assetsQuery);

  const filteredAssets = useMemo(() => {
    if (!rawAssets) return [];
    
    const sorted = [...rawAssets].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.filter((asset) =>
      (asset.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawAssets, searchTerm]);

  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user) return;
    setIsSubmitting(true);

    try {
        const assetData = {
            tenantId: tenant.id,
            model: data.model,
            serialNumber: data.serialNumber,
            status: data.status,
            quantity: Number(data.quantity) || 1,
            purchaseDate: data.purchaseDate.toISOString(),
            sellingPrice: Number(data.sellingPrice) || 0,
            updatedAt: new Date().toISOString()
        };

        if (editingAsset) {
            await updateDoc(doc(firestore, 'assets', editingAsset.id), assetData);
            toast({ title: "Inventory Updated" });
        } else {
            await addDoc(collection(firestore, 'assets'), {
                ...assetData,
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Item Registered" });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const columnActions = {
    onEdit: (asset: Asset) => { setEditingAsset(asset); setIsFormOpen(true); },
    onDelete: (asset: Asset) => { setAssetToDelete(asset); setIsDeleteConfirmOpen(true); },
  };

  const columns = useMemo(() => getLaptopColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredAssets,
    columns,
    state: { rowSelection, pagination },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory" 
        description="Unified tracking for all your serialized assets and stock items."
        actionLabel="Add New Item"
        onAction={() => { setEditingAsset(null); setIsFormOpen(true); }}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by model or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card h-11 font-bold"
        />
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-widest">Syncing Cloud Node...</div>
      ) : (
        <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="font-black uppercase text-[10px] py-4">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                    ))}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">No items found in this node.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingAsset ? "Modify Item" : "Register Item"}</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manage your cloud inventory items.</DialogDescription>
          </DialogHeader>
          <LaptopForm laptop={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Confirm Deletion</DialogTitle>
            <DialogDescription className="font-medium text-base pt-2">
              Are you sure you want to remove <strong>{assetToDelete?.model}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (assetToDelete) await deleteDoc(doc(firestore, 'assets', assetToDelete.id)); setIsDeleteConfirmOpen(false); }} className="font-black uppercase">Delete Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
