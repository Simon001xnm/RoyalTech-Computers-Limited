
'use client';

import { useState, useMemo } from "react";
import type { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UserX, UserPlus, Mail, ShieldAlert } from "lucide-react";
import { UserForm } from "./user-form";
import { getUserColumns, type UserColumnActions } from "./user-columns";
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
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useSaaS } from "@/components/saas/saas-provider";

export function UsersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUserProfile || !tenant) return null;
    return query(collection(firestore, 'users'), where('tenantId', '==', tenant.id));
  }, [firestore, currentUserProfile, tenant?.id]);

  const { data: users, isLoading: usersDataLoading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
      setEditingUser(null);
      setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === authUser?.uid) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot delete your own account.' });
      return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
          await deleteDoc(doc(firestore, 'users', userToDelete.id));
          toast({ title: "Access Revoked", description: "The team member profile has been removed." });
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Action Failed' });
      }
      setUserToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!tenant) return;
    setIsProcessing(true);
    
    try {
        if (editingUser) {
            // Update existing user profile
            await updateDoc(doc(firestore, 'users', editingUser.id), {
                name: data.name,
                phone: data.phone || "",
                role: data.role,
                permissions: data.permissions || [],
                updatedAt: new Date().toISOString()
            });
            toast({ title: "Access Updated" });
        } else {
            // Provision new profile (Invited)
            // We use a generated ID because the user doesn't have a UID yet.
            const inviteId = `invited_${crypto.randomUUID()}`;
            await setDoc(doc(firestore, 'users', inviteId), {
                id: inviteId,
                name: data.name,
                email: data.email.toLowerCase().trim(),
                phone: data.phone || "",
                role: data.role,
                permissions: data.permissions || [],
                tenantId: tenant.id,
                tenantIds: [tenant.id],
                status: 'invited',
                createdAt: new Date().toISOString()
            });
            toast({ 
                title: "User Provisioned", 
                description: `Invited ${data.name}. Ask them to sign up with ${data.email}.` 
            });
        }
        setIsFormOpen(false);
        setEditingUser(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Cloud Sync Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const isLoading = isAuthUserLoading || isProfileLoading || usersDataLoading;
  const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'super_admin';

  const columnActions: UserColumnActions = {
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
  };
  
  const columns = useMemo<ColumnDef<User, any>>(() => getUserColumns(columnActions), [columnActions]);

  const table = useReactTable({
    data: filteredUsers,
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
      <PageHeader
        title="Team Management"
        description="Provision accounts and configure granular module access levels."
        actionLabel={isAdmin ? "Provision New User" : undefined}
        onAction={isAdmin ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!isAdmin && !isLoading && (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full">
                <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h2>
                <p className="text-muted-foreground">
                    Only workspace administrators are permitted to provision staff accounts and configure module permissions.
                </p>
            </div>
        </div>
      )}

      {isAdmin && (
        <>
            <div className="mb-4">
                <Input
                placeholder="Search team by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-card"
                />
            </div>
            
            {isLoading ? (
                <p className="text-muted-foreground animate-pulse font-bold uppercase text-[10px] tracking-widest">Synchronizing cloud directory...</p>
            ) : (
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id} className="font-black uppercase text-[10px] py-4">
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                <TableCell key={cell.id} className="py-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">No team members found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    <DataTablePagination table={table} />
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingUser(null); }}}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                            {editingUser ? 'Configure Access' : 'Provision Team Account'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                            Secure cloud identity management
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm user={editingUser} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isProcessing} />
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                            <UserX className="h-5 w-5 text-destructive" />
                            Revoke Access
                        </DialogTitle>
                        <DialogDescription className="font-medium text-base pt-2">
                            Are you sure you want to remove <strong>{userToDelete?.name}</strong> from this workspace?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="font-black uppercase">Confirm Revocation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
      )}
    </>
  );
}
