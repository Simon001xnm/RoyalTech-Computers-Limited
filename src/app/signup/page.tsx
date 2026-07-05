'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { Loader2, Zap, ShieldCheck } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { logger } from '@/lib/logger';
import Link from 'next/link';

/**
 * @fileOverview Floating Signup Form
 * Optimized for ease of use and professional high-contrast aesthetic.
 */
export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all details.' });
        return;
    }

    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
        const q = query(collection(firestore, 'users'), where('email', '==', normalizedEmail), where('status', '==', 'invited'));
        const snap = await getDocs(q);
        const invitedProfile = !snap.empty ? snap.docs[0].data() : null;

        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });

        const isMaster = MASTER_KEYS.includes(normalizedEmail);
        const finalRole = isMaster ? 'super_admin' : (invitedProfile?.role || 'admin');
        const finalTenantId = invitedProfile?.tenantId || null;
        const finalTenantIds = invitedProfile?.tenantIds || (finalTenantId ? [finalTenantId] : []);
        const finalPermissions = invitedProfile?.permissions || (finalRole === 'admin' ? ['all'] : []);

        await setDoc(doc(firestore, 'users', newUser.uid), {
            id: newUser.uid,
            name: name,
            email: normalizedEmail,
            role: finalRole,
            tenantId: finalTenantId, 
            tenantIds: finalTenantIds,
            permissions: finalPermissions,
            status: 'active',
            createdAt: new Date().toISOString()
        });

        if (!snap.empty) {
            await deleteDoc(doc(firestore, 'users', snap.docs[0].id));
        }

        toast({ title: 'Welcome!', description: 'Your account is ready.' });
        router.push('/');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Signup Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
      setIsLoading(true);
      try {
          await initiateGoogleSignIn(auth);
      } catch (e: any) {
          setIsLoading(false);
          toast({ variant: 'destructive', title: 'Google Error', description: e.message });
      }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="w-5 h-5 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6 font-sans py-12">
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Logo Container */}
        <div className="flex flex-col items-center mb-8">
            <Link 
                href="/" 
                className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center p-3 mb-6 border border-black/5 hover:scale-105 transition-transform"
            >
                <Zap className="w-full h-full text-primary fill-primary" />
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Get Started</h1>
            <p className="text-xs text-muted-foreground font-bold mt-2 uppercase tracking-widest">Create your shop account</p>
        </div>

        {/* Floating Card */}
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/5 p-8 md:p-10 space-y-8">
          
          <Button 
            variant="outline" 
            onClick={handleGoogleSignUp} 
            disabled={isLoading}
            className="w-full h-12 bg-white border-black/10 text-xs font-bold uppercase tracking-widest hover:bg-muted/50 rounded-xl flex items-center justify-center gap-3 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Join with Google</span>
          </Button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/5" /></div>
            <span className="relative bg-white px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Or enter details</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none shadow-inner" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none shadow-inner" placeholder="name@email.com" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none shadow-inner" placeholder="Min 6 characters" />
            </div>

            <Button onClick={handleSignUp} className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 bg-accent text-accent-foreground hover:bg-accent/90 mt-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                Have an account? <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline">Log in here</Link>
            </p>
            <div className="pt-4 border-t border-black/5">
                <p className="text-[9px] font-medium text-muted-foreground/60 leading-relaxed px-6">
                    By joining, you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
