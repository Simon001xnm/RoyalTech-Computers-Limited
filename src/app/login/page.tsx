'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Zap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6 font-sans">
      <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center p-3 mb-4 border border-black/5">
                <Zap className="w-full h-full text-primary fill-primary" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Shop Login</h1>
            <p className="text-[10px] text-muted-foreground font-black mt-2 uppercase tracking-widest">STAFF ONLY ACCESS</p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden">
          <CardHeader className="bg-white pt-10 pb-2 px-8 md:px-10 text-center">
            <CardTitle className="text-3xl font-black tracking-tighter">Welcome Back</CardTitle>
            <CardDescription className="text-sm font-medium">Enter your email and password to start working.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 md:p-10 bg-white space-y-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input 
                    type="email" 
                    placeholder="you@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 rounded-xl bg-muted/20 border-none px-4 focus:ring-2 focus:ring-primary/20 font-bold" 
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                    <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        disabled={isResetting}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-80 underline underline-offset-4"
                    >
                        Forgot?
                    </button>
                </div>
                <div className="relative">
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="h-12 rounded-xl bg-muted/20 border-none px-4 pr-12 focus:ring-2 focus:ring-primary/20 font-bold" 
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

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="remember" className="border-muted-foreground/30" />
                <Label htmlFor="remember" className="text-xs font-bold text-muted-foreground cursor-pointer uppercase tracking-tighter">Stay logged in</Label>
            </div>

            <Button 
                onClick={handleSignIn} 
                className="w-full h-16 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 bg-primary text-white hover:bg-primary/90 mt-4" 
                disabled={isProcessing}
            >
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'LOGIN TO SHOP'}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                v3.0.0 &bull; simple shop manager &bull; secured
            </p>
        </div>
      </div>
    </div>
  );
}
