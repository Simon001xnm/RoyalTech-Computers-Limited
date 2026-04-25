"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, limit } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function ChatClient() {
  const [input, setInput] = useState('');
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // FIRESTORE query (Index-free)
  const messagesQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(
        collection(firestore, 'messages'),
        where('tenantId', '==', tenant.id),
        limit(100)
    );
  }, [firestore, tenant?.id]);

  const { data: rawMessages, isLoading } = useCollection(messagesQuery);

  const messages = useMemo(() => {
      if (!rawMessages) return [];
      return [...rawMessages].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
      });
  }, [rawMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !tenant) return;

    try {
        await addDoc(collection(firestore, 'messages'), {
            tenantId: tenant.id,
            text: input,
            userId: user.uid,
            userName: user.displayName || 'User',
            userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
            createdAt: new Date().toISOString()
        });
        setInput('');
    } catch (e) {
        console.error("Failed to post message:", e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Hub (SalesIQ)"
        description="Encrypted real-time communication for your business node."
      />
      <Card className="shadow-xl h-[70vh] flex flex-col border-none ring-1 ring-border">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Workspace Live Feed
                </CardTitle>
                <CardDescription>Collaborate with your team instantly.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                <Zap className="h-3 w-3 mr-1 fill-green-700" /> Secure Node
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden bg-card/50">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-6 py-6">
              {isLoading && <p className="text-center text-muted-foreground animate-pulse">Syncing encrypted chat history...</p>}
              {!isLoading && messages && messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-30 pt-20">
                    <MessageSquare className="h-16 w-16 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No activity in this node yet</p>
                </div>
              )}
              {messages && messages.map((message) => {
                const isPlatformAdmin = message.userId === 'platform_admin';
                const isMe = message.userId === user?.uid;

                return (
                    <div key={message.id} className={cn(
                        "flex items-start gap-3", 
                        isMe ? 'justify-end' : 'justify-start',
                        isPlatformAdmin && 'justify-center w-full my-8'
                    )}>
                      {!isMe && !isPlatformAdmin && (
                        <Avatar className="h-9 w-9 ring-2 ring-background border">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs">{message.userName.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      {isPlatformAdmin ? (
                          <div className="max-w-xl w-full bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-5">
                                  <ShieldCheck className="h-20 w-16" />
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                  <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] px-2 h-5">
                                      <ShieldCheck className="h-3 w-3 mr-1" />
                                      Platform Command
                                  </Badge>
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                      {message.createdAt ? format(new Date(message.createdAt), 'MMM d, HH:mm') : 'Recently'}
                                  </span>
                              </div>
                              <p className="text-sm font-bold text-foreground leading-relaxed">
                                  {message.text}
                              </p>
                              <div className="mt-4 pt-3 border-t border-primary/10">
                                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">
                                      Official infrastructure broadcast &bull; Action may be required
                                  </p>
                              </div>
                          </div>
                      ) : (
                        <div className={cn(
                            "rounded-2xl px-4 py-2.5 max-w-sm shadow-sm", 
                            isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none border'
                        )}>
                            {!isMe && <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{message.userName}</p>}
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <p className={cn(
                                "text-[9px] text-right mt-1.5 font-bold uppercase opacity-40",
                                isMe && "text-primary-foreground"
                            )}>
                                {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '--:--'}
                            </p>
                        </div>
                      )}

                       {isMe && !isPlatformAdmin && (
                        <Avatar className="h-9 w-9 ring-2 ring-background border">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback className="bg-primary text-white text-xs">{message.userName.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t bg-muted/5">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              id="message"
              placeholder="Send message to team..."
              className="flex-1 h-12 rounded-xl bg-background border-none ring-1 ring-border shadow-inner"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!user || isLoading}
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg transition-transform active:scale-95" disabled={!user || isLoading || !input.trim()}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
