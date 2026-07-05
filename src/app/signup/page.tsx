
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

/**
 * @fileOverview Signup Page
 * Handles new account registration with automatic role assignment.
 * First user of a node becomes Admin automatically.
 */
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
        // 1. Check for existing Provisioned profile (Invited by an Admin)
        const q = query(collection(firestore, 'users'), where('email', '==', normalizedEmail), where('status', '==', 'invited'));
        const snap = await getDocs(q);
        const invitedProfile = !snap.empty ? snap.docs[0].data() : null;

        // 2. Create the Authentication Account
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });

        // 3. Determine Role
        // If they were invited, use that role. 
        // If not, they are the first user (Admin) of a new workspace.
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

        // 4. Cleanup the temporary invitation record if it existed
        if (!snap.empty) {
            await deleteDoc(doc(firestore, 'users', snap.docs[0].id));
        }

        logger.business('Identity', 'Account Registration Complete', { email: normalizedEmail, role: finalRole });
        toast({ title: 'Account Activated', description: `Welcome ${name}! You have been granted ${finalRole} access.` });
        
        // Push to root - OnboardingGuard will catch them if they need to create a workspace
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
      <Card className="w-full max-w-[440px] border-none shadow-none bg-transparent">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-3 mb-2">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[32px] font-bold text-[#0e1217] tracking-tight leading-tight">Join BusinessHub</h1>
          <p className="text-[#5e6670] text-lg">Start your free usage period today.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignUp} 
            disabled={isLoading}
            className="w-full h-[52px] bg-white border-[#d0d5dd] text-[#344054] hover:bg-gray-50 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <img src="/2a5758d6-4edb-4047-87bb-e6b94dbbbab0-cover.png" alt="Google" className="w-full h-full object-contain" />
            </div>
            <span>Sign up with Google</span>
          </Button>

          <div className="pt-2">
            <button 
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="w-full flex items-center justify-center gap-2 text-[#5e6670] hover:text-[#0e1217] font-semibold text-base transition-colors py-2"
            >
                Continue with email
                {showEmailAuth ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showEmailAuth && (
                <div className="space-y-4 mt-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-[#d0d5dd] rounded-xl" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Work Email</Label>
                        <Input 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          className="h-12 border-[#d0d5dd] rounded-xl" 
                          placeholder="name@company.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Create Password</Label>
                        <Input 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="h-12 border-[#d0d5dd] rounded-xl" 
                          placeholder="Min 6 characters"
                        />
                    </div>
                    <Button onClick={handleSignUp} className="w-full h-12 text-base font-bold rounded-xl mt-2" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
                    </Button>
                </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-10 pt-8 text-center">
          <p className="text-sm text-[#5e6670] leading-relaxed max-w-[320px]">
            By continuing, you agree to our <a href="#" className="text-primary hover:underline font-semibold">Terms of Service</a>. 
          </p>
          
          <div className="space-y-6 pt-4 border-t border-gray-200 w-full">
            <p className="text-[#5e6670] text-sm">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
