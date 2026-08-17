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
 * @fileOverview High-Fidelity Landscape Login Page
 * Redesigned to match geometric split-pane reference.
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      {/* 
          CONTAINER DIMENSIONS (Landscape):
          Default: 320x400 (Portrait for mobile)
          Compact: 600x350 (Landscape sm)
          Premium: 650x380 (Landscape md)
          Desktop: 700x400 (Landscape lg+)
      */}
      <div className="w-full max-w-[320px] min-h-[400px] sm:max-w-[600px] sm:min-h-[350px] md:max-w-[650px] md:min-h-[380px] lg:max-w-[700px] lg:min-h-[400px] flex flex-col sm:flex-row rounded-[32px] border-none shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-700 bg-white relative transition-all">
        
        {/* Left Side: Geometric Decorative Branding */}
        <div className="w-full sm:w-[45%] bg-gradient-to-br from-[#3b49df] via-[#6366f1] to-[#a855f7] p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
             
            {/* Geometric Shapes Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Sphere 1 */}
                <div className="absolute top-[-20%] left-[-10%] w-40 h-40 rounded-full bg-white/10 blur-xl" />
                {/* Sphere 2 */}
                <div className="absolute bottom-[15%] left-[5%] w-32 h-32 rounded-full bg-gradient-to-br from-white/30 to-transparent shadow-2xl" />
                {/* Small Sphere Top */}
                <div className="absolute top-[10%] right-[15%] w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent shadow-lg" />
                {/* Rounded Bar 1 */}
                <div className="absolute top-[20%] left-[-20%] w-[300px] h-20 bg-gradient-to-r from-orange-400/30 to-transparent rounded-full rotate-[35deg]" />
                {/* Rounded Bar 2 */}
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-24 bg-gradient-to-l from-purple-400/20 to-transparent rounded-full rotate-[-45deg]" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <div className="w-3 h-3 border-2 border-white rounded-full" />
                    </div>
                    <h2 className="text-sm font-black tracking-tight uppercase leading-tight">
                        MATESH TECHNOLOGIES LIMITED
                    </h2>
                </div>
                <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Shop Workspace</p>
            </div>

            <div className="relative z-10">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                    Matesh Version 3.26
                </p>
            </div>
        </div>

        {/* Right Side: Login Form Area */}
        <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8 z-10">
            {/* Decorative Dots Top Right */}
            <div className="absolute top-6 right-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-200" />
                <div className="w-2 h-2 rounded-full bg-indigo-300" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
            </div>

            <div className="w-full max-w-[260px] space-y-6">
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#1a1a1a]">LOGIN</h1>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Input 
                                type="email" 
                                placeholder="Username" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="h-10 rounded-full bg-[#f4f7fe] border-none px-6 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 text-xs" 
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="h-10 rounded-full bg-[#f4f7fe] border-none px-6 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/30 text-xs" 
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

                    <div className="flex justify-end px-1">
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-[9px] font-bold text-muted-foreground/60 hover:text-primary transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <div className="pt-2">
                        <Button 
                            onClick={handleSignIn} 
                            className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all active:scale-95 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white border-none" 
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LOGIN'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
