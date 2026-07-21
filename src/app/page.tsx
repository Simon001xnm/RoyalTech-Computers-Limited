'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  Zap,
  CalendarClock,
  Users,
  Loader2,
  Sparkles,
  ArrowRight,
  Activity,
  TrendingUp,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSaaS } from '@/components/saas/saas-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LandingPage } from '@/components/marketing/landing-page';
import { PosClient } from './pos/components/pos-client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';

export default function DashboardPage() {
  const { tenant, isLoading: isSaaSLoading } = useSaaS();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id), limit(100));
  }, [firestore, tenant?.id]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const leasesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'leases'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: rawLeases, isLoading: leasesLoading } = useCollection(leasesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: customers } = useCollection(customersQuery);

  const activeLeases = useMemo(() => (rawLeases || []).filter(l => l.status === 'Active'), [rawLeases]);
  
  const earnings = useMemo(() => {
    if (!sales) return { day: 0, week: 0, month: 0 };
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    sales.forEach(sale => {
      try {
        const saleDate = parseISO(sale.date);
        const amount = sale.amount || 0;

        if (isSameDay(saleDate, today)) dayTotal += amount;
        if (isWithinInterval(saleDate, { start: weekStart, end: weekEnd })) weekTotal += amount;
        if (isWithinInterval(saleDate, { start: monthStart, end: monthEnd })) monthTotal += amount;
      } catch (e) {}
    });

    return { day: dayTotal, week: weekTotal, month: monthTotal };
  }, [sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isUserLoading) {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin opacity-20 text-primary" />
        </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const showMetricsLoading = isSaaSLoading || salesLoading || leasesLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
            title="Business Command Center" 
            description={tenant ? `Workspace: ${tenant.name}` : "Syncing node..."} 
        />
        <div className="flex gap-2 mb-6 sm:mb-0">
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 h-9 px-4 font-bold flex items-center">
                <Zap className="h-3 w-3 mr-2 fill-secondary" /> Secure Connection
            </Badge>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        {showMetricsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
        ) : (
            <>
                <SummaryCard 
                  title="Daily Revenue" 
                  value={formatCurrency(earnings.day)} 
                  icon={Activity} 
                  description="Earnings captured today"
                  className="border-l-4 border-l-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100/20"
                />
                <SummaryCard 
                  title="Weekly Volume" 
                  value={formatCurrency(earnings.week)} 
                  icon={TrendingUp} 
                  description="Current week performance"
                  className="border-l-4 border-l-purple-500 bg-purple-50/50 shadow-lg shadow-purple-100/20"
                />
                <SummaryCard 
                  title="Monthly Statement" 
                  value={formatCurrency(earnings.month)} 
                  icon={BarChart3} 
                  description="Total volume this month"
                  className="border-l-4 border-l-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100/20"
                />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-2xl overflow-hidden ring-1 ring-black/5 bg-white">
                  <CardHeader className="bg-primary/5 border-b p-6">
                      <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                              <div className="bg-primary p-2 rounded-xl shadow-lg">
                                <ShoppingCart className="h-6 w-6 text-white" />
                              </div>
                              Live Terminal (Quick POS)
                          </CardTitle>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px] px-3">ACTIVE NODE</Badge>
                      </div>
                      <CardDescription className="mt-2">Instant transaction processing with automated inventory updates.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                      <div className="p-2 md:p-6">
                        <PosClient />
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="space-y-8">
              <Card className="border-none bg-primary text-primary-foreground shadow-xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Sparkles className="h-20 w-20" />
                  </div>
                  <CardContent className="p-6 space-y-4 relative z-10">
                      <Badge variant="secondary" className="bg-white/20 text-white border-none font-black uppercase tracking-widest text-[8px] h-5">AI Intelligence</Badge>
                      <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Ask Saymoh</h3>
                      <p className="text-primary-foreground/70 text-xs font-medium">
                          Audit stock or summarize revenue via voice or text.
                      </p>
                      <Button asChild variant="outline" className="w-full bg-white text-primary border-none font-black uppercase text-[10px] h-9 group">
                          <Link href="/ai">
                              Open AI Hub
                              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Link>
                      </Button>
                  </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-500 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/20 space-y-4 relative overflow-hidden group">
                    <CalendarClock className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Active Hire Agreements</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black tracking-tighter">{activeLeases.length}</span>
                        <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white h-7 text-[9px] font-black uppercase px-4 rounded-full">
                            <Link href="/leases">Manage Hires</Link>
                        </Button>
                    </div>
                </div>
                
                <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl shadow-emerald-600/20 space-y-4 relative overflow-hidden group">
                    <Users className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Global Client Directory</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black tracking-tighter">{customers?.length || 0}</span>
                        <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white h-7 text-[9px] font-black uppercase px-4 rounded-full">
                            <Link href="/customers">Open CRM</Link>
                        </Button>
                    </div>
                </div>
              </div>
          </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-black text-white rounded-[32px] border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="h-32 w-32" />
          </div>
          <div className="flex items-center gap-6 relative z-10">
              <div className="bg-primary p-4 rounded-2xl shadow-lg ring-4 ring-primary/20">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest">Workspace Operational</p>
                  <p className="text-[11px] text-gray-400 font-medium">Verified Session: <span className="text-white font-bold">{user?.email}</span></p>
              </div>
          </div>
          <div className="text-[10px] text-gray-500 font-bold tracking-[0.3em] text-center uppercase relative z-10">
              &copy; 2026 shopmanager suite &bull; secured cloud node &bull; encrypted
          </div>
      </div>
    </div>
  );
}
