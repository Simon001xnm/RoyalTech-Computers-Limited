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

export function NotificationCenter() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useLiveQuery(async () => {
    if (!user) return [];
    
    // Get current user profile to find their tenant
    const profile = await db.users.get(user.uid);
    if (!profile?.tenantId) return [];

    return await db.notifications
        .where('tenantId').equals(profile.tenantId)
        .reverse()
        .sortBy('createdAt');
  }, [user]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleMarkAsRead = async (id: string) => {
    // UPDATED: Standardizing read receipt logging for Super Admin oversight
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
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5 text-primary animate-pulse" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-background">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
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
            Administrative messages from simonstyless support
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
                {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={cn(
                            "p-5 transition-colors cursor-pointer group",
                            notif.read ? "opacity-60" : "bg-primary/5"
                        )}
                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                {getPriorityIcon(notif.priority)}
                            </div>
                            <div className="space-y-1 flex-grow">
                                <div className="flex items-center justify-between">
                                    <p className={cn("text-sm font-bold leading-none", !notif.read && "text-primary")}>
                                        {notif.subject}
                                    </p>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        {format(parseISO(notif.createdAt), 'MMM d, p')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                    {notif.message}
                                </p>
                                <div className="pt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-2 h-4">
                                        FROM: {notif.from}
                                    </Badge>
                                    {!notif.read && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <MailOpen className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Inbox Empty</p>
                <p className="text-xs text-muted-foreground mt-1">No platform messages at this time.</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/20 text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">
                verified platform communication node &bull; encrypted sync active
            </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
