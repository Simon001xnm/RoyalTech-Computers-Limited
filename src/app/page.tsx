'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
  Laptop, 
  Component, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  // Data Fetching from Dexie
  const laptops = useLiveQuery(() => db.laptops.toArray());
  const accessories = useLiveQuery(() => db.accessories.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const leases = useLiveQuery(() => db.leases.toArray());
  const sales = useLiveQuery(() => db.sales.orderBy('date').reverse().limit(33).toArray());
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().limit(33).toArray());

  // Computations
  const stats = useMemo(() => ({
    availableLaptops: laptops?.filter(l => l.status === 'Available').length || 0,
    accessoryItems: accessories?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0,
    totalClients: customers?.length || 0,
    activeLeases: leases?.filter(l => l.status === 'Active').length || 0
  }), [laptops, accessories, customers, leases]);

  const expiringLeases = useMemo(() => {
    if (!leases) return [];
    const today = new Date();
    return leases
      .filter(l => l.status === 'Active')
      .map(l => ({
        ...l,
        daysLeft: differenceInDays(parseISO(l.endDate), today)
      }))
      .filter(l => l.daysLeft >= 0 && l.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [leases]);

  const latestTransactions = useMemo(() => {
    const combined = [
      ...(sales || []).map(s => ({ id: s.id, date: s.date, amount: s.amount, type: 'Sale' as const, label: s.customerName || 'Standard Sale' })),
      ...(expenses || []).map(e => ({ id: e.id, date: e.date, amount: e.amount, type: 'Expense' as const, label: e.category || 'Expense' }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 33);
  }, [sales, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading metrics..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        description={`Welcome back, ${user?.displayName || 'User'}! Here's what's happening at ROYALTECH COMPUTERS LIMITED today.`} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Laptops in Stock" 
          value={stats.availableLaptops} 
          icon={Laptop} 
          description="Laptops available for lease/sale"
        />
        <SummaryCard 
          title="Accessories" 
          value={stats.accessoryItems} 
          icon={Component} 
          description="Total units across all items"
        />
        <SummaryCard 
          title="Total Clients" 
          value={stats.totalClients} 
          icon={Users} 
          description="Registered system customers"
        />
        <SummaryCard 
          title="Active Leases" 
          value={stats.activeLeases} 
          icon={Clock} 
          description="Ongoing laptop lease agreements"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Leases Expiring Soon */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle>Leases Expiring Soon</CardTitle>
            </div>
            <CardDescription>Active leases ending within the next 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringLeases.length > 0 ? (
              <div className="space-y-4">
                {expiringLeases.map(lease => (
                  <div key={lease.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{lease.customerName}</p>
                      <p className="text-sm text-muted-foreground">{lease.laptopModel}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={lease.daysLeft <= 7 ? "destructive" : "outline"}>
                        {lease.daysLeft} days left
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{format(parseISO(lease.endDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No leases expiring soon.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Latest Transactions</CardTitle>
            <CardDescription>Recent 33 sales and expenses from the local records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestTransactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {t.type === 'Sale' ? 
                            <ArrowUpRight className="h-3 w-3 text-green-500" /> : 
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                          }
                          <span className="text-xs font-semibold uppercase">{t.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[150px]">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(t.date), 'MMM d, HH:mm')}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={t.type === 'Sale' ? 'text-green-600' : 'text-red-600'}>
                          {t.type === 'Sale' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {latestTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No recent transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
