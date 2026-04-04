"use client";

import { useState, useMemo } from "react";
import type { Laptop } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageSearch, Upload } from "lucide-react";
import { LaptopForm } from "./laptop-form";
import { getLaptopColumns, type LaptopColumnActions } from "./laptop-columns";
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
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export function StockClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [laptopToDelete, setLaptopToDelete] = useState<Laptop | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // DEXIE LOCAL QUERY
  const laptops = useLiveQuery(() => db.laptops.toArray());
  const isLoading = laptops === undefined;

  const filteredLaptops = useMemo(() => {
    if (!laptops) return [];
    return laptops.filter((laptop) =>
      laptop.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      laptop.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [laptops, searchTerm]);

  const handleAddLaptop = () => {
    setEditingLaptop(null);
    setIsFormOpen(true);
  };
  
  const handleBulkAdd = () => {
      setIsBulkFormOpen(true);
  }

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'The text area is empty.' });
        return;
    }

    setIsBulkImporting(true);
    const lines = bulkData.trim().split('\n').filter(line => line.trim() !== '');
    
    try {
        const newLaptops: Laptop[] = lines.map((line) => {
            const parts = line.split(',').map(p => p.trim());
            const [model, serialNumber, purchaseDateStr, quantityStr, status, purchasePriceStr, leasePriceStr, ram, storage, processor] = parts;
            
            return {
                id: crypto.randomUUID(),
                model,
                serialNumber,
                purchaseDate: new Date(purchaseDateStr).toISOString(),
                quantity: parseInt(quantityStr, 10) || 1,
                status: (status as Laptop['status']) || 'Available',
                purchasePrice: parseFloat(purchasePriceStr) || 0,
                leasePrice: parseFloat(leasePriceStr) || 0,
                specifications: {
                    ram: ram || '',
                    storage: storage || '',
                    processor: processor || '',
                },
                createdAt: new Date().toISOString()
            };
        });

        await db.laptops.bulkAdd(newLaptops);
        toast({ title: 'Import Successful', description: `${newLaptops.length} laptops added to local database.` });
        setIsBulkFormOpen(false);
        setBulkData("");
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
        setIsBulkImporting(false);
    }
  }

  const handleEditLaptop = (laptop: Laptop) => {
    setEditingLaptop(laptop);
    setIsFormOpen(true);
  };

  const handleDeleteLaptop = (laptop: Laptop) => {
    if (laptop.status === 'Leased') {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Cannot delete a laptop that is currently leased.",
        });
        return;
    }
    setLaptopToDelete(laptop);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (laptopToDelete) {
      await db.laptops.delete(laptopToDelete.id);
      toast({ title: "Laptop Deleted", description: `${laptopToDelete.model} has been removed.` });
      setLaptopToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    const laptopData: Laptop = {
      ...data,
      id: editingLaptop?.id || crypto.randomUUID(),
      purchaseDate: data.purchaseDate.toISOString(), 
      specifications: { 
        ram: data.ram || '', 
        storage: data.storage || '', 
        processor: data.processor || '' 
      },
      updatedAt: new Date().toISOString()
    };

    try {
        if (editingLaptop) {
            await db.laptops.put(laptopData);
            toast({ title: "Laptop Updated" });
        } else {
            await db.laptops.add({ ...laptopData, createdAt: new Date().toISOString() });
            toast({ title: "Laptop Added" });
        }
        setIsFormOpen(false);
        setEditingLaptop(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save laptop. Check for duplicate Serial Numbers.' });
    }
  };

  const columnActions: LaptopColumnActions = {
    onEdit: handleEditLaptop,
    onDelete: handleDeleteLaptop,
  };

  const columns = useMemo<ColumnDef<Laptop, any>[]>(() => getLaptopColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredLaptops,
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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
         <div className="flex-grow">
            <PageHeader
                title="Laptop Inventory (Local)"
                description="Manage your laptop inventory stored locally on this device."
            />
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <Button onClick={handleBulkAdd} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Add
            </Button>
            <Button onClick={handleAddLaptop}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Laptop
            </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by model or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading && <p>Loading laptops from IndexedDB...</p>}

      {!isLoading && filteredLaptops.length === 0 && searchTerm && (
        <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Laptops Found</AlertTitle>
          <AlertDescription>
            Your search for "{searchTerm}" did not match any laptops.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && laptops && laptops.length === 0 && !searchTerm && (
         <Alert variant="default" className="mb-4 bg-card">
          <PackageSearch className="h-4 w-4" />
          <AlertTitle>No Laptops in Stock</AlertTitle>
          <AlertDescription>
            Your local inventory is empty. Start adding laptops or use Bulk Add.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredLaptops.length > 0 && (
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingLaptop(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLaptop ? "Edit Laptop" : "Add New Laptop"}</DialogTitle>
          </DialogHeader>
          <LaptopForm
            laptop={editingLaptop}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingLaptop(null); }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Bulk Add Laptops</DialogTitle>
                <DialogDescription>
                    Paste CSV data. Format: Model,Serial,Date(YYYY-MM-DD),Qty,Status,Price,Lease,RAM,SSD,CPU
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Textarea 
                    placeholder="HP Probook,SN123,2026-01-01,1,Available,1200,75,8GB,256GB,i5"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={10}
                    disabled={isBulkImporting}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkFormOpen(false)} disabled={isBulkImporting}>Cancel</Button>
                <Button onClick={handleBulkImport} disabled={isBulkImporting}>
                    {isBulkImporting ? 'Importing...' : 'Import to Local DB'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Delete <strong>{laptopToDelete?.model}</strong>? This will remove it from this device and synced devices.
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
