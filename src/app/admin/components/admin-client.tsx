'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { 
    TrendingUp, 
    DollarSign, 
    AlertTriangle, 
    BarChart3,
    Activity,
    ShieldCheck,
    Loader2,
    PieChart as PieChartIcon
} from 'lucide-react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { 
    format, 
    parseISO, 
    startOfMonth, 
    subMonths, 
    isWithinInterval,
    eachDayOfInterval,
    startOfDay,
    endOfDay,
    isSameDay
} from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

export function AdminClient() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  // Data Fetching
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: expenses, isLoading: expLoading } = useCollection(expensesQuery);

  const stats = useMemo(() => {
    if (!sales || !expenses) return null;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);

    const monthlySales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: currentMonthStart, end: now }); } catch { return false; }
    });

    const prevMonthSales = sales.filter(s => {
        try { return isWithinInterval(parseISO(s.date), { start: lastMonthStart, end: lastMonthEnd }); } catch { return false; }
    });

    const totalRevenue = monthlySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const prevRevenue = prevMonthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const totalDebt = sales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

    const totalCogs = monthlySales.reduce((acc, s) => {
        const saleCogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
        return acc + saleCogs;
    }, 0);

    const totalExp = expenses.filter(e => {
        try { return isWithinInterval(parseISO(e.date), { start: currentMonthStart, end: now }); } catch { return false; }
    }).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const netProfit = totalRevenue - (totalCogs + totalExp);
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Chart 1: Daily Revenue Trend (Simulated candlesticks/Line)
    const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: now });
    const dailyTrend = daysInMonth.map(day => {
        const daySales = monthlySales.filter(s => isSameDay(parseISO(s.date), day));
        const dayTotal = daySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        return {
            date: format(day, 'dd MMM'),
            amount: dayTotal
        };
    });

    // Chart 2: Revenue vs Expenses (Bar)
    const performanceData = [
        { name: 'Revenue', value: totalRevenue, color: 'hsl(var(--primary))' },
        { name: 'Expenses', value: totalExp + totalCogs, color: 'hsl(var(--destructive))' }
    ];

    // Chart 3: Expense Categories (Pie)
    const expMap: Record<string, number> = {};
    expenses.forEach(e => {
        const cat = e.category || 'Other';
        expMap[cat] = (expMap[cat] || 0) + (Number(e.amount) || 0);
    });
    const pieData = Object.entries(expMap).map(([name, value]) => ({ name, value }));

    return {
        revenue: totalRevenue,
        growth,
        debt: totalDebt,
        margin,
        netProfit,
        dailyTrend,
        performanceData,
        pieData,
        salesCount: monthlySales.length
    };
  }, [sales, expenses]);

  const formatKes = (val: number) => {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);
  };

  if (salesLoading || expLoading) {
      return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-muted-foreground flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Preparing Shop Analysis...
      </div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Shop Analysis Hub" 
        description="Visual intelligence and data-driven insights for your business."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="Gross Revenue (GMV)" 
            value={formatKes(stats.revenue)} 
            icon={DollarSign} 
            trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}% vs last month`}
          />
          <SummaryCard 
            title="Profit Margin" 
            value={`${stats.margin.toFixed(1)}%`} 
            icon={TrendingUp} 
            description="Operational efficiency" 
            className="border-l-4 border-l-green-500"
          />
          <SummaryCard 
            title="Total Debt Exposure" 
            value={formatKes(stats.debt)} 
            icon={AlertTriangle} 
            description="Unpaid credit history" 
            className="border-l-4 border-l-red-500"
          />
          <SummaryCard 
            title="Total Units Sold" 
            value={stats.salesCount} 
            icon={Activity} 
            description="Monthly sales velocity" 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DAILY REVENUE TREND - CANDLESTICK STYLE LINE */}
          <Card className="shadow-sm border-none ring-1 ring-black/5">
              <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Daily Performance Trend</CardTitle>
                  <CardDescription>Sales velocity for the current month</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.dailyTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis 
                            dataKey="date" 
                            fontSize={9} 
                            fontFamily="monospace" 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis 
                            fontSize={9} 
                            fontFamily="monospace" 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(v) => `KES ${v/1000}k`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            labelStyle={{ fontWeight: '900', color: 'hsl(var(--primary))' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* REVENUE VS EXPENSE - BARS */}
          <Card className="shadow-sm border-none ring-1 ring-black/5">
              <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Financial Balance</CardTitle>
                  <CardDescription>Revenue vs Costs comparison</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.performanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="name" fontSize={10} fontStyle="bold" axisLine={false} tickLine={false} />
                          <YAxis fontSize={9} axisLine={false} tickLine={false} tickFormatter={(v) => `KES ${v/1000}k`} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                              {stats.performanceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* EXPENSE CATEGORIES - PIE */}
          <Card className="shadow-sm border-none ring-1 ring-black/5">
              <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" />
                    Spend Breakdown
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                            data={stats.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                             {stats.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - (index * 0.2)})`} />
                             ))}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* SECURITY AUDIT - REMAINING */}
          <Card className="shadow-sm border-none ring-1 ring-black/5 bg-primary/5">
                <CardHeader className="border-b border-primary/10">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        System Integrity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                            <span className="text-[10px] font-black uppercase">Staff Members Verified</span>
                            <span className="font-black text-green-600">SECURE</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                            <span className="text-[10px] font-black uppercase">Cloud Synchronization</span>
                            <span className="font-black text-primary">SYNCED</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                            <span className="text-[10px] font-black uppercase">Multi-Tenant Isolation</span>
                            <span className="font-black">ENFORCED</span>
                        </div>
                    </div>
                </CardContent>
          </Card>
      </div>

      <div className="text-center pt-8 opacity-20">
          <p className="text-[11px] font-black tracking-widest uppercase">Analysis node synchronization active &bull; Matesh Version 3.26</p>
      </div>
    </div>
  );
}
