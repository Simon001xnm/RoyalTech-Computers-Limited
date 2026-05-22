
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User as AppUser } from '@/types';
import { logger } from '@/lib/logger';
import { ScrollArea } from '@/components/ui/scroll-area';

const PUBLIC_PATHS = ['/login', '/signup'];

/**
 * OnboardingGuard: Ensures users have an active workspace.
 * Features a Self-Healing mechanism that restores missing tenant IDs from the user's portfolio.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [isSelfHealing, setIsSelfHealing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    industry: '',
    email: '',
    phone: '',
    address: '',
    country: 'Kenya',
    adminPosition: 'Owner',
  });

  // SELF-HEALING IDENTITY LOGIC
  useEffect(() => {
    if (!isProfileLoading && userProfile && !userProfile.tenantId) {
        // If the active tenantId is missing but they have tenantIds in their portfolio,
        // automatically restore the most recent one to prevent the "Setup Required" loop.
        const portfolio = userProfile.tenantIds || [];
        if (portfolio.length > 0 && userProfileRef) {
            const restoreId = portfolio[portfolio.length - 1];
            console.log("Self-healing: Restoring workspace connection for", restoreId);
            setIsSelfHealing(true);
            updateDoc(userProfileRef, { tenantId: restoreId })
                .then(() => {
                    localStorage.setItem('rcl_last_tenant_id', restoreId);
                    setIsSelfHealing(false);
                })
                .catch(() => setIsSelfHealing(false));
        }
    }
  }, [userProfile, isProfileLoading, userProfileRef]);

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
        plan: 'legacy_pro',
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'Owner' }
      };

      // Atomic Cloud Sync
      await setDoc(companyRef, setupData);
      
      const currentIds = userProfile?.tenantIds || [];
      await updateDoc(userProfileRef, { 
        tenantId: companyId, 
        tenantIds: [...new Set([...currentIds, companyId])],
        role: 'admin' 
      });

      localStorage.setItem('rcl_last_tenant_id', companyId);
      logger.business('Identity', 'Business Node Setup Complete', { companyName: formData.name, companyId });
      toast({ title: 'Workspace Activated Successfully' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading || isSelfHealing) {
    if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                {isSelfHealing ? "Restoring Workspace Connection..." : "Syncing Identity Node..."}
            </p>
        </div>
    );
  }

  if (!user || PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  
  if (userProfile?.role === 'super_admin') return <>{children}</>;

  // Show setup ONLY if user profile exists and has NO tenant history
  if (userProfile && !userProfile.tenantId && (!userProfile.tenantIds || userProfile.tenantIds.length === 0)) {
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
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-4">Workspace Activation</h2>
                    <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">
                        Finalize your business registration to initialize your dedicated cloud node.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/10 p-2 rounded-lg mt-1"><ShieldCheck className="h-4 w-4" /></div>
                        <div>
                            <p className="font-bold text-xs uppercase tracking-widest">Permanent Identity</p>
                            <p className="text-[10px] opacity-60">This workspace will be locked to your account.</p>
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex flex-col h-auto lg:max-h-[800px]">
                <CardHeader className="border-b bg-white/50 backdrop-blur px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Business Node Setup</CardTitle>
                        <CardDescription>PLATFORM INFRASTRUCTURE REGISTRATION</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest px-3 h-6">Action Required</Badge>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-grow">
                    <form onSubmit={handleSetup} className="p-8 space-y-8">
                        <section className="space-y-6">
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground border-b pb-2">Business Metadata</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Company Name <span className="text-red-500">*</span></Label>
                                    <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required placeholder="e.g. RoyalTech Limited" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Official Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required placeholder="office@company.com" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Phone <span className="text-red-500">*</span></Label>
                                    <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required placeholder="+254..." className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Position <span className="text-red-500">*</span></Label>
                                    <Input value={formData.adminPosition} onChange={e => handleInputChange('adminPosition', e.target.value)} required placeholder="CEO, Owner, etc." className="h-11" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                             <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground border-b pb-2">Localization</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Physical Address <span className="text-red-500">*</span></Label>
                                    <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} required placeholder="Building, Street..." className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Business Type</Label>
                                    <Select onValueChange={v => handleInputChange('businessType', v)} value={formData.businessType}>
                                        <SelectTrigger className="h-11"><SelectValue placeholder="Select type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail/POS</SelectItem>
                                            <SelectItem value="tech">Technology</SelectItem>
                                            <SelectItem value="service">Service Industry</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <div className="pt-6">
                            <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl transition-all" disabled={isSaving}>
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Activating Node...
                                    </div>
                                ) : 'Complete Workspace Activation'}
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
