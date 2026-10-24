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
  
  // Table states
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

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
            toast({ title: "Updated staff access." });
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
        toast({ variant: 'destructive', title: 'Saving failed', description: e.message });
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
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {!isMe && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 sm:h-8 sm:w-8" 
                                    onClick={() => toggleUserStatus(user)}
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
    <div className="space-y-3 sm:space-y-6 px-1 sm:px-0">
      <PageHeader
        title="Staff Members"
        description="Managed operators."
        actionLabel={isAdmin ? "Add Staff" : undefined}
        onAction={isAdmin ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!isAdmin && !isLoading && (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 text-center space-y-6 bg-background">
            <div className="bg-destructive/10 p-6 rounded-full"><Lock className="h-12 w-12 text-destructive" /></div>
            <div className="max-w-md space-y-2"><h2 className="text-2xl font-black uppercase tracking-tight">Access Locked</h2><p className="text-muted-foreground">Only owners manage staff.</p></div>
        </div>
      )}

      {isAdmin && (
        <>
            <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-30" />
                <Input placeholder="Find staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm bg-card h-10 sm:h-11 font-bold pl-9 rounded-xl" />
            </div>
            
            {isLoading ? (
                <p className="text-muted-foreground animate-pulse font-black uppercase text-[10px] tracking-widest text-center py-12">Checking staff pool...</p>
            ) : (
                <div className="rounded-xl sm:rounded-[2rem] border-none ring-1 ring-black/5 shadow-sm bg-card overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id} className="font-black uppercase text-[8px] sm:text-[10px] py-4 px-2 sm:px-6 whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={cn("hover:bg-muted/5 transition-colors", row.original.status === 'suspended' ? 'bg-destructive/5 opacity-70' : '')}>
                                            {row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-2 sm:py-4 px-2 sm:px-6 text-[11px] sm:text-xs font-medium whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic uppercase text-[10px] font-black opacity-30">No operators found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="px-4"><DataTablePagination table={table} /></div>
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingUser(null); }}}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-2xl sm:rounded-[2rem] p-0">
                    <DialogHeader className="p-6 sm:p-8 border-b bg-muted/10">
                        <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">{editingUser ? 'Modify Access' : 'Register Operator'}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 sm:p-8 pt-4">
                        <UserForm user={editingUser} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isProcessing} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-destructive">Remove Staff</DialogTitle>
                        <DialogDescription className="font-medium text-base pt-2">Permanently remove <strong>{userToDelete?.name}</strong> from this workspace?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold h-12 rounded-xl">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="font-black uppercase h-12 rounded-xl">Remove Forever</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
      )}
    </div>
  );
}
