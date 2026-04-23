
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Edit3, Image as ImageIcon, Check, Loader2, Building2, Upload, Palette, ShieldCheck, Crown, Zap, Repeat, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase/provider";
import { useEffect, useState, useRef } from "react";
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser, Company } from "@/types";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";
import placeholderAvatars from '@/lib/placeholder-images.json';
import { cn } from "@/lib/utils";
import { useSaaS } from "@/components/saas/saas-provider";
import { SaaSUsageMeters } from "@/components/saas/saas-usage-meters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant, plan, isLegacyUser, availableWorkspaces, switchTenant } = useSaaS();
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);

  const localUser = useLiveQuery(
    async () => authUser ? await db.users.get(authUser.uid) : null,
    [authUser]
  );

  const company = useLiveQuery(
    async () => tenant?.id ? await db.companies.get(tenant.id) : null,
    [tenant?.id]
  );

  useEffect(() => {
    if (localUser) {
      setDisplayName(localUser.name || authUser?.displayName || "");
      setEmail(localUser.email || authUser?.email || "");
      setAvatarUrl(localUser.avatarUrl || authUser?.photoURL || "");
    }
    if (company) {
      setCompName(company.name);
      setCompAddress(company.address);
      setCompPrimary(company.primaryColor || '#1e293b');
      setCompSecondary(company.secondaryColor || '#f1f5f9');
      setCompLogo(company.logoUrl || "");
    }
  }, [localUser, authUser, company]);

  const handleAvatarSelect = async (url: string) => {
    if (!authUser) return;
    try {
      setAvatarUrl(url);
      if (url.length < 2000) {
        await updateProfile(authUser, { photoURL: url });
      }
      await db.users.update(authUser.uid, { avatarUrl: url });
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
    if (!company) return;
    setIsSaving(true);
    try {
      await db.companies.update(company.id, {
        name: compName,
        address: compAddress,
        primaryColor: compPrimary,
        secondaryColor: compSecondary,
        logoUrl: compLogo,
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Workspace Updated', description: 'Branding changes applied successfully.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords mismatch.' });
      return;
    }
    if (!authUser || !authUser.email) return;

    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, newPassword);
      toast({ title: 'Password Updated' });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWorkspace = () => {
      // Logic for creating new workspace
      // For the prototype, we just redirect or prompt a fresh onboarding flow
      window.location.reload(); // Force a fresh state for onboarding guard
  };

  if (isUserLoading || !localUser) {
    return <div className="p-12 text-center">Loading profile...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader title="Profile & Workspace" description="Manage your personal account and business branding." />

      <div className="grid gap-8 md:grid-cols-3">
        {/* User Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
                  <AvatarImage src={avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} />
                  <AvatarFallback>{(displayName || "U").substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
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
                <Badge className="mt-2 capitalize">{localUser.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="grid grid-cols-5 gap-1">
                {placeholderAvatars.avatars.map((av) => (
                  <button key={av.id} onClick={() => handleAvatarSelect(av.url)} className={cn("rounded border-2", avatarUrl === av.url ? "border-primary" : "border-transparent")}>
                    <img src={av.url} className="aspect-square object-cover" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Switcher */}
          <Card className="shadow-md border-primary/20 bg-muted/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest">Workspace Portfolio</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNewWorkspaceOpen(true)}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {availableWorkspaces.map(ws => (
                    <div 
                        key={ws.id} 
                        className={cn(
                            "flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer",
                            tenant?.id === ws.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                        )}
                        onClick={() => tenant?.id !== ws.id && switchTenant(ws.id)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {ws.logoUrl ? (
                                <img src={ws.logoUrl} className="h-6 w-6 object-contain shrink-0" />
                            ) : (
                                <Building2 className="h-4 w-4 shrink-0 opacity-40" />
                            )}
                            <span className="text-xs font-bold truncate uppercase">{ws.name}</span>
                        </div>
                        {tenant?.id === ws.id && <Check className="h-3 w-3 shrink-0" />}
                    </div>
                ))}
            </CardContent>
          </Card>

          {/* SaaS Usage & Subscription */}
          <div className="space-y-6">
            <Card className="shadow-md border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Subscription</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-lg font-black text-primary uppercase tracking-tight">{plan?.name}</p>
                        <p className="text-[10px] text-muted-foreground">Status: <span className="text-green-600 font-bold uppercase">{tenant?.status}</span></p>
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs p-2 bg-background rounded-lg border border-primary/10">
                            <span className="text-muted-foreground">Tenant ID</span>
                            <span className="font-mono font-bold text-[10px] opacity-60">{tenant?.id}</span>
                        </div>
                        {isLegacyUser && (
                            <div className="flex items-start gap-2 p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
                                <Zap className="h-4 w-4 shrink-0 fill-white" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase leading-none">Golden v1.0 Access</p>
                                    <p className="text-[9px] opacity-90 leading-tight">Full feature set unlocked forever.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    {!isLegacyUser && <Button variant="outline" className="w-full h-8 text-[10px] uppercase font-bold" disabled>Change Plan</Button>}
                </CardFooter>
            </Card>

            <SaaSUsageMeters />
          </div>
        </div>

        {/* Workspace Branding */}
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Workspace Branding</CardTitle>
              </div>
              <CardDescription>Custom colors and logo for your system and documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-8">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden relative group" onClick={() => logoInputRef.current?.click()}>
                    {compLogo ? <img src={compLogo} className="w-full h-full object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white h-6 w-6" /></div>
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Palette</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold opacity-70">Primary Color</Label>
                        <div className="flex gap-2">
                            <input type="color" value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="w-12 h-10 p-1 cursor-pointer border rounded" />
                            <Input value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="font-mono text-xs uppercase" />
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold opacity-70">Secondary Color</Label>
                        <div className="flex gap-2">
                            <input type="color" value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="w-12 h-10 p-1 cursor-pointer border rounded" />
                            <Input value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="font-mono text-xs uppercase" />
                        </div>
                        </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input value={compName} onChange={e => setCompName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={compAddress} onChange={e => setCompAddress(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveCompany} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Branding Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader><CardTitle>Account Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
              </div>
            </CardContent>
            <CardFooter className="justify-end"><Button variant="outline" onClick={handlePasswordChange}>Change Password</Button></CardFooter>
          </Card>
        </div>
      </div>

       <Dialog open={isNewWorkspaceOpen} onOpenChange={setIsNewWorkspaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Workspace</DialogTitle>
            <DialogDescription>
              This will reset the setup guard to allow you to create a completely new business entity in your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
                You are currently managing <strong>{availableWorkspaces.length}</strong> workspaces. 
                Adding another will allow you to maintain separate inventory, sales, and staff records.
            </p>
          </div>
          <CardFooter className="px-0">
             <Button className="w-full font-bold" onClick={handleCreateWorkspace}>
                Initialize New Workspace
             </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
