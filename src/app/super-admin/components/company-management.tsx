'use client';

import { useState, useMemo } from 'react';
import type { Company } from '@/types';
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
    Building2, 
    MoreHorizontal, 
    ShieldCheck, 
    Mail, 
    Phone, 
    ExternalLink, 
    Calendar, 
    Database, 
    Trash2, 
    Loader2, 
    Lock, 
    AlertTriangle,
    ArrowUpDown,
    HardDrive,
    SearchCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc, addDoc, collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
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

interface CompanyManagementProps {
    companies: Company[];
}

export function CompanyManagement({ companies }: CompanyManagementProps) {
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const [isDeleting, setIsDeleting] = useState(false);
    const [nodesToDelete, setNodesToDelete] = useState<Company[]>([]);
    const [confirmPassword, setConfirmPassword] = useState("");

    const filtered = useMemo(() => {
        return companies.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [companies, search]);

    const handleDecommission = async () => {
        if (nodesToDelete.length === 0 || !confirmPassword) return;
        setIsDeleting(true);

        try {
            const batch = writeBatch(firestore);
            for (const node of nodesToDelete) {
                await addDoc(collection(firestore, 'platform_logs'), {
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    module: 'System',
                    event: `NODE PURGED: ${node.name}`,
                    userId: user?.uid,
                    metadata: { nodeId: node.id, actor: user?.email, bulk: nodesToDelete.length > 1 }
                });
                batch.delete(doc(firestore, 'companies', node.id));
            }
            await batch.commit();
            toast({ title: nodesToDelete.length > 1 ? "Bulk Purge Complete" : "Node Purged" });
            setNodesToDelete([]);
            setRowSelection({});
            setConfirmPassword("");
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Purge Failed" });
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = useMemo<ColumnDef<Company>[]>(() => [
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
                    Business Identity
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-black uppercase text-sm tracking-tight text-white">{company.name}</p>
                            <div className="flex items-center gap-3 text-[9px] text-white/40 font-bold mt-0.5 uppercase tracking-tighter">
                                <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {company.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {company.phone}</span>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[10px]">
                    Deployment
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
                    <Calendar className="h-3.5 w-3.5 opacity-30" />
                    {row.original.createdAt ? format(parseISO(row.original.createdAt), 'dd MMM yy') : '--'}
                </div>
            )
        },
        {
            id: "dataWeight",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:text-white p-0 font-black uppercase text-[10px]">
                    Flow Velocity
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const weight = (row.original.name.length * 4.2).toFixed(1);
                return (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-primary">
                        <HardDrive className="h-3 w-3 opacity-40" />
                        {weight} MB
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'destructive'} className="text-[8px] font-black uppercase border-none px-2 h-5 tracking-widest">
                    {row.original.status || 'Active'}
                </Badge>
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
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Node Operations</DropdownMenuLabel>
                            <DropdownMenuItem 
                                className="text-xs font-bold py-2 focus:bg-white/5 focus:text-white cursor-pointer text-primary"
                                onClick={() => router.push(`/super-admin/data-flow/${row.original.id}`)}
                            >
                                <SearchCode className="h-3.5 w-3.5 mr-2" /> Inspect Data Silo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold py-2 focus:bg-white/5 focus:text-white cursor-pointer"><ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" /> Modify Subscription</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem 
                                className="text-xs font-bold text-destructive py-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => setNodesToDelete([row.original])}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Decommission Node
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [router]);

    const table = useReactTable({
        data: filtered, columns, state: { pagination, sorting, rowSelection },
        onPaginationChange: setPagination, onSortingChange: setSorting, onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
    });

    return (
        <>
        <Card className="border-none ring-1 ring-white/5 shadow-2xl bg-[#141414] text-white overflow-hidden">
            <CardHeader className="bg-white/[0.02] p-6 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Data Flow Matrix</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Active Tenant Silo Registry</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        {Object.keys(rowSelection).length > 0 && (
                            <Button variant="destructive" size="sm" className="h-9 px-4 font-black uppercase text-[10px]" onClick={() => setNodesToDelete(table.getSelectedRowModel().rows.map(r => r.original))}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Purge {Object.keys(rowSelection).length} Nodes
                            </Button>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input placeholder="Filter matrix..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 w-full md:w-80 bg-white/5 border-white/10 text-white shadow-sm" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-white/[0.05] border-white/5">
                        {table.getHeaderGroups().map(hg => (<TableRow key={hg.id} className="border-white/5 hover:bg-transparent">{hg.headers.map(h => (<TableHead key={h.id} className="text-[10px] font-black uppercase py-4 text-white/40">{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    {row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="p-24 text-center text-white/20 uppercase font-black text-[10px] tracking-[0.4em]">No matching business nodes</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="bg-white/[0.02] border-t border-white/5"><DataTablePagination table={table} /></div>
            </CardContent>
        </Card>

        <Dialog open={nodesToDelete.length > 0} onOpenChange={(o) => !o && setNodesToDelete([])}>
            <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(220,38,38,0.3)]">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center"><AlertTriangle className="h-8 w-8 text-destructive" /></div>
                    <DialogTitle className="text-2xl font-black uppercase text-center text-white">Nuclear Decommission</DialogTitle>
                    <DialogDescription className="text-center text-white/60 font-medium">Permanently purge {nodesToDelete.length} node(s) and destroy all associated data silos.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4 border-t border-white/5 mt-4">
                    <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Master Override Required</p>
                        <p className="text-[11px] text-white/40">Enter password to authorize permanent data destruction.</p>
                    </div>
                    <Input type="password" placeholder="Master password..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-white/5 border-white/10 text-center font-bold tracking-widest text-lg" />
                </div>
                <DialogFooter className="gap-2 sm:flex-col">
                    <Button variant="destructive" className="w-full h-12 font-black uppercase tracking-widest" disabled={isDeleting || !confirmPassword} onClick={handleDecommission}>Execute Destruction Protocol</Button>
                    <Button variant="ghost" onClick={() => setNodesToDelete([])} className="w-full h-10 text-[10px] font-black uppercase text-white/20">Abort Operation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
