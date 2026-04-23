
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Building2, Users, CreditCard, Activity, ShieldCheck } from 'lucide-react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function SuperAdminDashboard() {
  const tenants = useLiveQuery(() => db.companies.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Platform Command" 
        description="Global SaaS oversight for RoyalTech ERP."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Tenants" value={tenants?.length || 0} icon={Building2} description="Active business workspaces" />
        <SummaryCard title="Platform Users" value={users?.length || 0} icon={Users} description="Registered across all tenants" />
        <SummaryCard title="Revenue (MRR)" value="KES 0" icon={CreditCard} description="Subscription income" />
        <SummaryCard title="System Load" value="Optimal" icon={Activity} description="Local-first sync status" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-destructive/20 shadow-xl">
            <CardHeader className="bg-destructive/5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-destructive" />
                    <CardTitle>System Health</CardTitle>
                </div>
                <CardDescription>Infrastructure status and multi-tenant isolation logs.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-bold uppercase opacity-60">Tenancy Isolation</span>
                        <span className="text-xs font-black text-green-600">VERIFIED</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-bold uppercase opacity-60">Subscription Guard</span>
                        <span className="text-xs font-black text-orange-600">IN DEVELOPMENT</span>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-bold uppercase opacity-60">Audit Trail (v2.0)</span>
                        <span className="text-xs font-black text-blue-600">LOGGING ACTIVE</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Tenant Activity</CardTitle>
                <CardDescription>Recent registrations and plan changes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <Building2 className="h-10 w-10 mb-2" />
                <p className="text-xs uppercase font-bold tracking-widest">No recent tenant events</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
