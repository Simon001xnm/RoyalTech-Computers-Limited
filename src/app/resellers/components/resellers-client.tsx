"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useUser } from "@/firebase/provider";
import type { Reseller, Laptop, Accessory, ItemIssuance, Sale } from "@/types";
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Briefcase, LaptopIcon, TrendingUp, CornerDownLeft, PlusCircle, Edit, Trash2, DownloadCloud } from "lucide-react";
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

type IssueableItem = 
  | (Laptop & { type: 'laptop' }) 
  | (Accessory & { type: 'accessory' });

// #region Reseller Card
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
                    <p>{reseller.phone || 'No phone number'}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                <Button size="sm" onClick={onViewDashboard}>View Dashboard</Button>
            </CardFooter>
        </Card>
    );
};
// #endregion

// #region Dashboard Sheet Content
const ResellerDashboardSheet = ({ reseller, allIssuances, allAvailableItems }: { reseller: Reseller, allIssuances: ItemIssuance[], allAvailableItems: IssueableItem[] }) => {
    const { user } = useUser();
    const { toast } = useToast();
    
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
        const held = issuances.filter(i => i.status === 'Issued').length;
        return { issued, sold, returned, held };
    }, [issuances]);

    const handleIssueItems = async (data: { items: { id: string; type: 'laptop' | 'accessory' }[] }) => {
        if (!user) return;

        try {
            await db.transaction('rw', [db.itemIssuances, db.laptops, db.accessories], async () => {
                for (const item of data.items) {
                    const itemToIssue = allAvailableItems.find(i => i.id === item.id);
                    if (!itemToIssue) continue;

                    const issuanceData: ItemIssuance = {
                        id: crypto.randomUUID(),
                        resellerId: reseller.id,
                        resellerName: reseller.name,
                        itemId: itemToIssue.id,
                        itemType: item.type,
                        itemSerialNumber: itemToIssue.serialNumber,
                        itemName: 'name' in itemToIssue ? itemToIssue.name : itemToIssue.model,
                        costPrice: itemToIssue.purchasePrice || 0,
                        expectedSellingPrice: ('sellingPrice' in itemToIssue ? itemToIssue.sellingPrice : itemToIssue.leasePrice) || 0,
                        dateIssued: new Date().toISOString(),
                        status: 'Issued',
                        createdAt: new Date().toISOString(),
                        createdBy: { uid: user.uid, name: user.displayName || 'User' }
                    };
                    await db.itemIssuances.add(issuanceData);
                    
                    if (item.type === 'laptop') {
                        await db.laptops.update(item.id, { status: 'With Reseller', quantity: 0 });
                    } else {
                        await db.accessories.update(item.id, { status: 'With Reseller', quantity: 0 });
                    }
                }
            });

            toast({ title: `${data.items.length} Item(s) Issued` });
            setIsIssueFormOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const handleMarkAsSold = async (data: { sellingPrice: number; paymentMethod: Sale['paymentMethod']; notes?: string; }) => {
        if (!selectedIssuance || !user) return;
        
        try {
            await db.transaction('rw', [db.itemIssuances, db.laptops, db.accessories, db.sales], async () => {
                await db.itemIssuances.update(selectedIssuance.id, { status: 'Sold', dateSold: new Date().toISOString() });
                
                if (selectedIssuance.itemType === 'laptop') {
                    await db.laptops.update(selectedIssuance.itemId, { status: 'Sold' });
                } else {
                    await db.accessories.update(selectedIssuance.itemId, { status: 'Sold' });
                }
                
                const saleData: Sale = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    amount: data.sellingPrice,
                    paymentMethod: data.paymentMethod,
                    cogs: selectedIssuance.costPrice,
                    notes: data.notes || `Sale by reseller: ${reseller.name}`,
                    items: [{ 
                        id: selectedIssuance.itemId, 
                        name: selectedIssuance.itemName, 
                        serialNumber: selectedIssuance.itemSerialNumber, 
                        price: data.sellingPrice, 
                        quantity: 1, 
                        type: selectedIssuance.itemType, 
                        cogs: selectedIssuance.costPrice 
                    }],
                    resellerId: reseller.id,
                    resellerName: reseller.name,
                    status: 'Paid',
                    createdAt: new Date().toISOString(),
                    createdBy: { uid: user.uid, name: user.displayName || 'User' }
                };
                await db.sales.add(saleData);
            });

            toast({ title: 'Sale Recorded!' });
            setIsSellFormOpen(false);
            setSelectedIssuance(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const confirmReturn = async () => {
        if (!selectedIssuance) return;
        try {
            await db.transaction('rw', [db.itemIssuances, db.laptops, db.accessories], async () => {
                await db.itemIssuances.update(selectedIssuance.id, { status: 'Returned', dateReturned: new Date().toISOString() });
                
                if (selectedIssuance.itemType === 'laptop') {
                    await db.laptops.update(selectedIssuance.itemId, { status: 'Available', quantity: 1 });
                } else {
                    await db.accessories.update(selectedIssuance.itemId, { status: 'Available', quantity: 1 });
                }
            });

            toast({ title: 'Item Returned' });
            setIsReturnConfirmOpen(false);
            setSelectedIssuance(null);
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
                <SheetTitle className="text-2xl">{reseller.name}'s Dashboard</SheetTitle>
                <SheetDescription>{reseller.email} | {reseller.company || 'No company'}</SheetDescription>
                <div className="pt-2">
                    <Button onClick={() => setIsIssueFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Issue Items</Button>
                </div>
            </SheetHeader>
            <Separator />
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard title="Total Items Issued" value={summaryStats.issued} icon={Briefcase} />
                    <SummaryCard title="Items Sold" value={summaryStats.sold} icon={TrendingUp} />
                    <SummaryCard title="Items Returned" value={summaryStats.returned} icon={CornerDownLeft} />
                    <SummaryCard title="Items Currently Held" value={summaryStats.held} icon={LaptopIcon} />
                </div>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Issuance History</CardTitle>
                            <CardDescription>All items currently or previously issued to {reseller.name}.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                                    )) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No items issued yet.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination table={table} />
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isIssueFormOpen} onOpenChange={setIsIssueFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Issue Items to {reseller.name}</DialogTitle>
                        <DialogDescription>Select one or more available items to issue.</DialogDescription>
                    </DialogHeader>
                    <IssueItemForm availableItems={allAvailableItems} onSubmit={handleIssueItems} onCancel={() => setIsIssueFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={isSellFormOpen} onOpenChange={setIsSellFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Sold</DialogTitle>
                        <DialogDescription>Record the sale for {selectedIssuance?.itemName}.</DialogDescription>
                    </DialogHeader>
                    <MarkSoldForm issuance={selectedIssuance} onSubmit={handleMarkAsSold} onCancel={() => setIsSellFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <AlertDialog open={isReturnConfirmOpen} onOpenChange={setIsReturnConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Item Return</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to mark {selectedIssuance?.itemName} as returned?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedIssuance(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReturn}>Confirm Return</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
// #endregion

export function ResellersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const resellers = useLiveQuery(() => db.resellers.toArray());
  const allIssuances = useLiveQuery(() => db.itemIssuances.toArray());
  const availableLaptops = useLiveQuery(() => db.laptops.filter(l => l.status === 'Available').toArray());
  const availableAccessories = useLiveQuery(() => db.accessories.filter(a => a.status === 'Available').toArray());
  
  const isLoading = resellers === undefined || allIssuances === undefined || availableLaptops === undefined || availableAccessories === undefined;

  const allAvailableItems = useMemo<IssueableItem[]>(() => {
        const laptops = (availableLaptops || []).map(item => ({ ...item, type: 'laptop' as const }));
        const accessories = (availableAccessories || []).map(item => ({ ...item, type: 'accessory' as const }));
        return [...laptops, ...accessories];
    }, [availableLaptops, availableAccessories]);

  const filteredResellers = useMemo(() => {
    if (!resellers) return [];
    return resellers.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resellers, searchTerm]);

  const handleAddReseller = () => { setEditingReseller(null); setIsFormOpen(true); };
  const handleEditReseller = (reseller: Reseller) => { setEditingReseller(reseller); setIsFormOpen(true); };
  const handleDeleteReseller = (reseller: Reseller) => { setEditingReseller(reseller); setIsDeleteConfirmOpen(true); };

  const confirmDelete = async () => {
    if (editingReseller) {
      await db.resellers.delete(editingReseller.id);
      toast({ title: "Reseller Deleted" });
    }
    setIsDeleteConfirmOpen(false);
    setEditingReseller(null);
  };

  const handleSaveReseller = async (data: any) => {
    if (!resellers) return;

    const lowerCaseName = data.name.toLowerCase();
    const lowerCaseEmail = data.email.toLowerCase();

    const conflictingReseller = resellers.find(r => {
        if (editingReseller && r.id === editingReseller.id) return false;
        return r.name.toLowerCase() === lowerCaseName ||
               r.email.toLowerCase() === lowerCaseEmail ||
               (data.phone && data.phone.trim() !== '' && r.phone === data.phone);
    });
    
    if (conflictingReseller) {
        toast({ variant: 'destructive', title: 'Duplicate Record', description: 'Reseller with same name, email or phone exists.' });
        return;
    }

    try {
        if (editingReseller) {
            await db.resellers.update(editingReseller.id, { ...data, updatedAt: new Date().toISOString() });
            toast({ title: "Reseller Updated" });
        } else {
            await db.resellers.add({ 
                ...data, 
                id: crypto.randomUUID(),
                registrationDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            toast({ title: "Reseller Added" });
        }
        setIsFormOpen(false); setEditingReseller(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };
  
  const handleExportResellers = () => {
    const filename = `RCL_Resellers_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    const dataToExport = (resellers || []).map(r => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      email: r.email,
      phone: r.phone || '',
      status: r.status,
      registrationDate: format(new Date(r.registrationDate), 'yyyy-MM-dd HH:mm:ss'),
    }));
    const columnMapping = {
      id: 'Reseller ID',
      name: 'Name',
      company: 'Company',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
      registrationDate: 'Date Joined',
    };
    exportToCsv(filename, dataToExport, columnMapping);
  };
  
  const handleExportIssuedItems = () => {
    const filename = `RCL_IssuedItems_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    const dataToExport = (allIssuances || []).map(issuance => ({
        resellerName: issuance.resellerName,
        itemName: issuance.itemName,
        itemSerialNumber: issuance.itemSerialNumber,
        status: issuance.status,
        dateIssued: format(new Date(issuance.dateIssued), 'yyyy-MM-dd'),
        dateSold: issuance.dateSold ? format(new Date(issuance.dateSold), 'yyyy-MM-dd') : '',
        dateReturned: issuance.dateReturned ? format(new Date(issuance.dateReturned), 'yyyy-MM-dd') : '',
        costPrice: issuance.costPrice,
    }));
     const columnMapping = {
        resellerName: 'Reseller Name',
        itemName: 'Item',
        itemSerialNumber: 'Serial Number',
        status: 'Status',
        dateIssued: 'Date Issued',
        dateSold: 'Date Sold',
        dateReturned: 'Date Returned',
        costPrice: 'Cost Price (KES)',
    };
    exportToCsv(filename, dataToExport, columnMapping);
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={handleExportIssuedItems} disabled={isLoading || !allIssuances || allIssuances.length === 0}>
        <DownloadCloud className="mr-2 h-4 w-4" /> Export Issued Items
      </Button>
      <Button variant="outline" onClick={handleExportResellers} disabled={isLoading || !resellers || resellers.length === 0}>
        <DownloadCloud className="mr-2 h-4 w-4" /> Export Resellers
      </Button>
      <Button onClick={handleAddReseller}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Reseller
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Resellers" 
        description="Manage reseller accounts and track issued items."
        actions={actions}
      />
      <div className="mb-4">
          <Input placeholder="Search by name, email, or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
      </div>
      
      {isLoading ? <p>Loading resellers...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResellers.map(reseller => (
                <ResellerCard 
                    key={reseller.id} 
                    reseller={reseller} 
                    onViewDashboard={() => setSelectedReseller(reseller)}
                    onEdit={() => handleEditReseller(reseller)}
                    onDelete={() => handleDeleteReseller(reseller)}
                />
            ))}
        </div>
      )}
      
      <Sheet open={!!selectedReseller} onOpenChange={(isOpen) => !isOpen && setSelectedReseller(null)}>
        <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-7xl flex flex-col p-0">
          {selectedReseller && <ResellerDashboardSheet reseller={selectedReseller} allIssuances={allIssuances || []} allAvailableItems={allAvailableItems} />}
        </SheetContent>
      </Sheet>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingReseller(null); }}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingReseller ? "Edit Reseller" : "Add New Reseller"}</DialogTitle>
            </DialogHeader>
            <ResellerForm reseller={editingReseller} onSubmit={handleSaveReseller} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>Are you sure you want to delete {editingReseller?.name}?</DialogDescription>
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
