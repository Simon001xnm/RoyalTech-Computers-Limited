'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Image as ImageIcon, Check, Loader2, Building2, Upload, Repeat, PlusCircle, ShieldCheck, Crown, Zap } from "lucide-react";
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

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant, plan, isLegacyUser, switchTenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Company fields state
  const [compName, setCompName] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compPrimary, setCompPrimary] = useState("");
  const [compSecondary, setCompSecondary] = useState("");
  const [compLogo, setCompLogo] = useState("");

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);

  // CLOUD DATA: Fetching profile and portfolio from Firestore
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc(userRef);

  const portfolioQuery = useMemoFirebase(() => {
    if (!userProfile?.tenantIds?.length) return null;
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
      setCompName(company.name);
      setCompAddress(company.address);
      setCompPrimary(company.primaryColor || '#1e293b');
      setCompSecondary(company.secondaryColor || '#f1f5f9');
      setCompLogo(company.logoUrl || "");
    }
  }, [userProfile, authUser, company]);

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
      reader.onloadend = () => setCompLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyRef) return;
    setIsSaving(true);
    try {
      await updateDoc(companyRef, {
        name: compName,
        address: compAddress,
        primaryColor: compPrimary,
        secondaryColor: compSecondary,
        logoUrl: compLogo,
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Workspace Updated', description: 'Branding changes applied.' });
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
          toast({ title: "Initializing Setup", description: "Taking you to the workspace setup wizard." });
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader title={isSuperAdmin ? "Platform technician identity" : "Profile & Workspace"} description="Manage your cloud credentials and business metadata." />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
                  <AvatarImage src={avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} />
                  <AvatarFallback>{(displayName || "U").substring(0, 2)}</AvatarFallback>
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
              <div className="mt-4">
                <CardTitle className="text-xl">{displayName || 'User'}</CardTitle>
                <CardDescription>{email}</CardDescription>
                <Badge className={cn("mt-2 capitalize", isSuperAdmin ? "bg-primary text-primary-foreground" : "")}>
                    {isSuperAdmin && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {userProfile.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="grid grid-cols-5 gap-1">
                {placeholderAvatars.avatars.map((av) => (
                  <button key={av.id} onClick={() => handleAvatarSelect(av.url)} className={cn("rounded border-2 overflow-hidden", avatarUrl === av.url ? "border-primary" : "border-transparent")}>
                    <img src={av.url} className="aspect-square object-cover" alt="avatar" />
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
                          <div key={ws.id} className={cn("flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer", tenant?.id === ws.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")} onClick={() => tenant?.id !== ws.id && switchTenant(ws.id)}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                  {ws.logoUrl ? <img src={ws.logoUrl} className="h-6 w-6 object-contain shrink-0" alt="logo" /> : <Building2 className="h-4 w-4 shrink-0 opacity-40" />}
                                  <span className="text-xs font-bold truncate uppercase">{ws.name}</span>
                              </div>
                              {tenant?.id === ws.id && <Check className="h-3 w-3 shrink-0" />}
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

        <div className="md:col-span-2 space-y-8">
          {!isSuperAdmin && company && (
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><CardTitle>Branding</CardTitle></div>
                    <CardDescription>Visual identity for your system and documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-8">
                    <div className="space-y-2">
                    <Label>Workspace Logo</Label>
                    <div className="w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden relative group" onClick={() => logoInputRef.current?.click()}>
                        {compLogo ? <img src={compLogo} className="w-full h-full object-contain" alt="company logo" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white h-6 w-6" /></div>
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-[10px] uppercase font-bold opacity-70">Primary Color</Label><div className="flex gap-2"><input type="color" value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="w-12 h-10 p-1 cursor-pointer border rounded" /><Input value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="font-mono text-xs uppercase" /></div></div>
                                <div className="space-y-2"><Label className="text-[10px] uppercase font-bold opacity-70">Secondary Color</Label><div className="flex gap-2"><input type="color" value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="w-12 h-10 p-1 cursor-pointer border rounded" /><Input value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="font-mono text-xs uppercase" /></div></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2"><Label>Business Name</Label><Input value={compName} onChange={e => setCompName(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Address</Label><Input value={compAddress} onChange={e => setCompAddress(e.target.value)} /></div>
                        </div>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button onClick={handleSaveCompany} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
                </CardFooter>
            </Card>
          )}

          <Card className="shadow-md">
            <CardHeader><CardTitle>Security & Access</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Contact your system administrator to reset credentials or modify access levels.</p>
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                  <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Cloud identity protected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

       <Dialog open={isNewWorkspaceOpen} onOpenChange={setIsNewWorkspaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Workspace Entity</DialogTitle><DialogDescription>Reset your session to initialize a new business node.</DialogDescription></DialogHeader>
          <CardFooter className="px-0 pt-4"><Button className="w-full font-bold h-12" onClick={handleCreateWorkspace}>Reset Session & Setup</Button></CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}