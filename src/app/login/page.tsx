'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Zap, Circle } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1a1c23] p-4 font-sans">
      <div className="w-full max-w-5xl h-[600px] flex rounded-[40px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-700">
        
        {/* LEFT DECORATIVE PANE */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#3b41c5] via-[#7c3aed] to-[#d946ef]">
            {/* Geometric Shapes */}
            <div className="absolute top-[15%] left-[-10%] w-[300px] h-[300px] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-3xl" />
            
            {/* Decorative Spheres */}
            <div className="absolute top-[10%] right-[15%] w-32 h-32 rounded-full bg-gradient-to-br from-white/40 to-transparent shadow-2xl backdrop-blur-sm" />
            <div className="absolute bottom-[20%] left-[10%] w-48 h-48 rounded-full bg-gradient-to-br from-white/30 to-transparent shadow-2xl backdrop-blur-sm" />
            
            {/* Rounded Bars */}
            <div className="absolute top-[40%] left-[10%] w-[250px] h-20 bg-gradient-to-r from-orange-400/40 to-purple-400/20 rounded-full rotate-[-45deg]" />
            <div className="absolute top-[20%] left-[-5%] w-[300px] h-20 bg-gradient-to-r from-white/20 to-transparent rounded-full rotate-[-45deg]" />
            <div className="absolute bottom-[10%] right-[5%] w-[300px] h-20 bg-gradient-to-r from-purple-400/20 to-transparent rounded-full rotate-[-45deg]" />

            {/* Logo Placeholder */}
            <div className="absolute top-10 left-10 flex items-center gap-2 text-white z-20">
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center p-1">
                    <Circle className="w-full h-full fill-white" />
                </div>
                <span className="font-black text-lg tracking-tight uppercase">Logo Here</span>
            </div>
        </div>

        {/* RIGHT LOGIN FORM PANE */}
        <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8 md:p-16">
            {/* Decorative dots in corner */}
            <div className="absolute top-10 right-10 flex gap-1.5 opacity-20">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>

            <div className="w-full max-w-[320px] space-y-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-black">LOGIN</h1>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Input 
                                type="email" 
                                placeholder="Work Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="h-12 rounded-full bg-[#eef6ff] border-none px-6 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/50" 
                            />
                        </div>
                        <div className="relative">
                            <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="h-12 rounded-full bg-[#eef6ff] border-none px-6 pr-12 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/50" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            disabled={isResetting}
                            className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <Button 
                        onClick={handleSignIn} 
                        className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg transition-all active:scale-95 bg-[#7c3aed] text-white hover:bg-[#6d28d9] border-none" 
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'LOGIN'}
                    </Button>
                </div>
            </div>
            
            <div className="absolute bottom-10 text-center">
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                    V3.0 SECURE
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
