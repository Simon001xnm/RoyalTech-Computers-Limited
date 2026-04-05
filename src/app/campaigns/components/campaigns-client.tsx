
"use client";

import { useState, useMemo } from "react";
import type { Campaign } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Inbox } from "lucide-react";
import { CampaignForm } from "./campaign-form";
import { getCampaignColumns, type CampaignColumnActions } from "./campaign-columns";
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
import { useUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { DataTablePagination } from "@/components/ui/data-table-pagination";


export function CampaignsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { user, isUserLoading } = useUser();
  const campaigns = useLiveQuery(() => db.campaigns.toArray());

  const isLoading = isUserLoading || campaigns === undefined;

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaigns, searchTerm]);

  const handleAddCampaign = () => {
    setEditingCampaign(null);
    setIsFormOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsFormOpen(true);
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (campaignToDelete) {
      await db.campaigns.delete(campaignToDelete.id);
      toast({ title: "Campaign Deleted", description: `Campaign "${campaignToDelete.name}" has been removed.` });
      setCampaignToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => { 
    const campaignData = {
      ...data,
      audience: { type: 'all' },
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingCampaign) {
            await db.campaigns.update(editingCampaign.id, campaignData);
            toast({ title: "Campaign Updated" });
        } else {
            await db.campaigns.add({ 
                ...campaignData, 
                id: crypto.randomUUID(), 
                createdAt: new Date().toISOString(),
                createdBy: { uid: user?.uid || 'local', name: user?.displayName || 'User' }
            });
            toast({ title: "Campaign Created" });
        }
        setIsFormOpen(false);
        setEditingCampaign(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    await db.campaigns.update(campaign.id, { status: 'Sent', sentAt: new Date().toISOString() });
    toast({ 
      title: "Campaign Sent (Simulated)", 
      description: `Campaign "${campaign.name}" has been marked as sent.` 
    });
  };

  const columnActions: CampaignColumnActions = {
    onEdit: handleEditCampaign,
    onDelete: handleDeleteCampaign,
    onSend: handleSendCampaign,
  };
  
  const columns = useMemo<ColumnDef<Campaign, any>[]>(() => getCampaignColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredCampaigns,
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
        title="Marketing Campaigns (Local)"
        description="Manage email marketing and social media campaigns stored on this device."
        actionLabel="Create New Campaign"
        onAction={handleAddCampaign}
        ActionIcon={PlusCircle}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by campaign name or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading && <p>Loading campaigns...</p>}

      {!isLoading && campaigns && campaigns.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <Inbox className="h-4 w-4" />
          <AlertTitle>No Campaigns Yet</AlertTitle>
          <AlertDescription>
            There are currently no local campaigns. Click "Create New Campaign" to get started.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredCampaigns.length > 0 && (
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

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingCampaign(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update the details of the marketing campaign." : "Fill in the details to create a new campaign."}
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingCampaign(null); }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the campaign: <strong>{campaignToDelete?.name}</strong>? This action cannot be undone.
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
