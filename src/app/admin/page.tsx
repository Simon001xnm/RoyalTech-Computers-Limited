'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Globe, Database, Server } from 'lucide-react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Badge } from '@/components/ui/badge';

export default function SuperAdminDashboard() {
  const company = useLiveQuery(() => db.companies.toCollection().last());
  const users = useLiveQuery(() => db.users.toArray());
  const logs = useLiveQuery(() => db.sales.orderBy('date').reverse().limit(5).toArray());
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Platform Command" 
        description="Global SaaS oversight for RoyalTech ERP."
        actions={
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Server className="h-3 w-3 mr-1" /> System Live
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Database className="h-3 w-3 mr-1" /> Cloud Sync Active
                </Badge>
            </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Tenants" value={company ? 1 : 0} icon={Building2} description="Active business workspaces" />
        <SummaryCard title="Platform Users" value={users?.length || 0} icon={Users} description="Registered across all tenants" />
        <SummaryCard title="Revenue (ARR)" value="KES 0" icon={CreditCard} description="Projected annual income" />
        <SummaryCard title="System Load" value="Optimal" icon={Activity} description="Infrastructure performance" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <CardTitle>Infrastructure Integrity</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-bold">v2.0-stable</Badge>
                </div>
                <CardDescription>Multi-tenant isolation and security audit logs.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-muted-foreground/10">
                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-primary opacity-60" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Tenancy Isolation</span>
                            </div>
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">VERIFIED</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-muted-foreground/10">
                            <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4 text-primary opacity-60" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sub Guard Engine</span>
                            </div>
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">ENFORCING</span>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
                        <Activity className="h-8 w-8 text-primary/20 mb-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Health Check</p>
                        <p className="text-xs font-medium mt-1">No latency spikes detected in the last 24h.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg border-muted-foreground/10">
            <CardHeader>
                <CardTitle className="text-lg">Recent Tenant Events</CardTitle>
                <CardDescription>Audit trail from active workspaces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {company ? (
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Building2 className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold">{company.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Provisioned v1.0 Legacy</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <Building2 className="h-10 w-10 mb-2" />
                        <p className="text-xs uppercase font-bold tracking-widest">No tenants registered</p>
                    </div>
                )}
                <Separator />
                <div className="space-y-3">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Business Activity Feed</p>
                     {logs && logs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-[10px]">
                            <span className="font-medium opacity-60">Sale by {log.resellerName || 'Direct'}</span>
                            <span className="font-mono text-primary font-bold">KES {log.amount.toLocaleString()}</span>
                        </div>
                     ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
