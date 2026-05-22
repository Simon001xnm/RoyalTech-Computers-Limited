'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Phone, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { User as AppUser, Company } from '@/types';
import { logger } from '@/lib/logger';
import { ScrollArea } from '@/components/ui/scroll-area';

const PUBLIC_PATHS = ['/login', '/signup'];

/**
 * OnboardingGuard: Ensures users have an active workspace.
 * Reinforced with persistent cache detection to prevent "Setup Required" loop on reload.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  // Cache check state to prevent UI flicker
  const [hasActiveSession, setHasActiveSession] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const cachedId = localStorage.getItem('rcl_last_tenant_id');
        setHasActiveSession(!!cachedId);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    industry: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    country: 'Kenya',
    city: '',
    adminPosition: '',
    kraPin: '',
    certRegistration: '',
    businessPermit: '',
    nationalId: '',
    paymentMethod: 'M-Pesa',
    billingIdentifier: '',
    mpesaShortcode: '',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
    mpesaPasskey: '',
    plan: 'free',
    currency: 'KES',
    timezone: 'EAT (UTC+3)',
    primaryColor: '#1e293b',
    secondaryColor: '#f1f5f9',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfileRef) return;
    setIsSaving(true);

    try {
      const companyId = crypto.randomUUID();
      const companyRef = doc(firestore, 'companies', companyId);
      
      const setupData = {
        id: companyId,
        tenantId: companyId,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'Owner' }
      };

      // 1. Create Company Document
      await setDoc(companyRef, setupData);

      // 2. Link User to Workspace
      const currentIds = userProfile?.tenantIds || [];
      await updateDoc(userProfileRef, { 
        tenantId: companyId, 
        tenantIds: [...new Set([...currentIds, companyId])],
        role: 'admin' 
      });

      // 3. PERSISTENT LOCK: Save locally to prevent refresh loop
      localStorage.setItem('rcl_last_tenant_id', companyId);
      setHasActiveSession(true);

      logger.business('Identity', 'Node Setup Complete', { companyName: formData.name, companyId });
      toast({ title: 'Workspace Activated Permanently' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // While determining session or profile, show a deep loader
  if (isUserLoading || isProfileLoading || hasActiveSession === null) {
    if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Data Node</p>
        </div>
    );
  }

  if (!user || PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  
  if (userProfile?.role === 'super_admin') return <>{children}</>;

  // Only show setup if the cloud confirms no tenantId AND local storage confirms no previous session
  if (userProfile && !userProfile.tenantId && !hasActiveSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4 md:p-10 font-sans">
          <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-none ring-1 ring-black/5">
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] h-full">
              <div className="bg-primary p-8 text-primary-foreground hidden lg:flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <Zap className="h-[400px] w-[400px] absolute -right-20 -bottom-20" />
                </div>
                <div className="relative z-10">
                    <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-4">Finalize Activation</h2>
                    <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">
                        Register your business entity once to unlock the full ecosystem. This setup is permanent and siloed.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/10 p-2 rounded-lg mt-1"><ShieldCheck className="h-4 w-4" /></div>
                        <div>
                            <p className="font-bold text-xs uppercase tracking-widest">Permanent Lock</p>
                            <p className="text-[10px] opacity-60">This registration will be saved across reloads.</p>
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex flex-col h-[85vh] lg:h-[800px]">
                <CardHeader className="border-b bg-white/50 backdrop-blur sticky top-0 z-20 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Business Registration</CardTitle>
                        <CardDescription>SIMON STYLES TECHNOLOGIES LIMITED ECOSYSTEM</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest px-3 h-6">Must Complete</Badge>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-grow">
                    <form onSubmit={handleSetup} className="p-8 space-y-10">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Entity Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Company Name <span className="text-red-500">*</span></Label>
                                    <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required placeholder="Official Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Official Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required placeholder="public@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Phone <span className="text-red-500">*</span></Label>
                                    <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required placeholder="+254..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Physical Address <span className="text-red-500">*</span></Label>
                                    <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} required placeholder="Location..." />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Identity & Roles</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Position <span className="text-red-500">*</span></Label>
                                    <Input value={formData.adminPosition} onChange={e => handleInputChange('adminPosition', e.target.value)} required placeholder="CEO, Owner, etc." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Business Type</Label>
                                    <Select onValueChange={v => handleInputChange('businessType', v)} value={formData.businessType}>
                                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="tech">Technology</SelectItem>
                                            <SelectItem value="service">Service Industry</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <div className="pt-6">
                            <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all" disabled={isSaving}>
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Syncing Registration...
                                    </div>
                                ) : 'Initialize Business Node'}
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
              </div>
            </div>
          </Card>
      </div>
    );
  }

  return <>{children}</>;
}
