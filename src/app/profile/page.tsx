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
    ShieldCheck,
    Building2,
    Lock,
    ArrowRight,
    Globe,
    Zap,
    Plus,
    Trash2,
    Tags,
    Landmark,
    Smartphone,
    Scale,
    FileText,
    Palette,
    Info,
    CheckCircle2,
    Package,
    Users,
    DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { cn, exportToCsv } from "@/lib/utils";
import { useSaaS } from "@/components/saas/saas-provider";
import { SaaSUsageMeters } from "@/components/saas/saas-usage-meters";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/lib/logger";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';
import type { CategoryGroup } from "@/types";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const { tenant, availableWorkspaces, switchTenant } = useSaaS();
  const firestore = useFirestore();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [compData, setCompData] = useState({
    name: '',
    businessType: 'retail',
    industry: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    taxPin: '',
    vatRate: 16,
    invoicePrefix: 'INV',
    receiptPrefix: 'RCT',
    quotePrefix: 'QTN',
    deliveryPrefix: 'DLV',
    primaryColor: '#1d4ed8',
    secondaryColor: '#f8fafc',
    bankName: '',
    bankAccName: '',
    bankAccNo: '',
    paybillNumber: '',
    paybillAccount: '',
    tillNumber: '',
    mobileMoneyPhone: '',
    categories: [] as CategoryGroup[],
    unitsOfMeasure: ['Pcs', 'Unit', 'Set']
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState<Record<string, string>>({});
  const [newUnitName, setNewUnitName] = useState("");

  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc<any>(userRef);

  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: company } = useDoc<any>(companyRef);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || authUser?.displayName || "");
      setEmail(userProfile.email || authUser?.email || "");
    }
    if (company) {
      setCompData({
        ...compData,
        ...company,
        categories: company.categories || [],
        unitsOfMeasure: company.unitsOfMeasure || ['Pcs', 'Unit', 'Set']
      });
    }
  }, [userProfile, authUser, company]);

  const handleInputChange = (field: string, value: any) => {
    setCompData(prev => ({ ...prev, [field]: value }));
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
      toast({ title: 'System Synchronized' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
      const name = newCategoryName.trim();
      if (!name) return;
      if (compData.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          toast({ variant: 'destructive', title: 'Duplicate Category' });
          return;
      }
      setCompData(prev => ({
          ...prev,
          categories: [...prev.categories, { name: name, subCategories: [] }]
      }));
      setNewCategoryName("");
      toast({ title: "Primary Category Created" });
  };

  const handleRemoveCategory = (name: string) => {
      setCompData(prev => ({
          ...prev,
          categories: prev.categories.filter(c => c.name !== name)
      }));
  };

  const handleAddSubCategory = (categoryName: string) => {
      const val = (newSubCategoryName[categoryName] || "").trim();
      if (!val) return;
      
      setCompData(prev => ({
          ...prev,
          categories: prev.categories.map(c => {
              if (c.name === categoryName) {
                  if (c.subCategories.some(sc => sc.toLowerCase() === val.toLowerCase())) {
                      return c;
                  }
                  return { ...c, subCategories: [...c.subCategories, val] };
              }
              return c;
          })
      }));
      setNewSubCategoryName(prev => ({ ...prev, [categoryName]: "" }));
      toast({ title: `Link established to ${categoryName}` });
  };

  const handleRemoveSubCategory = (categoryName: string, subName: string) => {
      setCompData(prev => ({
          ...prev,
          categories: prev.categories.map(c => {
              if (c.name === categoryName) {
                  return { ...c, subCategories: c.subCategories.filter(sc => sc !== subName) };
              }
              return c;
          })
      }));
  };

  const handleAddUnit = () => {
      const unit = newUnitName.trim();
      if (!unit) return;
      if (compData.unitsOfMeasure.includes(unit)) {
          toast({ variant: 'destructive', title: 'Unit Already Registered' });
          return;
      }
      setCompData(prev => ({
          ...prev,
          unitsOfMeasure: [...prev.unitsOfMeasure, unit]
      }));
      setNewUnitName("");
      toast({ title: "Logistic Unit Added" });
  };

  const handleRemoveUnit = (unit: string) => {
      setCompData(prev => ({
          ...prev,
          unitsOfMeasure: prev.unitsOfMeasure.filter(u => u !== unit)
      }));
  };

  const handleSwitch = async (id: string) => {
      if (id === tenant?.id) return;
      setIsSwitching(id);
      try {
          await switchTenant(id);
      } finally {
          setIsSwitching(null);
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
                fileName = `Inventory_Full_Audit.csv`;
                mapping = { model: 'Model', serialNumber: 'Serial Number', sku: 'SKU', category: 'Category', status: 'Status', quantity: 'Qty', sellingPrice: 'Price' };
                break;
            case 'customers':
                collectionName = 'customers';
                fileName = `Client_Directory.csv`;
                mapping = { name: 'Full Name', alias: 'Business Name', email: 'Email', phone: 'Phone', address: 'Address' };
                break;
            case 'sales':
                collectionName = 'sales_transactions';
                fileName = `Sales_Ledger.csv`;
                mapping = { invoiceNumber: 'Reference', date: 'Date', customerName: 'Client', total: 'Amount', status: 'Status' };
                break;
            case 'leases':
                collectionName = 'leases';
                fileName = `Lease_History.csv`;
                mapping = { customerName: 'Lessee', laptopModel: 'Hardware', serialNumber: 'S/N', status: 'Status', totalLeaseValue: 'Value' };
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
        logger.business('Identity', 'Data Extractions Processed', { type });
        toast({ title: 'Export Successful' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Extraction Failed' });
    } finally {
        setIsExporting(null);
    }
  };

  if (isUserLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Secure Hub Link...</p>
      </div>
    );
  }

  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

  return (
    <div className="space-y-4 sm:space-y-8 max-w-7xl mx-auto pb-20 px-1 sm:px-0">
      <PageHeader title="Shop Configuration Hub" description="Engineered settings for your business node." />

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-[350px_1fr]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-2xl overflow-hidden border-none ring-1 ring-black/5 rounded-[2rem] bg-white">
            <CardHeader className="items-center text-center bg-primary/5 pb-10">
              <div className="relative group cursor-pointer mt-6" onClick={() => logoInputRef.current?.click()}>
                <Avatar className="h-32 w-32 sm:h-44 sm:w-44 border-8 border-white shadow-2xl bg-white ring-1 ring-black/5">
                  <AvatarImage 
                    src={compData.logoUrl || `https://picsum.photos/seed/${authUser?.uid}/200/200`} 
                    className="object-contain p-2"
                  />
                  <AvatarFallback className="text-4xl sm:text-5xl font-black uppercase bg-primary text-primary-foreground">
                    {(compData.name || displayName || "CP").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Camera className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="mt-8 space-y-2 overflow-hidden px-4">
                <CardTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none truncate">
                    {compData.name || 'Your Hub Name'}
                </CardTitle>
                <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="font-black text-[8px] uppercase tracking-widest bg-white h-5">
                        {compData.businessType}
                    </Badge>
                    <Badge variant="outline" className="font-black text-[8px] uppercase tracking-widest bg-white h-5">
                        {tenant?.tier}
                    </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden rounded-2xl bg-white">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary opacity-60">
                    <Building2 className="h-3.5 w-3.5" />
                    Available Workspaces
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y max-h-[300px] overflow-y-auto no-scrollbar">
                    {availableWorkspaces.map(ws => (
                        <div key={ws.id} className={cn("p-4 flex items-center justify-between group transition-colors", tenant?.id === ws.id ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-muted/30 border-l-4 border-transparent")}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-9 w-9 rounded-xl shrink-0 border bg-white">
                                    <AvatarImage src={ws.logoUrl} className="object-contain p-1" />
                                    <AvatarFallback className="text-[9px] font-black">{ws.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-black uppercase tracking-tight leading-none truncate">{ws.name}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">{ws.businessType}</p>
                                </div>
                            </div>
                            {tenant?.id !== ws.id ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleSwitch(ws.id)} disabled={!!isSwitching}>
                                    {isSwitching === ws.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                </Button>
                            ) : <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>

          <SaaSUsageMeters />
        </div>

        <div className="space-y-4 sm:space-y-8">
          {!isAdmin ? (
               <div className="flex flex-col items-center justify-center p-12 sm:p-24 text-center space-y-6 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted shadow-inner">
                <div className="bg-destructive/10 p-6 rounded-full"><Lock className="h-12 w-12 text-destructive" /></div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-2xl font-black uppercase tracking-tight">Configuration Locked</h1>
                    <p className="text-muted-foreground text-sm font-medium">Only the Root Administrator can modify global shop settings and financial infrastructure.</p>
                </div>
            </div>
          ) : (
            <Card className="shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-none ring-1 ring-black/5 overflow-hidden rounded-[2.5rem] bg-white">
                <CardHeader className="bg-muted/10 border-b p-6 sm:p-10 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-black p-3 rounded-2xl shadow-xl"><Settings2 className="h-8 w-8 text-white" /></div>
                            <div>
                                <CardTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Identity Management</CardTitle>
                                <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60">Engineered Logic & Corporate Branding</CardDescription>
                            </div>
                        </div>
                        <Badge className="w-fit mx-auto sm:mx-0 h-6 px-4 bg-primary text-white font-black uppercase text-[10px] tracking-widest border-none">Active System Control</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b bg-muted/20">
                            <TabsList className="flex w-full grid grid-cols-7 h-14 bg-transparent rounded-none p-0 overflow-x-auto no-scrollbar">
                                <TabsTrigger value="profile" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Branding</TabsTrigger>
                                <TabsTrigger value="contact" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Contact</TabsTrigger>
                                <TabsTrigger value="payments" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Money</TabsTrigger>
                                <TabsTrigger value="groups" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Groups</TabsTrigger>
                                <TabsTrigger value="logistics" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Units</TabsTrigger>
                                <TabsTrigger value="documents" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Docs</TabsTrigger>
                                <TabsTrigger value="data" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white transition-all">Extra</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <div className="p-6 sm:p-12">
                            <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Palette className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Corporate Branding</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Configure legal identity and visual theme.</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Legal Business Name</Label><Input value={compData.name} onChange={e => handleInputChange('name', e.target.value)} className="h-12 font-black rounded-xl text-lg border-2" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Business Logic Template</Label>
                                            <Select onValueChange={v => handleInputChange('businessType', v)} value={compData.businessType}>
                                                <SelectTrigger className="h-12 font-black rounded-xl border-2"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="retail">Retail POS + Inventory</SelectItem>
                                                    <SelectItem value="tech">Technical Repair Node</SelectItem>
                                                    <SelectItem value="hospitality">Hospitality Management</SelectItem>
                                                    <SelectItem value="service">Standard Services</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-4">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase opacity-60">Primary Brand Color</Label>
                                            <div className="flex gap-4 items-center">
                                                <input type="color" value={compData.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer border-none shadow-md" />
                                                <code className="text-xs font-mono font-black uppercase opacity-40">{compData.primaryColor}</code>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase opacity-60">Secondary Highlight</Label>
                                            <div className="flex gap-4 items-center">
                                                <input type="color" value={compData.secondaryColor} onChange={e => handleInputChange('secondaryColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer border-none shadow-md" />
                                                <code className="text-xs font-mono font-black uppercase opacity-40">{compData.secondaryColor}</code>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="contact" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Globe className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Presence & HQ</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Where clients find and contact you.</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Official Support Email</Label><Input value={compData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-12 rounded-xl font-bold border-2" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Primary Business Phone</Label><Input value={compData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-12 rounded-xl font-bold border-2" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Alternative / WhatsApp</Label><Input value={compData.altPhone} onChange={e => handleInputChange('altPhone', e.target.value)} className="h-12 rounded-xl font-bold border-2" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Corporate Website</Label><Input value={compData.website} onChange={e => handleInputChange('website', e.target.value)} className="h-12 rounded-xl font-bold border-2" placeholder="https://..." /></div>
                                        <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Full Physical Headquarters Address</Label><Input value={compData.address} onChange={e => handleInputChange('address', e.target.value)} className="h-12 rounded-xl font-bold border-2" placeholder="Building, Floor, Street..." /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">City / Town</Label><Input value={compData.city} onChange={e => handleInputChange('city', e.target.value)} className="h-12 rounded-xl font-bold border-2" /></div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b pb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg"><Landmark className="h-5 w-5 text-primary" /></div>
                                            <div><h3 className="text-sm font-black uppercase">Banking Infrastructure</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Settlement details for Invoices and Statements.</p></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Bank Name</Label><Input value={compData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} className="h-12 rounded-xl font-bold border-2" placeholder="e.g. Diamond Trust Bank" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Account Number</Label><Input value={compData.bankAccNo} onChange={e => handleInputChange('bankAccNo', e.target.value)} className="h-12 rounded-xl font-mono font-black border-2" /></div>
                                            <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Beneficiary Name (Account Name)</Label><Input value={compData.bankAccName} onChange={e => handleInputChange('bankAccName', e.target.value)} className="h-12 rounded-xl font-black uppercase border-2" /></div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4">
                                        <div className="flex items-center gap-3 border-b pb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg"><Smartphone className="h-5 w-5 text-primary" /></div>
                                            <div><h3 className="text-sm font-black uppercase">Mobile Money (M-Pesa)</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Lipa Na M-Pesa automated reconciliation settings.</p></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Paybill Number</Label><Input value={compData.paybillNumber} onChange={e => handleInputChange('paybillNumber', e.target.value)} className="h-12 rounded-xl font-mono font-black border-2" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">M-Pesa Account ID</Label><Input value={compData.paybillAccount} onChange={e => handleInputChange('paybillAccount', e.target.value)} className="h-12 rounded-xl font-mono font-black border-2" placeholder="e.g. ROYAL1" /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Buy Goods (Till)</Label><Input value={compData.tillNumber} onChange={e => handleInputChange('tillNumber', e.target.value)} className="h-12 rounded-xl font-mono font-black border-2" /></div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 space-y-4 shadow-inner">
                                        <div className="flex items-center gap-3"><Info className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase tracking-widest text-primary">Financial Compliance</h4></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Company Tax PIN (KRA)</Label><Input value={compData.taxPin} onChange={e => handleInputChange('taxPin', e.target.value)} className="h-12 rounded-xl font-mono font-black border-2 uppercase" placeholder="P05..." /></div>
                                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Standard VAT Rate (%)</Label><Input type="number" value={compData.vatRate} onChange={e => handleInputChange('vatRate', Number(e.target.value))} className="h-12 rounded-xl font-black border-2 text-center" /></div>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="groups" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-10">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Tags className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Inventory Classification</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Hierarchy defined here flows to Item Registration.</p></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-1"><Label className="text-xs font-black uppercase">Primary Business Groups</Label><p className="text-[10px] text-muted-foreground uppercase">Major product categories (e.g. Laptops, Spares)</p></div>
                                            <div className="flex gap-3">
                                                <Input placeholder="Enter primary group..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                                                <Button onClick={handleAddCategory} type="button" className="h-12 w-14 p-0 shadow-2xl rounded-xl shrink-0"><Plus className="h-6 w-6" /></Button>
                                            </div>
                                            <ScrollArea className="h-[400px] border-2 rounded-[2rem] p-4 bg-muted/5 shadow-inner">
                                                <div className="space-y-2">
                                                    {compData.categories.map((cat, i) => (
                                                        <div key={i} className="p-4 bg-white border-2 rounded-2xl flex items-center justify-between group shadow-sm hover:border-primary transition-all">
                                                            <span className="font-black uppercase text-xs tracking-tight">{cat.name}</span>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-30 hover:opacity-100 hover:bg-destructive/10 rounded-full" onClick={() => handleRemoveCategory(cat.name)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-1"><Label className="text-xs font-black uppercase">Sub-Category Registry</Label><p className="text-[10px] text-muted-foreground uppercase">Granular links within primary groups.</p></div>
                                            <ScrollArea className="h-[520px] pr-2">
                                                <div className="space-y-6">
                                                    {compData.categories.map((cat, i) => (
                                                        <Card key={i} className="rounded-3xl border-2 border-black/5 overflow-hidden bg-card/30">
                                                            <CardHeader className="bg-primary/5 py-4 px-6 border-b flex flex-row items-center justify-between">
                                                                <Badge className="font-black uppercase text-[10px] h-6 px-4 bg-white border-2 text-primary">{cat.name}</Badge>
                                                                <span className="text-[9px] font-black uppercase opacity-30">{cat.subCategories.length} Links</span>
                                                            </CardHeader>
                                                            <CardContent className="p-6 space-y-4">
                                                                <div className="flex gap-2">
                                                                    <Input placeholder={`New link for ${cat.name}...`} value={newSubCategoryName[cat.name] || ""} onChange={e => setNewSubCategoryName({ ...newSubCategoryName, [cat.name]: e.target.value })} className="h-10 rounded-xl text-xs font-bold border-2" />
                                                                    <Button size="icon" variant="outline" onClick={() => handleAddSubCategory(cat.name)} className="h-10 w-10 shrink-0 rounded-xl border-2 hover:bg-primary hover:text-white transition-all"><Plus className="h-4 w-4" /></Button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {cat.subCategories.map((sub, sIdx) => (
                                                                        <Badge key={sIdx} variant="secondary" className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase h-7 bg-white border border-black/5 hover:border-destructive hover:text-destructive group/sub transition-all cursor-default">
                                                                            {sub}
                                                                            <button onClick={() => handleRemoveSubCategory(cat.name, sub)} className="opacity-0 group-hover/sub:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                    {compData.categories.length === 0 && <div className="p-20 text-center opacity-10 uppercase font-black tracking-[0.4em]">Empty Registry</div>}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="logistics" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Scale className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Measurement Units</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Standardize how you count inventory.</p></div>
                                    </div>
                                    <div className="max-w-2xl space-y-8">
                                        <div className="flex gap-4">
                                            <Input placeholder="Unit Name (e.g. Metres, Box)..." value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="h-14 text-lg font-black border-2 rounded-2xl" />
                                            <Button onClick={handleAddUnit} className="h-14 px-10 font-black uppercase tracking-widest shadow-2xl rounded-2xl shrink-0">Add Unit</Button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {compData.unitsOfMeasure.map(unit => (
                                                <div key={unit} className="p-5 bg-white border-2 rounded-2xl flex items-center justify-between group shadow-sm hover:ring-4 hover:ring-primary/5 transition-all">
                                                    <span className="font-black text-xs uppercase tracking-tight">{unit}</span>
                                                    <button onClick={() => handleRemoveUnit(unit)} className="text-destructive opacity-20 hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Paperwork Automation</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Configure sequential numbering and document themes.</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Invoice Prefix</Label><Input value={compData.invoicePrefix} onChange={e => handleInputChange('invoicePrefix', e.target.value)} className="h-12 font-black rounded-xl text-center border-2 uppercase" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Receipt Prefix</Label><Input value={compData.receiptPrefix} onChange={e => handleInputChange('receiptPrefix', e.target.value)} className="h-12 font-black rounded-xl text-center border-2 uppercase" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Quotation Prefix</Label><Input value={compData.quotePrefix} onChange={e => handleInputChange('quotePrefix', e.target.value)} className="h-12 font-black rounded-xl text-center border-2 uppercase" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Delivery Prefix</Label><Input value={compData.deliveryPrefix} onChange={e => handleInputChange('deliveryPrefix', e.target.value)} className="h-12 font-black rounded-xl text-center border-2 uppercase" /></div>
                                    </div>
                                    <div className="p-8 border-2 border-dashed rounded-[2rem] bg-muted/20 text-center space-y-4">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                            "Document settings affect all PDFs generated by the hub. Changes are reflected instantly on next document creation."
                                        </p>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="data" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 border-b pb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><DownloadCloud className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-sm font-black uppercase">Audit Extraction</h3><p className="text-[10px] font-medium text-muted-foreground uppercase">Secure CSV exports for external accounting.</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { id: 'inventory', label: 'Full Stock Audit', icon: Package },
                                            { id: 'customers', label: 'Client Directory', icon: Users },
                                            { id: 'sales', label: 'Sales Ledger', icon: DollarSign },
                                            { id: 'leases', label: 'Agreement Log', icon: FileText }
                                        ].map(item => (
                                            <Button 
                                                key={item.id}
                                                variant="outline" 
                                                className="h-24 flex flex-col gap-3 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all group" 
                                                onClick={() => handleDataExport(item.id as any)} 
                                                disabled={!!isExporting}
                                            >
                                                {isExporting === item.id ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <item.icon className="h-6 w-6 opacity-30 group-hover:opacity-100 transition-opacity" />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </section>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
                <CardFooter className="justify-end bg-muted/10 border-t p-8 sm:p-12">
                    <Button onClick={handleSaveCompany} disabled={isSaving} className="h-16 w-full sm:w-auto px-16 font-black uppercase tracking-widest shadow-2xl bg-primary text-white hover:bg-primary/90 rounded-2xl active:scale-95 transition-all flex items-center gap-3">
                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                        Execute System Sync
                    </Button>
                </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
