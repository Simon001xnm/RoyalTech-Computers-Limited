
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Loader2, Filter, FileSpreadsheet, TrendingUp, DollarSign, Activity, Users, ShoppingCart, Percent } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear, isWithinInterval, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, exportToCsv } from '@/lib/utils';
import { PnlReport } from './pnl-report';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export interface PnlData {
  operatingIncome: {
    totalSales: number;
    totalVat: number;
  };
  costOfGoodsSold: {
    totalCogs: number;
    cogsByCategory: { [key: string]: number };
  };
  operatingExpenses: {
    totalExpenses: number;
    expenseByCategory: { [key: string]: number };
  };
  grossProfit: number;
  netIncome: number;
  sales: any[];
  expenses: any[];
}

export function ReportsClient() {
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'official'>('dashboard');

  // DATA FETCHING
  const salesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  
  const expensesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'expenses'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const customersQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'customers'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);

  const { data: rawSales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: rawExpenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: rawCustomers, isLoading: customersLoading } = useCollection(customersQuery);

  const isLoading = salesLoading || expensesLoading || customersLoading;

  // ANALYTICS ENGINE
  const analytics = useMemo(() => {
    if (!rawSales || !rawExpenses || !rawCustomers) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const months = eachMonthOfInterval({
        start: startOfYear(now),
        end: now
    });

    // 1. Monthly Trends
    const monthlyData = months.map(month => {
        const monthSales = rawSales.filter(s => isSameMonth(parseISO(s.date), month));
        const monthExp = rawExpenses.filter(e => isSameMonth(parseISO(e.date), month));
        
        const rev = monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const cost = monthSales.reduce((acc, s) => {
            const cogs = s.items?.reduce((c: number, i: any) => c + (Number(i.buyingPrice || 0) * (Number(i.quantity) || 1)), 0) || 0;
            return acc + cogs;
        }, 0);
        const exp = monthExp.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

        return {
            name: format(month, 'MMM'),
            revenue: rev,
            costs: cost + exp,
            transactions: monthSales.length,
            answered: Math.floor(monthSales.length * 0.85) // Simulated matching metric
        };
    });

    // 2. Top Metrics
    const totalRevenue = rawSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalExpenses = rawExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalTrans = rawSales.length;
    const successRate = totalTrans > 0 ? 85 : 0; // Simulated success rate

    // 3. Customer Satisfaction Pie
    const satisfactionData = [
        { name: 'Very Satisfied', value: 30, color: '#00c853' },
        { name: 'Satisfied', value: 39, color: '#69f0ae' },
        { name: 'Neutral', value: 9, color: '#b2ff59' },
        { name: 'Unsatisfied', value: 16, color: '#ff5252' },
        { name: 'Very Unsatisfied', value: 6, color: '#d50000' }
    ];

    // 4. Product/Service Category Mix
    const catMap: Record<string, number> = {};
    rawSales.forEach(s => s.items?.forEach((i: any) => {
        const cat = i.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + 1;
    }));
    const categoryData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 3);

    return {
        monthlyData,
        metrics: {
            successRate,
            totalTrans,
            totalRevenue,
            expenseRatio: totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0
        },
        satisfactionData,
        categoryData,
        retention: 95 // Simulated retention
    };
  }, [rawSales, rawExpenses, rawCustomers]);

  // P&L COMPUTATION FOR OFFICIAL MODE
  const pnlData = useMemo<PnlData>(() => {
    if (!rawSales || !rawExpenses || !date?.from || !date?.to) {
        return { 
            operatingIncome: { totalSales: 0, totalVat: 0 }, 
            costOfGoodsSold: { totalCogs: 0, cogsByCategory: {} }, 
            operatingExpenses: { totalExpenses: 0, expenseByCategory: {} },
            grossProfit: 0, netIncome: 0, sales: [], expenses: []
        };
    }
    const interval = { start: date.from, end: date.to };
    const filteredSales = rawSales.filter(s => { try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; } });
    const filteredExpenses = rawExpenses.filter(e => { try { return isWithinInterval(parseISO(e.date), interval); } catch { return false; } });

    let totalSales = 0;
    let totalVat = 0;
    filteredSales.forEach(s => {
        totalSales += (Number(s.total) || 0);
        totalVat += (Number(s.vatAmount) || 0);
    });
    
    const cogsBreakdown = filteredSales.reduce((acc, sale) => {
        sale.items?.forEach((item: any) => {
            const cogs = Number(item.buyingPrice || 0) * (Number(item.quantity) || 1);
            acc.totalCogs += cogs;
            let cat = item.type === 'asset' ? 'Stock Cost' : 'Other Cost';
            acc.cogsByCategory[cat] = (acc.cogsByCategory[cat] || 0) + cogs;
        });
        return acc;
    }, { totalCogs: 0, cogsByCategory: {} as any });

    const totalExp = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expByCat = filteredExpenses.reduce((acc, e) => {
        const cat = e.category || 'General';
        acc[cat] = (acc[cat] || 0) + Number(e.amount);
        return acc;
    }, {} as any);

    const grossProfit = totalSales - cogsBreakdown.totalCogs - totalVat;
    return {
      operatingIncome: { totalSales, totalVat },
      costOfGoodsSold: cogsBreakdown,
      operatingExpenses: { totalExpenses: totalExp, expenseByCategory: expByCat },
      grossProfit,
      netIncome: grossProfit - totalExp,
      sales: filteredSales,
      expenses: filteredExpenses
    };
  }, [rawSales, rawExpenses, date]);

  const handleDownloadPdf = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const pages = document.querySelectorAll('.a4-pdf-page');
    if (!pages.length) return;
    setIsExporting(true);
    try {
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();
            const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 3.5, useCORS: true, backgroundColor: "#ffffff", width: 794, height: 1123, y: 0, scrollY: 0, windowWidth: 794 });
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        }
        pdf.save(`Official_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } finally { setIsExporting(false); }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest opacity-20">Analyzing Node Intelligence...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Business Intelligence Center" 
        description="Unified analytics for sales, costs, and customer loyalty." 
        actions={
            <div className="flex gap-2">
                <Button variant={viewMode === 'dashboard' ? 'default' : 'outline'} onClick={() => setViewMode('dashboard')} className="h-9 font-black uppercase text-[9px] tracking-widest">Dashboard View</Button>
                <Button variant={viewMode === 'official' ? 'default' : 'outline'} onClick={() => setViewMode('official')} className="h-9 font-black uppercase text-[9px] tracking-widest">Official Auditor P&L</Button>
            </div>
        }
      />

      {viewMode === 'dashboard' ? (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* TOP METRIC STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><Activity className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.successRate}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Successful Sales</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><ShoppingCart className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.totalTrans}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Total Transactions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><DollarSign className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">
                                KES {((analytics?.metrics.totalRevenue || 0) / 1000000).toFixed(2)}M
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Total Revenue {format(new Date(), 'yyyy')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-[#00c853]/10 p-3 rounded-xl"><Percent className="h-6 w-6 text-[#00c853]" /></div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-black">{analytics?.metrics.expenseRatio}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Expenses to Revenue</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CHART ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden col-span-1">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Sales Velocity v/s Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics?.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="transactions" stroke="#00c853" strokeWidth={3} dot={{ r: 4, fill: '#00c853' }} />
                                <Line type="monotone" dataKey="answered" stroke="#263238" strokeWidth={2} dot={{ r: 3, fill: '#263238' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden col-span-1">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Revenue v/s Cost of Sales</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#00c853" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="costs" stroke="#263238" strokeWidth={2} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden col-span-1">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Customer Satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.satisfactionData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics?.satisfactionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black">72%</span>
                            <span className="text-[8px] font-black uppercase opacity-40">Positive</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CHART ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Customer Retention</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px] flex flex-col items-center justify-between">
                        <div className="relative w-40 h-40">
                             <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#f5f5f5" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#00c853" strokeWidth="8" strokeDasharray="212 282" strokeLinecap="round" transform="rotate(135 50 50)" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{analytics?.retention}%</span>
                                <span className="text-[10px] font-black uppercase opacity-40">Target {'>'}= 91%</span>
                             </div>
                        </div>
                        <div className="w-full h-16 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics?.monthlyData}>
                                    <Line type="monotone" dataKey="transactions" stroke="#00c853" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Monthly Expense Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.monthlyData}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00c853" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#00c853" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="costs" stroke="#00c853" fillOpacity={1} fill="url(#colorCost)" />
                                <Line type="step" dataKey="costs" stroke="#263238" strokeWidth={2} dot={{ r: 4, fill: '#263238' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-black text-white p-3 text-center">
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Top Selling Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.categoryData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" fontSize={9} width={80} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#00c853" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fontSize: 10, fontWeight: 'bold' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center pt-10 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Integrated Intelligence Node &bull; v3.26 Live</p>
            </div>
        </div>
      ) : (
        <div className="space-y-6">
            <Card className="no-print shadow-sm border-none ring-1 ring-black/5">
                <CardHeader className="bg-muted/10 py-4 px-6 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        Report Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-wrap items-center gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Reporting Interval</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={'outline'} className={cn('w-full sm:w-[280px] justify-start text-left font-normal h-11 bg-white border-2', !date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? <>{format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}</> : format(date.from, 'LLL dd, y')) : <span>Pick a date range</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={isLoading || isExporting} className="h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl ml-auto">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download Official PDF
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-center bg-slate-100 rounded-3xl border-2 border-dashed p-4 md:p-12 overflow-x-auto no-scrollbar">
                <div className="shrink-0 origin-top transform scale-[0.4] sm:scale-[0.55] lg:scale-[0.7] xl:scale-[0.8] 2xl:scale-100">
                    <PnlReport data={pnlData} dateRange={date} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
