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
import Link from 'next/link';

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
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070")' }}
      />
      
      {/* Glassmorphism Card */}
      <Card className="relative w-[400px] bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl text-white">
        <CardHeader className="text-center items-center">
          <CardTitle className="text-2xl font-bold tracking-tight">{`Welcome to ${APP_NAME}`}</CardTitle>
          <CardDescription className="text-white/70">Enter your credentials to access your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signin" className="text-white/90">Email</Label>
            <Input
              id="email-signin"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signin" className="text-white/90">Password</Label>
            <Input
              id="password-signin"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyDown}
              disabled={isLoading}
              className="bg-black/40 border-white/10 text-white focus:ring-primary/50"
            />
             {isCapsLockOn && <p className="text-xs text-red-400 mt-2">Caps Lock is on</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button onClick={handleSignIn} className="w-full font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="mt-4 text-center text-sm text-white/60">
            Don't have an account?{' '}
            <Link href="/signup" className="underline text-white hover:text-primary-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
