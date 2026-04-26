
"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Accessory } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch } from "lucide-react";
import { AccessoryForm } from "./accessory-form";
import { getAccessoryColumns, type AccessoryColumnActions } from "./accessory-columns";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

export function AccessoriesClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<Accessory | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const accessoriesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'accessories'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawAccessories, isLoading } = useCollection(accessoriesQuery);

  const filteredAccessories = useMemo(() => {
    if (!rawAccessories) return [];
    
    const sorted = [...rawAccessories].sort((a, b) => {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.filter((accessory) =>
      (accessory.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (accessory.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawAccessories, searchTerm]);

  const handleAddAccessory = () => {
    setEditingAccessory(null);
    setIsFormOpen(true);
  };
  
  const handleEditAccessory = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setIsFormOpen(true);
  };

  const handleDeleteAccessory = (accessory: Accessory) => {
    setAccessoryToDelete(accessory);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (accessoryToDelete) {
      try {
        await deleteDoc(doc(firestore, 'accessories', accessoryToDelete.id));
        toast({ title: "Accessory Deleted" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setAccessoryToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!user || !tenant) return;

    // Explicitly structure to avoid 'undefined' values
    const accessoryData = {
      tenantId: tenant.id,
      name: data.name || '',
      serialNumber: data.serialNumber || '',
      status: data.status,
      quantity: Number(data.quantity) || 0,
      purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : null,
      sellingPrice: Number(data.sellingPrice) || 0,
      purchaseDate: data.purchaseDate.toISOString(), 
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingAccessory) {
            await updateDoc(doc(firestore, 'accessories', editingAccessory.id), accessoryData);
            toast({ title: "Accessory Updated" });
        } else {
            await addDoc(collection(firestore, 'accessories'), {
                ...accessoryData,
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || user.email }
            });
            toast({ title: "Accessory Added" });
        }
        setIsFormOpen(false);
        setEditingAccessory(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const columnActions: AccessoryColumnActions = {
    onEdit: handleEditAccessory,
    onDelete: handleDeleteAccessory,
  };

  const columns = useMemo<ColumnDef<Accessory, any>[]>(() => getAccessoryColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredAccessories,
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
    <div className="space-y-6">
      <PageHeader
          title="Accessory Inventory"
          description="Manage your accessory inventory belonging to this workspace."
          actionLabel="Add New Accessory"
          onAction={handleAddAccessory}
          ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? <p className="animate-pulse text-muted-foreground">Loading accessories...</p> : (
        <>
          {filteredAccessories.length === 0 && searchTerm ? (
            <Alert variant="default" className="mb-4 bg-card">
              <PackageSearch className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                No matching accessories found in this workspace.
              </AlertDescription>
            </Alert>
          ) : rawAccessories?.length === 0 ? (
            <Alert variant="default" className="mb-4 bg-card">
              <PackageSearch className="h-4 w-4" />
              <AlertTitle>No Stock</AlertTitle>
              <AlertDescription>
                Your accessory inventory is currently empty.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border shadow-sm bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
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
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingAccessory(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? "Edit Accessory" : "Add New Accessory"}</DialogTitle>
            <DialogDescription>Update the accessory metadata in the cloud.</DialogDescription>
          </DialogHeader>
          <AccessoryForm
            accessory={editingAccessory}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingAccessory(null); }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{accessoryToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
