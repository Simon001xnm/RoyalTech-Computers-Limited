
"use client";

import { useState, useMemo } from "react";
import type { Lease, Customer, Laptop } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSearch, FileX } from "lucide-react";
import { LeaseForm } from "./lease-form";
import { getLeaseColumns, type LeaseColumnActions } from "./lease-columns";
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
import { collection, doc, writeBatch } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { DataTablePagination } from "@/components/ui/data-table-pagination";


export function LeasesClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [leaseToDelete, setLeaseToDelete] = useState<Lease | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const leasesCollection = useMemoFirebase(() => user ? collection(firestore, 'leaseAgreements') : null, [firestore, user]);
  const { data: leases, isLoading: isLoadingLeases } = useCollection<Lease>(leasesCollection);

  const customersCollection = useMemoFirebase(() => user ? collection(firestore, 'customers') : null, [firestore, user]);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollection);

  const laptopsCollection = useMemoFirebase(() => user ? collection(firestore, 'laptops') : null, [firestore, user]);
  const { data: laptops, isLoading: isLoadingLaptops } = useCollection<Laptop>(laptopsCollection);

  const isLoading = isUserLoading || isLoadingLeases || isLoadingCustomers || isLoadingLaptops;

  const filteredLeases = useMemo(() => {
    if (!leases) return [];
    return leases.filter((lease) =>
      lease.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.laptopModel?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leases, searchTerm]);

  const handleAddLease = () => {
    setEditingLease(null);
    setIsFormOpen(true);
  };

  const handleEditLease = (lease: Lease) => {
    setEditingLease(lease);
    setIsFormOpen(true);
  };

  const handleDeleteLease = (lease: Lease) => {
    setLeaseToDelete(lease);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (leaseToDelete) {
        try {
            const batch = writeBatch(firestore);

            // 1. If the lease was associated with a laptop, set it back to 'Available'
            if (leaseToDelete.laptopId) {
                const laptopRef = doc(firestore, 'laptops', leaseToDelete.laptopId);
                batch.update(laptopRef, { status: 'Available' });
            }
            
            // 2. Delete the lease
            const leaseRef = doc(firestore, 'leaseAgreements', leaseToDelete.id);
            batch.delete(leaseRef);

            await batch.commit();

            toast({ title: "Lease Deleted", description: `Lease for ${leaseToDelete.laptopModel} has been removed and the laptop is now available.` });
        } catch (error) {
            console.error("Error deleting lease: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete the lease." });
        } finally {
            setLeaseToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    }
  };

  const handleFormSubmit = async (data: any) => { 
     const selectedCustomer = customers?.find(c => c.id === data.customerId);
     const selectedLaptop = laptops?.find(l => l.id === data.laptopId);

    if (!selectedCustomer || !selectedLaptop || !user) {
        toast({ variant: "destructive", title: "Error", description: "Invalid customer, laptop, or user session." });
        return;
    }

    const auditInfo = {
        uid: user.uid,
        name: user.displayName || user.email || (user.isAnonymous ? "Anonymous User" : "System"),
    };

    const leaseData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        customerName: selectedCustomer.name,
        laptopModel: selectedLaptop.model,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: auditInfo,
    };

    try {
        const batch = writeBatch(firestore);
        const laptopRef = doc(firestore, 'laptops', selectedLaptop.id);

        if (editingLease) {
            const leaseRef = doc(firestore, 'leaseAgreements', editingLease.id);
            batch.set(leaseRef, leaseData, { merge: true });
            
            if (editingLease.laptopId !== selectedLaptop.id) {
                const oldLaptopRef = doc(firestore, 'laptops', editingLease.laptopId);
                batch.update(oldLaptopRef, { status: 'Available' });
                batch.update(laptopRef, { status: 'Leased' });
            }
            
            toast({ title: "Lease Updated", description: `Lease for ${leaseData.laptopModel} has been updated.`});
        } else {
            const newLeaseRef = doc(collection(firestore, 'leaseAgreements'));
            batch.set(newLeaseRef, { ...leaseData, createdAt: new Date().toISOString(), createdBy: auditInfo });
            batch.update(laptopRef, { status: 'Leased' });
            toast({ title: "Lease Created", description: `New lease for ${leaseData.laptopModel} created.`});
        }
        
        await batch.commit();

    } catch (error) {
        console.error("Error submitting form: ", error);
        toast({ variant: "destructive", title: "Error", description: "There was a problem saving the lease." });
    } finally {
        setIsFormOpen(false);
        setEditingLease(null);
    }
  };
  
  const handleMarkPaid = (lease: Lease) => {
    const docRef = doc(firestore, 'leaseAgreements', lease.id);
    updateDocumentNonBlocking(docRef, { paymentStatus: 'Paid' });
    toast({ title: "Payment Updated", description: `Lease for ${lease.laptopModel} marked as Paid.` });
  };

  const handleTerminateLease = async (lease: Lease) => {
     try {
        const batch = writeBatch(firestore);
        const leaseRef = doc(firestore, 'leaseAgreements', lease.id);
        
        batch.update(leaseRef, { status: 'Terminated', endDate: new Date().toISOString() });
        
        if(lease.laptopId) {
            const laptopRef = doc(firestore, 'laptops', lease.laptopId);
            batch.update(laptopRef, { status: 'Available' });
        }
        
        await batch.commit();
        toast({ title: "Lease Terminated", description: `Lease for ${lease.laptopModel} has been terminated and the laptop is available again.` });
     } catch (error) {
        console.error("Error terminating lease: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not terminate the lease." });
     }
  };

  const columnActions: LeaseColumnActions = {
    onEdit: handleEditLease,
    onDelete: handleDeleteLease,
    onMarkPaid: handleMarkPaid,
    onTerminate: handleTerminateLease,
  };
  
  const columns = useMemo<ColumnDef<Lease, any>[]>(() => getLeaseColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredLeases,
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

  const availableLaptops = useMemo(() => {
    return laptops?.filter(l => 
        l.status === 'Available' || (editingLease && l.id === editingLease.laptopId)
    ) || [];
  }, [laptops, editingLease]);

  return (
    <>
      <PageHeader
        title="Lease Tracking"
        description="Manage all laptop lease agreements."
        actionLabel="Create New Lease"
        onAction={handleAddLease}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by customer or laptop model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>

      {isLoading && <p>Loading data...</p>}

      {!isLoading && filteredLeases.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <FileSearch className="h-4 w-4" />
          <AlertTitle>No Leases Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any leases. Try a different term or create a new lease.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && leases && leases.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <FileX className="h-4 w-4" />
          <AlertTitle>No Leases Recorded</AlertTitle>
          <AlertDescription>
            There are currently no leases in your records. Click "Create New Lease" to get started.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredLeases.length > 0 && (
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

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingLease(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLease ? "Edit Lease" : "Create New Lease"}</DialogTitle>
            <DialogDescription>
              {editingLease ? "Update the details of the existing lease." : "Fill in the details to create a new lease agreement."}
            </DialogDescription>
          </DialogHeader>
          <LeaseForm
            lease={editingLease}
            customers={customers || []}
            laptops={availableLaptops || []}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingLease(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the lease for <strong>{leaseToDelete?.laptopModel}</strong> (Customer: {leaseToDelete?.customerName})? This action will set the laptop status back to "Available" and cannot be undone.
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
