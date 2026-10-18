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
import { Search, Building2, MoreHorizontal, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';
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
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Active Workspaces</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Global Tenant Registry</CardDescription>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by company name..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 h-10 w-full md:w-64 bg-white"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase py-4 pl-8">Workspace Identity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Deployment Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Silo ID</TableHead>
                            <TableHead className="text-right pr-8 text-[10px] font-black uppercase py-4">Ops</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(company => (
                            <TableRow key={company.id} className="hover:bg-muted/5 transition-colors">
                                <TableCell className="pl-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm tracking-tight">{company.name}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold mt-0.5">
                                                <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {company.email}</span>
                                                <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {company.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={company.status === 'active' ? 'default' : 'destructive'} className="text-[9px] font-black uppercase border-none px-2 h-5">
                                        {company.status || 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {company.createdAt ? format(parseISO(company.createdAt), 'dd MMM yyyy') : '--'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <code className="text-[9px] font-mono bg-muted px-2 py-0.5 rounded opacity-50">{company.id.slice(0, 13)}...</code>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50">Administration</DropdownMenuLabel>
                                            <DropdownMenuItem className="text-xs font-bold"><ExternalLink className="h-3.5 w-3.5 mr-2" /> Inspect Workspace</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold"><ShieldCheck className="h-3.5 w-3.5 mr-2" /> Adjust Billing Plan</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-xs font-bold text-destructive">Suspend Node</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
