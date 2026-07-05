
'use client';

import { useState, useMemo } from "react";
import type { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UserX, UserPlus, Lock, Unlock, Loader2 } from "lucide-react";
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
    if (!tenant) return null;
    return query(collection(firestore, 'users'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

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

  const toggleUserStatus = async (user: User) => {
    if (user.id === authUser?.uid) {
        toast({ variant: 'destructive', title: 'Stop!', description: 'You cannot lock your own account.' });
        return;
    }
    
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
        await updateDoc(doc(firestore, 'users', user.id), { status: newStatus, updatedAt: new Date().toISOString() });
        toast({ 
            title: newStatus === 'suspended' ? 'Staff Locked' : 'Staff Unlocked', 
            description: `${user.name} is now ${newStatus === 'suspended' ? 'blocked' : 'allowed'} to use the shop.` 
        });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error saving status' });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === authUser?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'You cannot delete yourself.' });
      return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
          await deleteDoc(doc(firestore, 'users', userToDelete.id));
          toast({ title: "Staff member removed." });
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
            await updateDoc(doc(firestore, 'users', editingUser.id), {
                name: data.name,
                phone: data.phone || "",
                role: data.role,
                permissions: data.permissions || [],
                updatedAt: new Date().toISOString()
            });
            toast({ title: "Updated staff permissions." });
        } else {
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
                title: "Staff member added!", 
                description: `Tell ${data.name} to sign up using ${data.email}.` 
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
  
  const columns = useMemo<ColumnDef<User, any>[]>(() => {
      const base = getUserColumns(columnActions);
      return base.map(col => {
          if (col.id === 'actions') {
              return {
                  ...col,
                  cell: (props: any) => {
                      const user = props.row.original;
                      const isMe = user.id === authUser?.uid;
                      return (
                        <div className="flex items-center justify-end gap-2">
                            {!isMe && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => toggleUserStatus(user)}
                                    title={user.status === 'suspended' ? 'Unlock Access' : 'Lock Access'}
                                >
                                    {user.status === 'suspended' ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                                </Button>
                            )}
                            {flexRender(col.cell, props)}
                        </div>
                      )
                  }
              }
          }
          return col;
      });
  }, [columnActions, authUser?.uid]);

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
        title="Staff Members"
        description="Add and manage the people who work in your shop."
        actionLabel={isAdmin ? "Add New Staff" : undefined}
        onAction={isAdmin ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!isAdmin && !isLoading && (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full">
                <Lock className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h2>
                <p className="text-muted-foreground">
                    Only the shop owner can add or change staff permissions.
                </p>
            </div>
        </div>
      )}

      {isAdmin && (
        <>
            <div className="mb-4">
                <Input
                placeholder="Search staff by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-card h-11 font-bold"
                />
            </div>
            
            {isLoading ? (
                <p className="text-muted-foreground animate-pulse font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading staff list...
                </p>
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
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={row.original.status === 'suspended' ? 'bg-destructive/5 opacity-70' : ''}>
                                {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id} className="py-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">No staff members added yet.</TableCell>
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
                            {editingUser ? 'Change Access' : 'Add New Staff'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                            {editingUser ? 'Change what this person can do.' : 'Create an account for someone to help you in the shop.'}
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
                            Remove Staff
                        </DialogTitle>
                        <DialogDescription className="font-medium text-base pt-2">
                            Are you sure you want to remove <strong>{userToDelete?.name}</strong>? They will no longer be able to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="font-black uppercase">Yes, Remove Them</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
      )}
    </>
  );
}
