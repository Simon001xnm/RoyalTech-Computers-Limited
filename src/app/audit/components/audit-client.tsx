'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Filter, ShieldCheck, AlertCircle, Info, DollarSign } from 'lucide-react';

export function AuditClient() {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Siloed Logs: Index-free query (sort in memory)
  const logsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(
      collection(firestore, 'platform_logs'),
      where('tenantId', '==', tenant.id),
      limit(200)
    );
  }, [firestore, tenant?.id]);

  const { data: rawLogs, isLoading } = useCollection(logsQuery);

  const logs = useMemo(() => {
    if (!rawLogs) return [];
    
    // 1. In-memory sort by timestamp
    const sorted = [...rawLogs].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
    });

    // 2. Filters
    return sorted.filter(log => {
        const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
        const matchesSearch = !searchTerm || 
            log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.module.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
    });
  }, [rawLogs, levelFilter, searchTerm]);

  const getLogIcon = (level: string) => {
    switch (level) {
        case 'business': return <DollarSign className="h-3 w-3 text-green-600" />;
        case 'error': return <AlertCircle className="h-3 w-3 text-red-600" />;
        case 'warn': return <AlertCircle className="h-3 w-3 text-orange-600" />;
        default: return <Info className="h-3 w-3 text-blue-600" />;
    }
  };

  const getLevelBadge = (level: string) => {
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (level === 'business') variant = "default";
      if (level === 'error') variant = "destructive";
      return <Badge variant={variant} className="text-[9px] h-4 uppercase">{level}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Internal Audit Trail" 
        description="Private activity logs and business event history synced from the cloud."
      />

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
            <Card className="shadow-md border-muted/40 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Workspace Activity Feed</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search events..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Select value={levelFilter} onValueChange={setLevelFilter}>
                                <SelectTrigger className="h-9 w-32 text-xs bg-background">
                                    <Filter className="h-3 w-3 mr-2" />
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="error">Errors</SelectItem>
                                    <SelectItem value="warn">Warnings</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">Syncing cloud logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="p-20 text-center space-y-3">
                                <div className="bg-muted p-4 rounded-full w-fit mx-auto">
                                    <ShieldCheck className="h-10 w-10 text-muted-foreground opacity-20" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">No matching audit records found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-muted/40">
                                {logs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 bg-muted rounded-md p-1.5 border border-muted-foreground/10">
                                                    {getLogIcon(log.level)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        {getLevelBadge(log.level)}
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.module}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground leading-tight">{log.event}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {log.timestamp ? format(parseISO(log.timestamp), 'PPP p') : 'Recently'}
                                                    </p>
                                                </div>
                                            </div>
                                            {log.id && (
                                                <div className="hidden lg:block">
                                                    <Badge variant="outline" className="text-[8px] font-mono opacity-60">ID: {log.id.slice(0,8)}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Compliance Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-primary/80 leading-relaxed italic">
                        "Audit logs are immutable and cryptographically bound to your business workspace. These records ensure internal accountability and are synced across your team's cloud session."
                    </p>
                    <div className="p-3 bg-background rounded-lg border border-primary/10 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-muted-foreground">Log Retention</span>
                            <span className="text-green-600">CLOUD PERMANENT</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-muted-foreground">Silo Isolation</span>
                            <span className="text-green-600">VERIFIED</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
