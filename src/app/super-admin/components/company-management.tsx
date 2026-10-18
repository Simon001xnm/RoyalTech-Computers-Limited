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
import { Search, Building2, MoreHorizontal, ShieldCheck, Mail, Phone, ExternalLink, Calendar, Database, Trash2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
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

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const [isDeleting, setIsDeleting] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<Company | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("");

    const filtered = useMemo(() => {
        return companies.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        ).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [companies, search]);

    const handleDecommission = async () => {
        if (!nodeToDelete || !confirmPassword) return;
        setIsDeleting(true);

        try {
            // Log the security event
            await addDoc(collection(firestore, 'platform_logs'), {
                timestamp: new Date().toISOString(),
                level: 'error',
                module: 'System',
                event: `NODE DECOMMISSIONED: ${nodeToDelete.name}`,
                userId: user?.uid,
                metadata: { nodeId: nodeToDelete.id, actor: user?.email }
            });

            await deleteDoc(doc(firestore, 'companies', nodeToDelete.id));
            
            toast({ 
                title: "Node Purged", 
                description: `Business node ${nodeToDelete.name} has been removed from the cluster.` 
            });
            setNodeToDelete(null);
            setConfirmPassword("");
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Purge Failed", description: e.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = useMemo<ColumnDef<Company>[]>(() => [
        {
            accessorKey: "name",
            header: "Business Identity",
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
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'destructive'} className="text-[8px] font-black uppercase border-none px-2 h-5 tracking-widest">
                    {row.original.status || 'Active'}
                </Badge>
            )
        },
        {
            accessorKey: "createdAt",
            header: "Deployment Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
                    <Calendar className="h-3.5 w-3.5 opacity-30" />
                    {row.original.createdAt ? format(parseISO(row.original.createdAt), 'dd MMM yyyy') : '--'}
                </div>
            )
        },
        {
            accessorKey: "id",
            header: "Silo ID",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 opacity-20" />
                    <code className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-white/40">{row.original.id.slice(0, 13)}...</code>
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
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Node Operations</DropdownMenuLabel>
                            <DropdownMenuItem className="text-xs font-bold py-2 focus:bg-white/5 focus:text-white cursor-pointer"><ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" /> Inspect Data Silo</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold py-2 focus:bg-white/5 focus:text-white cursor-pointer"><ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" /> Modify Subscription</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem 
                                className="text-xs font-bold text-destructive py-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => setNodeToDelete(row.original)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Decommission Node
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], []);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
        <Card className="border-none ring-1 ring-white/5 shadow-2xl bg-[#141414] text-white overflow-hidden">
            <CardHeader className="bg-white/[0.02] p-6 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Workspace Inventory</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Tenant Silo Registry</CardDescription>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by node name..." 
                            value={search}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 w-full md:w-80 bg-white/5 border-white/10 text-white placeholder:text-white/20 shadow-sm"
                        />
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
                                    No matching business nodes found
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

        {/* NUCLEAR DELETE CONFIRMATION DIALOG */}
        <Dialog open={!!nodeToDelete} onOpenChange={(o) => !o && setNodeToDelete(null)}>
            <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(220,38,38,0.3)]">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase text-center text-white">Nuclear Decommission</DialogTitle>
                    <DialogDescription className="text-center text-white/60 font-medium leading-relaxed">
                        You are about to permanently purge <span className="text-white font-black">{nodeToDelete?.name}</span>. This will destroy all associated data silos.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4 border-t border-white/5 mt-4">
                    <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 space-y-2">
                        <div className="flex items-center gap-2 text-destructive">
                            <Lock className="h-4 w-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">2FA Verification Required</p>
                        </div>
                        <p className="text-[11px] text-white/40">Please provide your master administrative password to authorize this destructive action.</p>
                    </div>

                    <div className="space-y-2">
                        <Input 
                            type="password"
                            placeholder="Enter master password..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 bg-white/5 border-white/10 text-center font-bold tracking-widest text-lg"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:flex-col">
                    <Button 
                        variant="destructive" 
                        className="w-full h-12 font-black uppercase tracking-widest shadow-xl"
                        disabled={isDeleting || !confirmPassword}
                        onClick={handleDecommission}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Confirm Node Destruction
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setNodeToDelete(null)}
                        className="w-full h-10 text-[10px] font-black uppercase text-white/20 hover:text-white"
                    >
                        Abort Protocol
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
