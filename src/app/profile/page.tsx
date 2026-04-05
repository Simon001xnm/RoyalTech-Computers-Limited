
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Edit3, Image as ImageIcon, Check, Loader2, Building2, Upload } from "lucide-react";
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

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
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

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const localUser = useLiveQuery(
    async () => authUser ? await db.users.get(authUser.uid) : null,
    [authUser]
  );

  const company = useLiveQuery(() => db.companies.toCollection().last());

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

          <Card className="shadow-md bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <Button onClick={async () => {
                if (!authUser) return;
                await updateProfile(authUser, { displayName });
                await db.users.update(authUser.uid, { name: displayName });
                toast({ title: 'Profile Updated' });
              }} className="w-full">Update Name</Button>
            </CardContent>
          </Card>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="w-12 h-10 p-1" />
                        <Input value={compPrimary} onChange={e => setCompPrimary(e.target.value)} className="font-mono text-xs uppercase" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="w-12 h-10 p-1" />
                        <Input value={compSecondary} onChange={e => setCompSecondary(e.target.value)} className="font-mono text-xs uppercase" />
                      </div>
                    </div>
                  </div>
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
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveCompany} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Branding
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
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
    </div>
  );
}
