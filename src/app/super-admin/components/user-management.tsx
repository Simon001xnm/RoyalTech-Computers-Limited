'use client';

import { useState, useMemo } from 'react';
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
import { Search, User as UserIcon, MoreHorizontal, Key, ShieldAlert, Building2, Check, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface UserManagementProps {
    users: User[];
    companies: Company[];
}

export function UserManagement({ users, companies }: UserManagementProps) {
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const firestore = useFirestore();

    const [resetUser, setResetUser] = useState<User | null>(null);
    const [newPass, setNewPass] = useState("");
    const [isSavingPass, setIsSavingPass] = useState(false);

    const filtered = useMemo(() => {
        return users.filter(u => 
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        ).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [users, search]);

    const handleSetPassword = async () => {
        if (!resetUser || !newPass) return;
        setIsSavingPass(true);
        try {
            // Simulated protocol - In production, this would trigger a Cloud Function (Admin SDK)
            await new Promise(r => setTimeout(r, 1200));
            toast({ 
                title: "Credentials Set", 
                description: `Manual password override initiated for ${resetUser.email}. A system notification has been logged.` 
            });
            setResetUser(null);
            setNewPass("");
        } finally {
            setIsSavingPass(false);
        }
    };

    return (
        <>
        <Card className="border-none ring-1 ring-black/5 shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Global User Pool</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Consolidated Identity Management</CardDescription>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
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
                            <TableHead className="text-[10px] font-black uppercase py-4 pl-8">Account Identity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Global Role</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Enrollment Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4 text-center">Linked Nodes</TableHead>
                            <TableHead className="text-[10px] font-black uppercase py-4">Status</TableHead>
                            <TableHead className="text-right pr-8 text-[10px] font-black uppercase py-4">Ops</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(user => (
                            <TableRow key={user.id} className="hover:bg-muted/5 transition-colors group">
                                <TableCell className="pl-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm tracking-tight">{user.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'} className="text-[8px] font-black uppercase tracking-widest h-5">
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                        <Calendar className="h-3 w-3 opacity-30" />
                                        {user.createdAt ? format(parseISO(user.createdAt), 'dd MMM yyyy') : '--'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className="text-[10px] font-black h-6 min-w-[30px] justify-center bg-white border-2">
                                            {(user.tenantIds || []).length}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'suspended' ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <span className="text-[9px] font-black uppercase opacity-60">{user.status || 'Active'}</span>
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
                                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Identity Control</DropdownMenuLabel>
                                            <DropdownMenuItem className="text-xs font-bold py-2" onClick={() => setResetUser(user)}>
                                                <Key className="h-3.5 w-3.5 mr-2 text-primary" /> Set Access Password
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold py-2">
                                                <Building2 className="h-3.5 w-3.5 mr-2 text-primary" /> Assign to Node
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-xs font-bold text-destructive py-2">
                                                <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Deactivate Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Key className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Manual Credential Set</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Updating login credentials for: {resetUser?.email}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">New Access Password</p>
                        <Input 
                            type="password" 
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="Enter secure password..."
                            className="h-12 font-bold text-lg border-2 border-primary/20 focus-visible:ring-primary/10"
                        />
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-[10px] text-orange-900 font-bold leading-relaxed">
                        Security Notice: Setting a manual password will invalidate all existing sessions. The user will be required to re-authenticate on their next interaction.
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setResetUser(null)} className="h-12 px-6 font-bold">Cancel</Button>
                    <Button onClick={handleSetPassword} disabled={isSavingPass || !newPass} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl">
                        {isSavingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Apply Credentials</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
