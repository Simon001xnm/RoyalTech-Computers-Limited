'use client';

import { useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { User as AppUser } from '@/types';

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
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COLOR_PRESETS[0].primary);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
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
      
      const setupData = {
        id: companyId,
        tenantId: companyId,
        name,
        address,
        phone: '',
        email,
        logoUrl,
        primaryColor,
        secondaryColor: '#f1f5f9',
        plan: 'legacy_pro',
        status: 'active',
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
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
          <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary">Setup Required</Badge>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Business Node Setup</CardTitle>
              <CardDescription>Register your business workspace to begin.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSetup}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Business Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Public Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} required /></div>
                    </div>
                    <div className="space-y-4">
                         <Label>Branding</Label>
                         <div className="flex gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button key={preset.name} type="button" className={cn("w-8 h-8 rounded-full border-2", primaryColor === preset.primary ? "border-primary scale-110" : "border-transparent")} style={{ backgroundColor: preset.primary }} onClick={() => setPrimaryColor(preset.primary)} />
                            ))}
                         </div>
                         <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden">
                            {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-6 border-t px-6">
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Setup'}
                </Button>
              </CardFooter>
            </form>
          </Card>
      </div>
    );
  }

  return <>{children}</>;
}