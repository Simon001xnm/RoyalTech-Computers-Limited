
"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Zap, ShieldCheck, User, Bot, Loader2, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useSaaS } from '@/components/saas/saas-provider';
import { askSaymoh, type ChatInput } from '@/ai/flows/saymoh-chat-flow';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function AiClient() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm Saymoh, your business intelligence agent. How can I help you optimize your shop today?" }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const { user } = useUser();
  const { tenant } = useSaaS();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user || !tenant || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    try {
        const result = await askSaymoh({
            message: userMessage,
            tenantId: tenant.id,
            history: messages.slice(-10) // Send last 10 messages for context
        });

        setMessages(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error: any) {
        toast({ 
            variant: 'destructive', 
            title: 'Saymoh is offline', 
            description: 'Could not connect to the intelligence node.' 
        });
    } finally {
        setIsThinking(false);
    }
  };

  const quickPrompts = [
    "What is our current inventory level?",
    "How much have we sold recently?",
    "How many clients are registered?",
    "Draft a welcome email for a new client."
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Saymoh AI Hub"
        description="Autonomous reasoning and data analysis for your business node."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <Card className="shadow-2xl h-[75vh] flex flex-col border-none ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="border-b bg-muted/10 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-2.5 rounded-2xl shadow-lg ring-4 ring-primary/10">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Saymoh Agent</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-5 px-2 text-[8px] font-black uppercase tracking-widest">
                                    <Zap className="h-2.5 w-2.5 mr-1 fill-green-700" />
                                    Active Node
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground">v1.0 Autonomous</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Logic</span>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-hidden bg-card/30 p-0">
                <ScrollArea className="h-full px-6" ref={scrollAreaRef}>
                    <div className="space-y-8 py-8">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            )}>
                                <Avatar className={cn(
                                    "h-10 w-10 ring-4",
                                    msg.role === 'user' ? 'ring-muted' : 'ring-primary/10'
                                )}>
                                    {msg.role === 'user' ? (
                                        <>
                                            <AvatarImage src={`https://picsum.photos/seed/${user.uid}/64/64`} />
                                            <AvatarFallback className="bg-muted text-xs font-bold">ME</AvatarFallback>
                                        </>
                                    ) : (
                                        <div className="bg-primary h-full w-full flex items-center justify-center">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "space-y-2 max-w-[80%]",
                                    msg.role === 'user' ? 'items-end' : 'items-start'
                                )}>
                                    <p className={cn(
                                        "text-[9px] font-black uppercase tracking-widest opacity-40",
                                        msg.role === 'user' ? 'text-right' : 'text-left'
                                    )}>
                                        {msg.role === 'user' ? 'Workspace Owner' : 'Saymoh Intelligence'}
                                    </p>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        msg.role === 'user' 
                                            ? 'bg-black text-white rounded-tr-none' 
                                            : 'bg-white border rounded-tl-none text-foreground'
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 ring-4 ring-primary/10">
                                    <div className="bg-primary h-full w-full flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    </div>
                                </Avatar>
                                <div className="space-y-2">
                                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Saymoh Thinking...</p>
                                     <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-none border border-dashed animate-pulse">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-6 border-t bg-muted/10">
                <form onSubmit={handleSendMessage} className="w-full flex items-center gap-3">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask Saymoh about your business..."
                        className="flex-1 h-14 bg-white rounded-2xl border-none ring-1 ring-black/5 shadow-inner px-6 text-sm font-medium"
                        disabled={isThinking}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!input.trim() || isThinking}
                        className="h-14 w-14 rounded-2xl shadow-xl transition-all active:scale-95 bg-primary text-white hover:bg-primary/90"
                    >
                        <Send className="h-6 w-6" />
                    </Button>
                </form>
            </CardFooter>
        </Card>

        <div className="space-y-6">
            <Card className="border-none ring-1 ring-black/5 shadow-md overflow-hidden bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        Quick Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {quickPrompts.map((p, i) => (
                        <Button 
                            key={i} 
                            variant="outline" 
                            className="w-full justify-between h-auto py-3 text-left bg-white text-[10px] font-bold uppercase tracking-tight hover:bg-primary hover:text-white transition-all group"
                            onClick={() => { setInput(p); }}
                        >
                            <span className="line-clamp-1">{p}</span>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-none ring-1 ring-black/5 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase">Live Inventory Audit</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Real-time counts of available and leased items.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase">Sales Analysis</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Automatic revenue tracking and trend reporting.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase">CRM Intelligence</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Client database monitoring and lead qualification.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="text-center">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase opacity-40">
             Saymoh AI &bull; Autonomous Workspace Agent &bull; Secured Node
          </p>
      </div>
    </div>
  );
}
