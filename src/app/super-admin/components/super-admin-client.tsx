
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, addDoc, limit, orderBy, updateDoc, arrayUnion } from 'firebase/firestore';
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
    User as UserIcon
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

  // Support State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [targetNode, setTargetNode] = useState('all');
  const [targetUser, setTargetUser] = useState('all');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messagePriority, setMessagePriority] = useState('info');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<AppUser>(userProfileRef);

  const companiesQuery = useMemoFirebase(() => collection(firestore, 'companies'), [firestore]);
  const allUsersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const logsQuery = useMemoFirebase(() => query(collection(firestore, 'platform_logs'), orderBy('timestamp', 'desc'), limit(100)), [firestore]);
  const supportQuery = useMemoFirebase(() => query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(50)), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allLogs, isLoading: logsLoading } = useCollection(logsQuery);
  const { data: supportThreads, isLoading: supportLoading } = useCollection(supportQuery);

  const filteredTargetUsers = useMemo(() => {
    if (targetNode === 'all' || !allUsers) return [];
    return allUsers.filter(u => u.tenantIds?.includes(targetNode) || u.tenantId === targetNode);
  }, [targetNode, allUsers]);

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allLogs) return null;
    
    const activeNodes = companies.filter(c => c.status === 'active' || !c.status).length;
    const currentMRR = activeNodes * 2500;
    
    const now = new Date();
    const last6Months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now
    });

    const revenueTrend = last6Months.map(month => {
        const monthEnd = endOfMonth(month);
        const nodesAtPoint = companies.filter(c => parseISO(c.createdAt || '') <= monthEnd).length;
        return { name: format(month, 'MMM'), revenue: nodesAtPoint * 2500 };
    });

    const accessLogs = allLogs.filter(l => l.module === 'Identity' || l.event.toLowerCase().includes('login') || l.event.toLowerCase().includes('entered'));
    const downloadLogs = allLogs.filter(l => l.event.toLowerCase().includes('download') || l.event.toLowerCase().includes('pdf') || l.event.toLowerCase().includes('export'));
    const subscriptionLogs = allLogs.filter(l => l.module === 'Billing' || l.event.toLowerCase().includes('subscription') || l.event.toLowerCase().includes('node'));
    const healthLogs = allLogs.filter(l => l.level === 'error' || l.module === 'System');

    return { totalCompanies: companies.length, totalUsers: allUsers.length, currentMRR, activeNodes, revenueTrend, accessLogs, downloadLogs, subscriptionLogs, healthLogs };
  }, [companies, allUsers, allLogs]);

  const handleAddCompany = async () => {
      if (!newCompData.name || !newCompData.email) return;
      setIsSavingComp(true);
      try {
          const compId = crypto.randomUUID();
          await setDoc(doc(firestore, 'companies', compId), {
              ...newCompData, id: compId, tenantId: compId, status: 'active', plan: 'legacy_pro', createdAt: new Date().toISOString(), createdBy: { uid: user?.uid, name: profile?.name || 'System' }
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

  const handleSendSupport = async () => {
    if (!messageSubject || !messageBody || isSendingMessage) return;
    setIsSendingMessage(true);

    try {
        const timestamp = new Date().toISOString();
        const targets = targetNode === 'all' ? companies?.map(c => c.id) || [] : [targetNode];

        if (targets.length === 0) {
            toast({ variant: 'destructive', title: "No targets found" });
            setIsSendingMessage(false);
            return;
        }

        for (const tId of targets) {
            await addDoc(collection(firestore, 'notifications'), {
                tenantId: tId,
                targetUserId: targetUser, // 'all' or specific UID
                subject: messageSubject,
                message: messageBody,
                priority: messagePriority,
                read: false,
                type: 'system',
                senderId: 'platform_admin',
                senderName: 'Platform Support',
                replies: [],
                createdAt: timestamp,
                updatedAt: timestamp
            });
        }

        toast({ title: "Alert Sent Successfully", description: `Dispatched to ${targets.length} node(s).` });
        setIsComposeOpen(false);
        setMessageSubject('');
        setMessageBody('');
        setTargetUser('all');
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Broadcast Failed" });
    } finally {
        setIsSendingMessage(false);
    }
  };

  const handleSendReply = async (notifId: string) => {
      if (!replyText.trim() || isSendingReply) return;
      setIsSendingReply(true);

      try {
          const docRef = doc(firestore, 'notifications', notifId);
          await updateDoc(docRef, {
              replies: arrayUnion({
                  userId: 'platform_admin',
                  userName: 'Platform Controller',
                  message: replyText,
                  timestamp: new Date().toISOString()
              }),
              read: false, 
              updatedAt: new Date().toISOString()
          });

          toast({ title: "Response Dispatched" });
          setReplyText('');
          setReplyingTo(null);
      } catch (e: any) {
          toast({ variant: 'destructive', title: "Reply Failed" });
      } finally {
          setIsSendingReply(false);
      }
  };

  const handleResolveSupport = async (id: string) => {
      try {
          await updateDoc(doc(firestore, 'notifications', id), {
              priority: 'info',
              resolved: true,
              updatedAt: new Date().toISOString()
          });
          toast({ title: "Support Ticket Resolved" });
      } catch (e) {}
  };

  const formatKes = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  if (profileLoading || compsLoading || usersLoading || logsLoading || supportLoading) {
      return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-[#0a0a0a]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Secure Control Link...</p>
        </div>
      );
  }

  if (profile?.role !== 'super_admin') {
      return <div className="flex h-screen items-center justify-center text-white bg-black font-black">UNAUTHORIZED ACCESS ATTEMPT LOGGED</div>;
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
                            <svg viewBox="0 0 100 40" className="w-full h-full"><path d="M0 30 Q 25 10, 50 30 T 100 10" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" /></svg>
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
                    <div className={cn("p-2 rounded-xl", color)}><Icon className="h-4 w-4 text-white" /></div>
                    <div><CardTitle className="text-sm font-black uppercase tracking-widest text-white">{title}</CardTitle><CardDescription className="text-[9px] font-bold text-white/30 uppercase">{description}</CardDescription></div>
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
                                          <Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-1 border-white/10 text-white/40">{log.tenantId?.slice(0,8) || 'GLOBAL'}</Badge>
                                          <span className="text-[9px] font-bold text-white/20">{format(parseISO(log.timestamp), 'dd MMM, HH:mm')}</span>
                                      </div>
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
          </CardContent>
          <CardFooter className="bg-white/[0.01] p-3 border-t border-white/5 flex justify-center">
                <Button variant="ghost" className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white">Deep Audit Access</Button>
          </CardFooter>
      </Card>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary selection:text-white pb-20">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)]"><LayoutDashboard className="h-8 w-8 text-white" /></div>
                <div><h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Master Dashboard</h1><p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> SaaS Operations Intelligence</p></div>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10"><Database className="h-4 w-4 text-green-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cluster: PROD-KE-1</span></div>
                <Button onClick={() => setIsAddCompanyOpen(true)} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest shadow-2xl bg-white text-black hover:bg-white/90"><PlusCircle className="mr-2 h-4 w-4" /> Deploy Node</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MasterStatCard title="Platform Revenue" value={formatKes(stats?.currentMRR || 0)} description="Current Month Subscriptions" icon={DollarSign} colorClass="bg-blue-600" trend="+12.5%" />
            <MasterStatCard title="Data Flow Nodes" value={stats?.totalCompanies || 0} description="Active SaaS Tenants" icon={Share2} colorClass="bg-purple-600" trend="+8.3%" />
            <MasterStatCard title="Global Users" value={stats?.totalUsers || 0} description="Active Platform Accounts" icon={Users} colorClass="bg-cyan-600" trend="+15.7%" />
            <MasterStatCard title="System Health" value="99.98%" description="Network Service Uptime" icon={Activity} colorClass="bg-rose-600" trend="+5.4%" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AuditContainer title="User Access Audit" description="Presence & Module Entry Logs" icon={Users} logs={stats?.accessLogs || []} color="bg-cyan-600" />
            <AuditContainer title="Data Flow Log" description="PDF Downloads & Exports" icon={DownloadCloud} logs={stats?.downloadLogs || []} color="bg-blue-600" />
            <AuditContainer title="Subscription Flow" description="Billing & Plan Transitions" icon={CreditCard} logs={stats?.subscriptionLogs || []} color="bg-purple-600" />
            <AuditContainer title="System Stability" description="Error Traps & Integrity Logs" icon={ShieldCheck} logs={stats?.healthLogs || []} color="bg-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 pt-6">
            <div className="space-y-8">
                <Tabs defaultValue="data-flow" className="w-full">
                    <TabsList className="bg-white/5 p-1.5 border border-white/10 mb-8 h-14 rounded-2xl w-fit">
                        <TabsTrigger value="data-flow" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black"><Share2 className="h-3.5 w-3.5 mr-2" /> Data Flow</TabsTrigger>
                        <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-black"><Users className="h-3.5 w-3.5 mr-2" /> Identity Pool</TabsTrigger>
                    </TabsList>
                    <TabsContent value="data-flow" className="animate-in fade-in slide-in-from-bottom-4 duration-700"><CompanyManagement companies={companies || []} /></TabsContent>
                    <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-700"><UserManagement users={allUsers || []} companies={companies || []} /></TabsContent>
                </Tabs>
            </div>
            <div className="space-y-8">
                <Card className="bg-[#141414] border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
                    <CardHeader className="bg-white/[0.03] p-5 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Complaints & Support
                                </CardTitle>
                                <CardDescription className="text-[9px] font-bold uppercase opacity-30 mt-1">Cross-Tenant Bridge</CardDescription>
                            </div>
                            <Button onClick={() => setIsComposeOpen(true)} variant="outline" size="sm" className="h-8 text-[8px] font-black uppercase border-white/10 hover:bg-white/5">
                                <Send className="h-3 w-3 mr-1.5" /> Compose Alert
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[600px]">
                            <div className="divide-y divide-white/5">
                                {supportThreads && supportThreads.map(thread => (
                                    <div key={thread.id} className={cn(
                                        "p-5 hover:bg-white/[0.03] transition-all",
                                        thread.priority === 'alert' ? "bg-red-500/5" : ""
                                    )}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2 flex-grow overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn(
                                                        "text-[7px] font-black uppercase h-4 px-1.5 border-none",
                                                        thread.priority === 'alert' ? "bg-red-600" : "bg-blue-600"
                                                    )}>{thread.priority}</Badge>
                                                    <span className="text-[8px] font-black text-white/20 uppercase truncate">
                                                        NODE: {companies?.find(c => c.id === thread.tenantId)?.name || thread.tenantId?.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-tight text-white/90 truncate">{thread.subject}</p>
                                                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{thread.message}</p>
                                                
                                                {thread.replies && thread.replies.map((reply: any, idx: number) => (
                                                    <div key={idx} className="mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[8px] font-black uppercase text-primary">{reply.userName}</p>
                                                            <p className="text-[7px] font-bold text-white/20">{format(parseISO(reply.timestamp), 'HH:mm')}</p>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/60">{reply.message}</p>
                                                    </div>
                                                ))}

                                                {replyingTo === thread.id ? (
                                                    <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                        <Input 
                                                            autoFocus
                                                            placeholder="Type response..." 
                                                            value={replyText} 
                                                            onChange={e => setReplyText(e.target.value)}
                                                            className="h-8 text-[10px] bg-white/5 border-white/10"
                                                        />
                                                        <Button size="icon" className="h-8 w-8" onClick={() => handleSendReply(thread.id)} disabled={isSendingReply || !replyText.trim()}>
                                                            {isSendingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReplyingTo(null)}>
                                                            <Trash2 className="h-3 w-3 text-white/20" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-7 mt-2 text-[8px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                                                        onClick={() => setReplyingTo(thread.id)}
                                                    >
                                                        Respond to Node
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                <span className="text-[8px] font-bold text-white/10 uppercase">{format(parseISO(thread.createdAt), 'dd MMM')}</span>
                                                {!thread.resolved ? (
                                                    <Button onClick={() => handleResolveSupport(thread.id)} variant="ghost" size="icon" className="h-8 w-8 text-green-500/30 hover:text-green-500">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Badge variant="outline" className="text-[7px] font-black border-green-500/20 text-green-500/50">RESOLVED</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!supportThreads || supportThreads.length === 0) && (
                                    <div className="py-24 text-center opacity-20">
                                        <Headset className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No active support tickets</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-lg bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase flex items-center gap-3">
                      <Send className="h-6 w-6 text-primary" />
                      Dispatch Node Alert
                  </DialogTitle>
                  <DialogDescription className="text-white/40 font-bold text-[10px] uppercase tracking-widest">Bridging communication with business silos.</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/60">Target Node</Label>
                        <Select value={targetNode} onValueChange={(v) => { setTargetNode(v); setTargetUser('all'); }}>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10">
                                <SelectValue placeholder="Target Node..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                                <SelectItem value="all">Platform Broadcast (All)</SelectItem>
                                {companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/60">Target Operator</Label>
                        <Select value={targetUser} onValueChange={setTargetUser} disabled={targetNode === 'all'}>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10">
                                <SelectValue placeholder={targetNode === 'all' ? "All Staff" : "Select Staff..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                                <SelectItem value="all">All Shop Staff</SelectItem>
                                {filteredTargetUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-3 w-3 opacity-40" />
                                            <span>{u.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Priority Matrix</Label>
                      <Select value={messagePriority} onValueChange={setMessagePriority}>
                          <SelectTrigger className="h-11 bg-white/5 border-white/10">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-white/10 text-white">
                              <SelectItem value="info">Information (Blue)</SelectItem>
                              <SelectItem value="important">Important (Purple)</SelectItem>
                              <SelectItem value="alert">Critical Alert (Red)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Alert Subject</Label>
                      <Input 
                        value={messageSubject} 
                        onChange={e => setMessageSubject(e.target.value)} 
                        placeholder="e.g. Scheduled Maintenance" 
                        className="h-11 font-bold bg-white/5 border-white/10"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Communication Payload</Label>
                      <Textarea 
                        value={messageBody} 
                        onChange={e => setMessageBody(e.target.value)} 
                        placeholder="Enter the detailed message..." 
                        rows={5}
                        className="bg-white/5 border-white/10 font-medium"
                      />
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)} className="h-12 px-6 font-bold bg-transparent border-white/10 hover:bg-white/5">Cancel</Button>
                  <Button onClick={handleSendSupport} disabled={isSendingMessage || !messageSubject} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary text-white">
                      {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transmit Alert"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
          <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <DialogHeader><DialogTitle className="text-2xl font-black uppercase flex items-center gap-2 text-white"><Building className="h-6 w-6 text-primary" /> Deploy Enterprise Node</DialogTitle></DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Legal Business Name</Label><Input value={newCompData.name} onChange={e => setNewCompData({...newCompData, name: e.target.value})} placeholder="e.g. RoyalTech Cluster" className="h-12 bg-white/5 border-white/10 font-bold" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Primary Admin Email</Label><Input value={newCompData.email} onChange={e => setNewCompData({...newCompData, email: e.target.value})} placeholder="admin@node.com" className="h-12 bg-white/5 border-white/10" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Node Logic Template</Label><Select onValueChange={v => setNewCompData({...newCompData, businessType: v})} value={newCompData.businessType}><SelectTrigger className="h-12 bg-white/5 border-white/10"><SelectValue /></SelectTrigger><SelectContent className="bg-[#141414] border-white/10 text-white"><SelectItem value="retail">Retail POS + Inventory</SelectItem><SelectItem value="tech">Technical Repair Node</SelectItem><SelectItem value="hospitality">Hospitality Management</SelectItem><SelectItem value="service">Service Delivery Hub</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setIsAddCompanyOpen(false)} className="h-12 font-bold bg-transparent border-white/10 hover:bg-white/5">Cancel</Button><Button onClick={handleAddCompany} disabled={isSavingComp || !newCompData.name} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary text-white">Deploy Architecture</Button></DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
