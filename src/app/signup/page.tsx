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
import { Loader2 } from 'lucide-react';

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

    // MASTER KEY LOGIC: Hardened Super Admin Identities
    const MASTER_KEYS = ["master@royaltech.com", "admin@royaltech.com"];
    let role: 'super_admin' | 'admin' | 'user' = 'user';
    
    if (MASTER_KEYS.includes(email.toLowerCase())) {
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
            // non-blocking write for prototype
            setDoc(userDocRef, {
                id: user.uid,
                name: name,
                email: email.toLowerCase(),
                role: role,
                tenantId: null, 
                tenantIds: [],
                createdAt: new Date().toISOString()
            });

            toast({
                title: role === 'super_admin' ? 'Platform Command Active' : 'Account Created',
                description: role === 'super_admin' 
                    ? 'Global Technician privileges permanently granted.' 
                    : 'Welcome to your professional business node.',
            });
            
            router.push(role === 'super_admin' ? '/admin' : '/');
        })
        .catch((error) => {
            let description = "Registration could not be completed.";
            if (error.code === 'auth/email-already-in-use') description = 'This email address is already registered.';
            toast({ variant: 'destructive', title: 'Registration Error', description });
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
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105 transition-transform duration-[3000ms]" style={{ backgroundImage: 'url("https://picsum.photos/seed/setup/1920/1080")' }} />
      <Card className="relative w-full max-w-[420px] mx-4 bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-10">
          <CardTitle className="text-4xl font-black uppercase tracking-tighter">Initialize Node</CardTitle>
          <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Provision your cloud business identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-4">
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">Identity (Name)</Label>
            <Input placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">System Email</Label>
            <Input placeholder="master@royaltech.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">Access Key (Password)</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handlePasswordKeyDown} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white" />
            {isCapsLockOn && <p className="text-[10px] text-orange-400 mt-1 font-black uppercase">⚠️ Caps Lock is active</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-6 px-8 pb-12 pt-4">
          <Button onClick={handleSignUp} className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl bg-white text-black hover:bg-white/90 active:scale-95 transition-all" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Syncing Node...</> : 'Establish Cloud ID'}
          </Button>
          <div className="text-center text-[10px] uppercase font-bold tracking-widest text-white/30 border-t border-white/5 pt-6 w-full">
            Registered Node? <Link href="/login" className="text-white hover:underline">Return to Access</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
