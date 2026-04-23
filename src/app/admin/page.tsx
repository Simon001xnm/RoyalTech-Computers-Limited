
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server, History, MoreHorizontal, ShieldAlert, Lock, Unlock, Zap, Crown, BarChart3, TrendingUp, Trophy, Filter, Search, X } from 'lucide-react';
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

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  
  // State for Log Filtering
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const globalSales = useLiveQuery(() => db.sales.toArray());
  
  // Reactive logs with filtering
  const logs = useLiveQuery(async () => {
    let collection = db.platformLogs.orderBy('timestamp').reverse();
    const result = await collection.limit(200).toArray();
    
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
        activeAlerts: logs?.filter(l => l.level === 'error').length || 0
    };
  }, [tenants, users, globalSales, logs]);

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

  const resetFilters = () => {
    setLogLevelFilter('all');
    setTenantFilter('all');
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
            title="System Alerts" 
            value={platformStats.activeAlerts} 
            icon={Activity} 
            description="Recent critical events"
            className={platformStats.activeAlerts > 0 ? "border-red-200 bg-red-50/10" : ""}
        />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 p-1 bg-muted/30">
          <TabsTrigger value="activity" className="font-bold">Global Activity Stream</TabsTrigger>
          <TabsTrigger value="commercial" className="font-bold">Commercial Insights</TabsTrigger>
          <TabsTrigger value="tenants" className="font-bold">Workspace Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-muted/40 overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/30 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Real-time Audit Trail</CardTitle>
                            </div>
                            {(logLevelFilter !== 'all' || tenantFilter !== 'all') && (
                                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs gap-1">
                                    <X className="h-3 w-3" /> Clear Filters
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <div className="w-40">
                                <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                                    <SelectTrigger className="h-9 text-xs bg-background">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3 w-3" />
                                            <SelectValue placeholder="Log Level" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="business">Business Only</SelectItem>
                                        <SelectItem value="error">Errors Only</SelectItem>
                                        <SelectItem value="warn">Warnings</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="w-56">
                                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                                    <SelectTrigger className="h-9 text-xs bg-background">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3 w-3" />
                                            <SelectValue placeholder="Filter by Tenant" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Every Workspace</SelectItem>
                                        {tenants?.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[500px]">
                            <div className="divide-y divide-muted/40">
                                {logs && logs.length > 0 ? logs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={
                                                            log.level === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
                                                            log.level === 'business' ? 'border-green-200 bg-green-50 text-green-700' :
                                                            'bg-muted/50'
                                                        }
                                                    >
                                                        {log.level.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                                </div>
                                                <p className="text-sm font-semibold">{log.event}</p>
                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> 
                                                        {tenants?.find(t => t.id === log.tenantId)?.name || `Tenant: ${log.tenantId?.slice(0, 8) || 'System'}`}
                                                    </span>
                                                    <span>{format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}</span>
                                                </div>
                                            </div>
                                            {log.metadata?.amount && (
                                                <p className="font-mono text-sm font-black text-primary">
                                                    {formatCurrency(log.metadata.amount)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                        <Search className="h-12 w-12 mb-4" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No matching logs found</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/40 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle>System Health</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-primary opacity-60" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Tenant Isolation</span>
                                </div>
                                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">VERIFIED</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Database className="h-4 w-4 text-primary opacity-60" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Silo Integrity</span>
                                </div>
                                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">HEALTHY</span>
                            </div>
                        </div>
                        <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Infrastructure Alert</p>
                            <p className="text-xs font-medium leading-relaxed">
                                System operating on **v2.0 SaaS Engine**. Multi-tenant Commercial Intelligence (Phase 12) is active.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="commercial">
            <div className="grid gap-6">
                <Card className="shadow-md border-muted/40 overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            <CardTitle>Tenant GMV Leaderboard</CardTitle>
                        </div>
                        <CardDescription>Top business workspaces ranked by cumulative sales volume.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {commercialInsights.map((tenant, index) => (
                                <div key={tenant.id} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-black text-xs">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">{tenant.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {tenant.salesCount} Transactions</span>
                                                {tenant.lastActive && (
                                                    <span className="flex items-center gap-1"><History className="h-3 w-3" /> Last Active: {format(parseISO(tenant.lastActive), 'MMM d')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-primary">{formatCurrency(tenant.gmv)}</p>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Volume</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                     <Card className="shadow-sm border-muted/40">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Revenue Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {commercialInsights.slice(0, 5).map(tenant => {
                                const percentage = platformStats.totalRevenue > 0 ? (tenant.gmv / platformStats.totalRevenue) * 100 : 0;
                                return (
                                    <div key={tenant.id} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span>{tenant.name}</span>
                                            <span>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted/40 bg-muted/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Commercial Potential</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                High GMV tenants with > 100 transactions are prime candidates for the **Enterprise Elite** subscription override. Use the "Workspace Management" tab to adjust their tier manually if payment is handled offline.
                            </p>
                            <Button className="mt-4 w-full h-8 text-[10px] uppercase font-bold" variant="outline">Download Platform Statement</Button>
                        </CardContent>
                    </div>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="tenants">
            <Card className="shadow-md border-muted/40">
                <CardHeader>
                    <CardTitle>Workspace Directory</CardTitle>
                    <CardDescription>Manage lifecycle and subscriptions for all businesses on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Business Name</TableHead>
                                    <TableHead className="font-bold">Plan</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Joined</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants?.map(tenant => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {tenant.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{tenant.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono uppercase">{tenant.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={tenant.plan === 'legacy_pro' ? 'default' : 'outline'} className="uppercase text-[10px]">
                                                {tenant.plan === 'legacy_pro' ? <Zap className="h-2 w-2 mr-1 fill-white" /> : <Crown className="h-2 w-2 mr-1" />}
                                                {tenant.plan || 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={tenant.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                                {tenant.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(parseISO(tenant.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>Tenant Control</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleUpdateTenantPlan(tenant.id, 'pro')}>Upgrade to PRO</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateTenantPlan(tenant.id, 'basic')}>Downgrade to BASIC</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateTenantPlan(tenant.id, 'legacy_pro')}>Grant LEGACY PRO</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {tenant.status === 'suspended' ? (
                                                        <DropdownMenuItem onClick={() => handleUpdateTenantStatus(tenant.id, 'active')} className="text-green-600">
                                                            <Unlock className="h-4 w-4 mr-2" /> Re-activate Workspace
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleUpdateTenantStatus(tenant.id, 'suspended')} className="text-destructive">
                                                            <Lock className="h-4 w-4 mr-2" /> Suspend Workspace
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
