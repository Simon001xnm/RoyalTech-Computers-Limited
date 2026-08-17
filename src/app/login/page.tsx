'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Circle } from 'lucide-react';

/**
 * @fileOverview Modern Login Page
 * Redesigned with a compact split-pane layout and geometric decorative elements.
 */
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
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="w-5 h-5 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      {/* COMPACT CONTAINER: max-w-3xl for big screens */}
      <div className="w-full max-w-3xl h-[560px] flex rounded-[40px] border-none shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-700 bg-white">
        
        {/* LEFT DECORATIVE PANE */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#3b41c5] via-[#7c3aed] to-[#d946ef]">
            {/* Geometric Shapes */}
            <div className="absolute top-[15%] left-[-10%] w-[250px] h-[250px] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-3xl" />
            
            {/* Decorative Spheres */}
            <div className="absolute top-[10%] right-[15%] w-20 h-20 rounded-full bg-gradient-to-br from-white/40 to-transparent shadow-2xl backdrop-blur-sm" />
            <div className="absolute bottom-[20%] left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-white/30 to-transparent shadow-2xl backdrop-blur-sm" />
            
            {/* Rounded Bars */}
            <div className="absolute top-[40%] left-[10%] w-[180px] h-14 bg-gradient-to-r from-orange-400/40 to-purple-400/20 rounded-full rotate-[-45deg]" />
            <div className="absolute top-[20%] left-[-5%] w-[220px] h-14 bg-gradient-to-r from-white/20 to-transparent rounded-full rotate-[-45deg]" />
            <div className="absolute bottom-[10%] right-[5%] w-[220px] h-14 bg-gradient-to-r from-purple-400/20 to-transparent rounded-full rotate-[-45deg]" />

            {/* Company Branding */}
            <div className="absolute top-10 left-10 flex items-center gap-3 text-white z-20 pr-8">
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center p-1.5 shrink-0">
                    <Circle className="w-full h-full fill-white" />
                </div>
                <span className="font-black text-[10px] sm:text-xs tracking-tight uppercase leading-tight">
                  MATESH TECHNOLOGIES LIMITED
                </span>
            </div>
        </div>

        {/* RIGHT LOGIN FORM PANE */}
        <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8">
            {/* Decorative dots in corner */}
            <div className="absolute top-8 right-8 flex gap-1.5 opacity-20">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
            </div>

            {/* COMPACT FORM WIDTH: 280px to 300px */}
            <div className="w-full max-w-[280px] space-y-8">
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-black">LOGIN</h1>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sign in to your shop</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-4">Work Email</Label>
                            <Input 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="h-11 rounded-full bg-[#f4f7fe] border-none px-6 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 shadow-inner text-sm" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-4">Password</Label>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="h-11 rounded-full bg-[#f4f7fe] border-none px-6 pr-12 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 shadow-inner text-sm" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <Button 
                        onClick={handleSignIn} 
                        className="w-full h-11 text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-xl transition-all active:scale-95 bg-[#7c3aed] text-white hover:bg-[#6d28d9] border-none" 
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LOGIN'}
                    </Button>
                </div>
            </div>
            
            <div className="absolute bottom-10 text-center">
                <p className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
                    Matesh Version 3.26
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
