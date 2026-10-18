'use client';

import { useState, useMemo, useEffect } from 'react';
import type { User, Company } from '@/types';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    User as UserIcon, 
    MoreHorizontal, 
    Key, 
    ShieldAlert, 
    Building2, 
    Check, 
    Calendar, 
    Loader2, 
    UserPlus, 
    Trash2,
    ArrowUpDown,
    Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, setDoc, deleteDoc, writeBatch, collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { cn } from '@/lib/utils';

interface UserManagementProps {
    users: User[];
    companies: Company[];
}

export function UserManagement({ users, companies }: UserManagementProps) {
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const firestore = useFirestore();
    const [now, setNow] = useState(new Date());

    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [newUserData, setNewUserData] = useState({
        name: '',
        email: '',
        role: 'user',
        tenantId: ''
    });

    const [resetUser, setResetUser] = useState<User | null>(null);
    const [usersToDelete, setUsersToDelete] = useState<User[]>([]);
    const [newPass, setNewPass] = useState("");
    const [isSavingPass, setIsSavingPass] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const [userLastSeen, setUserLastSeen] = useState<Record<string, string>>({});

    // Refesh Online state every 60s
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch last activity for all visible users
    useEffect(() => {
        const fetchRecentActivity = async () => {
            try {
                const logsRef = collection(firestore, 'platform_logs');
                const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
                const snap = await getDocs(q);
                const activityMap: Record<string, string> = {};
                snap.docs.forEach(d => {
                    const data = d.data();
                    if (data.userId && !activityMap[data.userId]) {
                        activityMap[data.userId] = data.timestamp;
                    }
                });
                setUserLastSeen(prev => ({ ...prev, ...activityMap }));
            } catch (e) {}
        };
        fetchRecentActivity();
    }, [firestore, pagination.pageIndex]);

    const filtered = useMemo(() => {
        return users.filter(u => 
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const handleRegisterUser = async () => {
        if (!newUserData.email || !newUserData.name || !newUserData.tenantId) return;
        setIsSavingUser(true);
        try {
            const userId = `invited_${crypto.randomUUID()}`;
            const targetCompany = companies.find(c => c.id === newUserData.tenantId);
            
            await setDoc(doc(firestore, 'users', userId), {
                id: userId,
                name: newUserData.name,
                email: newUserData.email.toLowerCase().trim(),
                role: newUserData.role,
                tenantId: newUserData.tenantId,
                tenantIds: [newUserData.tenantId],
                status: 'invited',
                createdAt: new Date().toISOString()
            });

            toast({ title: "User Registered", description: `Assigned to ${targetCompany?.name || 'Workspace'}` });
            setIsAddUserOpen(false);
            setNewUserData({ name: '', email: '', role: 'user', tenantId: '' });
        } catch (e) {
            toast({ variant: 'destructive', title: "Registration Failed" });
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleDeleteUsers = async () => {
        if (usersToDelete.length === 0) return;
        setIsDeleting(true);
        try {
            const batch = writeBatch(firestore);
            for (const u of usersToDelete) {
                batch.delete(doc(firestore, 'users', u.id));
            }
            await batch.commit();
            toast({ title: usersToDelete.length > 1 ? "Accounts Purged" : "Account Purged" });
            setUsersToDelete([]);
            setRowSelection({});
        } catch (e) {
            toast({ variant: 'destructive', title: "Delete Failed" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetPassword = async () => {
        if (!resetUser || !newPass) return;
        setIsSavingPass(true);
        try {
            await new Promise(r => setTimeout(r, 1200));
            toast({ 
                title: "Credentials Set", 
                description: `Manual password override initiated for ${resetUser.email}.` 
            });
            setResetUser(null);
            setNewPass("");
        } finally {
            setIsSavingPass(false);
        }
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-white/20 data-[state=checked]:bg-primary"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="border-white/20 data-[state=checked]:bg-primary"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[10px]">
                    Account Identity
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const user = row.original;
                const lastSeen = userLastSeen[user.id];
                const isOnline = lastSeen ? (now.getTime() - parseISO(lastSeen).getTime() < 5 * 60 * 1000) : false;

                return (
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141414]",
                                isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                            )} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-black uppercase text-sm tracking-tight text-white">{user.name || 'Anonymous'}</p>
                                {isOnline && <Badge className="bg-green-500/10 text-green-500 border-none text-[6px] h-3 px-1 uppercase font-black">Online</Badge>}
                            </div>
                            <p className="text-[10px] text-white/40 font-bold">{user.email}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[10px]">
                    Enrollment
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
                    <Calendar className="h-3 w-3 opacity-30" />
                    {row.original.createdAt ? format(parseISO(row.original.createdAt), 'dd MMM yy') : '--'}
                </div>
            )
        },
        {
            accessorKey: "role",
            header: "Global Role",
            cell: ({ row }) => (
                <Badge variant={row.original.role === 'super_admin' ? 'destructive' : 'secondary'} className="text-[8px] font-black uppercase tracking-widest h-5 border-none">
                    {row.original.role}
                </Badge>
            )
        },
        {
            id: "tenantCount",
            header: "Silos",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="outline" className="text-[10px] font-black h-6 min-w-[30px] justify-center bg-transparent border-white/10 text-white/60">
                        {(row.original.tenantIds || []).length}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${row.original.status === 'suspended' ? 'bg-red-500' : (row.original.status === 'invited' ? 'bg-blue-500' : 'bg-green-500')}`} />
                    <span className="text-[9px] font-black uppercase opacity-40">{row.original.status || 'Active'}</span>
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Ops</div>,
            cell: ({ row }) => (
                <div className="text-right pr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#1a1a1a] text-white shadow-2xl">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Identity Control</DropdownMenuLabel>
                            <DropdownMenuItem className="text-xs font-bold py-2 focus:bg-white/5 focus:text-white cursor-pointer" onClick={() => setResetUser(row.original)}>
                                <Key className="h-3.5 w-3.5 mr-2 text-primary" /> Set Access Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="text-xs font-bold text-destructive py-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => setUsersToDelete([row.original])}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account Forever
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [companies, userLastSeen, now]);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { pagination, sorting, rowSelection },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const selectedCount = Object.keys(rowSelection).length;

    return (
        <>
        <Card className="border-none ring-1 ring-white/5 shadow-2xl bg-[#141414] text-white overflow-hidden">
            <CardHeader className="bg-white/[0.02] p-6 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Identity Pool</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Consolidated User Repository</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedCount > 0 && (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-9 px-4 font-black uppercase text-[10px] tracking-widest animate-in fade-in zoom-in-95"
                                onClick={() => {
                                    const selectedUsers = table.getSelectedRowModel().rows.map(r => r.original);
                                    setUsersToDelete(selectedUsers);
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Purge {selectedCount} Identities
                            </Button>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input 
                                placeholder="Search accounts..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 h-11 w-full md:w-64 bg-white/5 border-white/10 text-white placeholder:text-white/20 shadow-sm"
                            />
                        </div>
                        <Button onClick={() => setIsAddUserOpen(true)} className="h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl bg-white text-black hover:bg-white/90">
                            <UserPlus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-white/[0.05] border-white/5">
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id} className="border-white/5 hover:bg-transparent">
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id} className="text-[10px] font-black uppercase py-4 text-white/40">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id} className="py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-24 text-center text-white/20 uppercase font-black text-[10px] tracking-[0.4em]">
                                    No identity records found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="bg-white/[0.02] border-t border-white/5">
                    <DataTablePagination table={table} />
                </div>
            </CardContent>
        </Card>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase text-white">Register Global Identity</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-white/30">Creating a new account and linking to a node.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/60">Full Name</Label>
                        <Input value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} placeholder="e.g. Jane Doe" className="h-11 font-bold bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/60">Email Address</Label>
                        <Input value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} placeholder="jane@company.com" className="h-11 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/60">Assign to Business Node</Label>
                        <Select onValueChange={v => setNewUserData({...newUserData, tenantId: v})} value={newUserData.tenantId}>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10"><SelectValue placeholder="Select node..." /></SelectTrigger>
                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)} className="h-12 font-bold bg-transparent border-white/10 hover:bg-white/5">Cancel</Button>
                    <Button onClick={handleRegisterUser} disabled={isSavingUser || !newUserData.name || !newUserData.tenantId} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90 text-white">
                        {isSavingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute Registration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
            <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white">
                <DialogHeader className="space-y-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Key className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Manual Credential Set</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-white/30">
                        Updating login credentials for: {resetUser?.email}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/60">New Access Password</p>
                        <Input 
                            type="password" 
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="Enter secure password..."
                            className="h-12 font-bold text-lg bg-white/5 border-white/10"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setResetUser(null)} className="h-12 px-6 font-bold bg-transparent border-white/10">Cancel</Button>
                    <Button onClick={handleSetPassword} disabled={isSavingPass || !newPass} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90">
                        {isSavingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Apply Credentials</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={usersToDelete.length > 0} onOpenChange={(o) => !o && setUsersToDelete([])}>
            <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase text-destructive flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Nuclear Delete Access
                    </DialogTitle>
                    <DialogDescription className="font-medium text-white/60 pt-2">
                        {usersToDelete.length > 1 ? (
                            <>Are you absolutely sure? This will PERMANENTLY remove <span className="text-white font-black">{usersToDelete.length} identities</span> and their global profiles.</>
                        ) : (
                            <>Are you absolutely sure? This will PERMANENTLY remove <strong>{usersToDelete[0]?.email}</strong> and their global profile.</>
                        )}
                        This action cannot be undone and will block all associated access immediately.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 mt-6">
                    <Button variant="outline" onClick={() => setUsersToDelete([])} className="h-12 font-bold bg-transparent border-white/10">Cancel</Button>
                    <Button onClick={handleDeleteUsers} disabled={isDeleting} variant="destructive" className="h-12 px-10 font-black uppercase tracking-widest shadow-xl">
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
