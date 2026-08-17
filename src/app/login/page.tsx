'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Facebook } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
        await initiateGoogleSignIn(auth);
    } catch (e: any) {
        setIsProcessing(false);
        toast({ variant: 'destructive', title: 'Login Error', description: "Could not log in with Google." });
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
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="w-5 h-5 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* LEFT SIDE: FORM */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative z-10">
        <div className="max-w-[440px] w-full mx-auto space-y-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a]">Login</h1>
                <p className="text-sm font-medium text-muted-foreground">
                    Only registered staff can access the shop records.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-sm font-bold text-[#1a1a1a]">Email Address</Label>
                    <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-12 rounded-xl bg-muted/20 border-none px-4 focus:ring-2 focus:ring-primary/20" 
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-[#1a1a1a]">Password</Label>
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-xs font-bold text-primary underline underline-offset-4 hover:opacity-80"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <div className="relative">
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter 6 characters or more"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="h-12 rounded-xl bg-muted/20 border-none px-4 pr-12 focus:ring-2 focus:ring-primary/20" 
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className="border-muted-foreground/30" />
                    <Label htmlFor="remember" className="text-xs font-medium text-muted-foreground cursor-pointer">Remember me</Label>
                </div>

                <Button 
                    onClick={handleSignIn} 
                    className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95 bg-primary text-white hover:bg-primary/90" 
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'LOGIN'}
                </Button>

                <div className="relative text-center py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted/50" /></div>
                    <span className="relative bg-white px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">or login with</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="outline" 
                        onClick={handleGoogleSignIn} 
                        className="h-12 bg-white border-muted rounded-xl gap-2 font-bold text-xs"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-12 bg-white border-muted rounded-xl gap-2 font-bold text-xs"
                    >
                        <Facebook className="w-4 h-4 text-[#1877F2] fill-[#1877F2]" />
                        Facebook
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: ILLUSTRATION */}
      <div className="hidden lg:flex flex-1 bg-muted/10 items-center justify-center p-12">
        <div className="relative w-full max-w-2xl aspect-square">
            <Image 
                src="https://picsum.photos/seed/shopmanager_login/1200/1200" 
                alt="Workspace" 
                fill 
                className="object-contain"
                priority
                data-ai-hint="working woman illustration"
            />
            {/* Geometric Accents to match the requested style */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}