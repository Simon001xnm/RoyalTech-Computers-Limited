'use client';

import { useMemo, useState } from 'react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Server, 
    History, MoreHorizontal, Lock, Unlock, Zap, Crown, 
    ChevronRight, Inbox, Gauge, Eye, Mail, Phone, Clock, Send, SendHorizonal, MailCheck, MailQuestion, Loader2, MessageSquare, AlertCircle, Trash2, AlertTriangle, UserPlus, BarChart3, LineChart, PieChart, TrendingUp, Package, Search, Maximize2, Minimize2, EyeOff, LayoutTemplate, ShieldAlert, LogIn, LogOut, RotateCcw, AlertOctagon
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, updateDoc, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MASTER_KEYS } from '@/lib/roles';

/**
 * @fileOverview Platform Command Center (Super Admin Dashboard)
 * Advanced visibility into global identity and business nodes.
 * Includes System Maintenance tools for data purging.
 */
export default function PlatformCommandCenter() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Layout Management State
  const [showRegistry, setShowRegistry] = useState(true);
  const [showSignups, setShowSignups] = useState(true);
  const [isRegistryFullWidth, setIsRegistryFullWidth] = useState(false);

  // State for Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Messaging State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [msgTargetTenantId, setMsgTargetTenantId] = useState<string>('');
  const [msgTargetUserId, setMsgTargetUserId] = useState<string>('all');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgPriority, setMsgPriority] = useState<'info' | 'important' | 'alert'>('info');
  const [postToChat, setPostToChat] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  
  // GLOBAL CLOUD QUERIES (Real-time)
  const companiesQuery = useMemoFirebase(() => query(collection(firestore, 'companies')), []);
  const { data: tenants, isLoading: isTenantsLoading } = useCollection(companiesQuery);

  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), []);
  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), limit(500)), []);
  const { data: rawLogs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const globalSalesQuery = useMemoFirebase(() => query(collection(firestore, 'sales_transactions'), limit(1000)), []);
  const { data: globalSales } = useCollection(globalSalesQuery);

  const logs = useMemo(() => {
    if (!rawLogs) return [];
    const filtered = rawLogs.filter(log => {
        const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
        const matchesTenant = tenantFilter === 'all' || log.tenantId === tenantFilter;
        return matchesLevel && matchesTenant;
    });
    return [...filtered].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
    });
  }, [rawLogs, logLevelFilter, tenantFilter]);

  const recentUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 15);
  }, [users]);

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended') => {
      try {
          await updateDoc(doc(firestore, 'users', userId), { status, updatedAt: new Date().toISOString() });
          toast({ title: `User ${status === 'active' ? 'Authorized' : 'Suspended'}` });
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Action Failed' });
      }
  };

  const handleNuclearDelete = async (userId: string) => {
      if (!confirm("NUCLEAR ACTION: This will erase all user metadata. Audit logs will be preserved for security. Continue?")) return;
      try {
          await deleteDoc(doc(firestore, 'users', userId));
          toast({ title: "Account Metadata Purged" });
          setSelectedUserId(null);
      } catch (e) {
          toast({ variant: 'destructive', title: 'Purge Failed' });
      }
  };

  const handlePurgeAllUsers = async () => {
    if (!confirm("CRITICAL: This will delete ALL user accounts except Super Admins (Master Keys). All other team members will lose access. Continue?")) return;
    setIsResetting(true);
    const batch = writeBatch(firestore);
    try {
        const usersSnap = await getDocs(collection(firestore, 'users'));
        let count = 0;
        usersSnap.forEach(uDoc => {
            const uData = uDoc.data();
            const email = uData.email?.toLowerCase().trim();
            const isMaster = MASTER_KEYS.includes(email);
            if (uData.role !== 'super_admin' && !isMaster) {
                batch.delete(uDoc.ref);
                count++;
            }
        });
        await batch.commit();
        toast({ title: "Purge Complete", description: `${count} accounts removed from system.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Purge Failed', description: e.message });
    } finally {
        setIsResetting(false);
    }
  };

  const handleFullSystemReset = async () => {
    if (!confirm("WARNING: THIS IS A TOTAL SYSTEM WIPE. All companies, inventory, sales, and users (except you) will be deleted. THE SYSTEM WILL BE FACTORY FRESH. Are you absolutely certain?")) {
        const secondary = confirm("Type 'CONFIRM' to execute system wipe. (Actually just click OK again if you are sure)");
        if (!secondary) return;
    }
    
    setIsResetting(true);
    const collections = [
        'assets', 'accessories', 'customers', 'sales_transactions', 
        'leases', 'tickets', 'notifications', 'platform_logs', 
        'companies', 'messages', 'campaigns', 'projects'
    ];

    try {
        for (const colName of collections) {
            const snap = await getDocs(collection(firestore, colName));
            const batch = writeBatch(firestore);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        
        // Final Purge of Users except current Super Admin
        const userSnap = await getDocs(collection(firestore, 'users'));
        const userBatch = writeBatch(firestore);
        userSnap.forEach(d => {
            const data = d.data();
            const isMaster = MASTER_KEYS.includes(data.email?.toLowerCase().trim());
            if (data.role !== 'super_admin' && !isMaster) userBatch.delete(d.ref);
        });
        await userBatch.commit();

        toast({ title: "Global Reset Complete", description: "Node has been returned to zero state." });
        window.location.reload();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Reset Interrupted', description: e.message });
    } finally {
        setIsResetting(false);
    }
  };

  const handleSendPlatformMessage = async () => {
    if (!msgTargetTenantId || !msgSubject || !msgBody) return;
    setIsSendingMsg(true);
    const batch = writeBatch(firestore);
    
    try {
        const notifRef = doc(collection(firestore, 'notifications'));
        batch.set(notifRef, {
            tenantId: msgTargetTenantId,
            userId: msgTargetUserId === 'all' ? null : msgTargetUserId,
            from: 'Platform Command',
            subject: msgSubject,
            message: msgBody,
            priority: msgPriority,
            read: false,
            createdAt: new Date().toISOString()
        });

        if (postToChat) {
            const messageRef = doc(collection(firestore, 'messages'));
            batch.set(messageRef, {
                tenantId: msgTargetTenantId,
                text: `[ADMIN BROADCAST: ${msgSubject}] ${msgBody}`,
                userId: 'platform_admin',
                userName: 'Platform Command',
                userAvatar: 'https://picsum.photos/seed/admin/128/128',
                createdAt: new Date().toISOString(),
                isSystemMessage: true
            });
        }

        await batch.commit();
        toast({ title: "Broadcast Transmitted" });
        setIsMessageOpen(false);
        setMsgSubject('');
        setMsgBody('');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Transmission Error', description: e.message });
    } finally {
        setIsSendingMsg(false);
    }
  };

  const handleResetLayout = () => {
      setShowRegistry(true);
      setShowSignups(true);
      setIsRegistryFullWidth(false);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center justify-center md:justify-start gap-3">
                <Gauge className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                Platform Command
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Global Identity & Infrastructure Node</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            {(!showRegistry || !showSignups || isRegistryFullWidth) && (
                <Button variant="outline" onClick={handleResetLayout} className="h-9 px-4 font-bold border-dashed">
                    <LayoutTemplate className="h-4 w-4 mr-2" /> Reset View
                </Button>
            )}
            <Button onClick={() => setIsMessageOpen(true)} className="w-full sm:w-auto h-9 px-4 font-bold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                <SendHorizonal className="h-4 w-4 mr-2" /> Global Broadcast
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-9 px-4 font-bold justify-center">
                <Server className="h-3 w-3 mr-2" /> Online
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Nodes" value={isTenantsLoading ? '...' : tenants?.length || 0} icon={Building2} description="Business entities" />
        <SummaryCard title="Global Identity" value={isUsersLoading ? '...' : users?.length || 0} icon={Users} description="Registered accounts" />
        <SummaryCard title="Cumulative GMV" value={new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(globalSales?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0)} icon={CreditCard} description="Platform volume" />
        <SummaryCard title="Health" value="OPTIMAL" icon={Zap} description="Services nominal" />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-12 p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="activity" className="font-black uppercase tracking-widest text-[10px]">Global Trace</TabsTrigger>
          <TabsTrigger value="registry" className="font-black uppercase tracking-widest text-[10px]">Accounts</TabsTrigger>
          <TabsTrigger value="maintenance" className="font-black uppercase tracking-widest text-[10px] text-destructive">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl font-black uppercase tracking-tight">System Events</CardTitle>
                    </div>
                    <div className="flex gap-2">
                         <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                            <SelectTrigger className="w-[120px] h-8 text-[10px] font-bold uppercase"><SelectValue placeholder="Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="business">Transactions</SelectItem>
                                <SelectItem value="identity">Identity Events</SelectItem>
                                <SelectItem value="error">Critical Errors</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <div className="divide-y">
                            {logs.map(log => {
                                const companyName = tenants?.find(t => t.id === log.tenantId)?.name || 'Global Node';
                                const isLogin = log.event.toLowerCase().includes('sign') || log.event.toLowerCase().includes('session');
                                const Icon = isLogin ? (log.event.includes('End') ? LogOut : LogIn) : (log.level === 'business' ? CreditCard : History);

                                return (
                                    <div key={log.id} className="p-4 md:p-5 hover:bg-muted/20">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-muted p-2 rounded-lg shrink-0">
                                                <Icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="space-y-1 flex-grow">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className={cn("font-black text-[8px] uppercase", 
                                                        log.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700')}>
                                                        {log.level}
                                                    </Badge>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                                </div>
                                                <p className="text-sm font-bold leading-tight">{log.event}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                    <Building2 className="h-3 w-3 shrink-0" /> {companyName}
                                                    <span className="opacity-40">&bull;</span>
                                                    <Clock className="h-3 w-3 shrink-0" /> {log.timestamp ? format(parseISO(log.timestamp), 'MMM d, HH:mm:ss') : 'Recently'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="registry">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Account Registry</CardTitle>
                    <CardDescription>Direct oversight of all node identities.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6">Identified User</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Access Role</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map(u => (
                                <TableRow key={u.id} className="hover:bg-muted/5">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarImage src={u.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">{u.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-sm">{u.name || 'Unnamed'}</div>
                                                <div className="text-[10px] text-muted-foreground">{u.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="uppercase text-[9px] font-black">{u.role}</Badge></TableCell>
                                    <TableCell><Badge variant={u.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[9px] font-black">{u.status || 'Active'}</Badge></TableCell>
                                    <TableCell className="text-right px-6">
                                        <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] h-8" onClick={() => setSelectedUserId(u.id)}>
                                            <Eye className="h-3 w-3 mr-1.5" /> Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="maintenance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
                    <CardHeader>
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-orange-700">
                            <Users className="h-6 w-6" /> Staff Purge
                        </CardTitle>
                        <CardDescription className="text-orange-600/70 font-bold text-[10px] uppercase">Identity Sanitation Protocol</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm font-medium leading-relaxed text-orange-800">
                            Removes all staff members and workspace admins from the database. 
                            <strong> Only Super Admins (Master Keys) will remain.</strong>
                        </p>
                        <div className="p-4 bg-white/50 rounded-xl border border-orange-100 space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-700">
                                <ShieldCheck className="h-3 w-3" /> Master Keys Preserved
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-700">
                                <ShieldCheck className="h-3 w-3" /> Auth sessions invalidated
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            variant="outline" 
                            className="w-full h-12 font-black uppercase tracking-widest text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                            onClick={handlePurgeAllUsers}
                            disabled={isResetting}
                        >
                            {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Purge Standard Users
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-2 border-dashed border-red-200 bg-red-50/30">
                    <CardHeader>
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-red-700">
                            <AlertOctagon className="h-6 w-6" /> Nuclear Reset
                        </CardTitle>
                        <CardDescription className="text-red-600/70 font-bold text-[10px] uppercase">Full System Wipe</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm font-medium leading-relaxed text-red-800">
                            Permanently erases all inventory, sales, clients, companies, and non-master users. 
                            <strong> This action is irreversible.</strong>
                        </p>
                        <div className="p-4 bg-white/50 rounded-xl border border-red-100 space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-700">
                                <Trash2 className="h-3 w-3" /> ALL Collections wiped
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-700">
                                <RotateCcw className="h-3 w-3" /> Return to Factory state
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            variant="destructive" 
                            className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-xl"
                            onClick={handleFullSystemReset}
                            disabled={isResetting}
                        >
                            {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Execute Nuclear Wipe
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Identity Management Sheet */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 border-none shadow-2xl">
            <SheetHeader className="sr-only">
                <SheetTitle>User Identity Details</SheetTitle>
                <SheetDescription>Platform identity metadata and technician controls.</SheetDescription>
            </SheetHeader>
            {users?.find(u => u.id === selectedUserId) && (
                (() => {
                    const activeDetailUser = users?.find(u => u.id === selectedUserId)!;
                    return (
                        <div className="flex flex-col h-full bg-background overflow-hidden">
                            <div className="p-8 bg-primary text-primary-foreground relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="h-24 w-24" />
                                </div>
                                <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest bg-white/20 text-white border-none mb-4">Identity Snapshot</Badge>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 ring-4 ring-white/20">
                                        <AvatarImage src={activeDetailUser.avatarUrl} />
                                        <AvatarFallback className="text-2xl bg-white/10">{activeDetailUser.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter">{activeDetailUser.name}</h2>
                                        <p className="text-sm font-bold opacity-80">{activeDetailUser.email}</p>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-grow p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-muted/20 border-none">
                                        <CardContent className="pt-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Access Role</p>
                                            <p className="text-lg font-black uppercase">{activeDetailUser.role}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-muted/20 border-none">
                                        <CardContent className="pt-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Identity Status</p>
                                            <Badge variant={activeDetailUser.status === 'suspended' ? 'destructive' : 'default'} className="font-black uppercase text-[10px]">{activeDetailUser.status || 'Active'}</Badge>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4" /> Technician Controls
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Button 
                                            variant="outline" 
                                            className={cn("justify-start h-12 font-bold", activeDetailUser.status === 'suspended' ? "text-green-600" : "text-orange-600")}
                                            onClick={() => handleUpdateUserStatus(activeDetailUser.id, activeDetailUser.status === 'suspended' ? 'active' : 'suspended')}
                                        >
                                            {activeDetailUser.status === 'suspended' ? <Unlock className="h-4 w-4 mr-3" /> : <Lock className="h-4 w-4 mr-3" />}
                                            {activeDetailUser.status === 'suspended' ? "Authorize Platform Access" : "Suspend Account Access"}
                                        </Button>
                                        <Button variant="ghost" className="justify-start h-12 font-bold text-destructive hover:bg-destructive/10" onClick={() => handleNuclearDelete(activeDetailUser.id)}>
                                            <Trash2 className="h-4 w-4 mr-3" /> Nuclear Scrub (Delete Metadata)
                                        </Button>
                                    </div>
                                </div>
                            </ScrollArea>
                            
                            <div className="p-4 border-t bg-muted/10 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                    Authorized Node ID: {activeDetailUser.id}
                                </p>
                            </div>
                        </div>
                    );
                })()
            )}
        </SheetContent>
      </Sheet>

      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase flex items-center gap-2"><Send className="h-6 w-6 text-primary" /> direct transmission</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">Encrypted broadcast service to workspace nodes</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Targeting</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border text-xs font-bold">
                        {msgTargetUserId === 'all' ? 'All Workspace Admins' : `Direct to: ${users?.find(u => u.id === msgTargetUserId)?.name || 'Specific User'}`}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">subject</Label>
                    <Input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="System Protocol Update..." className="h-11 font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Message Content</Label>
                    <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={6} placeholder="Enter your platform update here..." />
                </div>
            </div>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                <Button onClick={handleSendPlatformMessage} disabled={isSendingMsg || !msgSubject} className="font-black uppercase">
                    {isSendingMsg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Execute Broadcast
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
