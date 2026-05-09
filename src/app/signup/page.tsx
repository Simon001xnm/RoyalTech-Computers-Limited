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
import { Loader2, RefreshCcw, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { forceResetMasterAccount, nuclearPurgePlatform } from '@/firebase/server-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Separator } from '@/components/ui/separator';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showForceReset, setShowForceReset] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Nuclear Reset State
  const [isNuclearOpen, setIsNuclearOpen] = useState(false);
  const [nuclearConfirm, setNuclearConfirm] = useState('');
  const [isPurging, setIsPurging] = useState(false);

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
                const repairCred = await signInWithEmailAndPassword(auth, email, password);
                await setDoc(doc(firestore, 'users', repairCred.user.uid), {
                    role: 'super_admin',
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                toast({ title: 'Master Key Verified' });
                router.push('/admin');
            } catch (repairError: any) {
                setShowForceReset(true);
                toast({ variant: 'destructive', title: 'Repair Failed', description: 'Existing account found. Use Force Overwrite below.' });
            }
        } else {
            toast({ variant: 'destructive', title: 'Registration Error', description: error.message });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
      setIsLoading(true);
      try {
          await initiateGoogleSignIn(auth);
          toast({ title: 'Google Identity Connected' });
      } catch (e: any) {
          setIsLoading(false);
          if (e.code !== 'auth/popup-closed-by-user') {
              toast({ variant: 'destructive', title: 'Google Setup Failed', description: e.message });
          }
      }
  };

  const handleForceReset = async () => {
      setIsResetting(true);
      try {
          const res = await forceResetMasterAccount(email);
          if (res.success) {
              toast({ title: "Master ID Cleared", description: "The existing account has been removed. You can now register fresh." });
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

  const handleNuclearPurge = async () => {
    if (nuclearConfirm !== 'PURGE ALL') return;
    setIsPurging(true);
    try {
        const res = await nuclearPurgePlatform();
        if (res.success) {
            toast({ title: "Database Wiped", description: "All normal accounts have been deregistered and forced to logout." });
            setIsNuclearOpen(false);
            window.location.reload();
        } else {
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Purge Failed', description: e.message });
    } finally {
        setIsPurging(false);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setIsCapsLockOn(e.getModifierState('CapsLock'));
  };
  
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-black overflow-hidden py-12">
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

          <Button onClick={handleSignUp} className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl bg-white text-black hover:bg-white/90 active:scale-95 transition-all mt-2" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Syncing Node...</> : 'Establish Cloud ID'}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><Separator className="bg-white/10" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-transparent px-2 text-white/40">Or register with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleSignUp} 
            disabled={isLoading}
            className="w-full h-12 bg-black/20 border-white/10 text-white hover:bg-white/5 hover:text-white font-bold uppercase text-xs tracking-widest"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.19 3.28-13.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
            </svg>
            Google Identity
          </Button>

          {showForceReset && (
              <Button onClick={handleForceReset} variant="destructive" className="w-full h-11 font-bold gap-2 animate-in zoom-in-95" disabled={isResetting}>
                  {isResetting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Force Deregister Existing Account
              </Button>
          )}

          <div className="flex flex-col items-center gap-6 mt-6 w-full">
            <div className="text-center text-[10px] uppercase font-bold tracking-widest text-white/30 border-t border-white/5 pt-6 w-full">
                Registered Node? <Link href="/login" className="text-white hover:underline">Return to Access</Link>
            </div>
            
            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-[0.2em] text-destructive/40 hover:text-destructive hover:bg-destructive/10" onClick={() => setIsNuclearOpen(true)}>
                <AlertTriangle className="h-3 w-3 mr-2" /> Nuclear Reset Utility
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNuclearOpen} onOpenChange={setIsNuclearOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase text-destructive">Nuclear Reset</DialogTitle>
                <DialogDescription className="font-bold text-xs uppercase text-muted-foreground">Force Deregister & Logout All Accounts</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p className="text-sm leading-relaxed">
                    This action will permanently delete all records from Firestore and remove all user accounts from the authentication system. **Anyone currently logged in will be automatically logged out.**
                </p>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Type "PURGE ALL" to confirm</Label>
                    <Input 
                        value={nuclearConfirm} 
                        onChange={e => setNuclearConfirm(e.target.value)} 
                        placeholder="Confirmation string..." 
                        className="h-12 border-destructive/20 font-black uppercase tracking-widest text-center"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNuclearOpen(false)}>Cancel</Button>
                <Button onClick={handleNuclearPurge} disabled={isPurging || nuclearConfirm !== 'PURGE ALL'} variant="destructive" className="font-black uppercase tracking-widest px-8">
                    {isPurging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />} Execute Purge
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}