'use client';

import { useMemo, useState } from 'react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Server, 
    History, MoreHorizontal, Lock, Unlock, Zap, Crown, 
    ChevronRight, Inbox, Gauge, Eye, Mail, Phone, Clock, Send, SendHorizonal, MailCheck, MailQuestion, Loader2, MessageSquare, AlertCircle, Trash2, AlertTriangle, UserPlus, BarChart3, LineChart, PieChart, TrendingUp, Package, Search, Maximize2, Minimize2, EyeOff, LayoutTemplate
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    BarChart, 
    Bar, 
    Legend,
    Cell
} from 'recharts';

/**
 * @fileOverview Platform Command Center (Super Admin Dashboard)
 * Optimized for real-time global oversight with deep business-node intelligence.
 * Enhanced with Dynamic Layout Controls for resizable/adjustable containers.
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

  const salesQuery = useMemoFirebase(() => query(collection(firestore, 'sales_transactions'), limit(2000)), []);
  const { data: rawGlobalSales } = useCollection(salesQuery);

  const assetsQuery = useMemoFirebase(() => query(collection(firestore, 'assets')), []);
  const { data: rawGlobalAssets } = useCollection(assetsQuery);

  const ticketsQuery = useMemoFirebase(() => query(collection(firestore, 'tickets')), []);
  const { data: globalTickets } = useCollection(ticketsQuery);

  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), limit(500)), []);
  const { data: rawLogs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const notifsQuery = useMemoFirebase(() => query(collection(firestore, 'notifications'), limit(100)), []);
  const { data: rawNotifications } = useCollection(notifsQuery);

  // Drill-down Logic
  const activeDetailCompany = useMemo(() => 
    tenants?.find(t => t.id === selectedCompanyId), 
  [tenants, selectedCompanyId]);

  const companyStats = useMemo(() => {
    if (!selectedCompanyId || !rawGlobalSales || !rawGlobalAssets) return null;
    
    const companySales = rawGlobalSales.filter(s => s.tenantId === selectedCompanyId);
    const companyAssets = rawGlobalAssets.filter(a => a.tenantId === selectedCompanyId);
    const companyUsers = users?.filter(u => u.tenantId === selectedCompanyId) || [];

    const totalRevenue = companySales.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalInventoryValue = companyAssets.reduce((acc, a) => acc + ((a.purchasePrice || 0) * (a.quantity || 1)), 0);
    
    // Group sales by month for the chart
    const monthlyData = companySales.reduce((acc: any, s) => {
        try {
            const month = format(parseISO(s.date), 'MMM');
            acc[month] = (acc[month] || 0) + s.amount;
        } catch(e) {}
        return acc;
    }, {});

    const chartData = Object.keys(monthlyData).map(month => ({
        name: month,
        sales: monthlyData[month],
        inventory: totalInventoryValue / Math.max(1, Object.keys(monthlyData).length) 
    }));

    return {
        totalRevenue,
        totalInventoryValue,
        userCount: companyUsers.length,
        assetCount: companyAssets.length,
        chartData,
        users: companyUsers
    };
  }, [selectedCompanyId, rawGlobalSales, rawGlobalAssets, users]);

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

  const recentUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 10);
  }, [users]);

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
            <p className="text-muted-foreground font-medium mt-1">Real-time Cloud Node Monitoring</p>
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
                <Server className="h-3 w-3 mr-2" /> Global Node Online
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Workspaces" value={isTenantsLoading ? '...' : platformStats.totalTenants} icon={Building2} description="Registered business nodes" />
        <SummaryCard title="Global Identity" value={isUsersLoading ? '...' : platformStats.totalUsers} icon={Users} description="Total staff accounts" />
        <SummaryCard title="Aggregate GMV" value={formatCurrency(platformStats.totalRevenue)} icon={CreditCard} description="Cumulative volume" />
        <SummaryCard title="Global Support" value={platformStats.openTickets} icon={Inbox} description="Pending helpdesk cases" />
      </div>

      <div className={cn(
          "grid gap-6 transition-all duration-500 ease-in-out",
          (showRegistry && showSignups && !isRegistryFullWidth) ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {showRegistry && (
            <Card className={cn(
                "shadow-xl border-none overflow-hidden transition-all duration-500",
                (showRegistry && showSignups && !isRegistryFullWidth) ? "lg:col-span-2" : "col-span-1"
            )}>
                <CardHeader className="bg-muted/30 p-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Cloud Workspace Registry</CardTitle>
                        <Badge variant="outline" className="font-bold hidden sm:flex">Live Sync</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title={isRegistryFullWidth ? "Standard View" : "Maximize"}
                            onClick={() => {
                                setIsRegistryFullWidth(!isRegistryFullWidth);
                                if (!isRegistryFullWidth) setShowSignups(false);
                                else setShowSignups(true);
                            }}
                        >
                            {isRegistryFullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                            title="Hide Registry"
                            onClick={() => setShowRegistry(false)}
                        >
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
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
                                            <Button variant="outline" size="sm" className="h-8 font-black uppercase text-[10px]" onClick={() => setSelectedCompanyId(tenant.id)}>
                                                <BarChart3 className="h-3 w-3 mr-1" /> View Intelligence
                                            </Button>
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
                            {tenants?.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No workspaces registered in this cloud node.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

        {showSignups && (
            <Card className="shadow-xl border-none transition-all duration-500">
                <CardHeader className="bg-muted/10 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            New Signups
                        </CardTitle>
                        <CardDescription className="hidden sm:block">Latest identity registrations.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title={(!showRegistry) ? "Standard View" : "Maximize"}
                            onClick={() => {
                                if (showRegistry) {
                                    setShowRegistry(false);
                                    setIsRegistryFullWidth(false);
                                } else {
                                    setShowRegistry(true);
                                }
                            }}
                        >
                            {(!showRegistry) ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                            title="Hide Signups"
                            onClick={() => setShowSignups(false)}
                        >
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                        <div className="divide-y">
                            {recentUsers.map(user => (
                                <div key={user.id} className="p-4 hover:bg-muted/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="overflow-hidden pr-4">
                                            <p className="font-bold text-sm truncate">{user.name || 'Unnamed User'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary" className="text-[8px] font-black uppercase mb-1">
                                                {user.tenantId ? tenants?.find(t => t.id === user.tenantId)?.name?.slice(0, 8) : 'Pending Setup'}
                                            </Badge>
                                            <p className="text-[9px] text-muted-foreground italic">
                                                {user.createdAt ? format(parseISO(user.createdAt), 'MMM d') : 'Recent'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentUsers.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground italic text-xs">No signups detected yet.</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
      </div>

      {!showRegistry && !showSignups && (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl opacity-40">
              <Activity className="h-12 w-12 mb-4" />
              <p className="font-black uppercase tracking-widest text-sm">Dashboard View Cleaned</p>
              <Button variant="link" onClick={handleResetLayout} className="mt-2 font-bold">Restore Default Modules</Button>
          </div>
      )}

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="activity" className="font-black uppercase tracking-widest text-[10px]">Global Network Trace (Audit)</TabsTrigger>
          <TabsTrigger value="comms" className="font-black uppercase tracking-widest text-[10px]">Communication Logs</TabsTrigger>
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
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="error">Errors</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <div className="divide-y">
                            {isLogsLoading ? (
                                <div className="p-20 text-center animate-pulse text-muted-foreground uppercase font-bold text-xs tracking-widest">Awaiting cloud events...</div>
                            ) : logs.map(log => (
                                <div key={log.id} className="p-4 md:p-5 hover:bg-muted/20">
                                    <div className="flex items-start justify-between gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                <Badge variant="outline" className={cn("font-black text-[8px] md:text-[9px] uppercase", log.level === 'error' ? 'bg-red-50 text-red-700' : log.level === 'business' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700')}>
                                                    {log.level}
                                                </Badge>
                                                <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                            </div>
                                            <p className="text-sm font-bold leading-tight">{log.event}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                <Building2 className="h-3 w-3 shrink-0" /> {tenants?.find(t => t.id === log.tenantId)?.name || 'Global Node'}
                                                <span className="opacity-40">&bull;</span>
                                                <Clock className="h-3 w-3 shrink-0" /> {log.timestamp ? format(parseISO(log.timestamp), 'MMM d, HH:mm:ss') : 'Recent'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!isLogsLoading && logs.length === 0 && (
                                <div className="p-20 text-center text-muted-foreground italic text-sm">No activity records found in the current buffer.</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="comms">
            <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b p-6"><CardTitle className="text-xl font-black uppercase tracking-tight">Platform Broadcast History</CardTitle></CardHeader>
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
                            {rawNotifications?.map(notif => (
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

      {/* Intelligence Drill-down Sheet */}
      <Sheet open={!!selectedCompanyId} onOpenChange={(open) => !open && setSelectedCompanyId(null)}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0 border-none shadow-2xl">
            {activeDetailCompany && companyStats && (
                <div className="flex flex-col h-full bg-background">
                    <div className="p-8 bg-primary text-primary-foreground">
                        <div className="flex justify-between items-start gap-6">
                            <div className="space-y-1">
                                <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest bg-white/20 text-white border-none mb-2">Workspace Intelligence</Badge>
                                <h2 className="text-4xl font-black uppercase tracking-tighter">{activeDetailCompany.name}</h2>
                                <div className="flex items-center gap-4 text-xs font-bold opacity-80 pt-2">
                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {activeDetailCompany.email}</span>
                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {activeDetailCompany.phone || 'No Phone'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className="bg-white text-primary border-none font-black h-8 px-4 uppercase">{activeDetailCompany.plan || 'Free'}</Badge>
                                <p className="text-[10px] opacity-60 mt-2 font-mono uppercase">Node ID: {activeDetailCompany.id.slice(0,12)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/20 border-none">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Lifetime GMV</p>
                                    <p className="text-xl font-black">{formatCurrency(companyStats.totalRevenue)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/20 border-none">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Inventory Value</p>
                                    <p className="text-xl font-black">{formatCurrency(companyStats.totalInventoryValue)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/20 border-none">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Hardware Units</p>
                                    <p className="text-xl font-black">{companyStats.assetCount}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/20 border-none">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Active Staff</p>
                                    <p className="text-xl font-black">{companyStats.userCount}</p>
                                </CardContent>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm ring-1 ring-muted overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b">
                                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Performance Analytics: Sales vs. Inventory
                                </CardTitle>
                                <CardDescription>Visualization of revenue generation vs. stock overhead.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={companyStats.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                                            <YAxis axisLine={false} tickLine={false} fontSize={10} />
                                            <Tooltip 
                                                cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                            <Bar dataKey="sales" name="Actual Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="inventory" name="Inventory Value (Avg)" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" /> Node Identity Registry (Staff)
                            </h3>
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-black uppercase py-4">Name</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {companyStats.users.map(u => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-bold text-sm py-4">{u.name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                                                <TableCell><Badge variant="outline" className="text-[9px] uppercase font-bold">{u.role}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="bg-muted/20 p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-bold">Node Geographic Data</p>
                                <p className="text-xs text-muted-foreground">{activeDetailCompany.address}</p>
                            </div>
                            <Button variant="outline" className="w-full h-11 font-black uppercase text-xs" onClick={() => { setMsgTargetTenantId(activeDetailCompany.id); setMsgTargetUserId('all'); setIsMessageOpen(true); }}>
                                <Send className="h-3 w-3 mr-2" /> Transmission official Alert to Node
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>

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
                    <Input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="System Security Update..." className="h-11 font-bold" />
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
