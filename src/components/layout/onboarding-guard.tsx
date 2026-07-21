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
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const PUBLIC_PATHS = ['/login', '/signup'];
const PUBLIC_PREFIXES = ['/solutions', '/resources', '/support', '/company', '/legal'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [isSelfHealing, setIsSelfHealing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const [formData, setFormData] = useState({
    name: '',
    businessType: 'retail',
    industry: '',
    email: '',
    phone: '',
    address: '',
    country: 'Kenya',
    adminPosition: 'Owner',
  });

  const isPublic = PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

  useEffect(() => {
    if (!isProfileLoading && userProfile && !userProfile.tenantId) {
        const portfolio = userProfile.tenantIds || [];
        if (portfolio.length > 0 && userProfileRef) {
            const restoreId = portfolio[portfolio.length - 1];
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
    if (!agreedToTerms) {
        toast({ variant: 'destructive', title: 'Action Required', description: 'You must agree to the terms to continue.' });
        return;
    }
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

      await setDoc(companyRef, setupData);
      
      const currentIds = userProfile?.tenantIds || [];
      await updateDoc(userProfileRef, { 
        tenantId: companyId, 
        tenantIds: [...new Set([...currentIds, companyId])],
        role: 'admin' 
      });

      localStorage.setItem('rcl_last_tenant_id', companyId);
      logger.business('Identity', 'Shop Setup Complete', { companyName: formData.name, companyId });
      toast({ title: 'Shop Ready!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading || isSelfHealing) {
    if (isPublic) return <>{children}</>;
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                {isSelfHealing ? "Connecting to your shop..." : "Loading account..."}
            </p>
        </div>
    );
  }

  if (!user || isPublic) return <>{children}</>;
  
  if (userProfile?.role === 'super_admin') return <>{children}</>;

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
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-4">Setup your shop</h2>
                    <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">
                        Fill in your shop info to start using the system.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/10 p-2 rounded-lg mt-1"><ShieldCheck className="h-4 w-4" /></div>
                        <div>
                            <p className="font-bold text-xs uppercase tracking-widest">Universal Node</p>
                            <p className="text-[10px] opacity-60">Modules adapt to your business type.</p>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 text-center">
                    <p className="text-[10px] text-primary-foreground/50 tracking-widest lowercase">
                        &copy; 2026 shopmanager suite &bull; powered by simonstyless technologies limited
                    </p>
                </div>
              </div>

              <div className="flex flex-col h-auto lg:max-h-[800px]">
                <CardHeader className="border-b bg-white/50 backdrop-blur px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Enter Shop Details</CardTitle>
                        <CardDescription>REGISTER YOUR BUSINESS</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest px-3 h-6">Action Needed</Badge>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-grow">
                    <form onSubmit={handleSetup} className="p-8 space-y-8">
                        <section className="space-y-6">
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground border-b pb-2">Business Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Shop Name <span className="text-red-500">*</span></Label>
                                    <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required placeholder="e.g. RoyalTech Limited" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Business Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required placeholder="office@company.com" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Shop Type</Label>
                                    <Select onValueChange={v => handleInputChange('businessType', v)} value={formData.businessType}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="What do you sell?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail / Hardware</SelectItem>
                                            <SelectItem value="sacco">SACCO / Financial</SelectItem>
                                            <SelectItem value="hospitality">Restaurant / Hotel</SelectItem>
                                            <SelectItem value="barber">Barber / Salon</SelectItem>
                                            <SelectItem value="tech">Computers & IT</SelectItem>
                                            <SelectItem value="service">General Services</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Your Position <span className="text-red-500">*</span></Label>
                                    <Input value={formData.adminPosition} onChange={e => handleInputChange('adminPosition', e.target.value)} required placeholder="CEO, Owner, etc." className="h-11" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                             <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground border-b pb-2">Location</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Physical Address <span className="text-red-500">*</span></Label>
                                    <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} required placeholder="Building, Street..." className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Phone Number <span className="text-red-500">*</span></Label>
                                    <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required placeholder="+254..." className="h-11" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t">
                            <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-xl border">
                                <Checkbox 
                                    id="terms-agreement" 
                                    checked={agreedToTerms} 
                                    onCheckedChange={(checked) => setAgreedToTerms(!!checked)} 
                                    className="mt-1"
                                />
                                <Label htmlFor="terms-agreement" className="text-[10px] font-bold cursor-pointer leading-relaxed text-muted-foreground">
                                    I have read and agree to the <Link href="/legal/terms" className="text-primary underline hover:opacity-80">Terms of Service</Link> and <Link href="/legal/privacy" className="text-primary underline hover:opacity-80">Privacy Policy</Link>. I understand that these terms govern my use of the platform.
                                </Label>
                            </div>
                        </section>

                        <div className="pt-6">
                            <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl transition-all" disabled={isSaving || !agreedToTerms}>
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Setting up...
                                    </div>
                                ) : 'Finish Setup'}
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
