
"use client";

import { useState, useMemo } from "react";
import type { Asset } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload, Lock, Download } from "lucide-react";
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { useUser } from "@/firebase/provider";
import { AssetService } from "@/services/asset-service";
import { cn, exportToCsv } from "@/lib/utils";
import { ValuationSummary } from "./valuation-summary";

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
  const firestore = useFirestore();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const assetsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laptop_instances');
  }, [firestore]);

  const { data: assets, isLoading } = useCollection<Asset>(assetsQuery);

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

  const handleDownloadTemplate = () => {
    const filename = "RCL_Asset_Import_Template.csv";
    const data = [
        {
            model: "iPhone 15 Pro",
            serialNumber: "IMEI-123456789",
            purchaseDate: "2024-01-15",
            quantity: "1",
            status: "Available",
            purchasePrice: "145000",
            leasePrice: "7500",
            ram: "8GB",
            storage: "256GB",
            processor: "A17 Pro"
        }
    ];
    const mapping = {
        model: "Model",
        serialNumber: "Serial Number",
        purchaseDate: "Purchase Date (YYYY-MM-DD)",
        quantity: "Quantity",
        status: "Status",
        purchasePrice: "Purchase Price",
        leasePrice: "Lease Rate",
        ram: "RAM",
        storage: "Storage",
        processor: "Processor"
    };
    exportToCsv(filename, data, mapping);
  };
  
  const handleBulkImport = async () => {
    if (!bulkData.trim() || !tenant || !firestore) return;
    setIsBulkImporting(true);
    try {
        const lines = bulkData.trim().split('\n').filter(line => line.trim() !== '');
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
            } as any;
        });

        await AssetService.bulkImport(firestore, newAssets, tenant.id);
        toast({ title: 'Import Started', description: `Processing ${newAssets.length} assets.` });
        setIsBulkFormOpen(false);
        setBulkData("");
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
        setIsBulkImporting(false);
    }
  }

  const confirmDelete = async () => {
    if (assetToDelete && tenant && firestore) {
      try {
        await AssetService.delete(firestore, assetToDelete.id, tenant.id);
        toast({ title: "Asset Deleted" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setIsDeleteConfirmOpen(false);
      setAssetToDelete(null);
    }
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user || !firestore) return;

    try {
        if (editingAsset) {
            await AssetService.update(firestore, editingAsset.id, data, tenant.id);
            toast({ title: "Asset Updated" });
        } else {
            await AssetService.create(firestore, data, tenant.id, { uid: user.uid, name: user.displayName || 'User' });
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
            <PageHeader title="Asset Inventory (Cloud)" description="Global audited hardware portfolio managed via Firestore." />
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <Button onClick={() => setIsBulkFormOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Bulk Add
            </Button>
            <Button onClick={handleAddAsset} className={cn("shadow-md font-bold", isAtCapacity && "opacity-50")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Asset
            </Button>
        </div>
      </div>

      {!isLoading && assets && <ValuationSummary assets={assets} />}

      <div className="mb-4">
        <Input
          placeholder="Search by model or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? <p className="text-muted-foreground animate-pulse">Accessing cloud inventory...</p> : (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
              )) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No assets found in the cloud.</TableCell></TableRow>)}
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
            <DialogHeader>
                <DialogTitle>Bulk Add Assets</DialogTitle>
                <DialogDescription>Paste inventory CSV data below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Button onClick={handleDownloadTemplate} size="sm" variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> Download Template
                </Button>
                <Textarea 
                    placeholder="Model, SN, Date, Qty, Status, Price, LeaseRate, RAM, Storage, Processor" 
                    value={bulkData} 
                    onChange={(e) => setBulkData(e.target.value)} 
                    rows={12} 
                    disabled={isBulkImporting} 
                    className="font-mono text-xs"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkFormOpen(false)} disabled={isBulkImporting}>Cancel</Button>
                <Button onClick={handleBulkImport} disabled={isBulkImporting || !bulkData.trim()}>
                    {isBulkImporting ? 'Syncing...' : 'Import to Firestore'}
                </Button>
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
