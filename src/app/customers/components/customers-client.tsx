"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import type { Customer, User as AppUser } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, UserX, Loader2, Search } from "lucide-react";
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
  DialogDescription,
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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

export function CustomersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

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
            toast({ title: "Updated" });
        } else {
            await addDoc(collection(firestore, 'customers'), {
                ...customerData,
                registrationDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Registered" });
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Saving' });
    }
  };

  const columnActions: CustomerColumnActions = {
    onEdit: (c) => { setEditingCustomer(c); setIsFormOpen(true); },
    onDelete: isAdmin ? (c) => { setCustomerToDelete(c); setIsDeleteConfirmOpen(true); } : undefined,
  };
  
  const columns = useMemo<ColumnDef<Customer, any>[]>(() => getCustomerColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredCustomers,
    columns,
    state: { rowSelection, pagination },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-3 sm:space-y-6 px-1 sm:px-0">
      <PageHeader
        title="Client List"
        description="Workspace CRM silo."
        actionLabel="Register New"
        onAction={() => { setEditingCustomer(null); setIsFormOpen(true); }}
        ActionIcon={PlusCircle}
      />

      <div className="mb-3 sm:mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-30" />
        <Input
          placeholder="Search name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card h-10 sm:h-11 font-bold pl-9 rounded-xl"
        />
      </div>
      
      {isLoading ? (
          <div className="p-12 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground">Syncing directory...</div>
      ) : (
        <div className="rounded-xl sm:rounded-[2rem] border-none ring-1 ring-black/5 shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id} className="font-black uppercase text-[8px] sm:text-[10px] py-4 px-2 sm:px-6 whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/5 transition-colors">
                                    {row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-3 px-2 sm:px-6 text-[11px] sm:text-xs font-medium whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="h-32 text-center opacity-30 font-black uppercase text-[10px]">No clients found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="px-4"><DataTablePagination table={table} /></div>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingCustomer(null); }}}>
        <DialogContent className="w-[95vw] sm:max-w-lg border-none shadow-2xl rounded-2xl sm:rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="p-6 sm:p-8 bg-muted/10 border-b"><DialogTitle className="text-xl font-black uppercase tracking-tight">{editingCustomer ? "Modify Identity" : "Register Node"}</DialogTitle></DialogHeader>
          <div className="p-6 sm:p-8 pt-4">
              <CustomerForm customer={editingCustomer} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-destructive">Void Account</DialogTitle>
            <DialogDescription className="font-medium text-base pt-2">
              Remove <strong>{customerToDelete?.name}</strong> forever?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting} className="font-bold h-12 rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (customerToDelete) { setIsDeleting(true); await deleteDoc(doc(firestore, 'customers', customerToDelete.id)); setCustomerToDelete(null); setIsDeleteConfirmOpen(false); setIsDeleting(false); } }} disabled={isDeleting} className="font-black uppercase h-12 rounded-xl">Purge Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
