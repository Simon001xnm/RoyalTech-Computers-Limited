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
import Image from 'next/image';
import placeholderImages from '@/app/lib/placeholder-images.json';

/**
 * @fileOverview Landscape Login Page
 * Specific Dimensions:
 * - Desktop: 700 x 400 px
 * - Premium: 650 x 380 px
 * - Compact: 600 x 350 px
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

  const loginBg = placeholderImages.branding.login_bg;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      {/* 
          CONTAINER DIMENSIONS (Landscape):
          Default: 320x400 (Portrait for very small)
          Compact: 600x350 (Landscape sm)
          Premium: 650x380 (Landscape md)
          Desktop: 700x400 (Landscape lg+)
      */}
      <div className="w-full max-w-[320px] min-h-[400px] sm:max-w-[600px] sm:min-h-[350px] md:max-w-[650px] md:min-h-[380px] lg:max-w-[700px] lg:min-h-[400px] flex flex-col sm:flex-row rounded-[32px] border-none shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-700 bg-white relative transition-all">
        
        {/* Left Side: Decorative Branding */}
        <div className="w-full sm:w-[40%] bg-primary p-8 text-primary-foreground flex flex-col justify-between relative overflow-hidden shrink-0">
             {/* Background Image Overlay */}
            <Image 
                src={loginBg.url} 
                alt="Technology" 
                fill 
                className="object-cover opacity-40 mix-blend-overlay z-0" 
                data-ai-hint={loginBg.hint}
                priority
            />

            <div className="relative z-10">
                <div className="bg-white/20 p-2 rounded-xl w-fit mb-4">
                    <Zap className="h-6 w-6 text-white fill-white" />
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase leading-tight">
                    MATESH TECHNOLOGIES LIMITED
                </h2>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-2">Workspace Portal</p>
            </div>

            <div className="relative z-10">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                    Matesh Version 3.26
                </p>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8 z-10">
            <div className="w-full max-w-[260px] space-y-6">
                <div className="text-center sm:text-left space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-black">LOGIN</h1>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sign in to your shop</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-4">Work Email</Label>
                            <Input 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="h-10 rounded-full bg-[#f4f7fe] border-none px-5 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 shadow-inner text-xs" 
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
                                    className="h-10 rounded-full bg-[#f4f7fe] border-none px-5 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 shadow-inner text-xs" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-2">
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
                        className="w-full h-10 text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-xl transition-all active:scale-95 bg-primary text-white hover:bg-primary/90 border-none" 
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LOGIN'}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
