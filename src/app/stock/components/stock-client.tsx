'use client';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload } from "lucide-react";
import { AssetForm } from "./asset-form";
import { getAssetColumns, type AssetColumnActions } from "./asset-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, type ColumnDef, type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { ValuationSummary } from "./valuation-summary";

export function StockClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { tenant, plan, usage, isLegacyUser } = useSaaS();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  // FIRESTORE QUERY: Strictly siloed by tenantId
  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: assets, isLoading } = useCollection(assetsQuery);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) =>
      (asset.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const isAtCapacity = !isLegacyUser && plan && usage && usage.assets >= plan.maxAssets;

  const handleAddAsset = () => {
    if (isAtCapacity) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: `Max ${plan.maxAssets} assets allowed.` });
        return;
    }
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      try {
        await deleteDoc(doc(firestore, 'assets', assetToDelete.id));
        toast({ title: "Asset Deleted" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setIsDeleteConfirmOpen(false);
      setAssetToDelete(null);
    }
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user) return;

    const assetData = {
      ...data,
      tenantId: tenant.id,
      updatedAt: new Date().toISOString(),
      purchaseDate: data.purchaseDate.toISOString(),
      specifications: {
        ram: data.ram || '',
        storage: data.storage || '',
        processor: data.processor || ''
      }
    };

    try {
        if (editingAsset) {
            await updateDoc(doc(firestore, 'assets', editingAsset.id), assetData);
            toast({ title: "Asset Updated" });
        } else {
            await addDoc(collection(firestore, 'assets'), {
                ...assetData,
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Asset Added" });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const columnActions: AssetColumnActions = {
    onEdit: (a) => { setEditingAsset(a); setIsFormOpen(true); },
    onDelete: (a) => { setAssetToDelete(a); setIsDeleteConfirmOpen(true); },
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
    <>
      <PageHeader 
        title="Inventory" 
        description="Workspace hardware portfolio."
        actionLabel="Add New Asset"
        onAction={handleAddAsset}
        ActionIcon={PlusCircle}
      />

      {!isLoading && assets && <ValuationSummary assets={assets as any} />}

      <div className="mb-4">
        <Input
          placeholder="Search model or serial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? <p className="animate-pulse">Syncing cloud inventory...</p> : (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>)}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
              )) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No assets found.</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle></DialogHeader>
          <AssetForm asset={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Asset</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
