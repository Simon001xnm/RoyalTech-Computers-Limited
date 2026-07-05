
'use client';

import { useState, useMemo } from "react";
import type { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UserX, UserPlus, ShieldAlert, Lock, Unlock, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

/**
 * @fileOverview Staff Management Node
 * Allows Admins to provision accounts and terminate access.
 */
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
        toast({ variant: 'destructive', title: 'Operation Denied', description: 'You cannot suspend your own account.' });
        return;
    }
    
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
        await updateDoc(doc(firestore, 'users', user.id), { status: newStatus, updatedAt: new Date().toISOString() });
        toast({ 
            title: newStatus === 'suspended' ? 'Access Terminated' : 'Access Restored', 
            description: `${user.name}'s account is now ${newStatus}.` 
        });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Sync Error' });
    }
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
          toast({ title: "Profile Purged" });
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
            toast({ title: "Privileges Updated" });
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
                title: "User Provisioned", 
                description: `Successfully provisioned ${data.name}. They can now sign up using ${data.email}.` 
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
  
  const columns = useMemo<ColumnDef<User, any>>(() => {
      const base = getUserColumns(columnActions);
      // Inject Status Toggle into actions
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
                                    title={user.status === 'suspended' ? 'Restore Access' : 'Terminate Access'}
                                >
                                    {user.status === 'suspended' ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                                </Button>
                            )}
                            {flexRender(col.cell, props.getContext())}
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
        title="Team Directory"
        description="Provision staff accounts and configure module-level access."
        actionLabel={isAdmin ? "Provision New Staff" : undefined}
        onAction={isAdmin ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!isAdmin && !isLoading && (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full">
                <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Privilege Restriction</h2>
                <p className="text-muted-foreground">
                    Only workspace administrators can provision new accounts or modify system privileges.
                </p>
            </div>
        </div>
      )}

      {isAdmin && (
        <>
            <div className="mb-4">
                <Input
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-card h-11 font-bold"
                />
            </div>
            
            {isLoading ? (
                <p className="text-muted-foreground animate-pulse font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Synchronizing Identity Node...
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
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">No team members registered.</TableCell>
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
                            {editingUser ? 'Update Privileges' : 'Provision Staff Account'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                            {editingUser ? 'Modify active permissions' : 'Create a pre-defined identity for your team member'}
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
                            Purge Profile
                        </DialogTitle>
                        <DialogDescription className="font-medium text-base pt-2">
                            Are you sure you want to permanently remove <strong>{userToDelete?.name}</strong>? All historical logs will be preserved but access will be impossible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="font-black uppercase">Confirm Purge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
      )}
    </>
  );
}
