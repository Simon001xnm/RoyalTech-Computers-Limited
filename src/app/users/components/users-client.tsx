
'use client';

import { useState, useMemo, useEffect } from "react";
import type { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, User as UserIcon, UserX } from "lucide-react";
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
import { useFirestore, useMemoFirebase, useUser as useAuthUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { DataTablePagination } from "@/components/ui/data-table-pagination";


export function UsersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useAuthUser();

  const usersCollection = useMemoFirebase(() => authUser ? collection(firestore, 'users') : null, [firestore, authUser]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);
  
  const currentUserDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useDoc<User>(currentUserDocRef);


  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    // This functionality is removed in favor of the public signup page for simplicity.
    toast({
        title: "Action Disabled",
        description: "Please use the public sign-up page to create new users.",
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (currentUser?.role !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete users." });
      return;
    }
     if (user.id === authUser?.uid) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot delete your own account.' });
      return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      const docRef = doc(firestore, 'users', userToDelete.id);
      // Note: This only deletes the Firestore record, not the Auth user.
      // A cloud function would be needed for full user deletion.
      deleteDocumentNonBlocking(docRef);
      toast({ title: "User Record Deleted", description: `Record for ${userToDelete.name} has been removed.` });
      setUserToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!editingUser) return;
    
    if (currentUser?.role !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to edit users." });
      return;
    }
    
    const userDocRef = doc(firestore, 'users', editingUser.id);
    setDocumentNonBlocking(userDocRef, { role: data.role }, { merge: true });
    toast({ title: "User Updated", description: `${data.name}'s role has been updated.` });
    
    setIsFormOpen(false);
    setEditingUser(null);
  };
  
  const isLoading = isLoadingUsers || isLoadingCurrentUser || isAuthUserLoading;
  
  const canManageUsers = !isLoading && currentUser?.role === 'admin';

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
        title="User Management"
        description="View and manage user accounts and roles."
      />

       {!canManageUsers && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <UserX className="h-4 w-4" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You do not have the required permissions to manage users. This feature is for Admins only.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>
      
      {isLoading && <p>Loading users...</p>}
      
      {canManageUsers && !isLoading && filteredUsers.length > 0 && (
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
                    No results for the current filter.
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
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for the selected user. Other details must be changed by the user on their profile page.
            </DialogDescription>
          </DialogHeader>
          {isFormOpen && editingUser && (
            <UserForm
                user={editingUser}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsFormOpen(false); setEditingUser(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the Firestore record for <strong>{userToDelete?.name}</strong>? This will not delete their authentication account but will remove their access and data from the app.
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
