
'use client';

import { useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, Loader2, Globe, Phone, MapPin, Briefcase, ShieldCheck, Wallet, Zap, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { User as AppUser, Company } from '@/types';
import { logger } from '@/lib/logger';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLOR_PRESETS = [
  { name: 'Executive Navy', primary: '#1e293b', secondary: '#f1f5f9' },
  { name: 'Forest Green', primary: '#064e3b', secondary: '#ecfdf5' },
  { name: 'Royal Blue', primary: '#1e3a8a', secondary: '#eff6ff' },
  { name: 'Modern Teal', primary: '#0d9488', secondary: '#f0fdfa' },
];

const PUBLIC_PATHS = ['/login', '/signup'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const [isSaving, setIsSaving] = useState(false);
  
  // State Overhaul
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
    mpesaCallbackUrl: '',
    plan: 'free',
    currency: 'KES',
    timezone: 'EAT (UTC+3)',
    primaryColor: COLOR_PRESETS[0].primary,
    secondaryColor: COLOR_PRESETS[0].secondary,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfileRef) return;
    setIsSaving(true);

    try {
      const companyId = crypto.randomUUID();
      const companyRef = doc(firestore, 'companies', companyId);
      
      const setupData: Company = {
        id: companyId,
        tenantId: companyId,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'Owner' }
      } as any;

      await setDoc(companyRef, setupData);

      const currentIds = userProfile?.tenantIds || [];
      await updateDoc(userProfileRef, { 
        tenantId: companyId, 
        tenantIds: [...new Set([...currentIds, companyId])],
        role: 'admin' 
      });

      logger.business('Identity', 'Professional Node Setup Complete', { companyName: formData.name, companyId });
      toast({ title: 'Workspace Initialized' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user) return <>{children}</>;
  if (userProfile?.role === 'super_admin') return <>{children}</>;

  if (userProfile && !userProfile.tenantId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4 md:p-10 font-sans">
          <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-none ring-1 ring-black/5">
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] h-full">
              {/* Sidebar Branding Panel */}
              <div className="bg-primary p-8 text-primary-foreground hidden lg:flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <Zap className="h-[400px] w-[400px] absolute -right-20 -bottom-20" />
                </div>
                <div className="relative z-10">
                    <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-4">Initialize your Node</h2>
                    <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">
                        Welcome to the ecosystem. Your professional node requires activation by providing your business credentials.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/10 p-2 rounded-lg mt-1"><ShieldCheck className="h-4 w-4" /></div>
                        <div>
                            <p className="font-bold text-xs uppercase tracking-widest">Encrypted Storage</p>
                            <p className="text-[10px] opacity-60">Your credentials are cryptographically siloed.</p>
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                        <p className="text-[10px] font-black uppercase mb-1">Technician Note</p>
                        <p className="text-[11px] italic opacity-80">"Fields marked with * are critical for payment API and legal compliance."</p>
                    </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex flex-col h-[85vh] lg:h-[800px]">
                <CardHeader className="border-b bg-white/50 backdrop-blur sticky top-0 z-20 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Business Node Setup</CardTitle>
                        <CardDescription>Configuration for Simon Styles Technologies Ecosystem.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest px-3 h-6">Action Required</Badge>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-grow">
                    <form onSubmit={handleSetup} className="p-8 space-y-12">
                        {/* SECTION 1: IDENTITY */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Basic Company Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Company Name <span className="text-red-500">*</span></Label>
                                    <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required placeholder="Official Entity Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Business Type <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => handleInputChange('businessType', v)} value={formData.businessType}>
                                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="real-estate">Real Estate</SelectItem>
                                            <SelectItem value="tech">Tech Services</SelectItem>
                                            <SelectItem value="sacco">SACCO</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Industry Category <span className="text-red-500">*</span></Label>
                                    <Input value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} required placeholder="e.g. IT, Finance, Trade" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Website URL (Optional)</Label>
                                    <div className="flex">
                                        <div className="bg-muted border border-r-0 flex items-center px-3 rounded-l-md"><Globe className="h-3 w-3" /></div>
                                        <Input value={formData.website} onChange={e => handleInputChange('website', e.target.value)} className="rounded-l-none" placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">Business Description (Optional)</Label>
                                <Textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Short profile about your node..." />
                            </div>
                        </section>

                        {/* SECTION 2: CONTACT */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <Phone className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Contact & Localization</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Official Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required placeholder="name@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Primary Phone <span className="text-red-500">*</span></Label>
                                    <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required placeholder="+254 7..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Alternative Phone</Label>
                                    <Input value={formData.altPhone} onChange={e => handleInputChange('altPhone', e.target.value)} placeholder="Secondary contact" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">City/Town <span className="text-red-500">*</span></Label>
                                    <Input value={formData.city} onChange={e => handleInputChange('city', e.target.value)} required placeholder="e.g. Nairobi" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">Physical Address <span className="text-red-500">*</span></Label>
                                <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} required placeholder="Street, Building, Floor" />
                            </div>
                        </section>

                        {/* SECTION 3: ADMIN & VERIFICATION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Verification & Admin</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Your Position <span className="text-red-500">*</span></Label>
                                    <Input value={formData.adminPosition} onChange={e => handleInputChange('adminPosition', e.target.value)} required placeholder="e.g. CEO, Founder, Director" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">KRA PIN (Optional)</Label>
                                    <Input value={formData.kraPin} onChange={e => handleInputChange('kraPin', e.target.value)} placeholder="For tax documentation" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Cert. of Registration (Optional)</Label>
                                    <Input value={formData.certRegistration} onChange={e => handleInputChange('certRegistration', e.target.value)} placeholder="Company number" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">National ID / Passport (Optional)</Label>
                                    <Input value={formData.nationalId} onChange={e => handleInputChange('nationalId', e.target.value)} placeholder="Personal verification" />
                                </div>
                            </div>
                        </section>

                        {/* SECTION 4: PAYMENT & API */}
                        <section className="space-y-6 p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-primary/20">
                            <div className="flex items-center gap-3 border-b border-primary/10 pb-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-primary">Payment & Billing Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Payment Method <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => handleInputChange('paymentMethod', v)} value={formData.paymentMethod}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M-Pesa">M-Pesa STK Push</SelectItem>
                                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                                            <SelectItem value="Paybill">Paybill</SelectItem>
                                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Till / Paybill Number</Label>
                                    <Input value={formData.billingIdentifier} onChange={e => handleInputChange('billingIdentifier', e.target.value)} placeholder="For collection" />
                                </div>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-xl space-y-4">
                                <p className="text-[10px] font-black uppercase text-primary">M-Pesa Daraja API (For STK Push Integration)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold uppercase opacity-60">Shortcode</Label>
                                        <Input value={formData.mpesaShortcode} onChange={e => handleInputChange('mpesaShortcode', e.target.value)} className="h-8 text-xs font-mono" placeholder="174379" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold uppercase opacity-60">Passkey</Label>
                                        <Input value={formData.mpesaPasskey} onChange={e => handleInputChange('mpesaPasskey', e.target.value)} className="h-8 text-xs font-mono" placeholder="bfb279f..." />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[9px] font-bold uppercase opacity-60">Consumer Key</Label>
                                        <Input value={formData.mpesaConsumerKey} onChange={e => handleInputChange('mpesaConsumerKey', e.target.value)} className="h-8 text-xs font-mono" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[9px] font-bold uppercase opacity-60">Consumer Secret</Label>
                                        <Input type="password" value={formData.mpesaConsumerSecret} onChange={e => handleInputChange('mpesaConsumerSecret', e.target.value)} className="h-8 text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 5: SAAS CONFIG */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">SaaS Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Currency <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => handleInputChange('currency', v)} value={formData.currency}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KES">KES (Shilling)</SelectItem>
                                            <SelectItem value="USD">USD (Dollar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Timezone <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => handleInputChange('timezone', v)} value={formData.timezone}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EAT (UTC+3)">EAT (Nairobi)</SelectItem>
                                            <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Subscription <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => handleInputChange('plan', v)} value={formData.plan}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free Node</SelectItem>
                                            <SelectItem value="basic">Growth Node</SelectItem>
                                            <SelectItem value="pro">Enterprise Node</SelectItem>
                                            <SelectItem value="legacy_pro">Legacy Pro (Gold)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 6: BRANDING */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Node Branding</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Logo</Label>
                                    <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden relative group">
                                        {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Zap className="text-white h-6 w-6" /></div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                                <div className="space-y-6">
                                    <Label className="text-[10px] font-black uppercase">System Theme</Label>
                                    <div className="flex flex-wrap gap-4">
                                        {COLOR_PRESETS.map((preset) => (
                                            <button key={preset.name} type="button" className={cn("p-2 rounded-xl border-2 transition-all flex items-center gap-3", formData.primaryColor === preset.primary ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-transparent hover:bg-muted")} onClick={() => setFormData(prev => ({ ...prev, primaryColor: preset.primary, secondaryColor: preset.secondary }))}>
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                                                <span className="text-[10px] font-bold uppercase">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="pt-10">
                            <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all" disabled={isSaving}>
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Syncing Node...
                                    </div>
                                ) : 'Execute Node Activation'}
                            </Button>
                            <p className="text-center text-[10px] text-muted-foreground uppercase font-bold mt-4 opacity-50">By activating, you agree to platform governance protocols.</p>
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
