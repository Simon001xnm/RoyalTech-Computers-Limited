"use client";

import { useState, useMemo, useCallback } from "react";
import type { Applicant, JobPosting } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
import { useSaaS } from "@/components/saas/saas-provider";
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

export function ApplicantList() {
    const { toast } = useToast();
    const { user } = useUser();
    const { tenant } = useSaaS();
    const firestore = useFirestore();

    // FIRESTORE QUERIES
    const applicantsQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(collection(firestore, 'applicants'), where('tenantId', '==', tenant.id));
    }, [firestore, tenant?.id]);
    const { data: applicants, isLoading: applicantsLoading } = useCollection(applicantsQuery);

    const postingsQuery = useMemoFirebase(() => {
        if (!tenant) return null;
        return query(collection(firestore, 'job_postings'), where('tenantId', '==', tenant.id));
    }, [firestore, tenant?.id]);
    const { data: postings, isLoading: postingsLoading } = useCollection(postingsQuery);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    
    const isLoading = applicantsLoading || postingsLoading;
    
    const filteredApplicants = useMemo(() => {
        if (!applicants) return [];
        const term = searchTerm.toLowerCase();
        return applicants.filter(applicant =>
            (applicant.name || "").toLowerCase().includes(term) ||
            (applicant.jobTitle || "").toLowerCase().includes(term)
        );
    }, [applicants, searchTerm]);

    const handleAddApplicant = () => {
        setEditingApplicant(null);
        setIsFormOpen(true);
    };

    const handleEditApplicant = useCallback((applicant: Applicant) => {
        setEditingApplicant(applicant);
        setIsFormOpen(true);
    }, []);

    const handleDeleteApplicant = useCallback((applicant: Applicant) => {
        setApplicantToDelete(applicant);
        setIsDeleteConfirmOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (applicantToDelete) {
            try {
                await deleteDoc(doc(firestore, 'applicants', applicantToDelete.id));
                toast({ title: "Applicant Record Deleted" });
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Error', description: e.message });
            }
        }
        setIsDeleteConfirmOpen(false);
    };
    
    const handleFormSubmit = async (data: any) => {
        if (!tenant) return;
        const selectedPosting = postings?.find(p => p.id === data.jobId);
        const applicantData = { ...data, tenantId: tenant.id, jobTitle: selectedPosting?.title, updatedAt: new Date().toISOString() };

        try {
            if (editingApplicant) {
                await updateDoc(doc(firestore, 'applicants', editingApplicant.id), applicantData);
                toast({ title: "Applicant Record Updated" });
            } else {
                await addDoc(collection(firestore, 'applicants'), { 
                    ...applicantData, 
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

    const columnActions: ApplicantColumnActions = useMemo(() => ({
        onEdit: handleEditApplicant,
        onDelete: handleDeleteApplicant,
    }), [handleEditApplicant, handleDeleteApplicant]);

    const columns = useMemo<ColumnDef<Applicant, any>[]>(() => getApplicantColumns(columnActions), [columnActions]);

    const table = useReactTable({
        data: filteredApplicants,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });
    
    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Applicants (Cloud)</CardTitle>
                        <CardDescription>View and manage job applicants globally.</CardDescription>
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
                 {isLoading && <p className="animate-pulse">Syncing talent pool...</p>}
                {!isLoading && applicants?.length === 0 && (
                    <Alert>
                        <UserPlus className="h-4 w-4" />
                        <AlertTitle>No Applicants Found</AlertTitle>
                        <AlertDescription>Click "Add Applicant" to create your first candidate record.</AlertDescription>
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
                                                {flexRender(header.column.columnDef.header, header.getContext())}
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

             <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditingApplicant(null); }}}>
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
