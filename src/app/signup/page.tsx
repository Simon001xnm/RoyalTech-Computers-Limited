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
import { Loader2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { logger } from '@/lib/logger';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  
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
        toast({ variant: 'destructive', title: 'Information Required', description: 'Please fill all fields.' });
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

        logger.business('Identity', 'Account Registration Complete', { email: normalizedEmail, role: finalRole });
        toast({ title: 'Account Activated', description: `Welcome ${name}! You have been granted ${finalRole} access.` });
        
        router.push('/');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
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
          toast({ variant: 'destructive', title: 'Google Registration Failed', description: e.message });
      }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="w-6 h-6 text-primary animate-spin opacity-20" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4 font-sans py-12">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Floating Logo Box */}
        <Link 
            href="/" 
            className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-3 mb-8 hover:shadow-md transition-all active:scale-95"
        >
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
        </Link>

        <div className="text-center space-y-2 mb-10">
          <h1 className="text-[32px] font-bold text-[#0e1217] tracking-tight leading-tight">Join BusinessHub</h1>
          <p className="text-[#5e6670] text-lg">Start your professional workspace today.</p>
        </div>
        
        <div className="w-full space-y-8">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignUp} 
            disabled={isLoading}
            className="w-full h-[54px] bg-white border-[#d0d5dd] text-[#344054] hover:bg-gray-50 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
            </div>
            <span>Sign up with Google</span>
          </Button>

          <div className="pt-2 text-center">
            <button 
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="inline-flex items-center gap-2 text-[#5e6670] hover:text-[#0e1217] font-semibold text-base transition-colors py-2"
            >
                Continue with email
                {showEmailAuth ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showEmailAuth && (
                <div className="space-y-4 mt-8 text-left animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-[#d0d5dd] rounded-xl bg-white" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Work Email</Label>
                        <Input 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          className="h-12 border-[#d0d5dd] rounded-xl bg-white" 
                          placeholder="name@company.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Create Password</Label>
                        <Input 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="h-12 border-[#d0d5dd] rounded-xl bg-white" 
                          placeholder="Min 6 characters"
                        />
                    </div>
                    <Button onClick={handleSignUp} className="w-full h-12 text-base font-bold rounded-xl mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
                    </Button>
                </div>
            )}
          </div>
        </div>

        <div className="mt-12 w-full flex flex-col items-center gap-8">
          <p className="text-sm text-[#5e6670] leading-relaxed max-w-[320px] text-center">
            By continuing, you agree to our <a href="#" className="text-primary hover:underline font-semibold">Terms of Service</a>. 
          </p>
          
          <div className="pt-6 border-t border-gray-200 w-full text-center">
            <p className="text-[#5e6670] text-sm">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
