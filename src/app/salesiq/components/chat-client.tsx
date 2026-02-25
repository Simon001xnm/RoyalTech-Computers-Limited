
"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp | Date | null;
}

export function ChatClient() {
  const [input, setInput] = useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesCollection = useMemoFirebase(
    () => user ? query(collection(firestore, 'messages'), orderBy('createdAt', 'asc')) : null,
    [firestore, user]
  );
  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesCollection);
  const isLoading = isUserLoading || messagesLoading;

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const newMessage = {
      text: input,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      createdAt: serverTimestamp() 
    };

    addDocumentNonBlocking(collection(firestore, 'messages'), newMessage);
    setInput('');
  };

  return (
    <>
      <PageHeader
        title="SalesIQ Live Chat"
        description="Engage with other registered users in a real-time group chat."
      />
      <Card className="shadow-lg h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle>Group Chat</CardTitle>
          <CardDescription>This is a shared chat room for all team members.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {isLoading && <p className="text-center text-muted-foreground">Loading chat history...</p>}
              {!isLoading && messages && messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2" />
                    <p>No messages yet. Be the first to say something!</p>
                </div>
              )}
              {messages && messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-3", message.userId === user?.uid ? 'justify-end' : 'justify-start')}>
                  {message.userId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.userAvatar} alt={message.userName} data-ai-hint="person avatar" />
                        <AvatarFallback>{message.userName.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("rounded-lg px-4 py-2 max-w-sm", message.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    {message.userId !== user?.uid && <p className="text-xs font-semibold mb-1">{message.userName}</p>}
                    <p className="text-sm">{message.text}</p>
                     <p className="text-xs text-right mt-1 opacity-70">
                        {message.createdAt instanceof Timestamp ? format(message.createdAt.toDate(), 'HH:mm') : 'sending...'}
                    </p>
                  </div>
                   {message.userId === user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.userAvatar} alt={message.userName} data-ai-hint="person avatar" />
                        <AvatarFallback>{message.userName.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!user || isLoading}
            />
            <Button type="submit" size="icon" disabled={!user || isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
