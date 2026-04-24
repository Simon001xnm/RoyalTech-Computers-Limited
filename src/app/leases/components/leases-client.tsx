"use client";

import { useState, useMemo } from "react";
import type { Lease, Customer, Asset } from "@/types";
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
  DialogHeader,
  DialogTitle,
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
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from "firebase/firestore";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

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

  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  // Firestore Queries (MIGRATED FROM DEXIE)
  const leasesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lease_agreements');
  }, [firestore]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laptop_instances');
  }, [firestore]);

  const { data: leases, isLoading: isLeasesLoading } = useCollection<Lease>(leasesQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);
  const { data: assets } = useCollection<Asset>(assetsQuery);

  const isLoading = isLeasesLoading || customers === null || assets === null;

  const filteredLeases = useMemo(() => {
    if (!leases) return [];
    return leases.filter((lease) =>
      lease.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.assetModel?.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (leaseToDelete && firestore) {
      const docRef = doc(firestore, 'lease_agreements', leaseToDelete.id);
      deleteDocumentNonBlocking(docRef);
      
      // Update asset status back to available
      if (leaseToDelete.assetId) {
        const assetRef = doc(firestore, 'laptop_instances', leaseToDelete.assetId);
        updateDocumentNonBlocking(assetRef, { status: 'Available' });
      }
      
      toast({ title: "Lease Removed" });
      setLeaseToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleFormSubmit = async (data: any) => { 
     const selectedCustomer = customers?.find(c => c.id === data.customerId);
     const selectedAsset = assets?.find(a => a.id === data.assetId);

    if (!selectedCustomer || !selectedAsset || !user || !firestore) return;

    const auditInfo = {
        uid: user.uid,
        name: user.displayName || user.email || "System",
    };

    const leaseData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        customerName: selectedCustomer.name,
        assetModel: selectedAsset.model,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: auditInfo,
    };

    try {
        if (editingLease) {
            const leaseRef = doc(firestore, 'lease_agreements', editingLease.id);
            updateDocumentNonBlocking(leaseRef, leaseData);
            
            if (editingLease.assetId !== selectedAsset.id) {
                const oldAssetRef = doc(firestore, 'laptop_instances', editingLease.assetId);
                const newAssetRef = doc(firestore, 'laptop_instances', selectedAsset.id);
                updateDocumentNonBlocking(oldAssetRef, { status: 'Available' });
                updateDocumentNonBlocking(newAssetRef, { status: 'Leased' });
            }
            toast({ title: "Lease Updated" });
        } else {
            const leasesCol = collection(firestore, 'lease_agreements');
            addDocumentNonBlocking(leasesCol, { 
                ...leaseData, 
                createdAt: new Date().toISOString(), 
                createdBy: auditInfo 
            });
            
            const assetRef = doc(firestore, 'laptop_instances', selectedAsset.id);
            updateDocumentNonBlocking(assetRef, { status: 'Leased' });
            toast({ title: "Lease Created" });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsFormOpen(false);
        setEditingLease(null);
    }
  };
  
  const handleMarkPaid = (lease: Lease) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'lease_agreements', lease.id);
    updateDocumentNonBlocking(docRef, { paymentStatus: 'Paid' });
    toast({ title: "Payment Recorded" });
  };

  const handleTerminateLease = (lease: Lease) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'lease_agreements', lease.id);
    updateDocumentNonBlocking(docRef, { status: 'Terminated', endDate: new Date().toISOString() });
    
    if(lease.assetId) {
        const assetRef = doc(firestore, 'laptop_instances', lease.assetId);
        updateDocumentNonBlocking(assetRef, { status: 'Available' });
    }
    toast({ title: "Lease Terminated" });
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

  const availableAssets = useMemo(() => {
    return assets?.filter(a => 
        a.status === 'Available' || (editingLease && a.id === editingLease.assetId)
    ) || [];
  }, [assets, editingLease]);

  return (
    <>
      <PageHeader
        title="Lease Tracking (Cloud)"
        description="Audited hardware lease agreements managed via Firestore."
        actionLabel="Create New Lease"
        onAction={handleAddLease}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by customer or asset model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>

      {isLoading ? <p className="text-muted-foreground animate-pulse">Syncing lease directory...</p> : (
        <>
          {!filteredLeases.length && searchTerm ? (
            <Alert variant="default" className="mb-4 bg-card">
              <FileSearch className="h-4 w-4" />
              <AlertTitle>No Leases Found</AlertTitle>
              <AlertDescription>Your search for "{searchTerm}" did not match any active cloud records.</AlertDescription>
            </Alert>
          ) : !leases?.length ? (
            <Alert variant="default" className="mb-4 bg-card">
              <FileX className="h-4 w-4" />
              <AlertTitle>No Leases Recorded</AlertTitle>
              <AlertDescription>Start tracking hardware leases in the cloud.</AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border shadow-sm bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results match filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <DataTablePagination table={table} />
            </div>
          )}
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingLease(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLease ? "Edit Agreement" : "Finalize New Lease"}</DialogTitle>
          </DialogHeader>
          <LeaseForm
            lease={editingLease}
            customers={customers || []}
            assets={availableAssets || []}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingLease(null); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
