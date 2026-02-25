
"use client";

import { useState, useMemo } from "react";
import type { Ticket, Customer, Lease, Laptop } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Inbox } from "lucide-react";
import { TicketForm } from "./ticket-form";
import { getTicketColumns, type TicketColumnActions } from "./ticket-columns";
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


export function DeskClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ticketsCollection = useMemoFirebase(() => user ? collection(firestore, 'tickets') : null, [firestore, user]);
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsCollection);
  
  const customersCollection = useMemoFirebase(() => user ? collection(firestore, 'customers') : null, [firestore, user]);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollection);
  
  const leasesCollection = useMemoFirebase(() => user ? collection(firestore, 'leaseAgreements') : null, [firestore, user]);
  const { data: leases, isLoading: isLoadingLeases } = useCollection<Lease>(leasesCollection);

  const laptopsCollection = useMemoFirebase(() => user ? collection(firestore, 'laptops') : null, [firestore, user]);
  const { data: laptops, isLoading: isLoadingLaptops } = useCollection<Laptop>(laptopsCollection);

  const isLoading = isUserLoading || isLoadingTickets || isLoadingCustomers || isLoadingLeases || isLoadingLaptops;

  const leasesWithLaptopDetails = useMemo(() => {
    return (leases || []).map(lease => {
      const laptop = laptops?.find(l => l.id === lease.laptopId);
      return {
        ...lease,
        laptopSerialNumber: laptop?.serialNumber,
      };
    });
  }, [leases, laptops]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleAddTicket = () => {
    setEditingTicket(null);
    setIsFormOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsFormOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ticketToDelete) {
      const docRef = doc(firestore, 'tickets', ticketToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Ticket Deleted", description: `Ticket "${ticketToDelete.subject}" has been removed.` });
      setTicketToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = (data: any) => { 
    const selectedCustomer = customers?.find(c => c.id === data.customerId);
    const selectedLease = leases?.find(l => l.id === data.leaseId);
    const selectedLaptop = laptops?.find(l => l.id === selectedLease?.laptopId);

    const ticketData = {
        ...data,
        customerName: selectedCustomer?.name,
        leaseIdentifier: selectedLease ? `${selectedLaptop?.serialNumber} (${selectedLease.laptopModel})` : undefined,
        updatedAt: new Date().toISOString(),
    };

    if (editingTicket) {
      const docRef = doc(firestore, 'tickets', editingTicket.id);
      setDocumentNonBlocking(docRef, ticketData, { merge: true });
      toast({ title: "Ticket Updated", description: `Ticket "${data.subject}" has been updated.`});
    } else {
      addDocumentNonBlocking(collection(firestore, 'tickets'), { ...ticketData, createdAt: new Date().toISOString() });
      toast({ title: "Ticket Created", description: `New ticket "${data.subject}" has been created.`});
    }
    setIsFormOpen(false);
    setEditingTicket(null);
  };

  const columnActions: TicketColumnActions = {
    onEdit: handleEditTicket,
    onDelete: handleDeleteTicket,
  };
  
  const columns = useMemo<ColumnDef<Ticket, any>[]>(() => getTicketColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredTickets,
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
        title="Helpdesk"
        description="Manage customer support tickets."
        actionLabel="Create New Ticket"
        onAction={handleAddTicket}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by subject or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading && <p>Loading tickets...</p>}

      {!isLoading && tickets && tickets.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <Inbox className="h-4 w-4" />
          <AlertTitle>No Tickets Yet</AlertTitle>
          <AlertDescription>
            There are currently no support tickets. Click "Create New Ticket" to get started.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredTickets.length > 0 && (
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

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingTicket(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket" : "Create New Ticket"}</DialogTitle>
            <DialogDescription>
              {editingTicket ? "Update the details of the existing support ticket." : "Fill in the details to create a new support ticket."}
            </DialogDescription>
          </DialogHeader>
          <TicketForm
            ticket={editingTicket}
            customers={customers || []}
            leases={leasesWithLaptopDetails || []}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingTicket(null); }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the ticket: <strong>{ticketToDelete?.subject}</strong>? This action cannot be undone.
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
