
"use client";

import { useState, useMemo } from "react";
import type { Accessory } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload } from "lucide-react";
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
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const accessoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'accessories') : null, [firestore, user]);
  const { data: accessories, isLoading: accessoriesLoading } = useCollection<Accessory>(accessoriesCollection);

  const isLoading = isUserLoading || accessoriesLoading;

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

  const confirmDelete = () => {
    if (accessoryToDelete) {
      const docRef = doc(firestore, 'accessories', accessoryToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Accessory Deleted", description: `${accessoryToDelete.name} has been removed.` });
      setAccessoryToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
        return;
    }
    const auditInfo = {
        uid: user.uid,
        name: user.displayName || user.email || (user.isAnonymous ? 'Anonymous User' : 'System'),
    };

    const accessoryData = {
      ...data,
      purchaseDate: data.purchaseDate.toISOString(), 
    };

    // Sanitize data for Firestore by removing undefined properties
    if (accessoryData.purchasePrice === undefined) {
      delete (accessoryData as any).purchasePrice;
    }

    const q = query(collection(firestore, 'accessories'), where('serialNumber', '==', accessoryData.serialNumber));
    
    try {
        const querySnapshot = await getDocs(q);
        const existingAccessory = querySnapshot.docs.find(doc => doc.id !== editingAccessory?.id);

        if (existingAccessory) {
            toast({
                variant: "destructive",
                title: "Duplicate Serial Number",
                description: `An accessory with the serial number ${accessoryData.serialNumber} already exists.`,
            });
            return;
        }
    } catch (error) {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: 'accessories'
        });
        errorEmitter.emit('permission-error', contextualError);
        return;
    }

    if (editingAccessory) {
      const docRef = doc(firestore, 'accessories', editingAccessory.id);
      setDocumentNonBlocking(docRef, { 
        ...accessoryData, 
        updatedAt: new Date().toISOString(),
        lastModifiedBy: auditInfo
      }, { merge: true });
      toast({ title: "Accessory Updated", description: `${accessoryData.name} has been updated.`});
    } else {
      addDocumentNonBlocking(collection(firestore, 'accessories'), {
        ...accessoryData,
        createdAt: new Date().toISOString(),
        createdBy: auditInfo
      });
      toast({ title: "Accessory Added", description: `${accessoryData.name} has been added to stock.`});
    }
    setIsFormOpen(false);
    setEditingAccessory(null);
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
          title="Accessory Inventory"
          description="Manage your accessory inventory."
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
            Your search for "{searchTerm}" did not match any accessories. Try a different term or add a new accessory.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && accessories && accessories.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Accessories in Stock</AlertTitle>
          <AlertDescription>
            There are currently no accessories in your inventory. Click "Add New Accessory" to get started.
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
                    No results for the current filter.
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
            <DialogDescription>
              {editingAccessory ? "Update the details of the existing accessory." : "Fill in the details to add a new accessory to inventory."}
            </DialogDescription>
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
              Are you sure you want to delete the accessory: <strong>{accessoryToDelete?.name}</strong> (S/N: {accessoryToDelete?.serialNumber})? This action cannot be undone.
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
