'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { 
    LayoutDashboard, 
    ArrowLeft, 
    Users, 
    History, 
    DownloadCloud, 
    Clock, 
    Activity, 
    HardDrive,
    ShieldCheck,
    Zap,
    MousePointer2,
    Eye,
    Globe,
    Loader2,
    ArrowRight,
    ChevronRight,
    FileText,
    FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Company, User as AppUser } from '@/types';

interface SiloInspectionClientProps {
    companyId: string;
}

export function SiloInspectionClient({ companyId }: SiloInspectionClientProps) {
    const router = useRouter();
    const firestore = useFirestore();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const companyRef = useMemoFirebase(() => doc(firestore, 'companies', companyId), [firestore, companyId]);
    const { data: company, isLoading: companyLoading } = useDoc<Company>(companyRef);

    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('tenantIds', 'array-contains', companyId)), [firestore, companyId]);
    
    // REMOVED orderBy to fix [failed-precondition] index error
    const logsQuery = useMemoFirebase(() => query(
        collection(firestore, 'platform_logs'), 
        where('tenantId', '==', companyId)
    ), [firestore, companyId]);

    const { data: users, isLoading: usersLoading } = useCollection<AppUser>(usersQuery);
    const { data: rawLogs, isLoading: logsLoading } = useCollection(logsQuery);

    const sortedLogs = useMemo(() => {
        if (!rawLogs) return [];
        return [...rawLogs].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    }, [rawLogs]);

    const metrics = useMemo(() => {
        if (!users || !sortedLogs) return null;

        const userMetrics = users.map(user => {
            const userLogs = sortedLogs.filter(l => l.userId === user.id);
            const downloads = userLogs.filter(l => l.event.toLowerCase().includes('download') || l.event.toLowerCase().includes('pdf') || l.event.toLowerCase().includes('export'));
            
            let totalMinutes = 0;
            const chronologicalLogs = [...userLogs].sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
            
            for(let i=1; i<chronologicalLogs.length; i++) {
                const diff = differenceInMinutes(parseISO(chronologicalLogs[i].timestamp), parseISO(chronologicalLogs[i-1].timestamp));
                if (diff < 60) totalMinutes += diff; 
            }

            const moduleInteractions: Record<string, number> = {};
            userLogs.forEach(l => {
                const mod = l.module || 'General';
                moduleInteractions[mod] = (moduleInteractions[mod] || 0) + 1;
            });

            return {
                ...user,
                totalMinutes,
                downloads: downloads.length,
                downloadLogs: downloads,
                lastActive: userLogs[0]?.timestamp,
                interactions: userLogs.length,
                moduleInteractions,
                recentLogs: userLogs.slice(0, 50)
            };
        });

        return {
            userMetrics: userMetrics.sort((a,b) => (b.interactions || 0) - (a.interactions || 0)),
            totalDownloads: sortedLogs.filter(l => l.event.toLowerCase().includes('download')).length,
            overallInteractions: sortedLogs.length
        };
    }, [users, sortedLogs]);

    const selectedUser = useMemo(() => {
        return metrics?.userMetrics.find(u => u.id === selectedUserId);
    }, [metrics, selectedUserId]);

    if (companyLoading || usersLoading || logsLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 animate-pulse">Syncing Silo Intelligence...</p>
            </div>
        );
    }

    if (selectedUser) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <header className="flex items-center justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-6">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10" onClick={() => setSelectedUserId(null)}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black uppercase tracking-tighter">{selectedUser.name}</h1>
                                <Badge className="bg-primary text-white font-black uppercase text-[10px] px-3 h-6">OPERATOR RESUME</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">{company?.name} &bull; {selectedUser.email}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <Card className="lg:col-span-1 bg-[#141414] border-white/5 shadow-2xl h-fit">
                        <CardHeader className="text-center pb-8 border-b border-white/5">
                            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white/5 mx-auto mb-4">
                                <Users className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-lg font-black uppercase text-white">{selectedUser.name}</CardTitle>
                            <Badge variant="outline" className="mt-2 h-5 text-[8px] font-black uppercase border-white/20 text-white/40">{selectedUser.role}</Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Total Presence</p>
                                <p className="text-2xl font-black text-primary">{Math.floor(selectedUser.totalMinutes / 60)}h {selectedUser.totalMinutes % 60}m</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Global Rank</p>
                                <p className="text-sm font-bold">NODE POWER OPERATOR</p>
                            </div>
                            <div className="pt-4 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-2">Capability Penetration</p>
                                {Object.entries(selectedUser.moduleInteractions).map(([mod, count]) => (
                                    <div key={mod} className="flex justify-between items-center text-[10px] font-bold uppercase">
                                        <span className="text-white/60">{mod}</span>
                                        <span className="text-primary">{count} Actions</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-3 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-[#141414] border-white/5 p-6 space-y-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg w-fit text-blue-500"><DownloadCloud className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white/20">Data Exports</p>
                                    <p className="text-2xl font-black">{selectedUser.downloads}</p>
                                </div>
                            </Card>
                            <Card className="bg-[#141414] border-white/5 p-6 space-y-4">
                                <div className="p-2 bg-green-500/10 rounded-lg w-fit text-green-500"><Activity className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white/20">System Load</p>
                                    <p className="text-2xl font-black">{selectedUser.interactions}</p>
                                </div>
                            </Card>
                            <Card className="bg-[#141414] border-white/5 p-6 space-y-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg w-fit text-purple-500"><Clock className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white/20">Last Active</p>
                                    <p className="text-sm font-black uppercase">{selectedUser.lastActive ? format(parseISO(selectedUser.lastActive), 'dd MMM yyyy, HH:mm') : 'Unknown'}</p>
                                </div>
                            </Card>
                        </div>

                        <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden">
                            <CardHeader className="bg-white/[0.02] border-b border-white/5 p-5">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Operator Activity Resume
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="divide-y divide-white/5">
                                        {selectedUser.recentLogs.map((log: any, idx: number) => (
                                            <div key={idx} className="p-5 hover:bg-white/[0.03] transition-colors group">
                                                <div className="flex justify-between items-start gap-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-white/80">{log.event}</p>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="secondary" className="text-[7px] font-black uppercase h-4 px-1.5">{log.module}</Badge>
                                                                <span className="text-[10px] font-bold text-white/20">{format(parseISO(log.timestamp), 'dd MMM, HH:mm:ss')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {log.event.toLowerCase().includes('download') && (
                                                        <Badge className="bg-blue-600 text-[8px] font-black uppercase border-none px-2 h-5">EXPORT DETECTED</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 space-y-8">
            <header className="flex items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black uppercase tracking-tighter">{company?.name}</h1>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase px-3 h-6">DATA SILO ACTIVE</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Silo ID: {companyId}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-[8px] font-black uppercase text-white/20 mb-0.5">Total Silo Flow</p>
                        <p className="text-xl font-black">{metrics?.overallInteractions || 0}</p>
                    </div>
                    <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-[8px] font-black uppercase text-white/20 mb-0.5">Global Downloads</p>
                        <p className="text-xl font-black">{metrics?.totalDownloads || 0}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Staff Interaction Profiles
                    </h3>
                    
                    <div className="grid gap-6">
                        {metrics?.userMetrics.map(u => (
                            <Card 
                                key={u.id} 
                                className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                                onClick={() => setSelectedUserId(u.id)}
                            >
                                <CardHeader className="bg-white/[0.02] border-b border-white/5 p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
                                                <Users className="h-6 w-6 text-white/40 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg font-black uppercase tracking-tight text-white">{u.name || 'Anonymous Operator'}</CardTitle>
                                                    <Badge className="bg-primary/20 text-primary border-none text-[7px] font-black uppercase px-2 h-4 opacity-0 group-hover:opacity-100 transition-opacity">VIEW RESUME</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge variant="secondary" className="text-[7px] font-black uppercase h-4 px-1.5">{u.role}</Badge>
                                                    <span className="text-[10px] font-bold text-white/20">{u.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase text-white/20 mb-1">Presence Time</p>
                                            <div className="flex items-center gap-2 text-primary">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-lg font-black tracking-tight">{Math.floor(u.totalMinutes / 60)}h {u.totalMinutes % 60}m</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                                            <MousePointer2 className="h-4 w-4 mx-auto mb-2 text-primary opacity-40" />
                                            <p className="text-lg font-black">{u.interactions}</p>
                                            <p className="text-[8px] font-black uppercase opacity-20">Interactions</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                                            <DownloadCloud className="h-4 w-4 mx-auto mb-2 text-blue-500 opacity-40" />
                                            <p className="text-lg font-black">{u.downloads}</p>
                                            <p className="text-[8px] font-black uppercase opacity-20">Exports</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                                            <Activity className="h-4 w-4 mx-auto mb-2 text-green-500 opacity-40" />
                                            <p className="text-xs font-black uppercase">{u.lastActive ? format(parseISO(u.lastActive), 'dd MMM') : '--'}</p>
                                            <p className="text-[8px] font-black uppercase opacity-20">Last Seen</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                                            <LayoutDashboard className="h-4 w-4 mx-auto mb-2 text-purple-500 opacity-40" />
                                            <p className="text-lg font-black">{Object.keys(u.moduleInteractions).length}</p>
                                            <p className="text-[8px] font-black uppercase opacity-20">Modules</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center pt-2">
                                        <Button variant="ghost" className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-primary group-hover:bg-primary/5 transition-all w-full h-10 rounded-xl">
                                            Open Detailed Audit Resume <ArrowRight className="ml-2 h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <Card className="bg-[#141414] border-white/5 shadow-2xl overflow-hidden sticky top-10">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <History className="h-3 w-3" />
                                Global Silo Stream
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <div className="divide-y divide-white/5">
                                    {sortedLogs.slice(0, 100).map((log: any, idx: number) => (
                                        <div key={idx} className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                                                <div className="space-y-1 overflow-hidden">
                                                    <p className="text-[11px] font-bold text-white/80 line-clamp-2">{log.event}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black uppercase text-primary">{log.module}</span>
                                                        <span className="text-[8px] font-bold text-white/10 uppercase">{format(parseISO(log.timestamp), 'HH:mm:ss')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
