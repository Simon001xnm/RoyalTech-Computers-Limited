
"use client";

import { useState } from "react";
import type { JobPosting } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase } from "lucide-react";
import { useUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { JobPostingForm } from "./job-posting-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

export function JobPostingList() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    const postings = useLiveQuery(() => db.jobPostings.toArray());
    const isLoading = isUserLoading || postings === undefined;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [postingToDelete, setPostingToDelete] = useState<JobPosting | null>(null);
    
    const handleAddPosting = () => {
        setEditingPosting(null);
        setIsFormOpen(true);
    };

    const handleEditPosting = (posting: JobPosting) => {
        setEditingPosting(posting);
        setIsFormOpen(true);
    };

    const handleDeletePosting = (posting: JobPosting) => {
        setPostingToDelete(posting);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (postingToDelete) {
            await db.jobPostings.delete(postingToDelete.id);
            toast({ title: "Job Posting Deleted" });
        }
        setIsDeleteConfirmOpen(false);
    };
    
    const handleFormSubmit = async (data: any) => {
        try {
            if (editingPosting) {
                await db.jobPostings.update(editingPosting.id, { ...data, updatedAt: new Date().toISOString() });
                toast({ title: "Job Posting Updated" });
            } else {
                await db.jobPostings.add({ 
                    ...data, 
                    id: crypto.randomUUID(), 
                    createdAt: new Date().toISOString() 
                });
                toast({ title: "Job Posting Created" });
            }
            setIsFormOpen(false);
            setEditingPosting(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const safeFormatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return isValid(date) ? format(date, "MMM d, yyyy") : "N/A";
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Job Postings (Local)</CardTitle>
                        <CardDescription>Manage all job positions stored on this device.</CardDescription>
                    </div>
                    <Button onClick={handleAddPosting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Posting
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Loading postings...</p>}
                {!isLoading && postings?.length === 0 && (
                    <Alert>
                        <Briefcase className="h-4 w-4" />
                        <AlertTitle>No Job Postings Found</AlertTitle>
                        <AlertDescription>Click "Add Posting" to create your first local job opening.</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {postings?.map(posting => (
                        <Card key={posting.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{posting.title}</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditPosting(posting)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeletePosting(posting)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription>{posting.department}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{posting.description}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between text-xs text-muted-foreground">
                                <div>
                                    <Badge variant={posting.status === 'Open' ? 'default' : 'secondary'}>{posting.status}</Badge>
                                </div>
                                <span>Created: {safeFormatDate(posting.createdAt)}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPosting ? "Edit Job Posting" : "Create Job Posting"}</DialogTitle>
                    </DialogHeader>
                    <JobPostingForm
                        posting={editingPosting}
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
                            Are you sure you want to delete the posting: <strong>{postingToDelete?.title}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
