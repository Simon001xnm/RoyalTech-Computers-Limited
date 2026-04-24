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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
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

  // FIRESTORE QUERIES: Siloed by tenantId
  const leasesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'leases'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: leases, isLoading: leasesLoading } = useCollection(leasesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers, isLoading: customersLoading } = useCollection(customersQuery);

  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: assets, isLoading: assetsLoading } = useCollection(assetsQuery);

  const isLoading = leasesLoading || customersLoading || assetsLoading;

  const filteredLeases = useMemo(() => {
    if (!leases) return [];
    return leases.filter((lease) =>
      (lease.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lease.laptopModel || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      const batch = writeBatch(firestore);
      batch.delete(doc(firestore, 'leases', leaseToDelete.id));
      
      if (leaseToDelete.assetId) {
        batch.update(doc(firestore, 'assets', leaseToDelete.assetId), { status: 'Available' });
      }
      
      try {
        await batch.commit();
        toast({ title: "Lease Removed" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setLeaseToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => { 
     const selectedCustomer = customers?.find(c => c.id === data.customerId);
     const selectedAsset = assets?.find(a => a.id === data.assetId);

    if (!selectedCustomer || !selectedAsset || !user || !tenant) return;

    const auditInfo = {
        uid: user.uid,
        name: user.displayName || user.email || "System",
    };

    const leaseData = {
        ...data,
        tenantId: tenant.id,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        customerName: selectedCustomer.name,
        laptopModel: selectedAsset.model,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: auditInfo,
    };

    try {
        const batch = writeBatch(firestore);
        if (editingLease) {
            batch.update(doc(firestore, 'leases', editingLease.id), leaseData);
            if (editingLease.assetId !== selectedAsset.id) {
                batch.update(doc(firestore, 'assets', editingLease.assetId), { status: 'Available' });
                batch.update(doc(firestore, 'assets', selectedAsset.id), { status: 'Leased' });
            }
            await batch.commit();
            toast({ title: "Lease Updated" });
        } else {
            const leaseRef = doc(collection(firestore, 'leases'));
            batch.set(leaseRef, { 
                ...leaseData, 
                id: leaseRef.id,
                createdAt: new Date().toISOString(), 
                createdBy: auditInfo 
            });
            batch.update(doc(firestore, 'assets', selectedAsset.id), { status: 'Leased' });
            await batch.commit();
            toast({ title: "Lease Created" });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsFormOpen(false);
        setEditingLease(null);
    }
  };
  
  const handleMarkPaid = async (lease: Lease) => {
    try {
        await updateDoc(doc(firestore, 'leases', lease.id), { paymentStatus: 'Paid' });
        toast({ title: "Payment Recorded" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleTerminateLease = async (lease: Lease) => {
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'leases', lease.id), { status: 'Terminated', endDate: new Date().toISOString() });
    
    if(lease.assetId) {
        batch.update(doc(firestore, 'assets', lease.assetId), { status: 'Available' });
    }
    
    try {
        await batch.commit();
        toast({ title: "Lease Terminated" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
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

  const availableAssets = useMemo(() => {
    return assets?.filter(a => 
        a.status === 'Available' || (editingLease && a.id === editingLease.assetId)
    ) || [];
  }, [assets, editingLease]);

  return (
    <>
      <PageHeader
        title="Lease Tracking"
        description="Hardware lease agreements synchronized across your cloud workspace."
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

      {isLoading ? <p className="text-muted-foreground animate-pulse">Syncing contracts...</p> : (
        <>
          {!filteredLeases.length && searchTerm ? (
            <Alert variant="default" className="mb-4 bg-card">
              <FileSearch className="h-4 w-4" />
              <AlertTitle>No Leases Found</AlertTitle>
              <AlertDescription>Your search for "{searchTerm}" did not match any cloud records.</AlertDescription>
            </Alert>
          ) : !leases?.length ? (
            <Alert variant="default" className="mb-4 bg-card">
              <FileX className="h-4 w-4" />
              <AlertTitle>No Leases Recorded</AlertTitle>
              <AlertDescription>Start tracking hardware leases globally.</AlertDescription>
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
