'use client';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import type { Product } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, History } from "lucide-react";
import { AssetForm } from "./asset-form";
import { getAssetColumns } from "./asset-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { format } from "date-fns";

export function StockClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Product | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedAuditProduct, setSelectedAuditProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { tenant } = useSaaS();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'products'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawAssets, isLoading } = useCollection(assetsQuery);

  const movementsQuery = useMemoFirebase(() => {
    if (!tenant || !selectedAuditProduct) return null;
    return query(collection(firestore, 'stock_movements'), where('productId', '==', selectedAuditProduct.id));
  }, [firestore, selectedAuditProduct?.id]);
  const { data: auditLogs, isLoading: auditLoading } = useCollection(movementsQuery);

  const filteredAssets = useMemo(() => {
    if (!rawAssets) return [];
    
    const sorted = [...rawAssets].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.filter((asset) =>
      (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawAssets, searchTerm]);

  const sanitizeData = (data: any) => {
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
          if (sanitized[key] === undefined) {
              sanitized[key] = "";
          }
      });
      return sanitized;
  };

  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user) return;
    setIsSubmitting(true);

    try {
        const sanitizedData = sanitizeData(data);
        const productData = {
            tenantId: tenant.id,
            ...sanitizedData,
            updatedAt: new Date().toISOString()
        };

        if (editingAsset) {
            const batch = writeBatch(firestore);
            const productRef = doc(firestore, 'products', editingAsset.id);
            
            const stockDiff = data.currentStock - editingAsset.currentStock;
            if (stockDiff !== 0) {
                const movementRef = doc(collection(firestore, 'stock_movements'));
                batch.set(movementRef, {
                    tenantId: tenant.id,
                    productId: editingAsset.id,
                    type: "ADJUSTMENT",
                    quantity: stockDiff,
                    previousStock: editingAsset.currentStock,
                    newStock: data.currentStock,
                    reason: "Manual adjustment in form",
                    timestamp: new Date().toISOString(),
                    createdBy: { uid: user.uid, name: user.displayName }
                });
            }

            batch.update(productRef, productData);
            await batch.commit();
            toast({ title: "Product Updated" });
        } else {
            const docRef = await addDoc(collection(firestore, 'products'), {
                ...productData,
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });

            if (data.currentStock > 0) {
                await addDoc(collection(firestore, 'stock_movements'), {
                    tenantId: tenant.id,
                    productId: docRef.id,
                    type: "STOCK IN",
                    quantity: data.currentStock,
                    previousStock: 0,
                    newStock: data.currentStock,
                    reason: "Initial stock registration",
                    timestamp: new Date().toISOString(),
                    createdBy: { uid: user.uid, name: user.displayName }
                });
            }
            toast({ title: "Product Created" });
        }
        setIsFormOpen(false);
        setEditingAsset(null);
    } catch (error: any) {
        console.error("Submission Error:", error);
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message || 'Check your internet connection and try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const columnActions = {
    onEdit: (asset: Product) => { setEditingAsset(asset); setIsFormOpen(true); },
    onDelete: (asset: Product) => { setAssetToDelete(asset); setIsDeleteConfirmOpen(true); },
    onAudit: (asset: Product) => { setSelectedAuditProduct(asset); }
  };

  const columns = useMemo(() => getAssetColumns(columnActions), [columnActions]);

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
        title="Inventory Engine" 
        description="Unified product management with variant support and multi-user audit trails."
        actionLabel="Register New Product"
        onAction={() => { setEditingAsset(null); setIsFormOpen(true); }}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name, SKU or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card h-11 font-bold"
        />
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center animate-pulse font-black uppercase text-[10px] tracking-widest">Loading node inventory...</div>
      ) : (
        <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto">
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
                        <TableCell colSpan={table.getAllColumns().length} className="h-32 text-center text-muted-foreground italic">No products found in this node.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingAsset(null); }}}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingAsset ? "Modify Product" : "Register Product Node"}</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ensure all required fields marked with * are completed.</DialogDescription>
          </DialogHeader>
          <AssetForm asset={editingAsset} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedAuditProduct} onOpenChange={(o) => !o && setSelectedAuditProduct(null)}>
        <SheetContent className="sm:max-w-xl flex flex-col p-0">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <SheetTitle className="text-xl font-black uppercase tracking-tighter">Audit Trail: {selectedAuditProduct?.name}</SheetTitle>
            <SheetDescription className="font-bold text-[10px] uppercase text-muted-foreground">Historical stock movements and adjustments.</SheetDescription>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto">
            {auditLoading ? (
                <div className="p-8 text-center animate-pulse">Syncing logs...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
                <div className="divide-y">
                    {[...auditLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                        <div key={log.id} className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <Badge variant={log.quantity > 0 ? 'default' : 'destructive'} className="text-[8px] font-black uppercase px-2 h-4 border-none">
                                    {log.type}
                                </Badge>
                                <span className="text-[10px] font-mono opacity-40">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1">
                                <p className="text-sm font-bold">{log.quantity > 0 ? '+' : ''}{log.quantity} {selectedAuditProduct?.unit}</p>
                                <p className="text-xs text-muted-foreground">Balance: {log.newStock}</p>
                            </div>
                            {log.reason && <p className="text-[10px] italic opacity-60">"{log.reason}"</p>}
                            <p className="text-[8px] uppercase font-black opacity-30">By: {log.createdBy?.name || 'System'}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center space-y-4">
                    <History className="h-10 w-10 mx-auto opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No movement history</p>
                </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Confirm Deletion</DialogTitle>
            <DialogDescription className="font-medium text-base pt-2">
              All history and variants for <strong>{assetToDelete?.name}</strong> will be erased.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Abort</Button>
            <Button variant="destructive" onClick={async () => { if (assetToDelete) await deleteDoc(doc(firestore, 'products', assetToDelete.id)); setIsDeleteConfirmOpen(false); }} className="font-black uppercase">Delete Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ variant, children, className }: any) {
    const variants: any = {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input bg-background"
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant || 'default']} ${className}`}>
            {children}
        </span>
    );
}
