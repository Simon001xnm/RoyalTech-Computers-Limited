'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Quote, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const quotes = [
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { text: "Business opportunities are like buses, there's always another one coming.", author: "Richard Branson" },
  { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Try not to become a man of success. Rather become a man of value.", author: "Albert Einstein" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Need Information', description: 'Please enter your email and password.' });
        return;
    }
    
    setIsProcessing(true);
    try {
        await initiateEmailSignIn(auth, email.toLowerCase().trim(), password);
    } catch (e: any) {
        setIsProcessing(false);
        const message = e.code === 'auth/invalid-credential' 
          ? "Wrong email or password." 
          : e.message;
        toast({ variant: 'destructive', title: 'Login Error', description: message });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Enter Email', description: 'Tell us your email to get a reset link.' });
      return;
    }
    setIsResetting(true);
    try {
      await initiatePasswordReset(auth, email.toLowerCase().trim());
      toast({ title: 'Email Sent', description: 'Check your inbox for a link to change your password.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset Error', description: "Could not send reset link." });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="w-5 h-5 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <div className="w-full max-w-[320px] min-h-[400px] sm:max-w-[650px] sm:min-h-[450px] md:max-w-[800px] md:min-h-[500px] lg:max-w-[900px] lg:min-h-[550px] flex flex-col sm:flex-row rounded-[40px] border-none shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-700 bg-white relative transition-all">
        
        <div className="w-full sm:w-[50%] bg-gradient-to-br from-[#3b49df] via-[#6366f1] to-[#a855f7] p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
             
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-40 h-40 rounded-full bg-white/10 blur-xl" />
                <div className="absolute bottom-[15%] left-[5%] w-32 h-32 rounded-full bg-gradient-to-br from-white/30 to-transparent shadow-2xl" />
                <div className="absolute top-[10%] right-[15%] w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent shadow-lg" />
                <div className="absolute top-[20%] left-[-20%] w-[300px] h-20 bg-gradient-to-r from-orange-400/30 to-transparent rounded-full rotate-[35deg]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-24 bg-gradient-to-l from-purple-400/20 to-transparent rounded-full rotate-[-45deg]" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                        <div className="w-4 h-4 border-2 border-white rounded-full" />
                    </div>
                    <h2 className="text-sm font-black tracking-tight uppercase leading-tight">
                        MATESH TECHNOLOGIES
                    </h2>
                </div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Shop Workspace</p>
            </div>

            <div className="relative z-10 my-8">
                <div key={currentQuoteIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Quote className="h-10 w-10 text-white/20 mb-6" />
                    <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tight mb-4">
                        "{quotes[currentQuoteIndex].text}"
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[2px] bg-orange-400" />
                        <p className="text-xs font-black uppercase tracking-widest text-orange-400">
                            {quotes[currentQuoteIndex].author}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-1.5 mt-10">
                    {quotes.map((_, i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                i === currentQuoteIndex ? "w-8 bg-white" : "w-2 bg-white/20"
                            )} 
                        />
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                    Version 3.26
                </p>
                <div className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <p className="text-[7px] font-bold uppercase tracking-widest">Enterprise Secured</p>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8 md:p-12 z-10">
            <div className="absolute top-8 right-10 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-200" />
                <div className="w-2 h-2 rounded-full bg-indigo-300" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
            </div>

            <div className="w-full max-w-[280px] space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] uppercase">Login</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Welcome Back</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Input 
                                type="email" 
                                placeholder="Email Address" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="h-12 rounded-2xl bg-[#f4f7fe] border-none px-6 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 text-xs" 
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="h-12 rounded-2xl bg-[#f4f7fe] border-none px-6 pr-12 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 text-xs" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end px-1">
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-[10px] font-black text-muted-foreground/60 hover:text-primary transition-colors uppercase tracking-tight"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <div className="pt-2">
                        <Button 
                            onClick={handleSignIn} 
                            className="w-full h-12 text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white border-none" 
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Workspace'}
                        </Button>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground">
                            Don't have an account? <Link href="/signup" className="text-primary font-black uppercase tracking-widest hover:underline">Sign up</Link>
                        </p>
                    </div>
                </div>
                
                <div className="pt-4 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Secured Shop Node
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 text-center w-full">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link 
                                href="/super-admin" 
                                className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-primary transition-colors"
                            >
                                <ShieldCheck className="h-2 w-2" />
                                System Portal
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-black text-white text-[10px] font-bold uppercase p-3 border-none rounded-xl shadow-2xl">
                           <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 text-primary" />
                                <p className="leading-relaxed">
                                    Master Login: use admin@businesshub.co.ke.<br/>
                                    First time? Please <Link href="/signup" className="underline">Sign Up</Link> first to set your password.
                                </p>
                           </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
      </div>
    </div>
  );
}
