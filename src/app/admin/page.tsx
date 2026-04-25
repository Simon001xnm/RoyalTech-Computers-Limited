'use client';

import { useMemo, useState } from 'react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Server, 
    History, MoreHorizontal, Lock, Unlock, Zap, Crown, 
    ChevronRight, Inbox, Gauge, Eye, Mail, Phone, Clock, Send, SendHorizonal, MailCheck, MailQuestion, Loader2, MessageSquare, AlertCircle
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function PlatformCommandCenter() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // State for Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [inspectingTenantId, setInspectingTenantId] = useState<string | null>(null);

  // Messaging State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [msgTargetTenantId, setMsgTargetTenantId] = useState<string>('');
  const [msgTargetUserId, setMsgTargetUserId] = useState<string>('all');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgPriority, setMsgPriority] = useState<'info' | 'important' | 'alert'>('info');
  const [postToChat, setPostToChat] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // GLOBAL CLOUD QUERIES (Index-free: sort in memory)
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

  const inspectionData = useMemo(() => {
      if (!inspectingTenantId || !globalSalesSorted || !users || !tenants) return null;
      const tenant = tenants.find(t => t.id === inspectingTenantId);
      const tenantSales = globalSalesSorted.filter(s => s.tenantId === inspectingTenantId);
      const tenantUsers = users.filter(u => u.tenantId === inspectingTenantId);
      return { tenant, sales: tenantSales, users: tenantUsers };
  }, [inspectingTenantId, globalSalesSorted, users, tenants]);
  
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
        // 1. Add to Official Notifications
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

        // 2. Optionally post to Team Chat (SalesIQ)
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Gauge className="h-10 w-10 text-primary" />
                Platform Command
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Global SaaS Oversight & Network Metrics</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsMessageOpen(true)} className="h-9 px-4 font-bold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                <SendHorizonal className="h-4 w-4 mr-2" /> Global Broadcast
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-9 px-4 font-bold">
                <Server className="h-3 w-3 mr-2" /> Global Node Online
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Workspaces" value={platformStats.totalTenants} icon={Building2} description="Registered cloud tenancies" />
        <SummaryCard title="Global Identity" value={platformStats.totalUsers} icon={Users} description="Consolidated staff accounts" />
        <SummaryCard title="Aggregate GMV" value={formatCurrency(platformStats.totalRevenue)} icon={CreditCard} description="Cumulative transaction volume" />
        <SummaryCard title="Global Support" value={platformStats.openTickets} icon={Inbox} description="Pending helpdesk tickets" />
      </div>

      <Tabs defaultValue="tenants" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12 p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="tenants" className="font-black uppercase tracking-widest text-[10px]">Workspaces</TabsTrigger>
          <TabsTrigger value="commercial" className="font-black uppercase tracking-widest text-[10px]">Commercials</TabsTrigger>
          <TabsTrigger value="activity" className="font-black uppercase tracking-widest text-[10px]">Global Audit</TabsTrigger>
          <TabsTrigger value="comms" className="font-black uppercase tracking-widest text-[10px]">Platform Comms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tenants">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="p-6"><CardTitle className="text-xl font-black uppercase tracking-tight">Cloud Workspace Registry</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6">Business Entity</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Staff Size</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Plan</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
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
                                                    <DropdownMenuItem className="font-bold text-xs" onClick={() => setInspectingTenantId(tenant.id)}><Eye className="h-4 w-4 mr-2" /> Inspect Node</DropdownMenuItem>
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
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y">
                            {logs?.map(log => (
                                <div key={log.id} className="p-5 hover:bg-muted/20">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn("font-black text-[9px] uppercase", log.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')}>
                                                    {log.level}
                                                </Badge>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                            </div>
                                            <p className="text-sm font-bold">{log.event}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                <Building2 className="h-3 w-3" /> {tenants?.find(t => t.id === log.tenantId)?.name || 'Platform'}
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
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6">Destination Node</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Subject</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Sent</TableHead>
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

      {/* Node Inspector Dialog */}
      <Dialog open={!!inspectingTenantId} onOpenChange={(open) => !open && setInspectingTenantId(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Eye className="h-8 w-8" />
                    Node Audit: {inspectionData?.tenant?.name}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold uppercase text-[10px] tracking-widest">
                    Tenancy ID: {inspectingTenantId?.toUpperCase()}
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden flex flex-col">
                <div className="grid grid-cols-3 gap-0 border-b">
                    <div className="p-6 text-center border-r bg-muted/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Sales</p>
                        <p className="text-2xl font-black">{inspectionData?.sales.length || 0}</p>
                    </div>
                    <div className="p-6 text-center border-r bg-muted/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Team Members</p>
                        <p className="text-2xl font-black">{inspectionData?.users.length || 0}</p>
                    </div>
                    <div className="p-6 text-center bg-muted/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active GMV</p>
                        <p className="text-2xl font-black text-primary">{formatCurrency(inspectionData?.sales.reduce((acc, s) => acc + s.amount, 0) || 0)}</p>
                    </div>
                </div>
                <ScrollArea className="flex-grow p-6">
                    <Table>
                        <TableHeader><TableRow><TableHead className="text-[9px] uppercase font-black">Date</TableHead><TableHead className="text-[9px] uppercase font-black text-right">Volume</TableHead><TableHead className="text-[9px] uppercase font-black text-right">Method</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {inspectionData?.sales.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="text-[10px] font-mono">{s.date ? format(parseISO(s.date), 'MMM d, HH:mm') : 'N/A'}</TableCell>
                                    <TableCell className="text-right font-black text-xs text-primary">{formatCurrency(s.amount)}</TableCell>
                                    <TableCell className="text-right"><Badge variant="outline" className="text-[8px]">{s.paymentMethod}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            <CardFooter className="p-6 border-t flex justify-end">
                <Button onClick={() => setInspectingTenantId(null)} className="font-bold">Close Audit</Button>
            </CardFooter>
        </DialogContent>
      </Dialog>

      {/* Messaging Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2"><Send className="h-6 w-6 text-primary" /> platform alert</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">Admin broadcast service for security & status updates</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">target node</Label>
                    <Select value={msgTargetTenantId} onValueChange={setMsgTargetTenantId}><SelectTrigger className="h-12 font-bold uppercase text-xs"><SelectValue placeholder="Select Business Node" /></SelectTrigger><SelectContent>{tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                
                {msgPriority === 'important' && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-orange-800 leading-tight">
                            <strong>Security Protocol:</strong> High-priority messages trigger red visual indicators on client dashboards. Ensure content is verified.
                        </p>
                    </div>
                )}
            </div>
            <DialogFooter className="border-t pt-6">
                <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                <Button onClick={handleSendPlatformMessage} disabled={isSendingMsg || !msgTargetTenantId || !msgSubject} className="font-black uppercase tracking-widest text-xs px-8 shadow-lg">
                    {isSendingMsg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Execute Broadcast
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
