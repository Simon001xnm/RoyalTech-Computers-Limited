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
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, ChevronDown, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { MASTER_KEYS } from '@/lib/roles';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

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

  const isMasterEmail = MASTER_KEYS.includes(email.toLowerCase().trim());

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push(isMasterEmail ? '/admin' : '/');
    }
  }, [user, isUserLoading, router, isMasterEmail]);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
        toast({ variant: 'destructive', title: 'Information Required' });
        return;
    }

    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();
    const isMaster = MASTER_KEYS.includes(normalizedEmail);
    let role: 'super_admin' | 'admin' | 'user' = isMaster ? 'super_admin' : 'user';
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });

        await setDoc(doc(firestore, 'users', newUser.uid), {
            id: newUser.uid,
            name: name,
            email: normalizedEmail,
            role: role,
            tenantId: null, 
            tenantIds: [],
            createdAt: new Date().toISOString()
        });

        toast({ title: 'Account Created Successfully' });
        router.push(isMaster ? '/admin' : '/');
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
          if (e.code !== 'auth/popup-closed-by-user') {
              toast({ 
                variant: 'destructive', 
                title: 'Google Identity Failed',
                description: e.message || 'Please authorize this domain in Firebase Console.'
              });
          }
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
          <h1 className="text-[32px] font-bold text-[#0e1217] tracking-tight leading-tight">Create your account</h1>
          <p className="text-[#5e6670] text-lg">Join the platform to manage your workspace.</p>
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
            <span>Continue with Google</span>
          </Button>

          <div className="pt-2">
            <button 
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="w-full flex items-center justify-center gap-2 text-[#5e6670] hover:text-[#0e1217] font-semibold text-base transition-colors py-2"
            >
                Continue another way
                {showEmailAuth ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showEmailAuth && (
                <div className="space-y-4 mt-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-[#d0d5dd] rounded-xl" />
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
                        {isMasterEmail && (
                          <div className="flex items-center gap-2 p-2 mt-1 bg-primary/5 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">
                            <ShieldCheck className="h-3 w-3" />
                            Platform Technician Identity Recognized
                          </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#344054]">Set Password</Label>
                        <Input 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="h-12 border-[#d0d5dd] rounded-xl" 
                          placeholder="Choose a strong password"
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
            By continuing, you agree to {APP_NAME}'s <a href="#" className="text-primary hover:underline font-semibold">Terms of Use</a>. 
            Read our <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
          </p>
          
          <div className="space-y-6 pt-4 border-t border-gray-200 w-full">
            <p className="text-[#5e6670] text-sm">
                Already registered? <Link href="/login" className="text-primary hover:underline font-bold">Return to Access</Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}