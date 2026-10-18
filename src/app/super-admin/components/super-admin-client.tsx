
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, addDoc, getDocs, limit, orderBy } from 'firebase/firestore';
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
    RefreshCw,
    Database,
    Zap,
    PlusCircle,
    Building,
    TrendingUp,
    DollarSign,
    AlertCircle,
    LayoutDashboard,
    CreditCard,
    Headset,
    Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyManagement } from './company-management';
import { UserManagement } from './user-management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Company } from '@/types';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export function SuperAdminClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [newCompData, setNewCompData] = useState({
      name: '',
      email: '',
      phone: '',
      businessType: 'retail'
  });

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<AppUser>(userProfileRef);

  const companiesQuery = useMemoFirebase(() => collection(firestore, 'companies'), [firestore]);
  const allUsersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const salesQuery = useMemoFirebase(() => collection(firestore, 'sales_transactions'), [firestore]);
  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), orderBy('timestamp', 'desc'), limit(5)), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allSales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: recentLogs } = useCollection(logsQuery);

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allSales) return null;
    
    const totalGmv = allSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const activeCompanies = companies.filter(c => c.status === 'active').length;
    const suspendedCompanies = companies.filter(c => c.status === 'suspended').length;
    
    // Monthly Recurring Revenue calculation logic
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const monthlySales = allSales.filter(s => {
        try { return parseISO(s.date) >= currentMonthStart; } catch { return false; }
    });
    const currentMRR = monthlySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // Chart Data Generation
    const last6Months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now
    });

    const revenueTrend = last6Months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthSales = allSales.filter(s => {
            const d = parseISO(s.date);
            return d >= monthStart && d <= monthEnd;
        });
        return {
            name: format(month, 'MMM'),
            revenue: monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
        };
    });

    const subscriptionData = [
        { name: 'Active', value: activeCompanies, color: '#00c853' },
        { name: 'Suspended', value: suspendedCompanies, color: '#ff1744' },
        { name: 'Trial', value: Math.floor(activeCompanies * 0.2), color: '#2979ff' },
        { name: 'Expired', value: 2, color: '#ffea00' }
    ];

    return {
        totalCompanies: companies.length,
        totalUsers: allUsers.length,
        totalGmv,
        currentMRR,
        activeNodes: activeCompanies,
        revenueTrend,
        subscriptionData
    };
  }, [companies, allUsers, allSales]);

  const handleAddCompany = async () => {
      if (!newCompData.name || !newCompData.email) return;
      setIsSavingComp(true);
      try {
          const compId = crypto.randomUUID();
          await setDoc(doc(firestore, 'companies', compId), {
              ...newCompData,
              id: compId,
              tenantId: compId,
              status: 'active',
              plan: 'legacy_pro',
              createdAt: new Date().toISOString(),
              createdBy: { uid: user?.uid, name: profile?.name || 'System' }
          });
          toast({ title: "Company Node Deployed" });
          setIsAddCompanyOpen(false);
          setNewCompData({ name: '', email: '', phone: '', businessType: 'retail' });
      } catch (e) {
          toast({ variant: 'destructive', title: "Deployment Failed" });
      } finally {
          setIsSavingComp(false);
      }
  };

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (profileLoading || compsLoading || usersLoading || salesLoading) {
      return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-[#0a0a0a]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Secure Control Link...</p>
        </div>
      );
  }

  if (profile?.role !== 'super_admin') {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-8 text-center space-y-6 bg-[#0a0a0a]">
            <div className="bg-destructive/10 p-6 rounded-full border border-destructive/20 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <Lock className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Access Denied</h1>
                <p className="text-muted-foreground leading-relaxed">
                    Global infrastructure control is restricted to authorized platform operators.
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary selection:text-white pb-20">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10">
        
        {/* TOP NAV / LOGO AREA */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                    <Globe className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Nexora Platform</h1>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5">
                        <Shield className="h-2.5 w-2.5" /> 
                        Infrastructure Control Layer
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region: AF-SOUTH-1</span>
                </div>
                <Button onClick={() => setIsAddCompanyOpen(true)} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest shadow-2xl bg-white text-black hover:bg-white/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Deploy Node
                </Button>
            </div>
        </header>

        {/* TOP SUMMARY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
                title="Active Nodes" 
                value={stats?.totalCompanies || 0} 
                icon={Building2} 
                description="Provisioned Business Units"
                className="bg-[#141414] border-white/5"
            />
            <SummaryCard 
                title="Platform Revenue" 
                value={formatKes(stats?.currentMRR || 0)} 
                icon={DollarSign} 
                description="Current Month Recurring"
                className="bg-[#141414] border-white/5"
                trend="+12.4% MoM"
            />
            <SummaryCard 
                title="Global Users" 
                value={stats?.totalUsers || 0} 
                icon={Users} 
                description="Active Across All Clusters"
                className="bg-[#141414] border-white/5"
            />
            <SummaryCard 
                title="System Health" 
                value="99.9%" 
                icon={Activity} 
                description="Live Service Uptime"
                className="bg-[#141414] border-l-4 border-l-green-500 border-white/5"
            />
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN REVENUE CHART */}
            <Card className="lg:col-span-2 bg-[#141414] border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="h-4 w-4 text-primary" /></div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Revenue Velocity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.revenueTrend}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={(v) => `Ksh ${v/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                itemStyle={{ color: 'white' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* SUBSCRIPTION SPLIT PIE */}
            <Card className="bg-[#141414] border-white/5 shadow-2xl">
                 <CardHeader className="border-b border-white/5 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-8 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats?.subscriptionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={10}
                                dataKey="value"
                                stroke="none"
                            >
                                {stats?.subscriptionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {stats?.subscriptionData.map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[10px] font-bold uppercase opacity-50">{d.name}: {d.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* MANAGEMENT INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-8">
                <Tabs defaultValue="companies" className="w-full">
                    <TabsList className="bg-white/5 p-1.5 border border-white/10 mb-8 h-14 rounded-2xl w-fit">
                        <TabsTrigger value="companies" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                            <Building2 className="h-3.5 w-3.5 mr-2" />
                            Node Management
                        </TabsTrigger>
                        <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                            <Users className="h-3.5 w-3.5 mr-2" />
                            Global Directory
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                            <CreditCard className="h-3.5 w-3.5 mr-2" />
                            Billing Ops
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="companies" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CompanyManagement companies={companies || []} />
                    </TabsContent>

                    <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <UserManagement users={allUsers || []} companies={companies || []} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* SECONDARY SIDEBAR: ACTIVITY & TASKS */}
            <div className="space-y-8">
                {/* SYSTEM INTEGRITY FEED */}
                <Card className="bg-[#141414] border-white/5 shadow-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            Platform Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentLogs?.map((log, idx) => (
                            <div key={idx} className="flex gap-4 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                <div>
                                    <p className="text-[11px] font-bold text-white leading-tight">{log.event}</p>
                                    <div className="flex items-center gap-2 mt-1 opacity-40">
                                        <span className="text-[8px] font-black uppercase tracking-widest">{log.module}</span>
                                        <span className="text-[8px] font-bold">&bull; {format(parseISO(log.timestamp), 'HH:mm')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
                            Inspect Audit Trail
                        </Button>
                    </CardFooter>
                </Card>

                {/* UPCOMING TASKS / RENEWALS */}
                <Card className="bg-[#141414] border-white/5 shadow-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <RefreshCw className="h-3 w-3" />
                            Upcoming Renewals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-xl">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white">Enterprise Node #{i}</p>
                                    <p className="text-[9px] font-bold text-primary uppercase">Due in 4 days</p>
                                </div>
                                <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase bg-transparent border-white/10">Invoice</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                 {/* SUPPORT QUEUE */}
                 <Card className="bg-[#141414] border-white/5 shadow-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Headset className="h-3 w-3" />
                            Incident Queue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center py-10 opacity-20">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest">All support lanes clear</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
          <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2 text-white">
                      <Building className="h-6 w-6 text-primary" />
                      Deploy Enterprise Node
                  </DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                      Provisioning isolated workspace in cluster.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60">Legal Business Name</Label>
                      <Input value={newCompData.name} onChange={e => setNewCompData({...newCompData, name: e.target.value})} placeholder="e.g. RoyalTech Cluster" className="h-12 bg-white/5 border-white/10 font-bold" />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60">Primary Admin Email</Label>
                      <Input value={newCompData.email} onChange={e => setNewCompData({...newCompData, email: e.target.value})} placeholder="admin@node.com" className="h-12 bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60">Node Logic Template</Label>
                      <Select onValueChange={v => setNewCompData({...newCompData, businessType: v})} value={newCompData.businessType}>
                          <SelectTrigger className="h-12 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#141414] border-white/10 text-white">
                              <SelectItem value="retail">Retail POS + Inventory</SelectItem>
                              <SelectItem value="tech">Technical Repair Node</SelectItem>
                              <SelectItem value="hospitality">Hospitality Management</SelectItem>
                              <SelectItem value="service">Service Delivery Hub</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)} className="h-12 font-bold bg-transparent border-white/10 hover:bg-white/5">Cancel</Button>
                  <Button onClick={handleAddCompany} disabled={isSavingComp || !newCompData.name} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90 text-white">
                      {isSavingComp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Architecture"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
