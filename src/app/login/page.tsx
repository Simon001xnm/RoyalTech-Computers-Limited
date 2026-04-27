'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

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
        toast({ variant: 'destructive', title: 'Missing Credentials' });
        return;
    }
    
    setIsProcessing(true);
    try {
        await initiateEmailSignIn(auth, email, password);
    } catch (e: any) {
        setIsProcessing(false);
        let description = 'Please check your credentials and try again.';
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            description = 'The email or password you entered is incorrect.';
        }
        toast({ variant: 'destructive', title: 'Sign In Failed', description });
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setIsCapsLockOn(e.getModifierState('CapsLock'));
  };
  
  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="animate-pulse text-xs font-bold uppercase tracking-widest opacity-50">Authenticating session...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105" style={{ backgroundImage: 'url("https://picsum.photos/seed/auth/1920/1080")' }} />
      <Card className="relative w-full max-w-[400px] mx-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-8">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter mb-2">{APP_NAME}</CardTitle>
          <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">Workspace Node Authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          <div className="space-y-2">
            <Label className="text-white/80 text-[10px] uppercase tracking-widest font-black">Email Address</Label>
            <Input type="email" placeholder="name@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProcessing} className="h-12 bg-black/40 border-white/5 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-[10px] uppercase tracking-widest font-black">Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handlePasswordKeyDown} disabled={isProcessing} className="h-12 bg-black/40 border-white/5 text-white" />
             {isCapsLockOn && <p className="text-[10px] text-orange-400 mt-1 font-medium flex items-center gap-1 uppercase">⚠️ Caps Lock is active</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-6 px-8 pb-10">
          <Button onClick={handleSignIn} className="w-full h-12 text-base font-black uppercase tracking-widest shadow-xl bg-white text-black hover:bg-white/90" disabled={isProcessing}>
            {isProcessing ? 'Syncing...' : 'Establish Connection'}
          </Button>
          <div className="text-center text-sm text-white/40">
                New workspace? <Link href="/signup" className="text-white hover:underline font-bold uppercase text-xs">Initialize Node</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
