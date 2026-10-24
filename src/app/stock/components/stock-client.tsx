'use client';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Search } from "lucide-react";
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
            serialNumber: data.serialNumber || '',
            status: data.status,
            quantity: Number(data.quantity) || 1,
            unit: data.unit || 'Unit',
            category: data.category || '',
            subCategory: data.subCategory || '',
            purchaseDate: data.purchaseDate.toISOString(),
            purchasePrice: Number(data.purchasePrice) || 0,
            sellingPrice: Number(data.sellingPrice) || 0,
            isSerialized: data.isSerialized ?? true,
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
    <div className="space-y-3 sm:space-y-6 px-1 sm:px-0">
      <PageHeader 
        title="Inventory List" 
        description="Managed hardware & items."
        actionLabel="Register Item"
        onAction={() => { setEditingAsset(null); setIsFormOpen(true); }}
        ActionIcon={PlusCircle}
      />

      <div className="mb-2 sm:mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
        <Input
          placeholder="Scan serial or search model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card h-10 sm:h-11 font-bold pl-10 rounded-xl"
        />
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center animate-pulse font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground">Synchronizing Cloud Silo...</div>
      ) : (
        <div className="rounded-xl sm:rounded-[2rem] border-none ring-1 ring-black/5 shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <Table>
                    <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="font-black uppercase text-[8px] sm:text-[10px] py-4 px-2 sm:px-6 whitespace-nowrap">
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
                            <TableCell key={cell.id} className="py-2 sm:py-4 px-2 sm:px-6 text-[11px] sm:text-sm">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground italic text-xs uppercase opacity-30 font-black">No matching inventory</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
            <div className="px-4"><DataTablePagination table={table} /></div>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="w-[98vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto border-none shadow-2xl rounded-2xl sm:rounded-[2rem] p-0">
          <DialogHeader className="p-6 sm:p-8 border-b bg-muted/10">
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">{editingAsset ? "Modify Records" : "Register Logic"}</DialogTitle>
            <DialogDescription className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Cloud Node Registry</DialogDescription>
          </DialogHeader>
          <div className="p-6 sm:p-8 pt-4">
            <LaptopForm laptop={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isSubmitting} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-destructive">Void Item</DialogTitle>
            <DialogDescription className="font-medium text-base pt-2">
              Remove <strong>{assetToDelete?.model}</strong> from the shop silo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold h-12 rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (assetToDelete) await deleteDoc(doc(firestore, 'assets', assetToDelete.id)); setIsDeleteConfirmOpen(false); }} className="font-black uppercase h-12 rounded-xl">Void Records</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
