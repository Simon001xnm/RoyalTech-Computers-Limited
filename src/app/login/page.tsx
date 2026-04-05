'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import {
  initiateEmailSignIn,
} from '@/firebase/non-blocking-login';
import { APP_NAME } from '@/lib/constants';
import Link from 'link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = () => {
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password, () => setIsLoading(false));
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };
  
  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p className="animate-pulse">Syncing session...</p>
        </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105 transition-transform duration-[2000ms] ease-out"
        style={{ backgroundImage: 'url("/stimaspt.jpg")' }}
      />
      
      {/* Blurred Mirror Form (Glassmorphism) */}
      <Card className="relative w-full max-w-[400px] mx-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-8">
          <CardTitle className="text-3xl font-bold tracking-tight mb-2">{`Welcome to ${APP_NAME}`}</CardTitle>
          <CardDescription className="text-white/60">Enter your credentials to access your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          <div className="space-y-2">
            <Label htmlFor="email-signin" className="text-white/80 text-xs uppercase tracking-widest font-semibold">Email Address</Label>
            <Input
              id="email-signin"
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-primary/50 focus:bg-black/60 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signin" className="text-white/80 text-xs uppercase tracking-widest font-semibold">Password</Label>
            <Input
              id="password-signin"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyDown}
              disabled={isLoading}
              className="h-12 bg-black/40 border-white/5 text-white focus:ring-primary/50 focus:bg-black/60 transition-all"
            />
             {isCapsLockOn && <p className="text-[10px] text-orange-400 mt-1 font-medium flex items-center gap-1 uppercase">⚠️ Caps Lock is active</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-6 px-8 pb-10">
          <Button onClick={handleSignIn} className="w-full h-12 text-base font-bold shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] bg-white text-black hover:bg-white/90" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Sign In'}
          </Button>
          <div className="text-center text-sm text-white/40">
            Don't have a workspace?{' '}
            <Link href="/signup" className="text-white hover:underline transition-colors font-semibold">
              Create one now
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
