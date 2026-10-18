'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, limit, orderBy } from 'firebase/firestore';
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
    Shield,
    DownloadCloud,
    History,
    MessageSquare,
    Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), orderBy('timestamp', 'desc'), limit(100)), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allLogs, isLoading: logsLoading } = useCollection(logsQuery);

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allLogs) return null;
    
    // SUBSCRIPTION REVENUE: 2500 KES per active company node
    const activeNodes = companies.filter(c => c.status === 'active' || !c.status).length;
    const currentMRR = activeNodes * 2500;
    
    const now = new Date();
    const last6Months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now
    });

    const revenueTrend = last6Months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        // Simulate growth based on cumulative node deployments in those months
        const nodesAtPoint = companies.filter(c => parseISO(c.createdAt || '') <= monthEnd).length;
        return {
            name: format(month, 'MMM'),
            revenue: nodesAtPoint * 2500
        };
    });

    // SEGRAGATED AUDIT LOGS
    const accessLogs = allLogs.filter(l => l.module === 'Identity' || l.event.toLowerCase().includes('login') || l.event.toLowerCase().includes('entered'));
    const downloadLogs = allLogs.filter(l => l.event.toLowerCase().includes('download') || l.event.toLowerCase().includes('pdf') || l.event.toLowerCase().includes('export'));
    const subscriptionLogs = allLogs.filter(l => l.module === 'Billing' || l.event.toLowerCase().includes('subscription') || l.event.toLowerCase().includes('node'));
    const healthLogs = allLogs.filter(l => l.level === 'error' || l.module === 'System');

    return {
        totalCompanies: companies.length,
        totalUsers: allUsers.length,
        currentMRR,
        activeNodes,
        revenueTrend,
        accessLogs,
        downloadLogs,
        subscriptionLogs,
        healthLogs
    };
  }, [companies, allUsers, allLogs]);

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

  if (profileLoading || compsLoading || usersLoading || logsLoading) {
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

  const MasterStatCard = ({ title, value, description, icon: Icon, colorClass, trend }: any) => (
      <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden group">
          <CardContent className="p-6">
              <div className="flex justify-between items-start">
                  <div className="space-y-4">
                      <div className={cn("p-3 rounded-2xl w-fit shadow-lg", colorClass)}>
                          <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{title}</p>
                          <h3 className="text-2xl font-black tracking-tighter text-white">{value}</h3>
                          <p className="text-[9px] font-bold text-white/20 uppercase">{description}</p>
                      </div>
                  </div>
                  {trend && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-12 w-24 opacity-20">
                            {/* Sparkline Visual Placeholder */}
                            <svg viewBox="0 0 100 40" className="w-full h-full">
                                <path d="M0 30 Q 25 10, 50 30 T 100 10" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-green-500">{trend}</span>
                      </div>
                  )}
              </div>
          </CardContent>
      </Card>
  );

  const AuditContainer = ({ title, description, icon: Icon, logs, color }: any) => (
      <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden flex flex-col h-[500px]">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", color)}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-white">{title}</CardTitle>
                        <CardDescription className="text-[9px] font-bold text-white/30 uppercase">{description}</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="text-[8px] font-black border-white/10 text-white/40">{logs.length} EVENTS</Badge>
              </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
              <ScrollArea className="h-full">
                  <div className="divide-y divide-white/5">
                      {logs.map((log: any, idx: number) => (
                          <div key={idx} className="p-4 hover:bg-white/[0.03] transition-all cursor-pointer group">
                              <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1">
                                      <p className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">{log.event}</p>
                                      <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-1 border-white/10 text-white/40">
                                              {log.metadata?.tenantId?.slice(0,8) || 'GLOBAL'}
                                          </Badge>
                                          <span className="text-[9px] font-bold text-white/20">{format(parseISO(log.timestamp), 'dd MMM, HH:mm')}</span>
                                      </div>
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                              </div>
                          </div>
                      ))}
                      {logs.length === 0 && (
                          <div className="p-20 text-center opacity-20 italic text-xs">No activity recorded for this lane.</div>
                      )}
                  </div>
              </ScrollArea>
          </CardContent>
          <CardFooter className="bg-white/[0.01] p-3 border-t border-white/5 flex justify-center">
                <Button variant="ghost" className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white">
                    Deep Audit Access
                </Button>
          </CardFooter>
      </Card>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary selection:text-white pb-20">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10">
        
        {/* MASTER DASHBOARD HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                    <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Master Dashboard</h1>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5">
                        <Shield className="h-2.5 w-2.5" /> 
                        SaaS Operations Intelligence
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cluster: PROD-KE-1</span>
                </div>
                <Button onClick={() => setIsAddCompanyOpen(true)} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest shadow-2xl bg-white text-black hover:bg-white/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Deploy Node
                </Button>
            </div>
        </header>

        {/* TOP SUMMARY GRID - STYLED PER REFERENCE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MasterStatCard 
                title="Platform Revenue" 
                value={formatKes(stats?.currentMRR || 0)} 
                description="Current Month Subscriptions"
                icon={DollarSign}
                colorClass="bg-blue-600"
                trend="+12.5%"
            />
            <MasterStatCard 
                title="Business Nodes" 
                value={stats?.totalCompanies || 0} 
                description="Active SaaS Tenants"
                icon={Building2}
                colorClass="bg-purple-600"
                trend="+8.3%"
            />
            <MasterStatCard 
                title="Global Users" 
                value={stats?.totalUsers || 0} 
                description="Active Platform Accounts"
                icon={Users}
                colorClass="bg-cyan-600"
                trend="+15.7%"
            />
            <MasterStatCard 
                title="System Health" 
                value="99.98%" 
                description="Network Service Uptime"
                icon={Activity}
                colorClass="bg-rose-600"
                trend="+5.4%"
            />
        </div>

        {/* THE FOUR AUDIT CONTAINERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AuditContainer 
                title="User Access Audit" 
                description="Presence & Module Entry Logs"
                icon={Users}
                logs={stats?.accessLogs || []}
                color="bg-cyan-600"
            />
            <AuditContainer 
                title="Data Flow Log" 
                description="PDF Downloads & Exports"
                icon={DownloadCloud}
                logs={stats?.downloadLogs || []}
                color="bg-blue-600"
            />
            <AuditContainer 
                title="Subscription Flow" 
                description="Billing & Plan Transitions"
                icon={CreditCard}
                logs={stats?.subscriptionLogs || []}
                color="bg-purple-600"
            />
            <AuditContainer 
                title="System Stability" 
                description="Error Traps & Integrity Logs"
                icon={ShieldCheck}
                logs={stats?.healthLogs || []}
                color="bg-rose-600"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 pt-6">
            <div className="space-y-8">
                <Tabs defaultValue="companies" className="w-full">
                    <TabsList className="bg-white/5 p-1.5 border border-white/10 mb-8 h-14 rounded-2xl w-fit">
                        <TabsTrigger value="companies" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                            <Building2 className="h-3.5 w-3.5 mr-2" />
                            Business Nodes
                        </TabsTrigger>
                        <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">
                            <Users className="h-3.5 w-3.5 mr-2" />
                            Identity Pool
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

            <div className="space-y-8">
                <Card className="bg-[#141414] border-white/5 shadow-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            Complaints & Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Bi-directional support feed simulation */}
                        <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <Badge className="bg-blue-600 text-[7px] font-black uppercase">NEW COMPLAINT</Badge>
                                <span className="text-[8px] font-bold opacity-30 uppercase">8 mins ago</span>
                            </div>
                            <p className="text-[11px] font-bold text-white leading-relaxed">
                                "Printer not connecting to the thermal output in Matesh Node."
                            </p>
                            <div className="pt-2 flex justify-end">
                                <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase border-white/10">Reply to Owner</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#141414] border-white/5 shadow-2xl">
                    <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40">Revenue Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend}>
                                <defs>
                                    <linearGradient id="masterRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} />
                                <YAxis axisLine={false} tickLine={false} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#masterRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>

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
