
"use client";

import { useState, useMemo } from "react";
import type { Applicant, JobPosting } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus } from "lucide-react";
import { useUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { getApplicantColumns, type ApplicantColumnActions } from "./applicant-columns";
import { ApplicantForm } from "./applicant-form";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export function ApplicantList() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    // Dexie queries
    const applicants = useLiveQuery(() => db.applicants.toArray());
    const postings = useLiveQuery(() => db.jobPostings.toArray());

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
    
    const isLoading = isUserLoading || applicants === undefined || postings === undefined;
    
    const filteredApplicants = useMemo(() => {
        if (!applicants) return [];
        return applicants.filter(applicant =>
            applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            applicant.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [applicants, searchTerm]);

    const handleAddApplicant = () => {
        setEditingApplicant(null);
        setIsFormOpen(true);
    };

    const handleEditApplicant = (applicant: Applicant) => {
        setEditingApplicant(applicant);
        setIsFormOpen(true);
    };

    const handleDeleteApplicant = (applicant: Applicant) => {
        setApplicantToDelete(applicant);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (applicantToDelete) {
            await db.applicants.delete(applicantToDelete.id);
            toast({ title: "Applicant Record Deleted" });
        }
        setIsDeleteConfirmOpen(false);
    };
    
    const handleFormSubmit = async (data: any) => {
        const selectedPosting = postings?.find(p => p.id === data.jobId);
        const applicantData = { ...data, jobTitle: selectedPosting?.title, updatedAt: new Date().toISOString() };

        try {
            if (editingApplicant) {
                await db.applicants.update(editingApplicant.id, applicantData);
                toast({ title: "Applicant Record Updated" });
            } else {
                await db.applicants.add({ 
                    ...applicantData, 
                    id: crypto.randomUUID(),
                    appliedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString() 
                });
                toast({ title: "Applicant Added" });
            }
            setIsFormOpen(false);
            setEditingApplicant(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const columnActions: ApplicantColumnActions = {
        onEdit: handleEditApplicant,
        onDelete: handleDeleteApplicant,
    };

    const columns = useMemo<ColumnDef<Applicant, any>[]>(() => getApplicantColumns(columnActions), [columnActions]);

    const table = useReactTable({
        data: filteredApplicants,
        columns,
        state: {
          pagination,
        },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });
    
    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Applicants (Local)</CardTitle>
                        <CardDescription>View and manage all job applicants locally.</CardDescription>
                    </div>
                    <Button onClick={handleAddApplicant}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Applicant
                    </Button>
                </div>
                 <Input
                  placeholder="Search by name or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
            </CardHeader>
            <CardContent>
                 {isLoading && <p>Loading applicants...</p>}
                {!isLoading && applicants?.length === 0 && (
                    <Alert>
                        <UserPlus className="h-4 w-4" />
                        <AlertTitle>No Applicants Found</AlertTitle>
                        <AlertDescription>Click "Add Applicant" to create your first candidate record locally.</AlertDescription>
                    </Alert>
                )}
                 {!isLoading && applicants && applicants.length > 0 && (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">No results found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <DataTablePagination table={table} />
                    </div>
                )}
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingApplicant ? "Edit Applicant Record" : "Add New Applicant"}</DialogTitle>
                    </DialogHeader>
                    <ApplicantForm
                        applicant={editingApplicant}
                        jobPostings={postings?.filter(p => p.status === 'Open') || []}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the record for <strong>{applicantToDelete?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
