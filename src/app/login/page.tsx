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
import Image from 'next/image';

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
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader className="text-center items-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Image src="/picture1.png" alt="App Logo" width={40} height={40} className="rounded-md" />
          </div>
          <CardTitle className="text-2xl">{`Welcome to ${APP_NAME}`}</CardTitle>
          <CardDescription>Enter your credentials to access your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signin">Email</Label>
            <Input
              id="email-signin"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signin">Password</Label>
            <Input
              id="password-signin"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyDown}
              disabled={isLoading}
            />
             {isCapsLockOn && <p className="text-xs text-destructive mt-2">Caps Lock is on</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
