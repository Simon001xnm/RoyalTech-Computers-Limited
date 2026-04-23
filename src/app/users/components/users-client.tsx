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
import { useUser as useAuthUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { createUser, updateUser } from "@/firebase/server-actions";


export function UsersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { user: authUser, isUserLoading: isAuthUserLoading } = useAuthUser();

  // Get current user profile for role checks
  const currentUser = useLiveQuery(async () => authUser ? await db.users.get(authUser.uid) : null, [authUser]);

  // Fetch users with Tenancy Isolation
  const users = useLiveQuery(async () => {
    if (!currentUser) return undefined;
    
    const baseQuery = db.users;
    
    // LAYER 2: Tenancy Isolation Logic
    if (isFeatureEnabled('TENANCY_ISOLATION') && currentUser.tenantId) {
        return await baseQuery.where('tenantId').equals(currentUser.tenantId).toArray();
    }
    
    return await baseQuery.toArray();
  }, [currentUser]);

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
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
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
      await db.users.delete(userToDelete.id);
      toast({ title: "User Record Deleted", description: `Local record for ${userToDelete.name} has been removed.` });
      setUserToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!currentUser) return;
    setIsProcessing(true);
    
    try {
        if (editingUser) {
            // Update Existing Team Member
            const result = await updateUser({
                uid: editingUser.id,
                name: data.name,
                phone: data.phone,
                role: data.role,
                requestingUserRole: currentUser.role
            });

            if (result.success) {
                await db.users.update(editingUser.id, { 
                    name: data.name, 
                    phone: data.phone, 
                    role: data.role,
                    updatedAt: new Date().toISOString()
                });
                toast({ title: "Team Member Updated" });
            } else {
                throw new Error(result.error);
            }
        } else {
            // Create New Team Member inside the Tenant
            const result = await createUser({
                email: data.email,
                password: data.password,
                name: data.name,
                phone: data.phone,
                role: data.role,
                tenantId: currentUser.tenantId, // Tag with current company
                requestingUserRole: currentUser.role
            });

            if (result.success && result.uid) {
                await db.users.add({
                    id: result.uid,
                    email: data.email,
                    name: data.name,
                    phone: data.phone,
                    role: data.role,
                    tenantId: currentUser.tenantId,
                    createdAt: new Date().toISOString()
                });
                toast({ title: "Team Member Added", description: `An account for ${data.name} has been created in your workspace.` });
            } else {
                throw new Error(result.error);
            }
        }
        setIsFormOpen(false);
        setEditingUser(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const isLoading = users === undefined || isAuthUserLoading;
  const canManageUsers = !isLoading && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin');

  const columnActions: UserColumnActions = {
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
  };
  
  const columns = useMemo<ColumnDef<User, any>>(() => getUserColumns(columnActions), [columnActions, canManageUsers]);

  const table = useReactTable({
    data: filteredUsers,
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
      <PageHeader
        title="Team Management (Multi-tenant)"
        description={isFeatureEnabled('TENANCY_ISOLATION') ? "Manage staff members belonging strictly to your business workspace." : "View and manage all system users locally."}
        actionLabel={canManageUsers ? "Invite Team Member" : undefined}
        onAction={canManageUsers ? handleAddUser : undefined}
        ActionIcon={UserPlus}
      />

       {!canManageUsers && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <UserX className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You do not have the required permissions to manage users for this tenant. Please contact your Workspace Owner.
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
      
      {isLoading && <p className="text-muted-foreground animate-pulse">Syncing team directory...</p>}
      
      {!isLoading && filteredUsers.length > 0 && (
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
                    No users match your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination table={table} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingUser(null); } else { setIsFormOpen(true); }}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Team Member' : 'Invite Team Member'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update role and profile details.' : 'Provision a new account for a staff member within your business workspace.'}
            </DialogDescription>
          </DialogHeader>
          {isFormOpen && (
            <UserForm
                user={editingUser}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsFormOpen(false); setEditingUser(null); }}
                isLoading={isProcessing}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{userToDelete?.name}</strong> from your workspace? They will no longer be able to log in.
            </DialogDescription>
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
