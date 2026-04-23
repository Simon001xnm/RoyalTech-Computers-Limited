
"use client";

import { useState, useMemo } from "react";
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
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // SaaS Isolated Query
  const customers = useLiveQuery(async () => {
    if (!tenant) return undefined;
    return await db.customers.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const isLoading = customers === undefined;

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      await db.customers.delete(customerToDelete.id);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!tenant) return;

    const customerData: Customer = {
      ...data,
      id: editingCustomer?.id || crypto.randomUUID(),
      tenantId: tenant.id, // Layer 2 Tenancy Injection
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingCustomer) {
            await db.customers.put(customerData);
            toast({ title: "Customer Updated" });
        } else {
            await db.customers.add({ 
                ...customerData, 
                registrationDate: new Date().toISOString(),
                createdAt: new Date().toISOString() 
            });
            toast({ title: "Customer Added" });
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save customer.' });
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
        title="Customer CRM (Siloed)"
        description="Managing client relationships private to your business workspace."
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
      
      {isLoading && <p className="text-muted-foreground animate-pulse">Syncing client directory...</p>}

      {!isLoading && filteredCustomers.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <UserX className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any records in your tenant.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && customers && customers.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <Users className="h-4 w-4" />
          <AlertTitle>CRM Empty</AlertTitle>
          <AlertDescription>
            Start building your private customer base for this business.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredCustomers.length > 0 && (
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
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingCustomer(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingCustomer(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{customerToDelete?.name}</strong> from your business CRM?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
