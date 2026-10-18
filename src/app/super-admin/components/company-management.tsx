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
import { Search, Building2, MoreHorizontal, ShieldCheck, Mail, Phone, ExternalLink, Calendar, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

interface CompanyManagementProps {
    companies: Company[];
}

export function CompanyManagement({ companies }: CompanyManagementProps) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return companies.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        ).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [companies, search]);

    return (
        <Card className="border-none ring-1 ring-black/5 shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Workspace Inventory</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Tenant Silo Registry</CardDescription>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by node name..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 h-11 w-full md:w-80 bg-white shadow-sm"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase py-4 pl-8">Business Identity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Deployment Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Silo ID</TableHead>
                            <TableHead className="text-right pr-8 text-[10px] font-black uppercase py-4">Ops</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(company => (
                            <TableRow key={company.id} className="hover:bg-muted/5 transition-colors group">
                                <TableCell className="pl-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm tracking-tight">{company.name}</p>
                                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">
                                                <span className="flex items-center gap-1"><Mail className="h-2 w-2" /> {company.email}</span>
                                                <span className="flex items-center gap-1"><Phone className="h-2 w-2" /> {company.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={company.status === 'active' ? 'default' : 'destructive'} className="text-[8px] font-black uppercase border-none px-2 h-5 tracking-widest">
                                        {company.status || 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                        <Calendar className="h-3 w-3 opacity-30" />
                                        {company.createdAt ? format(parseISO(company.createdAt), 'dd MMM yyyy') : '--'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3 w-3 opacity-20" />
                                        <code className="text-[9px] font-mono bg-muted px-2 py-0.5 rounded opacity-60">{company.id.slice(0, 13)}...</code>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 border-none shadow-2xl">
                                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Node Operations</DropdownMenuLabel>
                                            <DropdownMenuItem className="text-xs font-bold py-2"><ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" /> Inspect Data Silo</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold py-2"><ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" /> Modify Subscription</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-xs font-bold text-destructive py-2">Decommission Node</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="p-20 text-center text-muted-foreground uppercase font-black text-[10px] opacity-20">No matching business nodes found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
