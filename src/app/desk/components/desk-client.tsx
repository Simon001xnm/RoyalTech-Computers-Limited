
"use client";

import { useState, useMemo } from "react";
import type { Ticket } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, SearchX, Inbox } from "lucide-react";
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
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";
import { useUser } from "@/firebase/provider";
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // SaaS Isolated Query
  const tickets = useLiveQuery(async () => {
    if (!tenant) return undefined;
    return await db.tickets.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const customers = useLiveQuery(async () => {
    if (!tenant) return undefined;
    return await db.customers.where('tenantId').equals(tenant.id).toArray();
  }, [tenant?.id]);

  const isLoading = tickets === undefined || customers === undefined;

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleFormSubmit = async (data: any) => { 
    if (!tenant || !user) return;
    
    const selectedCustomer = customers?.find(c => c.id === data.customerId);

    const ticketData = {
        ...data,
        tenantId: tenant.id, // Multi-tenant Injection
        customerName: selectedCustomer?.name,
        updatedAt: new Date().toISOString(),
    };

    try {
        if (editingTicket) {
            await db.tickets.update(editingTicket.id, ticketData);
            toast({ title: "Ticket Updated" });
        } else {
            await db.tickets.add({ 
                ...ticketData, 
                id: crypto.randomUUID(), 
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });
            toast({ title: "Ticket Created" });
        }
        setIsFormOpen(false);
        setEditingTicket(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const confirmDelete = async () => {
    if (ticketToDelete) {
      await db.tickets.delete(ticketToDelete.id);
      toast({ title: "Ticket Deleted" });
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
        title="Support Desk (Siloed)" 
        description="Track and resolve customer support issues for your business." 
        actionLabel="Create Ticket" 
        onAction={() => setIsFormOpen(true)} 
        ActionIcon={PlusCircle} 
      />

      <div className="mb-4">
        <Input 
            placeholder="Search by subject or customer..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="max-w-sm bg-card h-10" 
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground animate-pulse">Syncing support directory...</p>
      ) : filteredTickets.length === 0 ? (
        <Alert className="bg-card">
            <Inbox className="h-4 w-4" />
            <AlertTitle>Desk Empty</AlertTitle>
            <AlertDescription>
                {searchTerm ? "No tickets match your search filters." : "Your support queue is clear. All customers are satisfied!"}
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
            <DialogTitle>Confirm Erasure</DialogTitle>
            <DialogDescription>
                Are you sure you want to permanently delete this support record?
            </DialogDescription>
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
