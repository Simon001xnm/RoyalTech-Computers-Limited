
"use client";

import { useState, useMemo } from "react";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload, Lock } from "lucide-react";
import { AssetForm } from "./asset-form";
import { getAssetColumns, type AssetColumnActions } from "./asset-columns";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { useUser } from "@/firebase/provider";
import { AssetService } from "@/services/asset-service";
import { cn } from "@/lib/utils";

export function StockClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant, plan, usage, isLegacyUser } = useSaaS();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const assets = useLiveQuery(async () => {
    if (!tenant) return undefined;
    return await db.assets.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const isLoading = assets === undefined;

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) =>
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const isAtCapacity = !isLegacyUser && plan && usage && usage.assets >= plan.maxAssets;

  const handleAddAsset = () => {
    if (isAtCapacity) {
        toast({ 
            variant: 'destructive', 
            title: 'Plan Limit Reached', 
            description: `You have reached the maximum of ${plan.maxAssets} assets. Please upgrade your plan.` 
        });
        return;
    }
    setEditingAsset(null);
    setIsFormOpen(true);
  };
  
  const handleBulkImport = async () => {
    if (!bulkData.trim() || !tenant || !plan) return;

    const lines = bulkData.trim().split('\n').filter(line => line.trim() !== '');
    const remainingSpace = isLegacyUser ? 9999 : plan.maxAssets - usage.assets;

    if (lines.length > remainingSpace) {
        toast({ variant: 'destructive', title: 'Import Too Large', description: `Space for ${remainingSpace} more assets.` });
        return;
    }

    setIsBulkImporting(true);
    try {
        const newAssets: Asset[] = lines.map((line) => {
            const parts = line.split(',').map(p => p.trim());
            return {
                id: crypto.randomUUID(),
                tenantId: tenant.id,
                model: parts[0],
                serialNumber: parts[1],
                purchaseDate: new Date(parts[2]).toISOString(),
                quantity: parseInt(parts[3], 10) || 1,
                status: (parts[4] as any) || 'Available',
                purchasePrice: parseFloat(parts[5]) || 0,
                leasePrice: parseFloat(parts[6]) || 0,
                specifications: { ram: parts[7] || '', storage: parts[8] || '', processor: parts[9] || '' },
                createdAt: new Date().toISOString()
            };
        });

        await AssetService.bulkImport(newAssets, tenant.id);
        toast({ title: 'Import Successful', description: `${newAssets.length} assets added.` });
        setIsBulkFormOpen(false);
        setBulkData("");
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
        setIsBulkImporting(false);
    }
  }

  const confirmDelete = async () => {
    if (assetToDelete && tenant) {
      try {
        await AssetService.delete(assetToDelete.id, tenant.id);
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

    try {
        if (editingAsset) {
            await AssetService.update(editingAsset.id, data, tenant.id);
            toast({ title: "Asset Updated" });
        } else {
            await AssetService.create(data, tenant.id, { uid: user.uid, name: user.displayName || 'User' });
            toast({ title: "Asset Added" });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save asset.' });
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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
         <div className="flex-grow">
            <PageHeader title="Asset Inventory (Siloed)" description="Managed high-value hardware service layer." />
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <Button onClick={() => setIsBulkFormOpen(true)} variant="outline" className={cn(isAtCapacity && "opacity-50")}>
                <Upload className="mr-2 h-4 w-4" /> Bulk Add
            </Button>
            <Button onClick={handleAddAsset} className={cn("shadow-md font-bold", isAtCapacity && "bg-muted text-muted-foreground hover:bg-muted")}>
                {isAtCapacity ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add New Asset
            </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by model or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? <p className="text-muted-foreground animate-pulse">Accessing inventory service...</p> : (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
              )) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No assets found in service.</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle></DialogHeader>
          <AssetForm asset={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader><DialogTitle>Bulk Add Assets</DialogTitle></DialogHeader>
            <div className="py-4"><Textarea placeholder="Model, SN, Date, Qty, Status..." value={bulkData} onChange={(e) => setBulkData(e.target.value)} rows={10} disabled={isBulkImporting} /></div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkFormOpen(false)} disabled={isBulkImporting}>Cancel</Button>
                <Button onClick={handleBulkImport} disabled={isBulkImporting}>{isBulkImporting ? 'Processing Service...' : 'Import to Service'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
