
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Image as ImageIcon, Check, Loader2, Building2, Upload, Repeat, PlusCircle, ShieldCheck, Crown, Zap, Globe, Phone, MapPin, Briefcase, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
import placeholderAvatars from '@/lib/placeholder-images.json';
import { cn } from "@/lib/utils";
import { useSaaS } from "@/components/saas/saas-provider";
import { SaaSUsageMeters } from "@/components/saas/saas-usage-meters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant, plan, isLegacyUser, switchTenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Company fields state (Overhauled)
  const [compData, setCompData] = useState({
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
    city: '',
    country: '',
    adminPosition: '',
    kraPin: '',
    certRegistration: '',
    businessPermit: '',
    nationalId: '',
    paymentMethod: '',
    billingIdentifier: '',
    mpesaShortcode: '',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
    mpesaPasskey: '',
    bankName: '',
    bankBranch: '',
    bankAccNo: '',
    bankAccName: '',
    bankCode: '',
    plan: '',
    currency: '',
    timezone: '',
    primaryColor: '',
    secondaryColor: '',
  });

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);

  // CLOUD DATA
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc(userRef);

  const portfolioQuery = useMemoFirebase(() => {
    if (!userProfile?.tenantIds || userProfile.tenantIds.length === 0) return null;
    return query(collection(firestore, 'companies'), where('id', 'in', userProfile.tenantIds));
  }, [firestore, userProfile?.tenantIds]);
  
  const { data: rawWorkspaces, isLoading: isPortfolioLoading } = useCollection(portfolioQuery);
  const availableWorkspaces = rawWorkspaces || [];

  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: company } = useDoc(companyRef);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || authUser?.displayName || "");
      setEmail(userProfile.email || authUser?.email || "");
      setAvatarUrl(userProfile.avatarUrl || authUser?.photoURL || "");
    }
    if (company) {
      setCompData({
        ...compData,
        ...company
      });
    }
  }, [userProfile, authUser, company]);

  const handleInputChange = (field: string, value: string) => {
    setCompData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = async (url: string) => {
    if (!authUser || !userRef) return;
    try {
      setAvatarUrl(url);
      await updateDoc(userRef, { avatarUrl: url });
      toast({ title: 'Avatar Updated' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompData(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyRef) return;
    setIsSaving(true);
    try {
      await updateDoc(companyRef, {
        ...compData,
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Workspace Updated' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWorkspace = async () => {
      if (!authUser || !userRef) return;
      try {
          await updateDoc(userRef, { tenantId: null });
          toast({ title: "Initializing Setup" });
          window.location.reload(); 
      } catch (e) { toast({ variant: 'destructive', title: 'Failed to reset workspace link' }); }
  };

  if (isUserLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Cloud Profile...</p>
      </div>
    );
  }

  const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader title={isSuperAdmin ? "Platform technician identity" : "Profile & Workspace"} description="Manage your cloud credentials and business metadata." />

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* LEFT COLUMN: Identity & Portfolio */}
        <div className="space-y-6">
          <Card className="shadow-md overflow-hidden border-none ring-1 ring-black/5">
            <CardHeader className="items-center text-center bg-muted/20 pb-8">
              <div className="relative group cursor-pointer mt-4" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} />
                  <AvatarFallback className="text-2xl">{(displayName || "U").substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="h-6 w-6 text-white" /></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => handleAvatarSelect(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
              <div className="mt-6 space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">{displayName || 'User'}</CardTitle>
                <CardDescription className="font-medium">{email}</CardDescription>
                <Badge className={cn("mt-4 capitalize px-4 h-7 text-[10px] font-black tracking-widest uppercase", isSuperAdmin ? "bg-primary text-primary-foreground" : "")}>
                    {isSuperAdmin && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {userProfile.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-5 gap-0.5 border-t">
                {placeholderAvatars.avatars.map((av) => (
                  <button key={av.id} onClick={() => handleAvatarSelect(av.url)} className={cn("aspect-square overflow-hidden hover:opacity-80 transition-opacity", avatarUrl === av.url ? "ring-2 ring-inset ring-primary" : "")}>
                    <img src={av.url} className="w-full h-full object-cover" alt="avatar" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isSuperAdmin && (
            <Card className="shadow-md border-primary/20 bg-muted/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-primary" />
                            <CardTitle className="text-xs font-bold uppercase tracking-widest">Portfolio</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNewWorkspaceOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isPortfolioLoading ? (
                      <div className="p-4 text-center text-xs animate-pulse opacity-50 uppercase font-bold">Checking workspaces...</div>
                    ) : availableWorkspaces.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground italic">No workspaces linked.</div>
                    ) : (
                      availableWorkspaces.map(ws => (
                          <div key={ws.id} className={cn("flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer", tenant?.id === ws.id ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]" : "bg-background hover:bg-muted border-black/5")} onClick={() => tenant?.id !== ws.id && switchTenant(ws.id)}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                  {ws.logoUrl ? <img src={ws.logoUrl} className="h-8 w-8 object-contain bg-white rounded p-1 shrink-0" alt="logo" /> : <Building2 className="h-5 w-5 shrink-0 opacity-40" />}
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-black truncate uppercase leading-none">{ws.name}</p>
                                    <p className="text-[9px] opacity-60 truncate mt-1">{ws.city}, {ws.country}</p>
                                  </div>
                              </div>
                              {tenant?.id === ws.id && <Check className="h-4 w-4 shrink-0" />}
                          </div>
                      ))
                    )}
                </CardContent>
            </Card>
          )}

          {!isSuperAdmin && (
            <div className="space-y-6">
                <Card className="shadow-md border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /><CardTitle className="text-xs font-bold uppercase tracking-widest">Plan</CardTitle></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-lg font-black text-primary uppercase tracking-tight">{plan?.name || 'Loading Plan...'}</p>
                        {isLegacyUser && <div className="flex items-start gap-2 p-3 bg-primary text-primary-foreground rounded-xl shadow-lg"><Zap className="h-4 w-4 shrink-0 fill-white" /><div className="space-y-0.5"><p className="text-[10px] font-black uppercase leading-none">Enterprise Unlocked</p><p className="text-[9px] opacity-90">All SaaS features are active.</p></div></div>}
                    </CardContent>
                </Card>
                <SaaSUsageMeters />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Settings Overhaul */}
        <div className="space-y-8">
          {!isSuperAdmin && company && (
            <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-muted/10 border-b p-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Workspace Management</CardTitle>
                            <CardDescription>Professional metadata and API configurations for your node.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/30 rounded-none border-b p-0">
                            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Identity</TabsTrigger>
                            <TabsTrigger value="contact" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Contact</TabsTrigger>
                            <TabsTrigger value="legal" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Legal & Verif</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Payments & API</TabsTrigger>
                        </TabsList>
                        
                        <div className="p-8">
                            <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Brand Identity</Label>
                                        <div className="w-full aspect-square border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative group shadow-inner" onClick={() => logoInputRef.current?.click()}>
                                            {compData.logoUrl ? <img src={compData.logoUrl} className="w-full h-full object-contain p-2" alt="logo" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white h-6 w-6" /></div>
                                        </div>
                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        <p className="text-[9px] text-center text-muted-foreground italic">Preferred: Square PNG with transparent background</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Business Name *</Label><Input value={compData.name} onChange={e => handleInputChange('name', e.target.value)} className="h-11 font-bold" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Industry *</Label><Input value={compData.industry} onChange={e => handleInputChange('industry', e.target.value)} className="h-11" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Position *</Label><Input value={compData.adminPosition} onChange={e => handleInputChange('adminPosition', e.target.value)} className="h-11" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Website</Label><Input value={compData.website} onChange={e => handleInputChange('website', e.target.value)} className="h-11" /></div>
                                        </div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Business Profile</Label><Textarea value={compData.description} onChange={e => handleInputChange('description', e.target.value)} rows={4} /></div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Official Email *</Label><Input value={compData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Primary Phone *</Label><Input value={compData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Alternative Phone</Label><Input value={compData.altPhone} onChange={e => handleInputChange('altPhone', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Country *</Label><Input value={compData.country} onChange={e => handleInputChange('country', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">City/Town *</Label><Input value={compData.city} onChange={e => handleInputChange('city', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Address *</Label><Input value={compData.address} onChange={e => handleInputChange('address', e.target.value)} className="h-11" /></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="legal" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="flex items-center gap-3 mb-6"><ShieldCheck className="h-5 w-5 text-primary" /><h4 className="font-black uppercase tracking-widest text-xs">Identity Verification</h4></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">KRA PIN</Label><Input value={compData.kraPin} onChange={e => handleInputChange('kraPin', e.target.value)} className="h-11 font-mono" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Reg. Certificate</Label><Input value={compData.certRegistration} onChange={e => handleInputChange('certRegistration', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Business Permit</Label><Input value={compData.businessPermit} onChange={e => handleInputChange('businessPermit', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">National ID / Passport</Label><Input value={compData.nationalId} onChange={e => handleInputChange('nationalId', e.target.value)} className="h-11" /></div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="billing" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Payment Method *</Label><Input value={compData.paymentMethod} onChange={e => handleInputChange('paymentMethod', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Paybill/Till Number</Label><Input value={compData.billingIdentifier} onChange={e => handleInputChange('billingIdentifier', e.target.value)} className="h-11 font-bold" /></div>
                                </div>
                                <div className="p-8 bg-black/5 rounded-3xl space-y-6">
                                    <div className="flex items-center gap-3"><Briefcase className="h-5 w-5 text-primary" /><h4 className="font-black uppercase tracking-widest text-xs">Official Bank Settlement</h4></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Bank Name</Label><Input value={compData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Branch</Label><Input value={compData.bankBranch} onChange={e => handleInputChange('bankBranch', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Account Holder Name</Label><Input value={compData.bankAccName} onChange={e => handleInputChange('bankAccName', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Account Number</Label><Input value={compData.bankAccNo} onChange={e => handleInputChange('bankAccNo', e.target.value)} className="h-11" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Bank/Swift Code</Label><Input value={compData.bankCode} onChange={e => handleInputChange('bankCode', e.target.value)} className="h-11" /></div>
                                    </div>
                                </div>
                                <div className="p-8 bg-black/5 rounded-3xl space-y-6">
                                    <div className="flex items-center gap-3"><Zap className="h-5 w-5 text-primary" /><h4 className="font-black uppercase tracking-widest text-xs">Daraja API Credentials</h4></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">M-Pesa Shortcode</Label><Input value={compData.mpesaShortcode} onChange={e => handleInputChange('mpesaShortcode', e.target.value)} className="h-11 font-mono" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">M-Pesa Passkey</Label><Input value={compData.mpesaPasskey} onChange={e => handleInputChange('mpesaPasskey', e.target.value)} className="h-11 font-mono" /></div>
                                        <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Consumer Key</Label><Input value={compData.mpesaConsumerKey} onChange={e => handleInputChange('mpesaConsumerKey', e.target.value)} className="h-11 font-mono" /></div>
                                        <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Consumer Secret</Label><Input type="password" value={compData.mpesaConsumerSecret} onChange={e => handleInputChange('mpesaConsumerSecret', e.target.value)} className="h-11 font-mono" /></div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
                <CardFooter className="justify-end bg-muted/10 border-t p-8">
                    <Button onClick={handleSaveCompany} disabled={isSaving} className="h-14 px-10 font-black uppercase tracking-widest shadow-xl">{isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />} Execute Cloud Sync</Button>
                </CardFooter>
            </Card>
          )}

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-black uppercase tracking-tight">Security Protocol</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">System identity protection is active. Multi-tenant isolation ensures your business verification data and API secrets are inaccessible to other business nodes.</p>
              <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/20">
                  <ShieldCheck className="h-10 w-10 text-primary opacity-50" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Cryptographic Isolation</p>
                    <p className="text-[10px] text-muted-foreground">Authorized Node ID: {tenant?.id}</p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

       <Dialog open={isNewWorkspaceOpen} onOpenChange={setIsNewWorkspaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Add Workspace Entity</DialogTitle>
            <DialogDescription className="font-medium">Reset your current session to initialize a new business node.</DialogDescription>
          </DialogHeader>
          <CardFooter className="px-0 pt-6"><Button className="w-full font-black uppercase h-14 shadow-lg" onClick={handleCreateWorkspace}>Reset Session & Setup</Button></CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
