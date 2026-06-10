
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Image as ImageIcon, Check, Loader2, Building2, Upload, Repeat, PlusCircle, ShieldCheck, Crown, Zap, Globe, Phone, MapPin, Briefcase, Wallet, FileText, Settings2, DownloadCloud, Database, History, Users, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import placeholderAvatars from '@/lib/placeholder-images.json';
import { cn, exportToCsv } from "@/lib/utils";
import { useSaaS } from "@/components/saas/saas-provider";
import { SaaSUsageMeters } from "@/components/saas/saas-usage-meters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/lib/logger";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant, plan, isLegacyUser, switchTenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Company fields state
  const [compData, setCompData] = useState({
    name: '',
    businessType: '',
    industry: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    country: '',
    adminPosition: '',
    taxPin: '',
    certRegistration: '',
    businessPermit: '',
    nationalId: '',
    paymentMethod: '',
    billingIdentifier: '',
    bankName: '',
    bankBranch: '',
    bankAccNo: '',
    bankAccName: '',
    bankCode: '',
    vatRate: 16,
    documentTheme: 'Corporate',
    invoicePrefix: 'INV',
    receiptPrefix: 'RCT',
    quotePrefix: 'QTN',
    deliveryPrefix: 'DLV',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    primaryColor: '#1e293b',
    secondaryColor: '#f1f5f9',
  });

  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc(userRef);

  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: company } = useDoc(companyRef);

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
      toast({ title: 'Workspace Settings Synced' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error syncing cloud settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async (type: 'inventory' | 'customers' | 'sales' | 'leases' | 'audit') => {
    if (!tenant) return;
    setIsExporting(type);
    
    try {
        let collectionName = '';
        let fileName = '';
        let mapping = {};

        switch (type) {
            case 'inventory':
                collectionName = 'assets';
                fileName = `Inventory_Export_${tenant.name.replace(/\s+/g, '_')}.csv`;
                mapping = { model: 'Model', serialNumber: 'Serial Number', status: 'Status', quantity: 'Qty', purchasePrice: 'Acquisition Cost', leasePrice: 'Daily Rate', purchaseDate: 'Purchase Date' };
                break;
            case 'customers':
                collectionName = 'customers';
                fileName = `Client_Directory_${tenant.name.replace(/\s+/g, '_')}.csv`;
                mapping = { name: 'Full Name', email: 'Email', phone: 'Phone', address: 'Address', registrationDate: 'Joined Date' };
                break;
            case 'sales':
                collectionName = 'sales_transactions';
                fileName = `Sales_Ledger_${tenant.name.replace(/\s+/g, '_')}.csv`;
                mapping = { id: 'Sale ID', date: 'Transaction Date', customerName: 'Customer', amount: 'Total KES', paymentMethod: 'Method', status: 'Payment Status', referenceCode: 'Reference' };
                break;
            case 'leases':
                collectionName = 'leases';
                fileName = `Lease_History_${tenant.name.replace(/\s+/g, '_')}.csv`;
                mapping = { customerName: 'Lessee', laptopModel: 'Hardware', serialNumber: 'S/N', startDate: 'Commencement', endDate: 'Expiry', duration: 'Duration', status: 'Agreement Status', paymentStatus: 'Billing Status' };
                break;
            case 'audit':
                collectionName = 'platform_logs';
                fileName = `Audit_Trail_${tenant.name.replace(/\s+/g, '_')}.csv`;
                mapping = { timestamp: 'Event Time', level: 'Severity', module: 'Module', event: 'Event Description' };
                break;
        }

        const q = query(collection(firestore, collectionName), where('tenantId', '==', tenant.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data());

        if (data.length === 0) {
            toast({ variant: 'outline', title: 'Export Empty', description: `No records found in ${collectionName}.` });
            return;
        }

        exportToCsv(fileName, data, mapping);
        logger.business('Identity', 'Data Export Triggered', { type, recordCount: data.length });
        toast({ title: 'Export Successful', description: `${fileName} has been generated.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Export Failed', description: e.message });
    } finally {
        setIsExporting(null);
    }
  };

  if (isUserLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing SaaS Context...</p>
      </div>
    );
  }

  const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader title="SaaS Control Node" description="Configure high-fidelity document generation and business identity." />

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
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Business Logic & Branding</CardTitle>
                            <CardDescription>SaaS infrastructure and document generation standards.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5 h-14 bg-muted/30 rounded-none border-b p-0">
                            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Identity</TabsTrigger>
                            <TabsTrigger value="contact" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Contact</TabsTrigger>
                            <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Prefixes</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest">Financials</TabsTrigger>
                            <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-black uppercase text-[10px] tracking-widest text-primary">Export</TabsTrigger>
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
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Document Theme</Label>
                                                <Select onValueChange={v => handleInputChange('documentTheme', v)} value={compData.documentTheme}>
                                                    <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Corporate">Theme 1: Corporate</SelectItem>
                                                        <SelectItem value="Retail">Theme 2: Retail</SelectItem>
                                                        <SelectItem value="Wholesale">Theme 3: Wholesale</SelectItem>
                                                        <SelectItem value="RentalLeasing">Theme 4: Rental Leasing</SelectItem>
                                                        <SelectItem value="Construction">Theme 5: Construction</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Primary Brand Color</Label><div className="flex gap-2"><Input type="color" value={compData.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="w-12 h-11 p-1" /><Input value={compData.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="h-11 font-mono" /></div></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">VAT Rate (%)</Label><Input type="number" value={compData.vatRate} onChange={e => handleInputChange('vatRate', Number(e.target.value))} className="h-11 font-bold" /></div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Official Email</Label><Input value={compData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Primary Phone</Label><Input value={compData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase">Physical Head Office Address</Label><Input value={compData.address} onChange={e => handleInputChange('address', e.target.value)} className="h-11" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Website URL</Label><Input value={compData.website} onChange={e => handleInputChange('website', e.target.value)} className="h-11" /></div>
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

                            <TabsContent value="billing" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="p-8 bg-white rounded-3xl border-2 border-black space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center gap-3"><Briefcase className="h-5 w-5 text-black" /><h4 className="font-black uppercase tracking-widest text-xs">Official Settlement Channel</h4></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Bank Institution</Label><Input value={compData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} className="h-11 border-black" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Branch Location</Label><Input value={compData.bankBranch} onChange={e => handleInputChange('bankBranch', e.target.value)} className="h-11 border-black" /></div>
                                        <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase">Account Name</Label><Input value={compData.bankAccName} onChange={e => handleInputChange('bankAccName', e.target.value)} className="h-11 border-black font-bold" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Account Number</Label><Input value={compData.bankAccNo} onChange={e => handleInputChange('bankAccNo', e.target.value)} className="h-11 border-black font-mono" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Paybill/M-Pesa ID</Label><Input value={compData.billingIdentifier} onChange={e => handleInputChange('billingIdentifier', e.target.value)} className="h-11 border-black font-black" /></div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="data" className="mt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <Database className="h-4 w-4" /> Cloud Inventory
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">Download a complete snapshot of all high-value hardware and generic accessories registered in this workspace.</p>
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('inventory')} disabled={!!isExporting}>
                                                {isExporting === 'inventory' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} Export Inventory CSV
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <Users className="h-4 w-4" /> Client Directory
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">Export your CRM database including contact details, addresses, and registration dates for all unique clients.</p>
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('customers')} disabled={!!isExporting}>
                                                {isExporting === 'customers' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} Export CRM CSV
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4" /> Sales Ledger
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">A full list of point-of-sale transactions, payment methods, and revenue figures for accounting reconciliation.</p>
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('sales')} disabled={!!isExporting}>
                                                {isExporting === 'sales' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} Export Sales CSV
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none ring-1 ring-black/5 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-primary/5 py-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <History className="h-4 w-4" /> Audit History
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">Download your workspace activity feed. Contains timestamps for login, sales, and system updates.</p>
                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => handleDataExport('audit')} disabled={!!isExporting}>
                                                {isExporting === 'audit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} Export Audit CSV
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
                        Sync Workspace Metadata
                    </Button>
                </CardFooter>
            </Card>
          )}

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-black uppercase tracking-tight">Security & Infrastructure</CardTitle></CardHeader>
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
