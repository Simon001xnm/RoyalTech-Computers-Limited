'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { 
    Bell, 
    BellRing, 
    Info, 
    AlertTriangle, 
    ShieldCheck, 
    MailOpen, 
    Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview Notification Center
 * Optimized to avoid composite index requirements for instant cloud integration.
 */
export function NotificationCenter() {
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // OPTIMIZED QUERY: We filter by tenantId in the cloud, but sort in memory 
  // to avoid requiring a composite index during prototyping.
  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !tenant) return null;
    return query(
      collection(firestore, 'notifications'),
      where('tenantId', '==', tenant.id)
    );
  }, [firestore, user?.uid, tenant?.id]);

  const { data: rawNotifications, isLoading } = useCollection(notificationsQuery);

  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    // Filter by user and sort by creation date in memory
    return rawNotifications
        .filter(n => !n.userId || n.userId === user?.uid)
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
  }, [rawNotifications, user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length || 0;

  const handleMarkAsRead = async (id: string) => {
    const docRef = doc(firestore, 'notifications', id);
    updateDoc(docRef, { 
        read: true, 
        updatedAt: new Date().toISOString() 
    });
  };

  const handleClearAll = async () => {
    if (!notifications || notifications.length === 0) return;
    
    const batch = writeBatch(firestore);
    notifications.forEach(n => {
      batch.delete(doc(firestore, 'notifications', n.id));
    });
    
    try {
      await batch.commit();
      toast({ title: "Inbox Cleared" });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Clear Failed' });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
        case 'important': return <ShieldCheck className="h-4 w-4 text-primary" />;
        default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          {unreadCount > 0 ? (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <BellRing className="h-5 w-5 text-primary relative z-10" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-background bg-primary text-primary-foreground shadow-sm">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md p-0 flex flex-col border-l shadow-2xl">
        <SheetHeader className="p-6 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Platform Alerts
            </SheetTitle>
            {notifications.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleClearAll} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
          </div>
          <SheetDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Official communications from Platform Admin
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground animate-pulse">Syncing alerts...</div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-muted/40">
                {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={cn(
                            "p-5 transition-all cursor-pointer group hover:bg-muted/30",
                            notif.read ? "opacity-50" : "bg-primary/5 border-l-4 border-l-primary"
                        )}
                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1 shrink-0">
                                {getPriorityIcon(notif.priority)}
                            </div>
                            <div className="space-y-1 flex-grow overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn("text-sm font-bold truncate", !notif.read && "text-primary")}>
                                        {notif.subject}
                                    </p>
                                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                        {notif.createdAt ? format(parseISO(notif.createdAt), 'MMM d, p') : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed pt-1 line-clamp-3">
                                    {notif.message}
                                </p>
                                <div className="pt-3 flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[8px] font-black uppercase py-0 px-2 h-4 border-none opacity-80">
                                        REF: {notif.id.slice(0, 8)}
                                    </Badge>
                                    {!notif.read && (
                                        <Badge variant="default" className="text-[8px] font-black uppercase py-0 px-2 h-4 animate-pulse">NEW</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                <div className="bg-muted p-6 rounded-full mb-4">
                    <MailOpen className="h-10 w-10 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Inbox Empty</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">
                    You have no active notifications from the platform provider at this time.
                </p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/30 text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter opacity-50">
                secured endpoint node &bull; realtime cloud sync active
            </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
