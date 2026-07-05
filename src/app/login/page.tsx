'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { logger } from '@/lib/logger';
import { doc } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';

/**
 * @fileOverview Floating Login Form
 * Uses simple English and a clean, high-contrast container.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const isMasterInput = MASTER_KEYS.includes(email.toLowerCase().trim());

  useEffect(() => {
    if (!isUserLoading && user) {
      const userEmail = user.email?.toLowerCase().trim() || "";
      const isActuallyMaster = MASTER_KEYS.includes(userEmail);
      router.push(isActuallyMaster ? '/admin' : '/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Enter email and password.' });
        return;
    }
    
    setIsProcessing(true);
    try {
        await initiateEmailSignIn(auth, email.toLowerCase().trim(), password);
    } catch (e: any) {
        setIsProcessing(false);
        const message = e.code === 'auth/invalid-credential' 
          ? "Account not found or wrong password." 
          : e.message;
        toast({ variant: 'destructive', title: 'Sign In Failed', description: message });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
        await initiateGoogleSignIn(auth);
    } catch (e: any) {
        setIsProcessing(false);
        toast({ variant: 'destructive', title: 'Google Error', description: e.message });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Needed', description: 'Enter your email for reset link.' });
      return;
    }
    setIsResetting(true);
    try {
      await initiatePasswordReset(auth, email.toLowerCase().trim());
      toast({ title: 'Email Sent', description: 'Check your inbox for reset steps.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset Error', description: e.message });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="w-5 h-5 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6 font-sans">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo Container */}
        <div className="flex flex-col items-center mb-8">
            <Link 
                href="/" 
                className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center p-3 mb-6 border border-black/5 hover:scale-105 transition-transform"
            >
                <Zap className="w-full h-full text-primary fill-primary" />
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Welcome back</h1>
            <p className="text-xs text-muted-foreground font-bold mt-2 uppercase tracking-widest">Login to your shop</p>
        </div>

        {/* Floating Card */}
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/5 p-8 md:p-10 space-y-8">
          
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            disabled={isProcessing}
            className="w-full h-12 bg-white border-black/10 text-xs font-bold uppercase tracking-widest hover:bg-muted/50 rounded-xl flex items-center justify-center gap-3 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/5" /></div>
            <span className="relative bg-white px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Or use email</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input 
                    type="email" 
                    placeholder="you@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-11 rounded-xl bg-muted/20 border-none shadow-inner" 
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isResetting}
                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="h-11 rounded-xl bg-muted/20 border-none shadow-inner" 
                />
            </div>

            {isMasterInput && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-primary text-[9px] font-black uppercase">
                <ShieldCheck className="h-3 w-3" /> System Admin Session
              </div>
            )}

            <Button onClick={handleSignIn} className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                Need an account? <Link href="/signup" className="text-accent font-black uppercase tracking-widest hover:underline">Sign Up Now</Link>
            </p>
            <div className="pt-4 border-t border-black/5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Protected by secure node encryption
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
