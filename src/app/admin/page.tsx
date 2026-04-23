
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server, 
    History, MoreHorizontal, ShieldAlert, Lock, Unlock, Zap, Crown, BarChart3, 
    TrendingUp, Trophy, Filter, Search, X, Loader2, Download, ActivitySquare, 
    ChevronRight, AlertCircle, Info, CheckCircle2, MessageSquare, Inbox, ActivityIcon,
    Gauge, Eye, User, Phone, Mail, Clock
} from 'lucide-react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function PlatformCommandCenter() {
  const { toast } = useToast();
  
  // State for Log Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Diagnostic & Inspection State
  const [diagnosticTenant, setDiagnosticTenant] = useState<any | null>(null);
  const [inspectingTenantId, setInspectingTenantId] = useState<string | null>(null);

  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const globalSales = useLiveQuery(() => db.sales.toArray());
  const globalTickets = useLiveQuery(() => db.tickets.toArray());
  
  // Node Inspector Data (Computed based on selected ID)
  const inspectionData = useMemo(() => {
      if (!inspectingTenantId || !globalSales || !users || !tenants) return null;
      
      const tenant = tenants.find(t => t.id === inspectingTenantId);
      const tenantSales = globalSales
          .filter(s => s.tenantId === inspectingTenantId)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
      const tenantUsers = users.filter(u => u.tenantId === inspectingTenantId);
      
      // Map sales to user identities for staff attribution
      const attributedSales = tenantSales.map(sale => {
          const user = tenantUsers.find(u => u.id === sale.createdBy?.uid);
          return {
              ...sale,
              staff: {
                  name: user?.name || sale.createdBy?.name || 'Unknown',
                  email: user?.email || 'N/A',
                  phone: user?.phone || 'N/A'
              }
          };
      });

      return { tenant, sales: attributedSales, users: tenantUsers };
  }, [inspectingTenantId, globalSales, users, tenants]);

  // Reactive logs with filtering
  const logs = useLiveQuery(async () => {
    let collection = db.platformLogs.orderBy('timestamp').reverse();
    const result = await collection.limit(500).toArray();
    
    return result.filter(log => {
        const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
        const matchesTenant = tenantFilter === 'all' || log.tenantId === tenantFilter;
        return matchesLevel && matchesTenant;
    }).slice(0, 50);
  }, [logLevelFilter, tenantFilter]);
  
  const platformStats = useMemo(() => {
    const totalRev = globalSales?.reduce((acc, s) => acc + s.amount, 0) || 0;
    
    return {
        totalRevenue: totalRev,
        totalTenants: tenants?.length || 0,
        totalUsers: users?.length || 0,
        openTickets: globalTickets?.filter(t => t.status !== 'Closed').length || 0,
        activeAlerts: logs?.filter(l => l.level === 'error').length || 0
    };
  }, [tenants, users, globalSales, logs, globalTickets]);

  const commercialInsights = useMemo(() => {
    if (!globalSales || !tenants || !users) return [];
    
    return tenants.map(t => {
        const tenantSales = globalSales.filter(s => s.tenantId === t.id);
        const tenantUsers = users.filter(u => u.tenantId === t.id);
        const gmv = tenantSales.reduce((acc, s) => acc + s.amount, 0);
        const lastSaleDate = tenantSales.length > 0 
            ? tenantSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
            : null;
            
        return {
            name: t.name,
            id: t.id,
            gmv,
            salesCount: tenantSales.length,
            userCount: tenantUsers.length,
            lastActive: lastSaleDate,
            plan: t.plan || 'Free'
        };
    }).sort((a, b) => b.gmv - a.gmv);
  }, [globalSales, tenants, users]);

  const handleUpdateTenantStatus = async (tenantId: string, status: 'active' | 'suspended') => {
    try {
        await db.companies.update(tenantId, { status, updatedAt: new Date().toISOString() });
        logger.warn('System', `Tenant Status Changed: ${status}`, { tenantId });
        toast({ title: `Tenant ${status === 'active' ? 'Activated' : 'Suspended'}` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  const handleUpdateTenantPlan = async (tenantId: string, plan: string) => {
    try {
        await db.companies.update(tenantId, { plan, updatedAt: new Date().toISOString() });
        logger.business('System', `Tenant Plan Overridden: ${plan}`, { tenantId });
        toast({ title: `Plan Updated to ${plan.toUpperCase()}` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Gauge className="h-10 w-10 text-primary" />
                Platform Nerve Center
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Global SaaS Oversight & Transaction Intelligence</p>
        </div>
        <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-9 px-4 font-bold">
                <Server className="h-3 w-3 mr-2" /> Global Cluster Online
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-9 px-4 font-bold">
                <Database className="h-3 w-3 mr-2" /> {tenants?.length || 0} Business Nodes
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Tenancies" value={platformStats.totalTenants} icon={Building2} description="Registered business workspaces" />
        <SummaryCard title="Global Users" value={platformStats.totalUsers} icon={Users} description="Consolidated staff across all nodes" />
        <SummaryCard title="Cumulative GMV" value={formatCurrency(platformStats.totalRevenue)} icon={CreditCard} description="Gross Merchandise Volume" />
        <SummaryCard 
            title="SaaS Support" 
            value={platformStats.openTickets} 
            icon={Inbox} 
            description="Active helpdesk inquiries"
            className={platformStats.openTickets > 0 ? "border-orange-200 bg-orange-50/10" : ""}
        />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-14 p-1 bg-muted/50 border shadow-inner">
          <TabsTrigger value="activity" className="font-black uppercase tracking-widest text-xs">Audit Nerve</TabsTrigger>
          <TabsTrigger value="commercial" className="font-black uppercase tracking-widest text-xs">GMV Insights</TabsTrigger>
          <TabsTrigger value="tenants" className="font-black uppercase tracking-widest text-xs">Workspace Registry</TabsTrigger>
          <TabsTrigger value="support" className="font-black uppercase tracking-widest text-xs">Global Helpdesk</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
            <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/30 border-b space-y-4 p-6">
                    <div className="flex items-center gap-2">
                        <History className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Global Activity Stream</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                            <SelectTrigger className="h-10 w-48 text-xs bg-background font-bold uppercase"><SelectValue placeholder="Severity"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="business">💰 Business Events</SelectItem>
                                <SelectItem value="error">🔴 Critical Errors</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={tenantFilter} onValueChange={setTenantFilter}>
                            <SelectTrigger className="h-10 w-64 text-xs bg-background font-bold uppercase"><SelectValue placeholder="Isolate Tenant"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Business Nodes</SelectItem>
                                {tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y divide-muted/40">
                            {logs?.map(log => (
                                <div key={log.id} className="p-5 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn(
                                                    "font-black text-[9px] uppercase",
                                                    log.level === 'error' ? 'bg-red-50 text-red-700' : log.level === 'business' ? 'bg-green-50 text-green-700' : ''
                                                )}>
                                                    {log.level}
                                                </Badge>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{log.module}</span>
                                            </div>
                                            <p className="text-sm font-bold text-foreground">{log.event}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded">
                                                    <Building2 className="h-3 w-3" /> {tenants?.find(t => t.id === log.tenantId)?.name || 'Platform'}
                                                </div>
                                                <span className="opacity-40">&bull;</span>
                                                {format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}
                                            </div>
                                        </div>
                                        {log.metadata && (
                                            <div className="hidden lg:block">
                                                <Badge variant="secondary" className="text-[8px] font-mono opacity-60">TXN_{log.id.slice(0,6).toUpperCase()}</Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="commercial">
            <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Tenant GMV Leaderboard</CardTitle>
                    <CardDescription className="text-xs uppercase font-bold text-muted-foreground">High-performance business nodes ranking &bull; Click to inspect node</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-muted/30">
                        {commercialInsights.map((tenant, index) => (
                            <button 
                                key={tenant.id} 
                                className="w-full p-8 flex items-center justify-between hover:bg-primary/5 transition-all group border-l-4 border-transparent hover:border-primary text-left"
                                onClick={() => setInspectingTenantId(tenant.id)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-black text-lg shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-lg uppercase tracking-tight">{tenant.name}</p>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase">{tenant.plan}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{tenant.salesCount} Cumulative Transactions</p>
                                            <span className="text-muted-foreground/30">&bull;</span>
                                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">{tenant.userCount} Team Members</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right space-y-1">
                                        <p className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(tenant.gmv)}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Volume</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="tenants">
            <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="p-6"><CardTitle className="text-xl font-black uppercase tracking-tight">Workspace Registry</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6">Business Node</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Staff Capacity</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Subscription</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Operational Status</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] px-6">Privileged Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants?.map(tenant => {
                                const tenantInsight = commercialInsights.find(i => i.id === tenant.id);
                                return (
                                <TableRow key={tenant.id} className="hover:bg-muted/5">
                                    <TableCell className="px-6 py-5">
                                        <div className="font-black uppercase text-sm">{tenant.name}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground opacity-60">NODE_ID: {tenant.id.toUpperCase()}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-bold text-xs">{tenantInsight?.userCount || 0} Accounts</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest h-6 px-3">{tenant.plan || 'Standard'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tenant.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest h-6 px-3">
                                            {tenant.status || 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-none ring-1 ring-black/5">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-3 py-2">Platform Overrides</DropdownMenuLabel>
                                                <DropdownMenuItem className="font-bold text-xs" onClick={() => handleUpdateTenantPlan(tenant.id, 'pro')}>
                                                    <Crown className="h-4 w-4 mr-2 text-primary" /> Upgrade to Enterprise
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="font-bold text-xs" onClick={() => setInspectingTenantId(tenant.id)}>
                                                    <Eye className="h-4 w-4 mr-2 text-primary" /> Inspect Node Metrics
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="font-bold text-xs" onClick={() => {
                                                    setDiagnosticTenant(tenant);
                                                    logger.info('System', 'Diagnostic Scan Initiated', { targetTenantId: tenant.id });
                                                }}>
                                                    <ActivityIcon className="h-4 w-4 mr-2 text-blue-600" /> Run Deep-Dive Diagnostics
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className={cn("font-bold text-xs", tenant.status === 'suspended' ? "text-green-600" : "text-destructive")}
                                                    onClick={() => handleUpdateTenantStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')}
                                                >
                                                    {tenant.status === 'suspended' ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                                    {tenant.status === 'suspended' ? "Re-activate Node" : "Suspend Tenancy"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="support">
            <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-orange-50/30 border-b p-6">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Global Support Oversight</CardTitle>
                    <CardDescription className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Platform-wide helpdesk monitoring</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] py-4 px-6">Source Node</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Subject</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Criticality</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Resolution</TableHead>
                                <TableHead className="font-black uppercase text-[10px] px-6">Ingested At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {globalTickets?.map(ticket => (
                                <TableRow key={ticket.id} className="hover:bg-muted/5">
                                    <TableCell className="px-6 py-5 font-black text-primary uppercase text-xs">
                                        {tenants?.find(t => t.id === ticket.tenantId)?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-sm">{ticket.subject}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{ticket.customerName || 'Direct Support'}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={ticket.priority === 'High' ? 'destructive' : 'outline'} className="font-black text-[9px] uppercase px-3">{ticket.priority}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-black text-[9px] uppercase px-3">{ticket.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] font-bold text-muted-foreground px-6">
                                        {format(parseISO(ticket.createdAt), 'MMM d, yyyy')}
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
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 border-none ring-1 ring-black/5 shadow-2xl overflow-hidden bg-background">
            <DialogHeader className="p-8 bg-primary text-primary-foreground border-b border-white/10 shrink-0">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Eye className="h-8 w-8" />
                            Node Inspector: {inspectionData?.tenant?.name}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-4">
                            <span>SaaS Tenancy ID: {inspectingTenantId?.toUpperCase()}</span>
                            <span>&bull;</span>
                            <span>Subscription: {inspectionData?.tenant?.plan || 'Standard'}</span>
                        </DialogDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 h-8 px-4 font-black uppercase tracking-widest text-[9px]">
                        Live Diagnostic Active
                    </Badge>
                </div>
            </DialogHeader>
            
            <div className="flex-grow overflow-hidden flex flex-col p-0">
                <div className="grid grid-cols-3 gap-0 border-b shrink-0">
                    <div className="p-6 text-center border-r bg-muted/20">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Transactions</p>
                        <p className="text-2xl font-black text-foreground tabular-nums">{inspectionData?.sales.length || 0}</p>
                    </div>
                    <div className="p-6 text-center border-r bg-muted/20">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Active Team Size</p>
                        <p className="text-2xl font-black text-foreground tabular-nums">{inspectionData?.users.length || 0}</p>
                    </div>
                    <div className="p-6 text-center bg-muted/20">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Cumulative GMV</p>
                        <p className="text-2xl font-black text-primary tabular-nums">
                            {formatCurrency(inspectionData?.sales.reduce((acc, s) => acc + s.amount, 0) || 0)}
                        </p>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col p-8 space-y-6">
                    <div className="flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Live Node Transaction Feed
                        </h3>
                        <Badge variant="secondary" className="text-[8px] font-black uppercase">Staff Attribution Enabled</Badge>
                    </div>

                    <div className="flex-grow overflow-hidden rounded-xl border bg-card shadow-sm flex flex-col">
                        <ScrollArea className="flex-grow">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black uppercase text-[9px] w-[150px]">Timestamp</TableHead>
                                        <TableHead className="font-black uppercase text-[9px]">Staff Identity (Primary ID)</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] text-right">Volume</TableHead>
                                        <TableHead className="font-black uppercase text-[9px]">Method</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inspectionData?.sales.map((sale) => (
                                        <TableRow key={sale.id} className="hover:bg-muted/10 transition-colors group">
                                            <TableCell className="text-[10px] font-mono opacity-60">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 opacity-40" />
                                                    {format(parseISO(sale.date), 'MMM d, HH:mm:ss')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 py-1">
                                                    <p className="text-xs font-black uppercase tracking-tight">{sale.staff.name}</p>
                                                    <div className="flex flex-col gap-0.5 opacity-70">
                                                        <p className="text-[10px] font-mono flex items-center gap-1">
                                                            <Mail className="h-2.5 w-2.5" /> {sale.staff.email}
                                                        </p>
                                                        <p className="text-[10px] font-mono flex items-center gap-1">
                                                            <Phone className="h-2.5 w-2.5" /> {sale.staff.phone}
                                                        </p>
                                                    </div>
                                                    <p className="text-[8px] font-mono text-muted-foreground tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
                                                        UID: {sale.createdBy?.uid}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-black text-xs tabular-nums text-primary">{formatCurrency(sale.amount)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-muted/20">
                                                    {sale.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="default" className="text-[8px] font-black uppercase bg-green-500 hover:bg-green-600">
                                                    {sale.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {inspectionData?.sales.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-black uppercase tracking-widest text-xs opacity-20">
                                                No transactions logged in this node.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            <CardFooter className="bg-muted/30 p-6 border-t flex justify-between shrink-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase italic max-w-sm">
                    "This oversight module provides cryptographically attributed transaction data. All staff actions are logged for platform-level accountability."
                </p>
                <Button onClick={() => setInspectingTenantId(null)} className="font-black uppercase tracking-widest text-xs px-8 h-10 shadow-lg">
                    Terminate Inspection
                </Button>
            </CardFooter>
        </DialogContent>
      </Dialog>

      {/* Deep-Dive Diagnostic Dialog (Technical Audit) */}
      <Dialog open={!!diagnosticTenant} onOpenChange={(open) => !open && setDiagnosticTenant(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 border-none ring-1 ring-black/5 shadow-2xl">
            <DialogHeader className="p-8 bg-muted/30 border-b">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <ActivityIcon className="h-6 w-6 text-primary" />
                    Deep-Dive Diagnostic Scan
                </DialogTitle>
                <DialogDescription className="font-bold uppercase text-[10px] tracking-widest pt-1">
                    Inspecting node: <span className="text-primary">{diagnosticTenant?.name}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-2xl border space-y-1">
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Operational Status</p>
                        <Badge className="font-black uppercase text-[10px]">{diagnosticTenant?.status || 'Active'}</Badge>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border space-y-1">
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Active Plan</p>
                        <p className="font-black uppercase text-lg tracking-tight text-primary">{diagnosticTenant?.plan || 'Standard'}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border space-y-1">
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Active Staff Count</p>
                        <p className="font-black uppercase text-lg tracking-tight text-foreground">
                            {commercialInsights.find(i => i.id === diagnosticTenant?.id)?.userCount || 0} Members
                        </p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Node-Specific Audit Trace
                    </h4>
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <ScrollArea className="h-[300px]">
                            <div className="divide-y divide-muted/30">
                                {logs?.filter(l => l.tenantId === diagnosticTenant?.id).map(l => (
                                    <div key={l.id} className="p-4 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase">{l.level}</Badge>
                                            <span className="text-[9px] font-mono opacity-50">{format(parseISO(l.timestamp), 'HH:mm:ss')}</span>
                                        </div>
                                        <p className="text-xs font-bold">{l.event}</p>
                                    </div>
                                ))}
                                {logs?.filter(l => l.tenantId === diagnosticTenant?.id).length === 0 && (
                                    <div className="p-10 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">No recent trace logs for this node.</div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                 </div>
            </div>
            <CardFooter className="bg-muted/30 p-6 border-t flex justify-end">
                <Button onClick={() => setDiagnosticTenant(null)} className="font-bold">Close Diagnostic Scan</Button>
            </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
