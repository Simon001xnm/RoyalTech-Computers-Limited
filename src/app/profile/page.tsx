'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useAuth } from "@/firebase/provider";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/types";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail, updateProfile } from "firebase/auth";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppUser['role']>("user");
  const [joinDate, setJoinDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  useEffect(() => {
    if (authUser) {
      setDisplayName(authUser.displayName || 'Anonymous User');
      setEmail(authUser.email || 'No email provided');
      setJoinDate(authUser.metadata.creationTime || new Date().toISOString());
      setAvatarUrl(authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/128/128`);

      const userRef = doc(firestore, 'users', authUser.uid);
      const unsub = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as AppUser;
          setRole(userData.role);
          setDisplayName(userData.name || authUser.displayName || 'Anonymous User');
          setEmail(userData.email || authUser.email || 'No email provided');
        }
      });
      return () => unsub();
    }
  }, [authUser, firestore]);

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
    if (!authUser || !authUser.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found or email is missing.' });
      return;
    }

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
    }
  };

  const handleSaveChanges = async () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
      return;
    }

    const userDocRef = doc(firestore, 'users', authUser.uid);
    let nameUpdated = false;
    let emailUpdated = false;

    // Update Display Name if changed
    if (authUser.displayName !== displayName) {
        await updateProfile(authUser, { displayName: displayName });
        nameUpdated = true;
    }

    // Update Firestore document with name and potentially email
    const firestoreUpdateData: Partial<AppUser> = {};
    if (nameUpdated) {
        firestoreUpdateData.name = displayName;
    }
    
    // Update Email if changed (requires re-authentication)
    if (authUser.email !== email) {
        const passwordForEmailChange = prompt("To change your email, please re-enter your current password:");
        if (passwordForEmailChange && authUser.email) {
            try {
                const credential = EmailAuthProvider.credential(authUser.email, passwordForEmailChange);
                await reauthenticateWithCredential(authUser, credential);
                await updateEmail(authUser, email);
                emailUpdated = true;
                firestoreUpdateData.email = email; // update email in firestore too
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Email Update Failed', description: `Could not update email. ${error.message}` });
                return;
            }
        } else if (passwordForEmailChange === null) {
            // User cancelled the prompt
        } else {
            toast({ variant: 'destructive', title: 'Email Not Updated', description: 'Password was required to change the email address.' });
        }
    }
    
    // Write to Firestore if there's anything to update
    if (Object.keys(firestoreUpdateData).length > 0) {
        setDocumentNonBlocking(userDocRef, firestoreUpdateData, { merge: true });
    }

    if (nameUpdated && emailUpdated) {
        toast({ title: 'Profile Updated', description: 'Your name and email have been saved.' });
    } else if (nameUpdated) {
        toast({ title: 'Profile Updated', description: 'Your name has been saved.' });
    } else if (emailUpdated) {
        toast({ title: 'Email Updated', description: 'Your email has been saved.' });
    } else {
        toast({ title: 'No Changes', description: 'No new information was saved.' });
    }
  };

  if (isUserLoading || !displayName) {
    return (
       <div className="space-y-6">
        <PageHeader title="User Profile" description="Manage your personal information and settings." />
        <p className="p-4 text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Profile" description="Manage your personal information and settings." />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="person avatar large" />
              <AvatarFallback className="text-3xl">{displayName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription>{email}</CardDescription>
              <Badge variant="outline" className="mt-1 capitalize">{role}</Badge>
            </div>
             <Button variant="outline" size="icon" className="ml-auto">
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit Profile Picture</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <p id="role" className="text-sm capitalize text-muted-foreground pt-2">{role}</p>
            </div>
            <div className="space-y-1">
                <Label htmlFor="joinDate">Member Since</Label>
                <p id="joinDate" className="text-sm text-muted-foreground pt-2">
                  {joinDate ? new Date(joinDate).toLocaleDateString() : 'N/A'}
                </p>
            </div>
          </div>
           <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <div className="space-y-4">
                 <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                 <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                 <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
            </div>
             <div className="flex justify-end pt-4">
                <Button onClick={handlePasswordChange} variant="secondary">Update Password</Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
