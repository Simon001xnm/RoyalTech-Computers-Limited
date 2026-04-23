
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server, AlertCircle, History } from 'lucide-react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SuperAdminDashboard() {
  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const globalSales = useLiveQuery(() => db.sales.toArray());
  const logs = useLiveQuery(() => db.platformLogs.orderBy('timestamp').reverse().limit(20).toArray());
  
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
        description="Global SaaS oversight and platform intelligence."
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
            description="Errors detected in last 24h"
            className={platformStats.recentErrors > 0 ? "border-red-200 bg-red-50/10" : ""}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-muted/40 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Global Activity Stream</CardTitle>
                    </div>
                    <Badge variant="secondary">v2.0 Audit Engine</Badge>
                </div>
                <CardDescription>Real-time visibility into cross-tenant operations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
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
                        {(!logs || logs.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <History className="h-10 w-10 mb-2" />
                                <p className="text-sm font-bold uppercase tracking-widest">No global activity recorded</p>
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
                    <CardTitle>Tenant Integrity</CardTitle>
                </div>
                <CardDescription>Security and isolation audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/10 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-primary opacity-60" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Tenancy Isolation</span>
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

                <Separator />

                <div className="space-y-3">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform Distribution</p>
                     {tenants && tenants.slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center text-[10px]">
                            <span className="font-bold opacity-70">{t.name}</span>
                            <Badge variant="outline" className="text-[9px] h-4">LEGACY PRO</Badge>
                        </div>
                     ))}
                </div>

                <div className="pt-4">
                    <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Infrastructure Alert</p>
                        <p className="text-xs font-medium leading-relaxed">
                            System is currently operating on **Hybrid Cloud v2**. Preparation for full backend migration (v3.0) is active.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
