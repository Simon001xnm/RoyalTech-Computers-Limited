'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Information Required', description: 'Please enter both email and password.' });
        return;
    }
    
    setIsProcessing(true);
    try {
        await initiateEmailSignIn(auth, email, password);
    } catch (e: any) {
        setIsProcessing(false);
        toast({ variant: 'destructive', title: 'Sign In Failed', description: e.message || 'Incorrect email or password.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
        await initiateGoogleSignIn(auth);
    } catch (e: any) {
        setIsProcessing(false);
        if (e.code !== 'auth/popup-closed-by-user') {
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
      await initiatePasswordReset(auth, email);
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
      <Card className="w-full max-w-[440px] border-none shadow-none bg-transparent">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-3 mb-2">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[32px] font-bold text-[#0e1217] tracking-tight leading-tight">Welcome back!</h1>
          <p className="text-[#5e6670] text-lg">Sign in to manage your workspace.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            disabled={isProcessing}
            className="w-full h-[52px] bg-white border-[#d0d5dd] text-[#344054] hover:bg-gray-50 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <img src="/2a5758d6-4edb-4047-87bb-e6b94dbbbab0-cover.png" alt="Google" className="w-full h-full object-contain" />
            </div>
            <span>Continue with Google</span>
          </Button>

          <div className="pt-2">
            <button 
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="w-full flex items-center justify-center gap-2 text-[#5e6670] hover:text-[#0e1217] font-semibold text-base transition-colors py-2"
            >
                Continue another way
                {showEmailAuth ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showEmailAuth && (
                <div className="space-y-4 mt-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Email Address</Label>
                        <Input 
                            type="email" 
                            placeholder="name@company.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="h-12 border-[#d0d5dd] rounded-xl focus:ring-primary" 
                        />
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
                            className="h-12 border-[#d0d5dd] rounded-xl focus:ring-primary" 
                        />
                    </div>
                    <Button onClick={handleSignIn} className="w-full h-12 text-base font-bold rounded-xl mt-2" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log in'}
                    </Button>
                </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-8 pt-8 text-center">
          <p className="text-sm text-[#5e6670] leading-relaxed max-w-[320px]">
            By continuing, you agree to the <a href="#" className="text-primary hover:underline font-semibold">Terms of Use</a>. 
            Read our <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
          </p>
          
          <div className="pt-4 border-t border-gray-200 w-full">
            <p className="text-[#5e6670] text-sm">
                New to the platform? <Link href="/signup" className="text-primary hover:underline font-bold">Create Account</Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
