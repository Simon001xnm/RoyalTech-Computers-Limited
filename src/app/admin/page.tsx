
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server, 
    History, MoreHorizontal, ShieldAlert, Lock, Unlock, Zap, Crown, BarChart3, 
    TrendingUp, Trophy, Filter, Search, X, Loader2, Download, ActivitySquare, 
    ChevronRight, AlertCircle, Info, CheckCircle2, MessageSquare, Inbox
} from 'lucide-react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
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

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  
  // State for Log Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Diagnostic State
  const [diagnosticTenantId, setDiagnosticTenantId] = useState<string | null>(null);

  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const globalSales = useLiveQuery(() => db.sales.toArray());
  const globalTickets = useLiveQuery(() => db.tickets.toArray());
  
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
    if (!globalSales || !tenants) return [];
    
    return tenants.map(t => {
        const tenantSales = globalSales.filter(s => s.tenantId === t.id);
        const gmv = tenantSales.reduce((acc, s) => acc + s.amount, 0);
        const lastSaleDate = tenantSales.length > 0 
            ? tenantSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
            : null;
            
        return {
            name: t.name,
            id: t.id,
            gmv,
            salesCount: tenantSales.length,
            lastActive: lastSaleDate
        };
    }).sort((a, b) => b.gmv - a.gmv);
  }, [globalSales, tenants]);

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

  const handleOpenDiagnostics = (tenantId: string) => {
      setDiagnosticTenantId(tenantId);
      logger.info('System', 'Diagnostic Session Started', { targetTenantId: tenantId });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Platform Command" 
        description="Global SaaS oversight and workspace commercial intelligence."
        actions={
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Server className="h-3 w-3 mr-1" /> All Systems Nominal
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Database className="h-3 w-3 mr-1" /> {tenants?.length || 0} Nodes Synced
                </Badge>
            </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Tenants" value={platformStats.totalTenants} icon={Building2} description="Active business workspaces" />
        <SummaryCard title="Platform Users" value={platformStats.totalUsers} icon={Users} description="Registered across all nodes" />
        <SummaryCard title="Gross Volume (GMV)" value={formatCurrency(platformStats.totalRevenue)} icon={CreditCard} description="Cumulative sales volume" />
        <SummaryCard 
            title="Open Tickets" 
            value={platformStats.openTickets} 
            icon={Inbox} 
            description="Active support issues"
            className={platformStats.openTickets > 0 ? "border-orange-200 bg-orange-50/10" : ""}
        />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12 p-1 bg-muted/30">
          <TabsTrigger value="activity" className="font-bold">Audit Trail</TabsTrigger>
          <TabsTrigger value="commercial" className="font-bold">Commercial</TabsTrigger>
          <TabsTrigger value="tenants" className="font-bold">Workspaces</TabsTrigger>
          <TabsTrigger value="support" className="font-bold">Global Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-muted/40 overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/30 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Real-time Platform Audit</CardTitle>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                                <SelectTrigger className="h-9 w-40 text-xs bg-background"><SelectValue placeholder="Level"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="error">Errors</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={tenantFilter} onValueChange={setTenantFilter}>
                                <SelectTrigger className="h-9 w-56 text-xs bg-background"><SelectValue placeholder="Tenant"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Workspaces</SelectItem>
                                    {tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[500px]">
                            <div className="divide-y divide-muted/40">
                                {logs?.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={log.level === 'error' ? 'bg-red-50 text-red-700' : log.level === 'business' ? 'bg-green-50 text-green-700' : ''}>{log.level.toUpperCase()}</Badge>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">{log.module}</span>
                                                </div>
                                                <p className="text-sm font-semibold">{log.event}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <Building2 className="h-3 w-3" /> {tenants?.find(t => t.id === log.tenantId)?.name || 'System'}
                                                    <span className="opacity-40">&bull;</span>
                                                    {format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-muted/40 bg-muted/10">
                    <CardHeader><CardTitle className="text-sm">Infrastructure Health</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <span className="text-xs font-bold uppercase opacity-60">Database Integrity</span>
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">SYNCED</Badge>
                         </div>
                         <div className="p-4 bg-primary text-primary-foreground rounded-xl space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Platform Note</p>
                            <p className="text-xs font-medium">Monitoring {tenants?.length} active business nodes across Layer 2.</p>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="support">
            <Card className="shadow-md border-muted/40 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>Global Helpdesk Oversight</CardTitle>
                    <CardDescription>Consolidated support tickets from every business workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">Tenant</TableHead>
                                <TableHead className="font-bold">Subject</TableHead>
                                <TableHead className="font-bold">Priority</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold">Reported</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {globalTickets?.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-bold text-primary">
                                        {tenants?.find(t => t.id === ticket.tenantId)?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{ticket.subject}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{ticket.customerName || 'Direct Support'}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={ticket.priority === 'High' ? 'destructive' : 'outline'}>{ticket.priority}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{ticket.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(parseISO(ticket.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!globalTickets || globalTickets.length === 0) && (
                                <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground">No active support tickets across the platform.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="commercial">
            <Card className="shadow-md border-muted/40 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b"><CardTitle>Tenant GMV Leaderboard</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {commercialInsights.map((tenant, index) => (
                            <div key={tenant.id} className="p-6 flex items-center justify-between hover:bg-muted/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-black text-xs">#{index + 1}</div>
                                    <div><p className="font-bold">{tenant.name}</p><p className="text-[10px] text-muted-foreground uppercase">{tenant.salesCount} Transactions</p></div>
                                </div>
                                <div className="text-right"><p className="text-lg font-black text-primary">{formatCurrency(tenant.gmv)}</p></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="tenants">
            <Card className="shadow-md border-muted/40 overflow-hidden">
                <CardHeader><CardTitle>Workspace Directory</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold">Business Name</TableHead>
                                <TableHead className="font-bold">Plan</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants?.map(tenant => (
                                <TableRow key={tenant.id}>
                                    <TableCell><div className="font-bold">{tenant.name}</div><div className="text-[10px] font-mono opacity-40">{tenant.id.slice(0,8)}</div></TableCell>
                                    <TableCell><Badge variant="outline" className="uppercase text-[10px]">{tenant.plan || 'Free'}</Badge></TableCell>
                                    <TableCell><Badge variant={tenant.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">{tenant.status || 'active'}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuItem onClick={() => handleUpdateTenantPlan(tenant.id, 'pro')}>Upgrade to PRO</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateTenantStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')} className={tenant.status === 'suspended' ? "text-green-600" : "text-destructive"}>
                                                    {tenant.status === 'suspended' ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                                    {tenant.status === 'suspended' ? "Re-activate" : "Suspend"}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
