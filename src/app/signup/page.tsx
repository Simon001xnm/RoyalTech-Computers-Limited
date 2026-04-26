
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
import { collection, doc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';


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
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
        toast({ variant: 'destructive', title: 'Information Required', description: 'Please fill in all the required fields.' });
        return;
    }

    setIsLoading(true);

    // DETERMINISTIC ROLE ASSIGNMENT
    let role: 'super_admin' | 'admin' | 'user' = 'user';
    
    try {
        const ROOT_ADMIN_EMAIL = "admin@royaltech.com";
        
        if (email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
            role = 'super_admin';
        } else {
            // Check if ANY super admin exists in the system
            const adminQuery = query(
                collection(firestore, 'users'), 
                where('role', '==', 'super_admin'), 
                limit(1)
            );
            const adminSnapshot = await getDocs(adminQuery);
            
            if (adminSnapshot.empty) {
                role = 'super_admin';
            } else {
                role = 'admin';
            }
        }
    } catch (e) {
        role = 'admin';
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
                tenantId: null, // Initialized as null to trigger onboarding
                tenantIds: [],
                createdAt: new Date().toISOString()
            });

            toast({
                title: role === 'super_admin' ? 'Platform Node Active' : 'Account Created',
                description: role === 'super_admin' 
                    ? 'Global Technician privileges granted.' 
                    : 'Welcome! Initializing your workspace setup...',
            });
            
            // Force immediate redirect to dashboard/onboarding
            router.push('/');
        })
        .catch((error) => {
            let description = "Registration could not be completed.";
            if (error.code === 'auth/email-already-in-use') {
                description = 'This email address is already registered.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                description = 'Password must be at least 6 characters.';
            }
            toast({
                variant: 'destructive',
                title: 'Sign-up Error',
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
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p className="animate-pulse text-sm font-medium uppercase tracking-widest">Redirecting to node...</p>
        </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105 transition-transform duration-[2000ms] ease-out"
        style={{ backgroundImage: 'url("https://picsum.photos/seed/setup/1920/1080")' }}
        data-ai-hint="modern office"
      />

      <Card className="relative w-full max-w-[400px] mx-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-8">
          <CardTitle className="text-3xl font-bold tracking-tight mb-2">Initialize Suite</CardTitle>
          <CardDescription className="text-white/60">Register your credentials to access the global business node.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8">
          <div className="space-y-2">
            <Label htmlFor="name-signup" className="text-white/80 text-xs uppercase tracking-widest font-semibold">Full Name</Label>
            <Input
              id="name-signup"
              type="text"
              placeholder="e.g. Platform Admin"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="h-12 bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-primary/50 focus:bg-black/60 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup" className="text-white/80 text-xs uppercase tracking-widest font-semibold">Master Identity (Email)</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="admin@royaltech.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-primary/50 focus:bg-black/60 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup" className="text-white/80 text-xs uppercase tracking-widest font-semibold">Access Key (Password)</Label>
            <Input
              id="password-signup"
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
        <CardFooter className="flex-col gap-6 px-8 pb-10 pt-2">
          <Button onClick={handleSignUp} className="w-full h-12 text-base font-bold shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] bg-white text-black hover:bg-white/90" disabled={isLoading}>
            {isLoading ? 'Synchronizing...' : 'Finalize Registration'}
          </Button>
          <div className="text-center text-sm text-white/40">
            Already registered?{' '}
            <Link href="/login" className="text-white hover:underline transition-colors font-semibold">
              Sign in to node
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
