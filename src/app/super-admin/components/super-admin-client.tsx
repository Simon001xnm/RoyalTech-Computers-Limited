'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { 
    Globe, 
    Building2, 
    Users, 
    Activity, 
    ShieldCheck, 
    Lock, 
    Loader2, 
    BarChart3,
    Search,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyManagement } from './company-management';
import { UserManagement } from './user-management';
import { Badge } from '@/components/ui/badge';
import type { User as AppUser } from '@/types';

export function SuperAdminClient() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<AppUser>(userProfileRef);

  const companiesQuery = useMemoFirebase(() => collection(firestore, 'companies'), [firestore]);
  const allUsersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const salesQuery = useMemoFirebase(() => collection(firestore, 'sales_transactions'), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allSales, isLoading: salesLoading } = useCollection(salesQuery);

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allSales) return null;
    const totalGmv = allSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    return {
        totalCompanies: companies.length,
        totalUsers: allUsers.length,
        totalGmv,
        activeNodes: companies.filter(c => c.status === 'active').length
    };
  }, [companies, allUsers, allSales]);

  if (profileLoading || compsLoading || usersLoading || salesLoading) {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Platform Intelligence...</p>
        </div>
      );
  }

  if (profile?.role !== 'super_admin') {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full">
                <Lock className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-tight">Platform Restricted</h1>
                <p className="text-muted-foreground leading-relaxed">
                    This area is reserved for the primary system controller. Your node credentials do not allow access to the global control layer.
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Platform Control Node" 
        description="Global system oversight, multi-tenant management, and platform analytics."
        actions={
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-8 px-4 font-black uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> System Live
            </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Total Companies" value={stats?.totalCompanies || 0} icon={Building2} description="Registered business nodes" />
          <SummaryCard title="Global Accounts" value={stats?.totalUsers || 0} icon={Users} description="Platform-wide registered users" />
          <SummaryCard title="Platform GMV" value={new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(stats?.totalGmv || 0)} icon={Activity} description="Cumulative sales across all nodes" />
          <SummaryCard title="Operational Health" value="99.9%" icon={ShieldCheck} description="Core cloud infrastructure status" className="border-l-4 border-l-green-500" />
      </div>

      <Tabs defaultValue="companies" className="w-full">
          <TabsList className="bg-muted/50 p-1 border mb-8 h-12">
              <TabsTrigger value="companies" className="px-8 font-black uppercase text-[10px] tracking-widest h-full">Company Directory</TabsTrigger>
              <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full">Global User Pool</TabsTrigger>
              <TabsTrigger value="security" className="px-8 font-black uppercase text-[10px] tracking-widest h-full">System Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="animate-in fade-in duration-500">
              <CompanyManagement companies={companies || []} />
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in duration-500">
              <UserManagement users={allUsers || []} companies={companies || []} />
          </TabsContent>

          <TabsContent value="security" className="animate-in fade-in duration-500">
              <Card className="border-none ring-1 ring-black/5 shadow-xl">
                  <CardHeader className="bg-muted/10 border-b">
                      <CardTitle className="text-lg font-black uppercase tracking-tight">System Integrity Rules</CardTitle>
                      <CardDescription>Global configuration for platform security and data isolation.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 text-center opacity-30">
                      <Lock className="h-16 w-16 mx-auto mb-4" />
                      <p className="font-black uppercase tracking-widest text-[10px]">Access to system rules is currently encrypted.</p>
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
