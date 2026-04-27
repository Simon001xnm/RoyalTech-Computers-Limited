
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
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, RefreshCcw, ShieldAlert } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { forceResetMasterAccount } from '@/firebase/server-actions';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showForceReset, setShowForceReset] = useState(false);
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
        toast({ variant: 'destructive', title: 'Information Required' });
        return;
    }

    setIsLoading(true);
    const isMaster = MASTER_KEYS.includes(email.toLowerCase());
    let role: 'super_admin' | 'admin' | 'user' = isMaster ? 'super_admin' : 'user';
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });

        await setDoc(doc(firestore, 'users', newUser.uid), {
            id: newUser.uid,
            name: name,
            email: email.toLowerCase(),
            role: role,
            tenantId: null, 
            tenantIds: [],
            createdAt: new Date().toISOString()
        });

        toast({ title: isMaster ? 'Platform Command Active' : 'Account Created' });
        router.push(isMaster ? '/admin' : '/');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use' && isMaster) {
            try {
                // Attempt repair via login
                const repairCred = await signInWithEmailAndPassword(auth, email, password);
                await setDoc(doc(firestore, 'users', repairCred.user.uid), {
                    role: 'super_admin',
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                toast({ title: 'Master Key Verified' });
                router.push('/admin');
            } catch (repairError: any) {
                setShowForceReset(true);
                toast({ variant: 'destructive', title: 'Repair Failed', description: 'Check credentials or use Force Overwrite.' });
            }
        } else {
            toast({ variant: 'destructive', title: 'Registration Error', description: error.message });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleForceReset = async () => {
      setIsResetting(true);
      try {
          const res = await forceResetMasterAccount(email);
          if (res.success) {
              toast({ title: "Account Deregistered", description: "You can now register this identity again." });
              setShowForceReset(false);
          } else {
              throw new Error(res.error);
          }
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Reset Failed', description: e.message });
      } finally {
          setIsResetting(false);
      }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setIsCapsLockOn(e.getModifierState('CapsLock'));
  };
  
  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105" style={{ backgroundImage: 'url("https://picsum.photos/seed/setup/1920/1080")' }} />
      <Card className="relative w-full max-w-[420px] mx-4 bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl text-white">
        <CardHeader className="text-center items-center pt-10">
          <CardTitle className="text-4xl font-black uppercase tracking-tighter">Initialize Node</CardTitle>
          <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Provision your cloud business identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-4">
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">Identity (Name)</Label>
            <Input placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">System Email</Label>
            <Input placeholder="name@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs uppercase tracking-widest font-black">Access Key (Password)</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handlePasswordKeyDown} disabled={isLoading} className="h-12 bg-black/40 border-white/10 text-white" />
            {isCapsLockOn && <p className="text-[10px] text-orange-400 mt-1 font-black uppercase">⚠️ Caps Lock is active</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4 px-8 pb-12 pt-4">
          <Button onClick={handleSignUp} className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl bg-white text-black hover:bg-white/90 active:scale-95 transition-all" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Syncing Node...</> : 'Establish Cloud ID'}
          </Button>

          {showForceReset && (
              <Button onClick={handleForceReset} variant="destructive" className="w-full h-11 font-bold gap-2 animate-in zoom-in-95" disabled={isResetting}>
                  {isResetting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Force Overwrite Master Node
              </Button>
          )}

          <div className="text-center text-[10px] uppercase font-bold tracking-widest text-white/30 border-t border-white/5 pt-6 w-full">
            Registered Node? <Link href="/login" className="text-white hover:underline">Return to Access</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
