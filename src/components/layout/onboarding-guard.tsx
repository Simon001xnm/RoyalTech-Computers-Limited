'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, Loader2, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

const COLOR_PRESETS = [
  { name: 'Navy', primary: '#1e293b', secondary: '#f1f5f9' },
  { name: 'Emerald', primary: '#065f46', secondary: '#ecfdf5' },
  { name: 'Royal', primary: '#1e40af', secondary: '#eff6ff' },
  { name: 'Maroon', primary: '#7f1d1d', secondary: '#fef2f2' },
  { name: 'Slate', primary: '#334155', secondary: '#f8fafc' },
  { name: 'Teal', primary: '#0d9488', secondary: '#f0fdfa' },
];

const PUBLIC_PATHS = ['/login', '/signup'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We check if a company exists for this session
  const company = useLiveQuery(() => db.companies.toArray());
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
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
    if (!user) return;
    setIsSaving(true);

    try {
      await db.companies.add({
        id: crypto.randomUUID(),
        name,
        address,
        phone,
        email,
        location,
        logoUrl,
        primaryColor,
        secondaryColor,
        createdAt: new Date().toISOString(),
        createdBy: { uid: user.uid, name: user.displayName || 'Owner' }
      });
      toast({ title: 'Workspace Ready!', description: 'Your business suite is now configured with your branding.' });
      setIsSaving(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
      setIsSaving(false);
    }
  };

  // 1. If we are still loading Auth, show nothing
  if (isUserLoading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  // 2. If the user is on a public page or NOT logged in, show the page as is
  // AuthGuard will handle the logic of forcing them to login.
  if (!user || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // 3. If we are logged in, wait for the company query to resolve
  if (company === undefined) {
    return <div className="h-screen w-full flex items-center justify-center">Syncing workspace...</div>;
  }

  // 4. If no business profile is found, show the introduction setup screen
  if (company.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 py-12">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Setup Your Business Workspace</CardTitle>
            <CardDescription>Welcome! Enter your business details to customize your dashboard and professional documents.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-xs text-muted-foreground p-2">
                      <Upload className="h-6 w-6 mx-auto mb-1" />
                      Upload Logo
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <p className="text-[10px] text-muted-foreground">Upload your brand logo for documents and receipts.</p>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Quest Tech Solutions" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Public Business Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">City / Town</Label>
                  <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Nairobi, KE" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Building, Street, Suite..." required />
              </div>

              {/* Branding Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">System Appearance</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Brand Palette</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            primaryColor === preset.primary ? "ring-2 ring-primary ring-offset-2" : "border-transparent"
                          )}
                          style={{ backgroundColor: preset.primary }}
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                          }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Custom Identity</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="p-color" className="text-[10px] uppercase text-muted-foreground">Primary</Label>
                        <div className="flex gap-2 items-center">
                          <Input type="color" id="p-color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-8 p-0 border-none bg-transparent" />
                          <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-8 font-mono text-xs uppercase" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="s-color" className="text-[10px] uppercase text-muted-foreground">Secondary</Label>
                        <div className="flex gap-2 items-center">
                          <Input type="color" id="s-color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-8 p-0 border-none bg-transparent" />
                          <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-8 font-mono text-xs uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 text-lg" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finish Setup'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // 5. If company exists, release the guard
  return <>{children}</>;
}
