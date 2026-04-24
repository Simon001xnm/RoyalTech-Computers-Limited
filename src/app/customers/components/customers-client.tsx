"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Customer } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, UserX } from "lucide-react";
import { CustomerForm } from "./customer-form";
import { getCustomerColumns, type CustomerColumnActions } from "./customer-columns";
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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

export function CustomersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // FIRESTORE QUERY: Siloed by tenantId
  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) =>
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await deleteDoc(doc(firestore, 'customers', customerToDelete.id));
        toast({ title: "Customer Deleted" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setIsDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!tenant || !user) return;

    const customerData = {
      ...data,
      tenantId: tenant.id,
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingCustomer) {
            await updateDoc(doc(firestore, 'customers', editingCustomer.id), customerData);
            toast({ title: "Customer Updated" });
        } else {
            await addDoc(collection(firestore, 'customers'), {
                ...customerData,
                registrationDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Customer Added" });
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const columnActions: CustomerColumnActions = {
    onEdit: handleEditCustomer,
    onDelete: handleDeleteCustomer,
  };
  
  const columns = useMemo<ColumnDef<Customer, any>[]>(() => getCustomerColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredCustomers,
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
        title="Customer CRM"
        description="Managing client relationships within your cloud workspace."
        actionLabel="Add New Customer"
        onAction={handleAddCustomer}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? <p className="text-muted-foreground animate-pulse">Syncing client directory...</p> : (
        <>
            {!filteredCustomers.length && searchTerm ? (
                <Alert variant="default" className="mb-4 bg-card">
                <UserX className="h-4 w-4" />
                <AlertTitle>No Results</AlertTitle>
                <AlertDescription>Your search for "{searchTerm}" did not match any records.</AlertDescription>
                </Alert>
            ) : !customers?.length ? (
                <Alert variant="default" className="mb-4 bg-card">
                <Users className="h-4 w-4" />
                <AlertTitle>CRM Empty</AlertTitle>
                <AlertDescription>Start building your cloud-synced customer base.</AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-lg border shadow-sm bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataTablePagination table={table} />
                </div>
            )}
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingCustomer(null); }}}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
          <CustomerForm customer={editingCustomer} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
