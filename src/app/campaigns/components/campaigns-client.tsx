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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useSaaS } from "@/components/saas/saas-provider";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export function CampaignsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { user } = useUser();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // FIRESTORE Isolated Query
  const campaignsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'campaigns'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: campaigns, isLoading } = useCollection(campaignsQuery);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((campaign) =>
      (campaign.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      try {
        await deleteDoc(doc(firestore, 'campaigns', campaignToDelete.id));
        toast({ title: "Campaign Deleted" });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      setCampaignToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => { 
    if (!tenant) return;

    const campaignData = {
      ...data,
      tenantId: tenant.id,
      audience: { type: 'all' },
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingCampaign) {
            await updateDoc(doc(firestore, 'campaigns', editingCampaign.id), campaignData);
            toast({ title: "Campaign Updated" });
        } else {
            await addDoc(collection(firestore, 'campaigns'), { 
                ...campaignData, 
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
    try {
        await updateDoc(doc(firestore, 'campaigns', campaign.id), { status: 'Sent', sentAt: new Date().toISOString() });
        toast({ title: "Campaign Sent (Simulated)" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
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
        title="Marketing Campaigns (Cloud)"
        description="Manage cross-channel marketing campaigns stored securely in the cloud."
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
      
      {isLoading ? <p className="animate-pulse">Syncing campaigns...</p> : (
        <>
            {!filteredCampaigns.length && !searchTerm ? (
                <Alert variant="default" className="mb-4 bg-card">
                <Inbox className="h-4 w-4" />
                <AlertTitle>No Campaigns Yet</AlertTitle>
                <AlertDescription>
                    Your cloud campaign list is empty. Click "Create New Campaign" to start your first outreach.
                </AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-lg border shadow-sm bg-card">
                <Table>
                    <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHead key={header.id}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                        </TableRow>
                    ))}
                    </TableHeader>
                    <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingCampaign(null); }}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingCampaign(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the campaign: <strong>{campaignToDelete?.name}</strong>?
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
