"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Reseller, Accessory, Asset, ItemIssuance, Sale } from "@/types";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Briefcase, TrendingUp, CornerDownLeft, PlusCircle, Edit, Trash2, DownloadCloud, Component as ComponentIcon, Laptop } from "lucide-react";
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

type IssueableItem = (Accessory | Asset) & { type: 'accessory' | 'asset' };

const ResellerCard = ({ reseller, onViewDashboard, onEdit, onDelete }: { reseller: Reseller, onViewDashboard: () => void, onEdit: () => void, onDelete: () => void }) => {
    return (
        <Card className="flex flex-col transition-all duration-200 hover:shadow-md border-none ring-1 ring-black/5 shadow-sm">
            <CardHeader className="bg-muted/10">
                <div className="flex justify-between items-start">
                    <div>
                        <a onClick={onViewDashboard} className="cursor-pointer group">
                            <CardTitle className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">{reseller.name}</CardTitle>
                        </a>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{reseller.company || reseller.email}</CardDescription>
                    </div>
                    <Badge variant={reseller.status === 'Active' ? 'default' : 'destructive'} className="text-[9px] font-black uppercase">{reseller.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-4">
                 <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">{reseller.email}</p>
                    <p className="font-medium">{reseller.phone || 'No phone'}</p>
                 </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-1 border-t bg-muted/5 p-2">
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={onEdit}><Edit className="mr-1.5 h-3 w-3" />Edit</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/5" onClick={onDelete}><Trash2 className="mr-1.5 h-3 w-3" />Delete</Button>
                <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest shadow-sm" onClick={onViewDashboard}>Dashboard</Button>
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
        const issued = issuances.filter(i => i.status === 'Issued').length;
        const sold = issuances.filter(i => i.status === 'Sold').length;
        const returned = issuances.filter(i => i.status === 'Returned').length;
        return { issued, sold, returned };
    }, [issuances]);

    const handleIssueItems = async (data: { items: { id: string; type: 'accessory' | 'asset' }[] }) => {
        if (!user || !tenant) return;
        const batch = writeBatch(firestore);
        try {
            for (const item of data.items) {
                const itemToIssue = allAvailableItems.find(i => i.id === item.id);
                if (!itemToIssue) continue;

                const issuanceRef = doc(collection(firestore, 'item_issuances'));
                const itemName = (itemToIssue as Asset).model || (itemToIssue as Accessory).name;
                const costPrice = (itemToIssue as Asset).purchasePrice || (itemToIssue as Accessory).purchasePrice || 0;
                const sellingPrice = (itemToIssue as Asset).leasePrice || (itemToIssue as Accessory).sellingPrice || 0;

                const issuanceData: ItemIssuance = {
                    id: issuanceRef.id,
                    tenantId: tenant.id,
                    resellerId: reseller.id,
                    resellerName: reseller.name,
                    itemId: itemToIssue.id,
                    itemType: item.type,
                    itemSerialNumber: itemToIssue.serialNumber,
                    itemName: itemName,
                    costPrice: costPrice,
                    expectedSellingPrice: sellingPrice,
                    dateIssued: new Date().toISOString(),
                    status: 'Issued',
                    createdAt: new Date().toISOString(),
                    createdBy: { uid: user.uid, name: user.displayName || 'User' }
                };
                
                batch.set(issuanceRef, issuanceData);
                
                // Update source collection
                const collectionName = item.type === 'asset' ? 'assets' : 'accessories';
                batch.update(doc(firestore, collectionName, item.id), { 
                    status: 'With Reseller', 
                    updatedAt: new Date().toISOString() 
                });
            }
            await batch.commit();
            toast({ title: `Items Issued to ${reseller.name}` });
            setIsIssueFormOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Issuance Failed', description: error.message });
        }
    };
    
    const handleMarkAsSold = async (data: { sellingPrice: number; paymentMethod: Sale['paymentMethod']; notes?: string; }) => {
        if (!selectedIssuance || !user || !tenant) return;
        const batch = writeBatch(firestore);
        try {
            batch.update(doc(firestore, 'item_issuances', selectedIssuance.id), { status: 'Sold', dateSold: new Date().toISOString() });
            
            // Update the actual item status to Sold
            const collectionName = selectedIssuance.itemType === 'asset' ? 'assets' : 'accessories';
            batch.update(doc(firestore, collectionName, selectedIssuance.itemId), { status: 'Sold', updatedAt: new Date().toISOString() });
            
            const saleRef = doc(collection(firestore, 'sales_transactions'));
            batch.set(saleRef, {
                tenantId: tenant.id,
                date: new Date().toISOString(),
                amount: data.sellingPrice,
                paymentMethod: data.paymentMethod,
                cogs: selectedIssuance.costPrice,
                notes: data.notes || `Issued Sale via Reseller: ${reseller.name}`,
                items: [{ 
                    id: selectedIssuance.itemId, 
                    name: selectedIssuance.itemName, 
                    serialNumber: selectedIssuance.itemSerialNumber, 
                    price: data.sellingPrice, 
                    quantity: 1, 
                    type: selectedIssuance.itemType 
                }],
                resellerId: reseller.id,
                status: 'Paid',
                createdAt: new Date().toISOString(),
                createdBy: { uid: user.uid, name: user.displayName || 'User' }
            });

            await batch.commit();
            toast({ title: 'Sale Recorded Successfully' });
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
            
            // Restore item status to Available
            const collectionName = selectedIssuance.itemType === 'asset' ? 'assets' : 'accessories';
            batch.update(doc(firestore, collectionName, selectedIssuance.itemId), { 
                status: 'Available', 
                updatedAt: new Date().toISOString() 
            });
            
            await batch.commit();
            toast({ title: 'Item Restored to Inventory' });
            setIsReturnConfirmOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Return Failed', description: error.message });
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
        <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-8 border-b bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <SheetTitle className="text-2xl font-black uppercase tracking-tighter">{reseller.name}'s Dashboard</SheetTitle>
                        <SheetDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Partner Inventory Control Node</SheetDescription>
                    </div>
                    <Button onClick={() => setIsIssueFormOpen(true)} className="h-11 px-6 font-black uppercase tracking-widest shadow-lg">
                        <PlusCircle className="mr-2 h-4 w-4"/>Issue Stock
                    </Button>
                </div>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-card/50">
                 <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <SummaryCard title="Current Stock" value={summaryStats.issued} icon={Briefcase} description="Items with reseller" />
                    <SummaryCard title="Sold to Date" value={summaryStats.sold} icon={TrendingUp} description="Converted sales" />
                    <SummaryCard title="Returned Units" value={summaryStats.returned} icon={CornerDownLeft} description="Re-stocked items" />
                </div>
                 <Card className="border-none ring-1 ring-black/5 shadow-xl overflow-hidden">
                    <CardHeader className="bg-muted/20 py-4 px-6 border-b">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                {table.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase py-4">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10 transition-colors">
                                            {row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-4 text-xs font-medium">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs">No records found for this partner.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DataTablePagination table={table} />
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isIssueFormOpen} onOpenChange={setIsIssueFormOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary" />
                            Issue Stock to Partner
                        </DialogTitle>
                    </DialogHeader>
                    <IssueItemForm availableItems={allAvailableItems} onSubmit={handleIssueItems} onCancel={() => setIsIssueFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={isSellFormOpen} onOpenChange={setIsSellFormOpen}>
                <DialogContent className="border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase">Finalize Partner Sale</DialogTitle>
                    </DialogHeader>
                    <MarkSoldForm issuance={selectedIssuance} onSubmit={handleMarkAsSold} onCancel={() => setIsSellFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <AlertDialog open={isReturnConfirmOpen} onOpenChange={setIsReturnConfirmOpen}>
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase">Confirm Inventory Return</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-base pt-2">
                            This will move <strong>{selectedIssuance?.itemName}</strong> back to your central available inventory.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReturn} className="font-black uppercase bg-destructive text-white hover:bg-destructive/90">Execute Return</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
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
    return query(collection(firestore, 'accessories'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawAccessories } = useCollection(accessoriesQuery);

  const assetsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'assets'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawAssets } = useCollection(assetsQuery);
  
  const isLoading = resellersLoading || issuancesLoading;

  const allAvailableItems = useMemo<IssueableItem[]>(() => {
    const list: IssueableItem[] = [];
    
    if (rawAssets) {
        rawAssets.filter(a => a.status === 'Available').forEach(a => {
            list.push({ ...a, type: 'asset' });
        });
    }
    
    if (rawAccessories) {
        rawAccessories.filter(a => a.status === 'Available').forEach(a => {
            list.push({ ...a, type: 'accessory' });
        });
    }
    
    return list;
  }, [rawAccessories, rawAssets]);

  const filteredResellers = useMemo(() => {
    if (!resellers) return [];
    return resellers.filter((r) => (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [resellers, searchTerm]);

  const handleSaveReseller = async (data: any) => {
    if (!tenant) return;
    try {
        if (editingReseller) {
            await updateDoc(doc(firestore, 'resellers', editingReseller.id), { ...data, updatedAt: new Date().toISOString() });
            toast({ title: "Profile Updated" });
        } else {
            await addDoc(collection(firestore, 'resellers'), { ...data, tenantId: tenant.id, registrationDate: new Date().toISOString(), createdAt: new Date().toISOString() });
            toast({ title: "Partner Registered" });
        }
        setIsFormOpen(false); setEditingReseller(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <PageHeader 
        title="Partner Network (Resellers)" 
        description="Oversee inventory distribution and track sales conversion through partners." 
        actionLabel="Register New Partner" 
        onAction={() => setIsFormOpen(true)} 
        ActionIcon={PlusCircle} 
      />

      <div className="mb-4">
        <Input 
            placeholder="Search partners by name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="max-w-sm bg-card h-11 font-bold"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold uppercase text-[10px] tracking-widest">
            <DownloadCloud className="h-4 w-4" /> Syncing partner nodes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResellers.map(reseller => (
                <ResellerCard key={reseller.id} reseller={reseller} onViewDashboard={() => setSelectedReseller(reseller)} onEdit={() => { setEditingReseller(reseller); setIsFormOpen(true); }} onDelete={() => { setEditingReseller(reseller); setIsDeleteConfirmOpen(true); }} />
            ))}
            {filteredResellers.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl opacity-30">
                    <Briefcase className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No partners registered in this node</p>
                </div>
            )}
        </div>
      )}

      <Sheet open={!!selectedReseller} onOpenChange={(o) => !o && setSelectedReseller(null)}>
        <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl flex flex-col p-0 border-none shadow-2xl">
            {selectedReseller && <ResellerDashboardSheet reseller={selectedReseller} allIssuances={allIssuances || []} allAvailableItems={allAvailableItems} />}
        </SheetContent>
      </Sheet>

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingReseller(null); }}}>
        <DialogContent className="border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingReseller ? "Update Partner" : "Initialize Partner Node"}</DialogTitle>
            </DialogHeader>
            <ResellerForm reseller={editingReseller} onSubmit={handleSaveReseller} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="border-none shadow-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black uppercase">Revoke Partner Node?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-base pt-2">
                    This will remove the reseller from your active directory. Historical records of issuances will be preserved.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-2">
                <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => { if (editingReseller) await deleteDoc(doc(firestore, 'resellers', editingReseller.id)); setIsDeleteConfirmOpen(false); }} className="bg-destructive text-white hover:bg-destructive/90 font-black uppercase tracking-widest">Confirm Revocation</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
