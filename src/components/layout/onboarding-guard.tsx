'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, Loader2, Palette, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COLOR_PRESETS[0].primary);
  const [secondaryColor, setSecondaryColor] = useState(COLOR_PRESETS[0].secondary);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast({ variant: 'destructive', title: 'Logo Too Large', description: 'Please use an image under 500KB.' });
        return;
      }
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
      
      await setDoc(companyRef, {
        id: companyId,
        tenantId: companyId,
        name,
        address,
        phone,
        email,
        location,
        logoUrl,
        primaryColor,
        secondaryColor,
        plan: 'legacy_pro',
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'Owner' }
      });

      const currentIds = userProfile?.tenantIds || [];
      await updateDoc(userProfileRef, { 
        tenantId: companyId, 
        tenantIds: [...new Set([...currentIds, companyId])],
        role: 'admin' 
      });

      toast({ title: 'Workspace Provisioned!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  if (userProfile?.role === 'super_admin') {
      return <>{children}</>;
  }

  if (userProfile && !userProfile.tenantId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4 lg:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          <Card className="shadow-2xl border-none ring-1 ring-black/5">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="font-bold tracking-tight">Step 1: Identity</Badge>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Setup Your Business Workspace</CardTitle>
            </CardHeader>
            <form onSubmit={handleSetup}>
              <CardContent className="space-y-8 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Public Email</Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Physical Address</Label>
                      <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-4">
                        <Label>Brand Palette</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                key={preset.name}
                                type="button"
                                className={cn("w-9 h-9 rounded-full border-2", primaryColor === preset.primary ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-transparent")}
                                style={{ backgroundColor: preset.primary }}
                                onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); }}
                                />
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-6 border-t px-6">
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSaving || !name || !email}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finish Setup'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
