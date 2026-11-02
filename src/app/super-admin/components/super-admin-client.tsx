
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, addDoc, limit, orderBy, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { 
    Globe, 
    Share2, 
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
    History as HistoryIcon,
    MessageSquare,
    Trash2,
    ArrowRight,
    Send,
    Check,
    User as UserIcon,
    CircleCheck,
    XCircle,
    Smartphone
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
import { Textarea } from '@/components/ui/textarea';

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
  const { data: profile } = useDoc<AppUser>(userProfileRef);

  const companiesQuery = useMemoFirebase(() => collection(firestore, 'companies'), [firestore]);
  const allUsersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), orderBy('timestamp', 'desc'), limit(100)), [firestore]);
  const supportQuery = useMemoFirebase(() => query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(50)), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allLogs, isLoading: logsLoading } = useCollection(logsQuery);
  const { data: supportThreads, isLoading: supportLoading } = useCollection(supportQuery);

  const pendingApprovals = useMemo(() => {
    if (!companies) return [];
    return companies.filter(c => c.status === 'pending');
  }, [companies]);

  const pendingPayments = useMemo(() => {
    if (!companies) return [];
    return companies.filter(c => c.status === 'awaiting_payment_verification');
  }, [companies]);

  const handleApproveNode = async (id: string, name: string) => {
    try {
        await updateDoc(doc(firestore, 'companies', id), {
            status: 'active',
            plan: 'free',
            updatedAt: new Date().toISOString()
        });
        toast({ title: "Node Installed & Approved", description: `${name} can now access their trial.` });
    } catch (e) { toast({ variant: 'destructive', title: "Approval Failed" }); }
  };

  const handleVerifyPayment = async (id: string, name: string) => {
    try {
        await updateDoc(doc(firestore, 'companies', id), {
            status: 'active',
            plan: 'basic',
            updatedAt: new Date().toISOString()
        });
        toast({ title: "Payment Verified", description: `${name} has been upgraded to Standard Node.` });
    } catch (e) { toast({ variant: 'destructive', title: "Verification Failed" }); }
  };

  const handleRejectNode = async (id: string) => {
    try {
        await updateDoc(doc(firestore, 'companies', id), {
            status: 'suspended',
            updatedAt: new Date().toISOString()
        });
        toast({ title: "Installation Rejected" });
    } catch (e) {}
  };

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allLogs) return null;
    const activeNodes = companies.filter(c => c.status === 'active' || !c.status).length;
    const currentMRR = activeNodes * 2500;
    return { totalCompanies: companies.length, totalUsers: allUsers.length, currentMRR, activeNodes };
  }, [companies, allUsers, allLogs]);

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (profile?.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)]"><LayoutDashboard className="h-8 w-8 text-white" /></div>
                <div><h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Master Dashboard</h1><p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> Platform Intelligence</p></div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 text-white/40 h-8 px-4 font-black uppercase text-[10px] tracking-widest border-white/10">Active Cluster: PROD-KE-1</Badge>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Pending Installations</CardTitle>
                            <CardDescription className="text-[9px] font-bold text-white/30 uppercase mt-1">Awaiting Engineer Approval</CardDescription>
                        </div>
                        <Badge className="bg-primary text-white h-5 px-2 text-[9px] font-black">{pendingApprovals.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-white/5">
                            {pendingApprovals.map(node => (
                                <div key={node.id} className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Building className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-white">{node.name}</p>
                                            <p className="text-[9px] font-bold text-white/20 uppercase">{node.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleApproveNode(node.id, node.name)}><CircleCheck className="h-5 w-5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => handleRejectNode(node.id)}><XCircle className="h-5 w-5" /></Button>
                                    </div>
                                </div>
                            ))}
                            {pendingApprovals.length === 0 && <div className="p-20 text-center opacity-10 font-black uppercase text-[10px] tracking-widest">No pending installations</div>}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-green-500">Payment Verifications</CardTitle>
                            <CardDescription className="text-[9px] font-bold text-white/30 uppercase mt-1">PayPal / M-Pesa Post-Trial Audits</CardDescription>
                        </div>
                        <Badge className="bg-green-600 text-white h-5 px-2 text-[9px] font-black">{pendingPayments.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-white/5">
                            {pendingPayments.map(node => (
                                <div key={node.id} className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><DollarSign className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-white">{node.name}</p>
                                            <Badge variant="outline" className="text-[7px] font-black border-green-500/20 text-green-500/60 uppercase">Claimed Settlement: KES 40,000</Badge>
                                        </div>
                                    </div>
                                    <Button className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700" onClick={() => handleVerifyPayment(node.id, node.name)}>Verify & Activate</Button>
                                </div>
                            ))}
                            {pendingPayments.length === 0 && <div className="p-20 text-center opacity-10 font-black uppercase text-[10px] tracking-widest">No pending verifications</div>}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="data-flow" className="w-full">
            <TabsList className="bg-white/5 p-1.5 border border-white/10 mb-8 h-14 rounded-2xl w-fit">
                <TabsTrigger value="data-flow" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black"><Share2 className="h-3.5 w-3.5 mr-2" /> Data Flow</TabsTrigger>
                <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black"><Users className="h-3.5 w-3.5 mr-2" /> Identity Pool</TabsTrigger>
            </TabsList>
            <TabsContent value="data-flow" className="animate-in fade-in slide-in-from-bottom-4 duration-700"><CompanyManagement companies={companies || []} /></TabsContent>
            <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-700"><UserManagement users={allUsers || []} companies={companies || []} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
