"use client";

import { useState, useMemo } from "react";
import type { Lease } from "@/types";
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

  const { user, isUserLoading } = useUser();

  const leases = useLiveQuery(() => db.leases.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());

  const isLoading = isUserLoading || leases === undefined || customers === undefined || assets === undefined;

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
    if (leaseToDelete) {
        try {
            await db.transaction('rw', [db.leases, db.assets], async () => {
                if (leaseToDelete.assetId) {
                    await db.assets.update(leaseToDelete.assetId, { status: 'Available' });
                }
                await db.leases.delete(leaseToDelete.id);
            });
            toast({ title: "Lease Deleted" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLeaseToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    }
  };

  const handleFormSubmit = async (data: any) => { 
     const selectedCustomer = customers?.find(c => c.id === data.customerId);
     const selectedAsset = assets?.find(a => a.id === data.assetId);

    if (!selectedCustomer || !selectedAsset || !user) return;

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
        await db.transaction('rw', [db.leases, db.assets], async () => {
            if (editingLease) {
                await db.leases.update(editingLease.id, leaseData);
                if (editingLease.assetId !== selectedAsset.id) {
                    await db.assets.update(editingLease.assetId, { status: 'Available' });
                    await db.assets.update(selectedAsset.id, { status: 'Leased' });
                }
                toast({ title: "Lease Updated" });
            } else {
                await db.leases.add({ 
                    ...leaseData, 
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(), 
                    createdBy: auditInfo 
                });
                await db.assets.update(selectedAsset.id, { status: 'Leased' });
                toast({ title: "Lease Created" });
            }
        });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsFormOpen(false);
        setEditingLease(null);
    }
  };
  
  const handleMarkPaid = async (lease: Lease) => {
    await db.leases.update(lease.id, { paymentStatus: 'Paid' });
    toast({ title: "Payment Updated" });
  };

  const handleTerminateLease = async (lease: Lease) => {
     try {
        await db.transaction('rw', [db.leases, db.assets], async () => {
            await db.leases.update(lease.id, { status: 'Terminated', endDate: new Date().toISOString() });
            if(lease.assetId) {
                await db.assets.update(lease.assetId, { status: 'Available' });
            }
        });
        toast({ title: "Lease Terminated" });
     } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
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
        title="Lease Tracking (Local)"
        description="Manage asset lease agreements stored on this device."
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

      {isLoading && <p>Loading data...</p>}

      {!isLoading && filteredLeases.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <FileSearch className="h-4 w-4" />
          <AlertTitle>No Leases Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any local leases.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && leases && leases.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <FileX className="h-4 w-4" />
          <AlertTitle>No Leases Recorded</AlertTitle>
          <AlertDescription>
            There are currently no leases in your records.
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

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the lease for <strong>{leaseToDelete?.assetModel}</strong>?
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
