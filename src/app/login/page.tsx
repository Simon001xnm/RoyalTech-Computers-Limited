'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { logger } from '@/lib/logger';
import { doc } from 'firebase/firestore';
import type { User as AppUser, Company } from '@/types';

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

  // PRE-FETCH FOR LOGGING
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<AppUser>(userRef);

  const companyRef = useMemoFirebase(() => 
    userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
    [firestore, userProfile?.tenantId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  useEffect(() => {
    if (!isUserLoading && user) {
      const userEmail = user.email?.toLowerCase().trim() || "";
      const isActuallyMaster = MASTER_KEYS.includes(userEmail);
      
      // LOG SESSION START
      logger.business('Identity', 'Account Session Started', { 
        email: userEmail, 
        company: company?.name || 'ROOT',
        uid: user.uid
      });

      router.push(isActuallyMaster ? '/admin' : '/');
    }
  }, [user, isUserLoading, router, company]);

  const handleSignIn = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Information Required', description: 'Please enter both email and password.' });
        return;
    }
    
    setIsProcessing(true);
    try {
        await initiateEmailSignIn(auth, email.toLowerCase().trim(), password);
    } catch (e: any) {
        setIsProcessing(false);
        const message = e.code === 'auth/invalid-credential' 
          ? "Account not found or password incorrect. Please sign up if you are new." 
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
        if (e.code === 'auth/popup-blocked') {
            toast({ 
                variant: 'destructive', 
                title: 'Popup Blocked', 
                description: 'Please allow popups for this site in your browser settings to sign in with Google.' 
            });
        } else if (e.code === 'auth/unauthorized-domain') {
            toast({ 
                variant: 'destructive', 
                title: 'Authorized Domain Required', 
                description: 'Please add this domain to authorized domains in Firebase Console.' 
            });
        } else if (e.code !== 'auth/popup-closed-by-user') {
            toast({ 
                variant: 'destructive', 
                title: 'Google Identity Failed', 
                description: e.message || 'Domain not authorized or provider disabled.' 
            });
        }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address to receive a reset link.' });
      return;
    }

    setIsResetting(true);
    try {
      await initiatePasswordReset(auth, email.toLowerCase().trim());
      toast({ title: 'Reset Email Sent', description: `Instructions have been sent to ${email}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset Failed', description: e.message || 'Could not initiate password reset.' });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4 font-sans">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Floating Logo Box */}
        <Link 
            href="/" 
            className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-3 mb-8 hover:shadow-md transition-all active:scale-95"
        >
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
        </Link>

        <div className="text-center space-y-2 mb-10">
          <h1 className="text-[32px] font-bold text-[#0e1217] tracking-tight leading-tight">Welcome back!</h1>
          <p className="text-[#5e6670] text-lg">Sign in to manage your workspace.</p>
        </div>
        
        <div className="w-full space-y-8">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            disabled={isProcessing}
            className="w-full h-[54px] bg-white border-[#d0d5dd] text-[#344054] hover:bg-gray-50 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {/* Standard Google Icon */}
                <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
            </div>
            <span>Continue with Google</span>
          </Button>

          <div className="pt-2 text-center">
            <button 
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="inline-flex items-center gap-2 text-[#5e6670] hover:text-[#0e1217] font-semibold text-base transition-colors py-2"
            >
                Continue another way
                {showEmailAuth ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showEmailAuth && (
                <div className="space-y-4 mt-8 text-left animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Email Address</Label>
                        <Input 
                            type="email" 
                            placeholder="name@company.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="h-12 border-[#d0d5dd] rounded-xl focus:ring-primary bg-white" 
                        />
                        {isMasterInput && (
                          <div className="flex items-center gap-2 p-2 mt-1 bg-primary/5 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3" />
                            Technician Session Detected
                          </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-[#344054]">Password</Label>
                          <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            {isResetting ? 'Sending...' : 'Forgot password?'}
                          </button>
                        </div>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="h-12 border-[#d0d5dd] rounded-xl focus:ring-primary bg-white" 
                        />
                    </div>
                    <Button onClick={handleSignIn} className="w-full h-12 text-base font-bold rounded-xl mt-4" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log in'}
                    </Button>
                </div>
            )}
          </div>
        </div>

        <div className="mt-12 w-full flex flex-col items-center gap-8">
          <p className="text-sm text-[#5e6670] leading-relaxed max-w-[320px] text-center">
            By continuing, you agree to the <a href="#" className="text-primary hover:underline font-semibold">Terms of Use</a>. 
            Read our <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
          </p>
          
          <div className="pt-6 border-t border-gray-200 w-full text-center">
            <p className="text-[#5e6670] text-sm">
                New to the platform? <Link href="/signup" className="text-primary hover:underline font-bold">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
