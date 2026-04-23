
"use client";

import { useState, useMemo } from "react";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

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
  const { tenant } = useSaaS();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // SaaS Isolated Query
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

  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };
  
  const handleBulkAdd = () => {
      setIsBulkFormOpen(true);
  }

  const handleBulkImport = async () => {
    if (!bulkData.trim() || !tenant) {
        toast({ variant: 'destructive', title: 'Error', description: 'The text area is empty or tenant not resolved.' });
        return;
    }

    setIsBulkImporting(true);
    const lines = bulkData.trim().split('\n').filter(line => line.trim() !== '');
    
    try {
        const newAssets: Asset[] = lines.map((line) => {
            const parts = line.split(',').map(p => p.trim());
            const [model, serialNumber, purchaseDateStr, quantityStr, status, purchasePriceStr, leasePriceStr, ram, storage, processor] = parts;
            
            return {
                id: crypto.randomUUID(),
                tenantId: tenant.id, // SaaS Injection
                model,
                serialNumber,
                purchaseDate: new Date(purchaseDateStr).toISOString(),
                quantity: parseInt(quantityStr, 10) || 1,
                status: (status as Asset['status']) || 'Available',
                purchasePrice: parseFloat(purchasePriceStr) || 0,
                leasePrice: parseFloat(leasePriceStr) || 0,
                specifications: {
                    ram: ram || '',
                    storage: storage || '',
                    processor: processor || '',
                },
                createdAt: new Date().toISOString()
            };
        });

        await db.assets.bulkAdd(newAssets);
        toast({ title: 'Import Successful', description: `${newAssets.length} assets added to your local business workspace.` });
        setIsBulkFormOpen(false);
        setBulkData("");
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
        setIsBulkImporting(false);
    }
  }

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
      await db.assets.delete(assetToDelete.id);
      toast({ title: "Asset Deleted", description: `${assetToDelete.model} has been removed.` });
      setAssetToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!tenant) return;

    const assetData: Asset = {
      ...data,
      id: editingAsset?.id || crypto.randomUUID(),
      tenantId: tenant.id, // SaaS Injection
      purchaseDate: data.purchaseDate.toISOString(), 
      specifications: { 
        ram: data.ram || '', 
        storage: data.storage || '', 
        processor: data.processor || '' 
      },
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingAsset) {
            await db.assets.put(assetData);
            toast({ title: "Asset Updated" });
        } else {
            await db.assets.add({ ...assetData, createdAt: new Date().toISOString() });
            toast({ title: "Asset Added" });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save asset.' });
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
    state: {
      rowSelection,
      pagination,
    },
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
            <PageHeader
                title="Asset Inventory (Siloed)"
                description="Managing high-value hardware restricted to your business workspace."
            />
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <Button onClick={handleBulkAdd} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Add
            </Button>
            <Button onClick={handleAddAsset}>
                <PlusCircle className="mr-2 h-4 w-4" />
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
      
      {isLoading && <p className="text-muted-foreground animate-pulse">Accessing tenant inventory...</p>}

      {!isLoading && filteredAssets.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Assets Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any assets in your workspace.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && assets && assets.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>Workspace Empty</AlertTitle>
          <AlertDescription>
            No assets registered for this business yet. Use Bulk Add to jumpstart your inventory.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredAssets.length > 0 && (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingAsset(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <AssetForm
            asset={editingAsset}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingAsset(null); }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Bulk Add Assets</DialogTitle>
                <DialogDescription>
                    Paste CSV data. Every item will be tagged with your Tenant ID: {tenant?.id}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Textarea 
                    placeholder="iPhone 15 Pro,SN123,2026-01-01,1,Available,1200,75,8GB,256GB,A17"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={10}
                    disabled={isBulkImporting}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkFormOpen(false)} disabled={isBulkImporting}>Cancel</Button>
                <Button onClick={handleBulkImport} disabled={isBulkImporting}>
                    {isBulkImporting ? 'Processing Silos...' : 'Import to Workspace'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{assetToDelete?.model}</strong>? This action is permanent within your business workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
