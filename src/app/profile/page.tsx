'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Camera, 
    Image as ImageIcon, 
    Check, 
    Loader2, 
    Upload, 
    Settings2, 
    DownloadCloud, 
    ShieldCheck 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import placeholderAvatars from '@/lib/placeholder-images.json';
import { cn, exportToCsv } from "@/lib/utils";
import { useSaaS } from "@/components/saas/saas-provider";
import { SaaSUsageMeters } from "@/components/saas/saas-usage-meters";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/lib/logger";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [compData, setCompData] = useState({
    name: '',
    businessType: 'retail',
    industry: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    taxPin: '',
    vatRate: 16,
    invoicePrefix: 'INV',
    receiptPrefix: 'RCT',
    quotePrefix: 'QTN',
    deliveryPrefix: 'DLV',
    primaryColor: '#1d4ed8',
    secondaryColor: '#f8fafc',
  });

  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc<any>(userRef);

  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: company } = useDoc<any>(companyRef);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || authUser?.displayName || "");
      setEmail(userProfile.email || authUser?.email || "");
      setAvatarUrl(userProfile.avatarUrl || authUser?.photoURL || "");
    }
    if (company) {
      setCompData({
        ...compData,
        ...company
      });
    }
  }, [userProfile, authUser, company]);

  const handleInputChange = (field: string, value: any) => {
    setCompData(prev => ({ ...prev, [field]: value }));
  };

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
      reader.onloadend = () => setCompData(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyRef) return;
    setIsSaving(true);
    try {
      await updateDoc(companyRef, {
        ...compData,
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Settings Synced' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async (type: 'inventory' | 'customers' | 'sales' | 'leases') => {
    if (!tenant) return;
    setIsExporting(type);
    
    try {
        let collectionName = '';
        let fileName = '';
        let mapping = {};

        switch (type) {
            case 'inventory':
                collectionName = 'assets';
                fileName = `Inventory_Export.csv`;
                mapping = { model: 'Model', serialNumber: 'Serial Number', status: 'Status', quantity: 'Qty' };
                break;
            case 'customers':
                collectionName = 'customers';
                fileName = `Client_Directory.csv`;
                mapping = { name: 'Full Name', email: 'Email', phone: 'Phone' };
                break;
            case 'sales':
                collectionName = 'sales_transactions';
                fileName = `Sales_Ledger.csv`;
                mapping = { id: 'Sale ID', date: 'Transaction Date', amount: 'Total KES' };
                break;
            case 'leases':
                collectionName = 'leases';
                fileName = `Lease_History.csv`;
                mapping = { customerName: 'Lessee', laptopModel: 'Hardware', serialNumber: 'S/N' };
                break;
        }

        const q = query(collection(firestore, collectionName), where('tenantId', '==', tenant.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data());

        if (data.length === 0) {
            toast({ variant: 'outline', title: 'Export Empty' });
            return;
        }

        exportToCsv(fileName, data, mapping);
        logger.business('Identity', 'Data Export Triggered', { type });
        toast({ title: 'Export Successful' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Export Failed' });
    } finally {
        setIsExporting(null);
    }
  };

  if (isUserLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Context...</p>
      </div>
    );
  }

  const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader title="Shop Settings" description="Configure branding and high-fidelity generation standards." />

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <div className="space-y-6">
          <Card className="shadow-md overflow-hidden border-none ring-1 ring-black/5">
            <CardHeader className="items-center text-center bg-muted/20 pb-8">
              <div className="relative group cursor-pointer mt-4" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} />
                  <AvatarFallback className="text-2xl">{(displayName || "U").substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="h-6 w-6 text-white" /></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
              </div>
              <div className="mt-6 space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">{displayName || 'User'}</CardTitle>
                <CardDescription className="font-medium">{email}</CardDescription>
                <Badge className={cn("mt-4 capitalize px-4 h-7 text-[10px] font-black tracking-widest uppercase", isSuperAdmin ? "bg-primary text-primary-foreground" : "")}>
                    {userProfile.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-5 gap-0.5 border-t">
                {placeholderAvatars.avatars.map((av) => (
                  <button key={av.id} onClick={() => handleAvatarSelect(av.url)} className={cn("aspect-square overflow-hidden hover:opacity-80 transition-opacity", avatarUrl === av.url ? "ring-2 ring-inset ring-primary" : "")}>
                    <img src={av.url} className="w-full h-full object-cover" alt="avatar" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <SaaSUsageMeters />
        </div>

        <div className="space-y-8">
          {!isSuperAdmin && company && (
            <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-muted/10 border-b p-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-black p-3 rounded-2xl shadow-lg">
                            <Settings2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Identity & Logic</CardTitle>
                            <CardDescription>SaaS infrastructure and document generation standards.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/30 rounded-none border-b p-0">
                            <TabsTrigger value="profile" className="rounded-none h-full font-black uppercase text-[10px] tracking-widest">Branding</TabsTrigger>
                            <TabsTrigger value="contact" className="rounded-none h-full font-black uppercase text-[10px] tracking-widest">Contact</TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-none h-full font-black uppercase text-[10px] tracking-widest">Standards</TabsTrigger>
                            <TabsTrigger value="data" className="rounded-none h-full font-black uppercase text-[10px] tracking-widest text-primary">Backups</TabsTrigger>
                        </TabsList>
                        
                        <div className="p-8">
                            <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">High-Res Logo</Label>
                                        <div className="w-full aspect-square border-2 border-black border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative group shadow-inner bg-white" onClick={() => logoInputRef.current?.click()}>
                                            {compData.logoUrl ? <img src={compData.logoUrl} className="w-full h-full object-contain p-2" alt="logo" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white h-6 w-6" /></div>
                                        </div>
                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Official Business Name</Label><Input value={compData.name} onChange={e => handleInputChange('name', e.target.value)} className="h-11 font-bold" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Shop Category</Label>
                                                <Select onValueChange={v => handleInputChange('businessType', v)} value={compData.businessType}>
                                                    <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="retail">Retail / Hardware</SelectItem>
                                                        <SelectItem value="sacco">SACCO / Financial</SelectItem>
                                                        <SelectItem value="hospitality">Restaurant / Hotel</SelectItem>
                                                        <SelectItem value="barber">Barber / Salon</SelectItem>
                                                        <SelectItem value="tech">Computers & IT</SelectItem>
                                                        <SelectItem value="service">General Services</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Brand Primary Color</Label><div className="flex gap-2"><Input type="color" value={compData.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="w-12 h-11 p-1" /><Input value={compData.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="h-11 font-mono" /></div></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">VAT Rate (%)</Label><Input type="number" value={compData.vatRate} onChange={e => handleInputChange('vatRate', Number(e.target.value))} className="h-11 font-bold" /></div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Official Email</Label><Input value={compData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Primary Phone</Label><Input value={compData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase">Head Office Address</Label><Input value={compData.address} onChange={e => handleInputChange('address', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Website</Label><Input value={compData.website} onChange={e => handleInputChange('website', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">KRA PIN / Tax ID</Label><Input value={compData.taxPin} onChange={e => handleInputChange('taxPin', e.target.value)} className="h-11 font-mono uppercase" /></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-black/5 rounded-2xl border border-black/10">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Invoice Prefix</Label><Input value={compData.invoicePrefix} onChange={e => handleInputChange('invoicePrefix', e.target.value)} className="h-11 font-black" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Receipt Prefix</Label><Input value={compData.receiptPrefix} onChange={e => handleInputChange('receiptPrefix', e.target.value)} className="h-11 font-black" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Quotation Prefix</Label><Input value={compData.quotePrefix} onChange={e => handleInputChange('quotePrefix', e.target.value)} className="h-11 font-black" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Delivery Prefix</Label><Input value={compData.deliveryPrefix} onChange={e => handleInputChange('deliveryPrefix', e.target.value)} className="h-11 font-black" /></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="data" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest">Inventory Log</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('inventory')} disabled={!!isExporting}>
                                                {isExporting === 'inventory' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} CSV Export
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest">CRM Directory</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('customers')} disabled={!!isExporting}>
                                                {isExporting === 'customers' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} CSV Export
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
                <CardFooter className="justify-end bg-muted/10 border-t p-8">
                    <Button onClick={handleSaveCompany} disabled={isSaving} className="h-14 px-10 font-black uppercase tracking-widest shadow-xl border-2 border-black hover:bg-black hover:text-white transition-all">
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />} 
                        Sync Settings
                    </Button>
                </CardFooter>
            </Card>
          )}

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-black uppercase tracking-tight">Security</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">System identity protection is active. Multi-tenant isolation ensures your business verification data and API secrets are inaccessible to other nodes.</p>
              <div className="flex items-center gap-4 p-6 bg-black/5 rounded-2xl border border-black/20">
                  <ShieldCheck className="h-10 w-10 text-black opacity-50" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-widest">Cryptographic Isolation</p>
                    <p className="text-[10px] text-muted-foreground font-mono">NODE-ID: {tenant?.id}</p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
