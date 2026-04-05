
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Edit3, Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase/provider";
import { useEffect, useState, useRef } from "react";
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/types";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail, updateProfile } from "firebase/auth";
import placeholderAvatars from '@/lib/placeholder-images.json';
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // DEXIE: Fetch user details locally
  const localUser = useLiveQuery(
    async () => authUser ? await db.users.get(authUser.uid) : null,
    [authUser]
  );

  useEffect(() => {
    if (localUser) {
      setDisplayName(localUser.name || authUser?.displayName || "");
      setEmail(localUser.email || authUser?.email || "");
      setAvatarUrl(localUser.avatarUrl || authUser?.photoURL || "");
    }
  }, [localUser, authUser]);

  const handleAvatarSelect = async (url: string) => {
    if (!authUser) return;
    try {
      setAvatarUrl(url);
      
      // Update Firebase Auth if URL is short enough (base64 can be too long for Auth photoURL)
      if (url.length < 2000) {
        await updateProfile(authUser, { photoURL: url });
      }
      
      // Update local database
      await db.users.update(authUser.uid, { avatarUrl: url });
      
      toast({ title: 'Avatar Updated', description: 'Your profile picture has been changed locally.' });
    } catch (e) {
      console.error("Avatar update error:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update avatar.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 800KB.' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleAvatarSelect(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (authUser?.isAnonymous) {
      toast({ variant: 'destructive', title: 'Error', description: 'Anonymous users cannot change passwords.' });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.' });
      return;
    }
    if (!authUser || !authUser.email) return;

    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, newPassword);
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      let description = "Could not change password. Please try again.";
      if(error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          description = "The current password you entered is incorrect.";
      }
      toast({ variant: 'destructive', title: 'Password Change Failed', description });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!authUser) return;
    setIsSaving(true);

    try {
        // 1. Update Firebase Auth Profile
        if (authUser.displayName !== displayName) {
            await updateProfile(authUser, { displayName: displayName });
        }

        // 2. Update local database record
        await db.users.update(authUser.uid, {
            name: displayName,
            email: email,
            updatedAt: new Date().toISOString()
        });

        toast({ title: 'Profile Updated', description: 'Changes saved to your local profile.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  if (isUserLoading || !localUser) {
    return (
       <div className="space-y-6">
        <PageHeader title="User Profile" description="Loading local profile..." />
        <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader title="User Profile (Local)" description="Manage your personal information and look." />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Sidebar */}
        <Card className="md:col-span-1 shadow-md">
          <CardHeader className="items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-lg">
                <AvatarImage src={avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} />
                <AvatarFallback className="text-4xl uppercase">{(displayName || "U").substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
            <div className="mt-4">
              <CardTitle>{displayName || 'User'}</CardTitle>
              <CardDescription>{email}</CardDescription>
              <Badge variant="secondary" className="mt-2 capitalize">{localUser.role}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Choose an Avatar</p>
              <div className="grid grid-cols-3 gap-2">
                {placeholderAvatars.avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.url)}
                    className={cn(
                      "relative rounded-md overflow-hidden border-2 transition-all hover:scale-105",
                      avatarUrl === avatar.url ? "border-primary shadow-sm" : "border-transparent"
                    )}
                  >
                    <img src={avatar.url} alt="preset avatar" className="aspect-square object-cover" />
                    {avatarUrl === avatar.url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </CardContent>
        </Card>

        {/* Main Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update your personal information. Changes sync locally first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={isSaving} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isSaving} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={handlePasswordChange} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
