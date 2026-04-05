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
import { Separator } from '@/components/ui/separator';

const COLOR_PRESETS = [
  { name: 'Executive Navy', primary: '#1e293b', secondary: '#f1f5f9' },
  { name: 'Forest Green', primary: '#064e3b', secondary: '#ecfdf5' },
  { name: 'Royal Blue', primary: '#1e3a8a', secondary: '#eff6ff' },
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
              <CardDescription className="text-base">Enter your business details to customize your dashboard and professional documents.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSetup}>
              <CardContent className="space-y-8 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase font-bold text-muted-foreground">Legal Business Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Quest Global Solutions" required className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Public Business Email</Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@company.com" required className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs uppercase font-bold text-muted-foreground">Contact Phone</Label>
                      <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 ..." required className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-xs uppercase font-bold text-muted-foreground">City / Town</Label>
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Nairobi, KE" className="h-11 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs uppercase font-bold text-muted-foreground">Physical Address</Label>
                      <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Building, Suite, Street..." required className="h-11 shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <h4 className="text-xs uppercase font-bold text-muted-foreground">System Appearance</h4>
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-bold opacity-60">Brand Palette</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((preset) => (
                                    <button
                                    key={preset.name}
                                    type="button"
                                    className={cn(
                                        "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center",
                                        primaryColor === preset.primary ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: preset.primary }}
                                    onClick={() => {
                                        setPrimaryColor(preset.primary);
                                        setSecondaryColor(preset.secondary);
                                    }}
                                    title={preset.name}
                                    >
                                        {primaryColor === preset.primary && <CheckCircle2 className="h-4 w-4 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-bold opacity-60">Custom Identity</Label>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryColor" className="text-xs">Primary</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="color" 
                                            id="primaryColor"
                                            value={primaryColor} 
                                            onChange={e => setPrimaryColor(e.target.value)} 
                                            className="w-12 h-10 p-1 cursor-pointer" 
                                        />
                                        <Input 
                                            value={primaryColor} 
                                            onChange={e => setPrimaryColor(e.target.value)} 
                                            className="font-mono text-xs uppercase" 
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondaryColor" className="text-xs">Secondary</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="color" 
                                            id="secondaryColor"
                                            value={secondaryColor} 
                                            onChange={e => setSecondaryColor(e.target.value)} 
                                            className="w-12 h-10 p-1 cursor-pointer" 
                                        />
                                        <Input 
                                            value={secondaryColor} 
                                            onChange={e => setSecondaryColor(e.target.value)} 
                                            className="font-mono text-xs uppercase" 
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-6 border-t px-6">
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl" disabled={isSaving || !name || !email}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finish Setup'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg border-none bg-primary text-primary-foreground overflow-hidden" style={{ backgroundColor: primaryColor }}>
                <CardHeader>
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-80">Workspace Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pb-8">
                    <div 
                        className="w-44 h-44 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all relative group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-3" />
                        ) : (
                            <div className="text-center text-[10px] opacity-60 px-4">
                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                Upload Logo
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                            <span className="text-[10px] font-bold">REPLACE IMAGE</span>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <div className="text-center space-y-1 w-full px-4">
                        <h4 className="text-xl font-black leading-tight uppercase truncate">
                            {name || 'Business Name'}
                        </h4>
                        <p className="text-[10px] font-medium opacity-70 tracking-widest uppercase">Workspace Live</p>
                    </div>
                </CardContent>
            </Card>

            <div className="p-5 rounded-2xl bg-muted/50 border border-muted-foreground/10 space-y-3">
                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Setup Guide</h5>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                    The logo and colors you choose will be applied to all your **Invoices**, **Receipts**, and **Reports**.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Secure Local Storage
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
