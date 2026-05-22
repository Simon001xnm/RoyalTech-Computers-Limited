
"use client";

import { useState, useMemo } from "react";
import type { Lease, Customer } from "@/types";
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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

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

  const isLoading = leasesLoading || customersLoading;

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

  const confirmDelete = async () => {
    if (leaseToDelete) {
      try {
        await deleteDoc(doc(firestore, 'leases', leaseToDelete.id));
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
    if (!selectedCustomer || !user || !tenant) return;

    const leaseData = {
        clientType: data.clientType,
        customerId: data.customerId,
        customerName: selectedCustomer.name,
        laptopModel: data.laptopModel,
        serialNumber: data.serialNumber,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        duration: data.duration,
        durationUnit: data.durationUnit,
        monthlyPayment: data.monthlyPayment,
        paymentStatus: data.paymentStatus,
        status: data.status,
        signature: data.signature,
        tenantId: tenant.id,
        updatedAt: new Date().toISOString(),
        verification: {
            nationalId: data.nationalId || null,
            guarantorId: data.guarantorId || null,
            studentId: data.studentId || null,
            parentName: data.parentName || null,
            parentPhone: data.parentPhone || null,
            businessPermit: data.businessPermit || null,
            cr12Reference: data.cr12Reference || null,
            directorId: data.directorId || null,
            contactPerson: data.contactPerson || null,
        }
    };

    try {
        if (editingLease) {
            await updateDoc(doc(firestore, 'leases', editingLease.id), leaseData);
            toast({ title: "Lease Updated" });
        } else {
            await addDoc(collection(firestore, 'leases'), { 
                ...leaseData, 
                createdAt: new Date().toISOString(), 
                createdBy: { uid: user.uid, name: user.displayName || user.email } 
            });
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

  const columnActions: LeaseColumnActions = {
    onEdit: handleEditLease,
    onDelete: (l) => { setLeaseToDelete(l); setIsDeleteConfirmOpen(true); },
    onMarkPaid: handleMarkPaid,
  };
  
  const columns = useMemo<ColumnDef<Lease, any>[]>(() => getLeaseColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredLeases,
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
      <PageHeader title="Lease Tracking" description="Manage hire agreements manually." actionLabel="Create New Lease" onAction={handleAddLease} ActionIcon={PlusCircle} />
      <div className="mb-4"><Input placeholder="Search client or model..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm bg-card" /></div>
      {isLoading ? <p className="text-muted-foreground animate-pulse">Syncing...</p> : (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}
      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingLease(null); }}}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Lease Agreement</DialogTitle></DialogHeader>
          <LeaseForm lease={editingLease} customers={customers || []} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
