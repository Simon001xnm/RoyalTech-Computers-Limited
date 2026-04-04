"use client";

import { useState, useMemo } from "react";
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
import { useUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { DataTablePagination } from "@/components/ui/data-table-pagination";


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
  
  const { user, isUserLoading } = useUser();
  const accessories = useLiveQuery(() => db.accessories.toArray());

  const isLoading = isUserLoading || accessories === undefined;

  const filteredAccessories = useMemo(() => {
    if (!accessories) return [];
    return accessories.filter((accessory) =>
      accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accessory.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accessories, searchTerm]);

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
      await db.accessories.delete(accessoryToDelete.id);
      toast({ title: "Accessory Deleted" });
      setAccessoryToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!user) return;

    const accessoryData = {
      ...data,
      purchaseDate: data.purchaseDate.toISOString(), 
    };

    try {
        if (editingAccessory) {
            await db.accessories.update(editingAccessory.id, { 
                ...accessoryData, 
                updatedAt: new Date().toISOString() 
            });
            toast({ title: "Accessory Updated" });
        } else {
            await db.accessories.add({
                ...accessoryData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString()
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
    <>
      <PageHeader
          title="Accessory Inventory (Local)"
          description="Manage your accessory inventory stored on this device."
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
      
      {isLoading && <p>Loading accessories...</p>}

      {!isLoading && filteredAccessories.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Accessories Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any accessories.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && accessories && accessories.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Accessories in Stock</AlertTitle>
          <AlertDescription>
            There are currently no accessories in your inventory.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredAccessories.length > 0 && (
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

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingAccessory(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? "Edit Accessory" : "Add New Accessory"}</DialogTitle>
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
              Are you sure you want to delete the accessory: <strong>{accessoryToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
