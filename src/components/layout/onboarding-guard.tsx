'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, Loader2, Palette, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const COLOR_PRESETS = [
  { name: 'Executive Navy', primary: '#1e293b', secondary: '#f1f5f9' },
  { name: 'Forest Green', primary: '#064e3b', secondary: '#ecfdf5' },
  { name: 'Royal Blue', primary: '#1e3a8a', secondary: '#eff6ff' },
  { name: 'Deep Crimson', primary: '#7f1d1d', secondary: '#fef2f2' },
  { name: 'Midnight Charcoal', primary: '#0f172a', secondary: '#f8fafc' },
  { name: 'Modern Teal', primary: '#0d9488', secondary: '#f0fdfa' },
];

const PUBLIC_PATHS = ['/login', '/signup'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const company = useLiveQuery(() => db.companies.toArray());
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
        toast({ variant: 'destructive', title: 'Logo Too Large', description: 'Please use an image under 500KB for faster syncing.' });
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
      toast({ title: 'Workspace Provisioned!', description: 'Your executive suite is ready.' });
      setIsSaving(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: err.message });
      setIsSaving(false);
    }
  };

  if (isUserLoading || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  if (company === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (company.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4 lg:p-8">
        <div className="w-full max-w-4xl grid lg:grid-cols-[1fr_350px] gap-8 items-start">
          <Card className="shadow-2xl border-none ring-1 ring-black/5">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="font-bold tracking-tight">Step 1: Identity</Badge>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Setup Your Business Workspace</CardTitle>
              <CardDescription className="text-base">Configure your professional identity for the platform and documents.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSetup}>
              <CardContent className="space-y-8 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase font-bold text-muted-foreground">Legal Business Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Quest Global Solutions" required className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Professional Email</Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" required className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs uppercase font-bold text-muted-foreground">Office Contact</Label>
                      <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 ..." required className="h-11 shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-xs uppercase font-bold text-muted-foreground">City / Region</Label>
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Nairobi, KE" className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs uppercase font-bold text-muted-foreground">Full Physical Address</Label>
                      <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Building, Suite, Street..." required className="h-11 shadow-sm" />
                    </div>
                    <div className="pt-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground mb-3 block">Corporate Branding</Label>
                        <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                            <button
                            key={preset.name}
                            type="button"
                            className={cn(
                                "w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center",
                                primaryColor === preset.primary ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-transparent"
                            )}
                            style={{ backgroundColor: preset.primary }}
                            onClick={() => {
                                setPrimaryColor(preset.primary);
                                setSecondaryColor(preset.secondary);
                            }}
                            title={preset.name}
                            >
                                {primaryColor === preset.primary && <CheckCircle2 className="h-5 w-5 text-white" />}
                            </button>
                        ))}
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-6 border-t px-6">
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl" disabled={isSaving || !name || !email}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Initialize Workspace'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg border-none bg-primary text-primary-foreground overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Branding Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pb-8">
                    <div 
                        className="w-40 h-40 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all relative group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-xs opacity-60 px-4">
                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                Drop Logo Here
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                            <span className="text-[10px] font-bold">CHANGE LOGO</span>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <div className="text-center space-y-1">
                        <h4 className="text-xl font-black leading-tight uppercase truncate max-w-[300px]">
                            {name || 'Your Company Name'}
                        </h4>
                        <p className="text-[10px] font-medium opacity-70 tracking-widest">ESTABLISHED {new Date().getFullYear()}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-muted/50 border border-muted-foreground/10 space-y-3">
                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Onboarding Guide</h5>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                    The details provided here will automatically populate your **Executive Dashboard**, **Invoices**, and **System Reports**.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Encrypted Local Storage
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
