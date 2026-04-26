'use client';

import { useState, useMemo } from "react";
import type { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UserX, UserPlus } from "lucide-react";
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
import { doc, collection, query, where, deleteDoc } from "firebase/firestore";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { createUser, updateUser } from "@/firebase/server-actions";
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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUserProfile) return null;
    
    if (currentUserProfile.role === 'super_admin') {
        return query(collection(firestore, 'users'));
    }
    
    if (tenant?.id) {
        return query(collection(firestore, 'users'), where('tenantId', '==', tenant.id));
    }
    
    return query(collection(firestore, 'users'), where('id', '==', authUser?.uid || 'none'));
  }, [firestore, currentUserProfile, tenant?.id, authUser?.uid]);

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
    if (currentUserProfile?.role !== 'admin' && currentUserProfile?.role !== 'super_admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete users." });
      return;
    }
     if (user.id === authUser?.uid) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot delete your own account here.' });
      return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
          await deleteDoc(doc(firestore, 'users', userToDelete.id));
          toast({ title: "User Record Deleted" });
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
      }
      setUserToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!currentUserProfile) return;
    setIsProcessing(true);
    
    try {
        if (editingUser) {
            const result = await updateUser({
                uid: editingUser.id,
                name: data.name,
                phone: data.phone,
                role: data.role,
                requestingUserRole: currentUserProfile.role
            });
            if (!result.success) throw new Error(result.error);
            toast({ title: "Team Member Updated" });
        } else {
            const result = await createUser({
                email: data.email,
                password: data.password,
                name: data.name,
                phone: data.phone,
                role: data.role,
                tenantId: tenant?.id || null, 
                requestingUserRole: currentUserProfile.role
            });
            if (!result.success) throw new Error(result.error);
            toast({ title: "Team Member Added" });
        }
        setIsFormOpen(false);
        setEditingUser(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const isLoading = isAuthUserLoading || isProfileLoading || usersDataLoading;
  const canManageUsers = !isLoading && (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'super_admin');

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
        title="Team Management (Cloud)"
        description="Manage staff members belonging strictly to your business workspace."
        actionLabel={canManageUsers ? "Invite Team Member" : undefined}
        onAction={canManageUsers ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!canManageUsers && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <UserX className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You do not have the required permissions to manage users for this tenant.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search team by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading ? (
          <p className="text-muted-foreground animate-pulse">Syncing team directory...</p>
      ) : (
        <div className="rounded-lg border shadow-sm bg-card">
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
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingUser(null); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Team Member' : 'Invite Team Member'}</DialogTitle>
            <DialogDescription>Provision an account within your workspace.</DialogDescription>
          </DialogHeader>
          <UserForm user={editingUser} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isLoading={isProcessing} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>Remove <strong>{userToDelete?.name}</strong> from your workspace?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Confirm Revocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
