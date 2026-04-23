
'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server, History, MoreHorizontal, ShieldAlert, Lock, Unlock, Zap, Crown } from 'lucide-react';
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

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const globalSales = useLiveQuery(() => db.sales.toArray());
  const logs = useLiveQuery(() => db.platformLogs.orderBy('timestamp').reverse().limit(30).toArray());
  
  const platformStats = useMemo(() => {
    const totalRev = globalSales?.reduce((acc, s) => acc + s.amount, 0) || 0;
    const errorsCount = logs?.filter(l => l.level === 'error').length || 0;
    
    return {
        totalRevenue: totalRev,
        totalTenants: tenants?.length || 0,
        totalUsers: users?.length || 0,
        recentErrors: errorsCount
    };
  }, [tenants, users, globalSales, logs]);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Platform Command" 
        description="Global SaaS oversight and workspace lifecycle management."
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
            value={platformStats.recentErrors} 
            icon={Activity} 
            description="Events recorded in last cycle"
            className={platformStats.recentErrors > 0 ? "border-red-200 bg-red-50/10" : ""}
        />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-muted/30">
          <TabsTrigger value="activity" className="font-bold">Global Activity Stream</TabsTrigger>
          <TabsTrigger value="tenants" className="font-bold">Workspace Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-muted/40 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Real-time Audit Trail</CardTitle>
                            </div>
                            <Badge variant="secondary">Security Level 1</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <div className="divide-y divide-muted/40">
                                {logs && logs.map(log => (
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
                                                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Tenant: {log.tenantId?.slice(0, 8) || 'System'}</span>
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
                                ))}
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
                                System operating on **v2.0 SaaS Engine**. Migration to v3.0 (Standalone Backend) is currently in design phase.
                            </p>
                        </div>
                    </CardContent>
                </Card>
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
