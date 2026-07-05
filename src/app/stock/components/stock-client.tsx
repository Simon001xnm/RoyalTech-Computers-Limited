
'use client';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, getDocs, limit } from "firebase/firestore";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch } from "lucide-react";
import { AssetForm } from "./asset-form";
import { getAssetColumns, type AssetColumnActions } from "./asset-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, type ColumnDef, type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { ValuationSummary } from "./valuation-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.filter((asset) =>
      (asset.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawAssets, searchTerm]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      try {
        await deleteDoc(doc(firestore, 'assets', assetToDelete.id));
        toast({ title: "Removed from list." });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setIsDeleteConfirmOpen(false);
      setAssetToDelete(null);
    }
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user) return;
    setIsSubmitting(true);

    try {
        if (!editingAsset) {
            const serialQuery = query(
                collection(firestore, 'assets'), 
                where('tenantId', '==', tenant.id), 
                where('serialNumber', '==', data.serialNumber),
                limit(1)
            );
            const querySnapshot = await getDocs(serialQuery);
            if (!querySnapshot.empty) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Stop!', 
                    description: 'This Serial Number is already in your list.' 
                });
                setIsSubmitting(false);
                return;
            }
        }

        const assetData = {
            tenantId: tenant.id,
            model: data.model || '',
            serialNumber: data.serialNumber || '',
            status: data.status,
            quantity: Number(data.quantity) || 0,
            purchaseDate: data.purchaseDate.toISOString(),
            updatedAt: new Date().toISOString(),
            purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : null,
            leasePrice: data.leasePrice !== undefined ? Number(data.leasePrice) : null,
            specifications: {
                ram: data.ram || '',
                storage: data.storage || '',
                processor: data.processor || ''
            }
        };

        if (editingAsset) {
            await updateDoc(doc(firestore, 'assets', editingAsset.id), assetData);
            toast({ title: "Updated!" });
        } else {
            await addDoc(collection(firestore, 'assets'), {
                ...assetData,
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Saved to stock list." });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const columnActions: AssetColumnActions = {
    onEdit: handleEditAsset,
    onDelete: handleDeleteAsset,
  };

  const columns = useMemo<ColumnDef<Asset, any>[]>(() => getAssetColumns(columnActions), [columnActions]);

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
        title="Laptop Stock" 
        description="See all your laptops and items here."
        actionLabel="Add New Laptop"
        onAction={handleAddAsset}
        ActionIcon={PlusCircle}
      />

      {!isLoading && filteredAssets.length > 0 && (
        <ValuationSummary assets={filteredAssets} />
      )}

      <div className="mb-4">
        <Input
          placeholder="Search by name or serial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground animate-pulse font-bold uppercase text-[10px] tracking-widest">Loading items...</div>
      ) : (
        <>
            {rawAssets?.length === 0 ? (
                <Alert className="bg-card">
                    <PackageSearch className="h-4 w-4" />
                    <AlertTitle>List is Empty</AlertTitle>
                    <AlertDescription>You haven't added any laptops yet. Click the button above to add one.</AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-black uppercase text-[10px] py-4">
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground italic">No matching items found.</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                    <DataTablePagination table={table} />
                </div>
            )}
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingAsset ? "Change info" : "Add to Stock"}</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Enter the laptop details below.</DialogDescription>
          </DialogHeader>
          <AssetForm asset={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Are you sure?</DialogTitle>
            <DialogDescription className="font-medium text-base pt-2">
              This will delete <strong>{assetToDelete?.model}</strong> from your list forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">No, Go Back</Button>
            <Button variant="destructive" onClick={confirmDelete} className="font-black uppercase">Yes, Delete it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
