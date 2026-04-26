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

    // MASTER KEY LOGIC (Definitive Super Admin)
    const MASTER_KEY_EMAIL = "master@royaltech.com";
    let role: 'super_admin' | 'admin' | 'user' = 'user';
    
    if (email.toLowerCase() === MASTER_KEY_EMAIL.toLowerCase()) {
        role = 'super_admin';
    } else {
        try {
            const adminQuery = query(collection(firestore, 'users'), where('role', '==', 'super_admin'), limit(1));
            const adminSnapshot = await getDocs(adminQuery);
            role = adminSnapshot.empty ? 'super_admin' : 'admin';
        } catch (e) {
            role = 'admin';
        }
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
                id: user.uid,
                name: name,
                email: email.toLowerCase(),
                role: role,
                tenantId: null, 
                tenantIds: [],
                createdAt: new Date().toISOString()
            });

            toast({
                title: role === 'super_admin' ? 'Platform Node Active' : 'Account Created',
                description: role === 'super_admin' 
                    ? 'Global Technician privileges granted.' 
                    : 'Welcome to the suite!',
            });
            
            router.push(role === 'super_admin' ? '/admin' : '/');
        })
        .catch((error) => {
            let description = "Registration could not be completed.";
            if (error.code === 'auth/email-already-in-use') description = 'This email address is already registered.';
            toast({ variant: 'destructive', title: 'Sign-up Error', description });
        })
        .finally(() => {
            setIsLoading(false);
        });
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setIsCapsLockOn(e.getModifierState('CapsLock'));
  };
  
  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80" style={{ backgroundImage: 'url("https://picsum.photos/seed/setup/1920/1080")' }} />
      <Card className="relative w-full max-w-[400px] mx-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-8">
          <CardTitle className="text-3xl font-bold tracking-tight mb-2">Initialize Suite</CardTitle>
          <CardDescription className="text-white/60">Register your business node identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8">
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-semibold">Full Name</Label>
            <Input placeholder="e.g. platform admin" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/5 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-semibold">Master Identity (Email)</Label>
            <Input placeholder="master@royaltech.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/5 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-semibold">Access Key (Password)</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handlePasswordKeyDown} disabled={isLoading} className="h-12 bg-black/40 border-white/5 text-white" />
            {isCapsLockOn && <p className="text-[10px] text-orange-400 mt-1 font-medium uppercase">⚠️ Caps Lock active</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-6 px-8 pb-10 pt-2">
          <Button onClick={handleSignUp} className="w-full h-12 text-base font-bold shadow-xl bg-white text-black hover:bg-white/90" disabled={isLoading}>
            {isLoading ? 'Synchronizing...' : 'Finalize Registration'}
          </Button>
          <div className="text-center text-sm text-white/40">
            Already registered? <Link href="/login" className="text-white hover:underline font-semibold">Sign in to node</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
