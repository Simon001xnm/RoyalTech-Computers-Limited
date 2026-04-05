'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useAuth } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';


export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  useEffect(() => {
    // If the user becomes authenticated, immediately send them to home (where setup happens)
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill in all fields.' });
        return;
    }

    setIsLoading(true);

    let role: 'admin' | 'user' = 'user';
    try {
        const usersCollectionRef = collection(firestore, 'users');
        const snapshot = await getDocs(query(usersCollectionRef, limit(1)));
        if (snapshot.empty) {
            role = 'admin';
        }
    } catch (e) {
        console.warn("Could not check for first user, defaulting to 'user' role.", e);
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
                id: user.uid,
                name: name,
                email: email,
                phone: '',
                role: role,
            });

            toast({
                title: 'Welcome!',
                description: 'Your account is ready. Let\'s setup your business workspace.',
            });
            // The useEffect will handle the redirect automatically now
        })
        .catch((error) => {
            let description = "An unknown error occurred.";
            if (error.code === 'auth/email-already-in-use') {
                description = 'This email address is already in use.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                description = 'The password must be at least 6 characters long.';
            }
            toast({
                variant: 'destructive',
                title: 'Sign-up Failed',
                description: description,
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };
  
  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecting to your workspace...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader className="text-center items-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join the {APP_NAME} to manage your business.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-signup">Full Name</Label>
            <Input
              id="name-signup"
              type="text"
              placeholder="e.g. John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email Address</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Password</Label>
            <Input
              id="password-signup"
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
          <Button onClick={handleSignUp} className="w-full h-11" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Get Started'}
          </Button>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
