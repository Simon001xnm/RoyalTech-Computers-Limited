
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Reseller, Accessory, ItemIssuance, Sale } from "@/types";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Briefcase, TrendingUp, CornerDownLeft, PlusCircle, Edit, Trash2, DownloadCloud, Component as ComponentIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { getIssuanceColumns, type IssuanceColumnActions } from "./issuance-columns";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ResellerForm } from "./reseller-form";
import { IssueItemForm } from "./issue-item-form";
import { MarkSoldForm } from "./mark-sold-form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { exportToCsv } from "@/lib/utils";
import { format } from "date-fns";
import { useSaaS } from "@/components/saas/saas-provider";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";

type IssueableItem = Accessory & { type: 'accessory' };

const ResellerCard = ({ reseller, onViewDashboard, onEdit, onDelete }: { reseller: Reseller, onViewDashboard: () => void, onEdit: () => void, onDelete: () => void }) => {
    return (
        <Card className="flex flex-col transition-all duration-200 hover:shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <a onClick={onViewDashboard} className="cursor-pointer hover:underline">
                            <CardTitle className="text-lg">{reseller.name}</CardTitle>
                        </a>
                        <CardDescription>{reseller.company || reseller.email}</CardDescription>
                    </div>
                    <Badge variant={reseller.status === 'Active' ? 'default' : 'destructive'}>{reseller.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="text-sm text-muted-foreground space-y-1">
                    <p>{reseller.email}</p>
                    <p>{reseller.phone || 'No phone'}</p>
                 </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                <Button size="sm" onClick={onViewDashboard}>Dashboard</Button>
            </CardFooter>
        </Card>
    );
};

const ResellerDashboardSheet = ({ reseller, allIssuances, allAvailableItems }: { reseller: Reseller, allIssuances: ItemIssuance[], allAvailableItems: IssueableItem[] }) => {
    const { user } = useUser();
    const { tenant } = useSaaS();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
    const [isSellFormOpen, setIsSellFormOpen] = useState(false);
    const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<ItemIssuance | null>(null);

    const issuances = useMemo(() => allIssuances.filter(i => i.resellerId === reseller.id), [allIssuances, reseller.id]);
    
    const summaryStats = useMemo(() => {
        const issued = issuances.length;
        const sold = issuances.filter(i => i.status === 'Sold').length;
        const returned = issuances.filter(i => i.status === 'Returned').length;
        return { issued, sold, returned };
    }, [issuances]);

    const handleIssueItems = async (data: { items: { id: string; type: 'accessory' }[] }) => {
        if (!user || !tenant) return;
        const batch = writeBatch(firestore);
        try {
            for (const item of data.items) {
                const itemToIssue = allAvailableItems.find(i => i.id === item.id);
                if (!itemToIssue) continue;

                const issuanceRef = doc(collection(firestore, 'item_issuances'));
                const issuanceData: ItemIssuance = {
                    id: issuanceRef.id,
                    tenantId: tenant.id,
                    resellerId: reseller.id,
                    resellerName: reseller.name,
                    itemId: itemToIssue.id,
                    itemType: 'accessory',
                    itemSerialNumber: itemToIssue.serialNumber,
                    itemName: itemToIssue.name,
                    costPrice: itemToIssue.purchasePrice || 0,
                    expectedSellingPrice: itemToIssue.sellingPrice || 0,
                    dateIssued: new Date().toISOString(),
                    status: 'Issued',
                    createdAt: new Date().toISOString(),
                    createdBy: { uid: user.uid, name: user.displayName || 'User' }
                };
                batch.set(issuanceRef, issuanceData);
                batch.update(doc(firestore, 'accessories', item.id), { status: 'With Reseller', quantity: 0 });
            }
            await batch.commit();
            toast({ title: `${data.items.length} Accessory(s) Issued` });
            setIsIssueFormOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const handleMarkAsSold = async (data: { sellingPrice: number; paymentMethod: Sale['paymentMethod']; notes?: string; }) => {
        if (!selectedIssuance || !user || !tenant) return;
        const batch = writeBatch(firestore);
        try {
            batch.update(doc(firestore, 'item_issuances', selectedIssuance.id), { status: 'Sold', dateSold: new Date().toISOString() });
            batch.update(doc(firestore, 'accessories', selectedIssuance.itemId), { status: 'Sold' });
            
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, {
                tenantId: tenant.id,
                date: new Date().toISOString(),
                amount: data.sellingPrice,
                paymentMethod: data.paymentMethod,
                cogs: selectedIssuance.costPrice,
                notes: data.notes || `Reseller: ${reseller.name}`,
                items: [{ id: selectedIssuance.itemId, name: selectedIssuance.itemName, serialNumber: selectedIssuance.itemSerialNumber, price: data.sellingPrice, quantity: 1, type: 'accessory' }],
                resellerId: reseller.id,
                status: 'Paid',
                createdAt: new Date().toISOString()
            });

            await batch.commit();
            toast({ title: 'Sale Recorded' });
            setIsSellFormOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const confirmReturn = async () => {
        if (!selectedIssuance) return;
        const batch = writeBatch(firestore);
        try {
            batch.update(doc(firestore, 'item_issuances', selectedIssuance.id), { status: 'Returned', dateReturned: new Date().toISOString() });
            batch.update(doc(firestore, 'accessories', selectedIssuance.itemId), { status: 'Available', quantity: 1 });
            await batch.commit();
            toast({ title: 'Item Returned' });
            setIsReturnConfirmOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const columnActions: IssuanceColumnActions = {
        onMarkAsSold: (issuance) => { setSelectedIssuance(issuance); setIsSellFormOpen(true); },
        onMarkAsReturned: (issuance) => { setSelectedIssuance(issuance); setIsReturnConfirmOpen(true); },
    };
    
    const columns = useMemo<ColumnDef<ItemIssuance>[]>(() => getIssuanceColumns(columnActions), []);
    const table = useReactTable({
        data: issuances || [], columns, state: { pagination }, onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
            <SheetHeader className="p-6">
                <SheetTitle>{reseller.name}'s Dashboard</SheetTitle>
                <div className="pt-2"><Button onClick={() => setIsIssueFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Issue Accessories</Button></div>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                 <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard title="Issued" value={summaryStats.issued} icon={Briefcase} />
                    <SummaryCard title="Sold" value={summaryStats.sold} icon={TrendingUp} />
                    <SummaryCard title="Returned" value={summaryStats.returned} icon={CornerDownLeft} />
                </div>
                 <Card>
                    <CardHeader><CardTitle>History</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                            <TableBody>{table.getRowModel().rows.map(row => (<TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))}</TableBody>
                        </Table>
                        <DataTablePagination table={table} />
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isIssueFormOpen} onOpenChange={setIsIssueFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <IssueItemForm availableItems={allAvailableItems} onSubmit={handleIssueItems} onCancel={() => setIsIssueFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={isSellFormOpen} onOpenChange={setIsSellFormOpen}><DialogContent><MarkSoldForm issuance={selectedIssuance} onSubmit={handleMarkAsSold} onCancel={() => setIsSellFormOpen(false)} /></DialogContent></Dialog>
            <AlertDialog open={isReturnConfirmOpen} onOpenChange={setIsReturnConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Return?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmReturn}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
    );
}

export function ResellersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const resellersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'resellers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: resellers, isLoading: resellersLoading } = useCollection(resellersQuery);

  const issuancesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'item_issuances'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: allIssuances, isLoading: issuancesLoading } = useCollection(issuancesQuery);

  const accessoriesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'accessories'), where('tenantId', '==', tenant.id), where('status', '==', 'Available'));
  }, [firestore, tenant?.id]);
  const { data: availableAccessories } = useCollection(accessoriesQuery);
  
  const isLoading = resellersLoading || issuancesLoading;

  const allAvailableItems = useMemo<IssueableItem[]>(() => {
        return (availableAccessories || []).map(item => ({ ...item, type: 'accessory' as const }));
    }, [availableAccessories]);

  const filteredResellers = useMemo(() => {
    if (!resellers) return [];
    return resellers.filter((r) => (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [resellers, searchTerm]);

  const handleSaveReseller = async (data: any) => {
    if (!tenant) return;
    try {
        if (editingReseller) {
            await updateDoc(doc(firestore, 'resellers', editingReseller.id), { ...data, updatedAt: new Date().toISOString() });
            toast({ title: "Updated" });
        } else {
            await addDoc(collection(firestore, 'resellers'), { ...data, tenantId: tenant.id, registrationDate: new Date().toISOString(), createdAt: new Date().toISOString() });
            toast({ title: "Added" });
        }
        setIsFormOpen(false); setEditingReseller(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error' });
    }
  };

  return (
    <>
      <PageHeader title="Resellers" description="Manage reseller accounts." actionLabel="Add New Reseller" onAction={() => setIsFormOpen(true)} ActionIcon={PlusCircle} />
      <div className="mb-4"><Input placeholder="Search name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/></div>
      {isLoading ? <p>Syncing...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResellers.map(reseller => (
                <ResellerCard key={reseller.id} reseller={reseller} onViewDashboard={() => setSelectedReseller(reseller)} onEdit={() => { setEditingReseller(reseller); setIsFormOpen(true); }} onDelete={() => { setEditingReseller(reseller); setIsDeleteConfirmOpen(true); }} />
            ))}
        </div>
      )}
      <Sheet open={!!selectedReseller} onOpenChange={(o) => !o && setSelectedReseller(null)}><SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl flex flex-col p-0">{selectedReseller && <ResellerDashboardSheet reseller={selectedReseller} allIssuances={allIssuances || []} allAvailableItems={allAvailableItems} />}</SheetContent></Sheet>
      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingReseller(null); }}}>
        <DialogContent><DialogHeader><DialogTitle>{editingReseller ? "Edit" : "Add"}</DialogTitle></DialogHeader><ResellerForm reseller={editingReseller} onSubmit={handleSaveReseller} onCancel={() => setIsFormOpen(false)} /></DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Reseller?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { if (editingReseller) await deleteDoc(doc(firestore, 'resellers', editingReseller.id)); setIsDeleteConfirmOpen(false); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}
