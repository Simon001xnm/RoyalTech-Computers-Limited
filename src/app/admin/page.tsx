'use client';

import { useMemo, useState } from 'react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Server, 
    History, MoreHorizontal, Lock, Unlock, Zap, Crown, 
    ChevronRight, Inbox, Gauge, Eye, Mail, Phone, Clock, Send, SendHorizonal, MailCheck, MailQuestion, Loader2, MessageSquare, AlertCircle, Trash2, AlertTriangle
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * @fileOverview Platform Command Center (Super Admin Dashboard)
 * Provides global SaaS oversight and network metrics.
 */
export default function PlatformCommandCenter() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // State for Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  // Messaging State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [msgTargetTenantId, setMsgTargetTenantId] = useState<string>('');
  const [msgTargetUserId, setMsgTargetUserId] = useState<string>('all');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgPriority, setMsgPriority] = useState<'info' | 'important' | 'alert'>('info');
  const [postToChat, setPostToChat] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  
  // GLOBAL CLOUD QUERIES
  const companiesQuery = useMemoFirebase(() => query(collection(firestore, 'companies')), []);
  const { data: tenants } = useCollection(companiesQuery);

  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), []);
  const { data: users } = useCollection(usersQuery);

  const salesQuery = useMemoFirebase(() => query(collection(firestore, 'sales_transactions'), limit(1000)), []);
  const { data: rawGlobalSales } = useCollection(salesQuery);

  const ticketsQuery = useMemoFirebase(() => query(collection(firestore, 'tickets')), []);
  const { data: globalTickets } = useCollection(ticketsQuery);

  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), limit(100)), []);
  const { data: rawLogs } = useCollection(logsQuery);

  const notifsQuery = useMemoFirebase(() => query(collection(firestore, 'notifications'), limit(50)), []);
  const { data: rawNotifications } = useCollection(notifsQuery);

  // In-memory Sorting & Derivation
  const globalSalesSorted = useMemo(() => {
    if (!rawGlobalSales) return [];
    return [...rawGlobalSales].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [rawGlobalSales]);

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

  const allNotifications = useMemo(() => {
    if (!rawNotifications) return [];
    return [...rawNotifications].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
  }, [rawNotifications]);

  const platformStats = useMemo(() => ({
    totalRevenue: globalSalesSorted?.reduce((acc, s) => acc + s.amount, 0) || 0,
    totalTenants: tenants?.length || 0,
    totalUsers: users?.length || 0,
    openTickets: globalTickets?.filter(t => t.status !== 'Closed').length || 0
  }), [tenants, users, globalSalesSorted, globalTickets]);

  const handleUpdateTenantStatus = async (tenantId: string, status: 'active' | 'suspended') => {
    try {
        await updateDoc(doc(firestore, 'companies', tenantId), { status, updatedAt: new Date().toISOString() });
        toast({ title: `Tenant ${status === 'active' ? 'Activated' : 'Suspended'}` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed' });
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
            from: 'Platform Admin',
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
                text: `[SYSTEM ALERT: ${msgSubject}] ${msgBody}`,
                userId: 'platform_admin',
                userName: 'Platform Command',
                userAvatar: 'https://picsum.photos/seed/admin/128/128',
                createdAt: new Date().toISOString(),
                isSystemMessage: true
            });
        }

        await batch.commit();
        toast({ title: "Broadcast Transmitted Successfully" });
        setIsMessageOpen(false);
        setMsgSubject('');
        setMsgBody('');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Transmission Error', description: e.message });
    } finally {
        setIsSendingMsg(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center justify-center md:justify-start gap-3">
                <Gauge className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                Platform Command
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Global SaaS Oversight & Network Metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsMessageOpen(true)} className="w-full sm:w-auto h-9 px-4 font-bold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                <SendHorizonal className="h-4 w-4 mr-2" /> Global Broadcast
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-9 px-4 font-bold justify-center">
                <Server className="h-3 w-3 mr-2" /> Global Node Online
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Workspaces" value={platformStats.totalTenants} icon={Building2} description="Registered cloud tenancies" />
        <SummaryCard title="Global Identity" value={platformStats.totalUsers} icon={Users} description="Consolidated staff accounts" />
        <SummaryCard title="Aggregate GMV" value={formatCurrency(platformStats.totalRevenue)} icon={CreditCard} description="Cumulative transaction volume" />
        <SummaryCard title="Global Support" value={platformStats.openTickets} icon={Inbox} description="Pending helpdesk tickets" />
      </div>

      <Tabs defaultValue="tenants" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 h-12 p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="tenants" className="font-black uppercase tracking-widest text-[9px] md:text-[10px]">Workspaces</TabsTrigger>
          <TabsTrigger value="activity" className="font-black uppercase tracking-widest text-[9px] md:text-[10px]">Audit</TabsTrigger>
          <TabsTrigger value="comms" className="font-black uppercase tracking-widest text-[9px] md:text-[10px]">Comms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tenants">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="p-6"><CardTitle className="text-xl font-black uppercase tracking-tight">Cloud Workspace Registry</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6 min-w-[200px]">Business Entity</TableHead>
                                <TableHead className="font-black uppercase text-[10px] min-w-[120px]">Staff Size</TableHead>
                                <TableHead className="font-black uppercase text-[10px] min-w-[100px]">Plan</TableHead>
                                <TableHead className="font-black uppercase text-[10px] min-w-[100px]">Status</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants?.map(tenant => (
                                <TableRow key={tenant.id} className="hover:bg-muted/5">
                                    <TableCell className="px-6 py-5">
                                        <div className="font-black uppercase text-sm">{tenant.name}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground opacity-60">ID: {tenant.id.slice(0,8).toUpperCase()}</div>
                                    </TableCell>
                                    <TableCell><span className="font-bold text-xs">{users?.filter(u => u.tenantId === tenant.id).length || 0} Accounts</span></TableCell>
                                    <TableCell><Badge variant="outline" className="uppercase text-[9px] font-black">{tenant.plan || 'Free'}</Badge></TableCell>
                                    <TableCell><Badge variant={tenant.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[9px] font-black">{tenant.status || 'Active'}</Badge></TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="Quick Message" onClick={() => { setMsgTargetTenantId(tenant.id); setMsgTargetUserId('all'); setIsMessageOpen(true); }}><Mail className="h-4 w-4" /></Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2">
                                                    <DropdownMenuItem className="font-bold text-xs" onClick={() => { setMsgTargetTenantId(tenant.id); setMsgTargetUserId('all'); setIsMessageOpen(true); }}><Mail className="h-4 w-4 mr-2" /> Message Tenant</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className={cn("font-bold text-xs", tenant.status === 'suspended' ? "text-green-600" : "text-destructive")} onClick={() => handleUpdateTenantStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')}>
                                                        {tenant.status === 'suspended' ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                                        {tenant.status === 'suspended' ? "Re-activate Node" : "Suspend Access"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="activity">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-6">
                    <div className="flex items-center gap-2">
                        <History className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Global Network Trace</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px] md:h-[600px]">
                        <div className="divide-y">
                            {logs?.map(log => (
                                <div key={log.id} className="p-4 md:p-5 hover:bg-muted/20">
                                    <div className="flex items-start justify-between gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                <Badge variant="outline" className={cn("font-black text-[8px] md:text-[9px] uppercase", log.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')}>
                                                    {log.level}
                                                </Badge>
                                                <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                            </div>
                                            <p className="text-sm font-bold leading-tight">{log.event}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                <Building2 className="h-3 w-3 shrink-0" /> {tenants?.find(t => t.id === log.tenantId)?.name || 'Platform'}
                                                <span className="opacity-40">&bull;</span>
                                                {log.timestamp ? format(parseISO(log.timestamp), 'MMM d, HH:mm') : 'Recent'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="comms">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b p-6"><CardTitle className="text-xl font-black uppercase tracking-tight">Communication Audit Log</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6 min-w-[150px]">Destination Node</TableHead>
                                <TableHead className="font-black uppercase text-[10px] min-w-[200px]">Subject</TableHead>
                                <TableHead className="font-black uppercase text-[10px] min-w-[100px]">Sent</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allNotifications?.map(notif => (
                                <TableRow key={notif.id} className="hover:bg-muted/5">
                                    <TableCell className="px-6 py-4 font-black uppercase text-xs text-primary">{tenants?.find(t => t.id === notif.tenantId)?.name || 'Unknown'}</TableCell>
                                    <TableCell className="font-bold text-sm">{notif.subject}</TableCell>
                                    <TableCell className="text-[10px] font-medium text-muted-foreground">{notif.createdAt ? format(parseISO(notif.createdAt), 'MMM d, HH:mm') : 'Pending'}</TableCell>
                                    <TableCell>
                                        <Badge variant={notif.read ? "default" : "outline"} className="font-black uppercase text-[9px]">
                                            {notif.read ? "Read" : "Sent"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Messaging Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black uppercase flex items-center gap-2"><Send className="h-6 w-6 text-primary" /> platform alert</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">Admin broadcast service for security & status updates</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">target node</Label>
                    <Select value={msgTargetTenantId} onValueChange={setMsgTargetTenantId}><SelectTrigger className="h-12 font-bold uppercase text-xs"><SelectValue placeholder="Select Business Node" /></SelectTrigger><SelectContent>{tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">priority level</Label>
                        <Select value={msgPriority} onValueChange={(v: any) => setMsgPriority(v)}>
                            <SelectTrigger className="h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="info">Information</SelectItem>
                                <SelectItem value="important">Important (Security)</SelectItem>
                                <SelectItem value="alert">Critical Alert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Alert Type</Label>
                        <div className="flex items-center h-11 space-x-2 bg-muted/20 px-3 rounded-md border">
                            <Checkbox id="chat-toggle" checked={postToChat} onCheckedChange={(v: any) => setPostToChat(v)} />
                            <label htmlFor="chat-toggle" className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" /> Post to Team Chat
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">subject</Label>
                    <Input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="System Security Update, Expiration Reminder..." className="h-11 font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Message Content</Label>
                    <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={6} placeholder="Compose your platform communication here..." />
                </div>
            </div>
            <DialogFooter className="border-t pt-6 flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsMessageOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleSendPlatformMessage} disabled={isSendingMsg || !msgTargetTenantId || !msgSubject} className="w-full sm:w-auto font-black uppercase tracking-widest text-xs px-8 shadow-lg">
                    {isSendingMsg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Execute Broadcast
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
