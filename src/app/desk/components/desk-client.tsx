"use client";

import { useState, useMemo } from "react";
import type { Ticket, Customer } from "@/types";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DeskClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // FIRESTORE QUERIES: Consolidated & Siloed
  const ticketsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'tickets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: tickets, isLoading: ticketsLoading } = useCollection(ticketsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers, isLoading: customersLoading } = useCollection(customersQuery);

  const isLoading = ticketsLoading || customersLoading;

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) =>
      (ticket.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleFormSubmit = async (data: any) => { 
    if (!tenant || !user) return;
    
    const selectedCustomer = customers?.find(c => c.id === data.customerId);

    const ticketData = {
        ...data,
        tenantId: tenant.id,
        customerName: selectedCustomer?.name,
        updatedAt: new Date().toISOString(),
    };

    try {
        if (editingTicket) {
            await updateDoc(doc(firestore, 'tickets', editingTicket.id), ticketData);
            toast({ title: "Case Updated" });
        } else {
            await addDoc(collection(firestore, 'tickets'), { 
                ...ticketData, 
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Case Initialized" });
        }
        setIsFormOpen(false);
        setEditingTicket(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  const confirmDelete = async () => {
    if (ticketToDelete) {
      try {
        await deleteDoc(doc(firestore, 'tickets', ticketToDelete.id));
        toast({ title: "Ticket Erased" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setTicketToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const columnActions: TicketColumnActions = {
    onEdit: (t) => { setEditingTicket(t); setIsFormOpen(true); },
    onDelete: (t) => { setTicketToDelete(t); setIsDeleteConfirmOpen(true); },
  };
  
  const columns = useMemo<ColumnDef<Ticket, any>[]>(() => getTicketColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredTickets,
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
      <PageHeader 
        title="Support Desk" 
        description="Workspace helpdesk oversight and case management in the cloud." 
        actionLabel="Create Ticket" 
        onAction={() => setIsFormOpen(true)} 
        ActionIcon={PlusCircle} 
      />

      <div className="mb-4">
        <Input 
            placeholder="Search cases..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="max-w-sm bg-card h-10" 
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground animate-pulse">Syncing support registry...</p>
      ) : (
        <>
            {!filteredTickets.length ? (
                <Alert className="bg-card">
                    <Inbox className="h-4 w-4" />
                    <AlertTitle>Desk Empty</AlertTitle>
                    <AlertDescription>
                        {searchTerm ? "No tickets match your filters." : "Your support queue is clear."}
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                                </TableRow>
                            ))}
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

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingTicket(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {editingTicket ? "Modify Case" : "Initialize New Case"}
            </DialogTitle>
          </DialogHeader>
          <TicketForm 
            ticket={editingTicket} 
            customers={customers || []} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Permanently remove this support record from the workspace?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
