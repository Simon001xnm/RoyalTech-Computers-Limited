"use client";

import { useState, useMemo } from "react";
import type { Ticket } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

export function DeskClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // Local data fetching
  const tickets = useLiveQuery(() => db.tickets.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const leases = useLiveQuery(() => db.leases.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());

  const isLoading = tickets === undefined || customers === undefined || leases === undefined;

  const leasesWithAssetDetails = useMemo(() => {
    return (leases || []).map(lease => {
      const asset = assets?.find(a => a.id === lease.assetId);
      return { ...lease, laptopSerialNumber: asset?.serialNumber }; // Keeping field name for compatibility with form
    });
  }, [leases, assets]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleFormSubmit = async (data: any) => { 
    const selectedCustomer = customers?.find(c => c.id === data.customerId);
    const selectedLease = leases?.find(l => l.id === data.leaseId);
    const selectedAsset = assets?.find(a => a.id === selectedLease?.assetId);

    const ticketData = {
        ...data,
        customerName: selectedCustomer?.name,
        leaseIdentifier: selectedLease ? `${selectedAsset?.serialNumber} (${selectedLease.assetModel})` : undefined,
        updatedAt: new Date().toISOString(),
    };

    try {
        if (editingTicket) {
            await db.tickets.update(editingTicket.id, ticketData);
            toast({ title: "Ticket Updated" });
        } else {
            await db.tickets.add({ ...ticketData, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
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
      <PageHeader title="Helpdesk (Local)" description="Track support issues on this device." actionLabel="Create Ticket" onAction={() => setIsFormOpen(true)} ActionIcon={PlusCircle} />
      <div className="mb-4"><Input placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" /></div>
      {isLoading ? <p>Loading...</p> : (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>{table.getRowModel().rows.map(row => (<TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))}</TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket" : "Create Ticket"}</DialogTitle>
          </DialogHeader>
          <TicketForm 
            ticket={editingTicket} 
            customers={customers || []} 
            leases={leasesWithAssetDetails || []} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
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
