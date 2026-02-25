
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
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { DataTablePagination } from "@/components/ui/data-table-pagination";


export function CustomersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const customersCollection = useMemoFirebase(() => user ? collection(firestore, 'customers') : null, [firestore, user]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersCollection);

  const isLoading = isUserLoading || customersLoading;

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

  const confirmDelete = () => {
    if (customerToDelete) {
      const docRef = doc(firestore, 'customers', customerToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = (data: any) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
        return;
    }
    const auditInfo = {
        uid: user.uid,
        name: user.displayName || user.email || (user.isAnonymous ? 'Anonymous User' : 'System'),
    };

    if (editingCustomer) {
      const docRef = doc(firestore, 'customers', editingCustomer.id);
      setDocumentNonBlocking(docRef, { 
        ...data, 
        updatedAt: new Date().toISOString(),
        lastModifiedBy: auditInfo 
      }, { merge: true });
      toast({ title: "Customer Updated", description: `${data.name} has been updated.`});
    } else {
      addDocumentNonBlocking(collection(firestore, 'customers'), { 
        ...data, 
        registrationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: auditInfo
      });
      toast({ title: "Customer Added", description: `${data.name} has been added.`});
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
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
        title="Customer Management"
        description="Manage your customer records."
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
      
      {isLoading && <p>Loading customers...</p>}

      {!isLoading && filteredCustomers.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <UserX className="h-4 w-4" />
          <AlertTitle>No Customers Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any customers. Try a different term or add a new customer.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && customers && customers.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <Users className="h-4 w-4" />
          <AlertTitle>No Customers Yet</AlertTitle>
          <AlertDescription>
            There are currently no customers in your records. Click "Add New Customer" to get started.
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
                    No results for the current filter.
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
            <DialogDescription>
              {editingCustomer ? "Update the details of the existing customer." : "Fill in the details to add a new customer."}
            </DialogDescription>
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
              Are you sure you want to delete the customer: <strong>{customerToDelete?.name}</strong>? This action cannot be undone.
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
