
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
    Bell, 
    BellRing, 
    X, 
    CheckCircle2, 
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

/**
 * @fileOverview Notification Center (Recipient View)
 * Displays platform alerts sent from the Super Admin.
 */
export function NotificationCenter() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // REACTIVE QUERY: Get notifications for this specific user or their tenant
  const notifications = useLiveQuery(async () => {
    if (!user) return [];
    
    const profile = await db.users.get(user.uid);
    const tid = profile?.tenantId;

    // Fetch all notifications for this tenant
    // Note: We filter for specifically targeted messages vs group broadcasts in memory for simplicity
    const all = await db.notifications
        .where('tenantId').equals(tid || 'platform')
        .toArray();

    return all
        .filter(n => !n.userId || n.userId === user.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleMarkAsRead = async (id: string) => {
    await db.notifications.update(id, { 
        read: true, 
        updatedAt: new Date().toISOString() 
    });
  };

  const handleClearAll = async () => {
    if (!notifications) return;
    const ids = notifications.map(n => n.id);
    await db.notifications.bulkDelete(ids);
    toast({ title: "Inbox Cleared" });
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
            {notifications && notifications.length > 0 && (
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
          {notifications && notifications.length > 0 ? (
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
                                        {format(parseISO(notif.createdAt), 'MMM d, p')}
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
                secured endpoint node &bull; realtime synchronization active
            </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
