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
    Scale
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
    address: '',
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
      toast({ title: 'Settings Synced' });
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
      toast({ title: "Category Created" });
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
      toast({ title: `Added to ${categoryName}` });
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
          toast({ variant: 'destructive', title: 'Unit Exists' });
          return;
      }
      setCompData(prev => ({
          ...prev,
          unitsOfMeasure: [...prev.unitsOfMeasure, unit]
      }));
      setNewUnitName("");
      toast({ title: "Unit Added" });
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

  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

  return (
    <div className="space-y-4 sm:space-y-8 max-w-7xl mx-auto pb-20 px-1 sm:px-0">
      <PageHeader title="Shop Settings" description="Branding & Logistics Node." />

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-md overflow-hidden border-none ring-1 ring-black/5 rounded-2xl">
            <CardHeader className="items-center text-center bg-muted/20 pb-6 sm:pb-8">
              <div className="relative group cursor-pointer mt-4" onClick={() => logoInputRef.current?.click()}>
                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-xl bg-white">
                  <AvatarImage 
                    src={compData.logoUrl || `https://picsum.photos/seed/${authUser?.uid}/128/128`} 
                    className="object-contain p-1"
                  />
                  <AvatarFallback className="text-3xl sm:text-4xl font-black uppercase bg-primary text-primary-foreground">
                    {(compData.name || displayName || "CP").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 space-y-1 overflow-hidden px-2">
                <CardTitle className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none truncate">
                    {compData.name || 'Your Shop'}
                </CardTitle>
                <CardDescription className="font-bold text-[8px] sm:text-[10px] uppercase tracking-widest text-primary">
                    Administrator: {displayName}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-primary" />
                    My Nodes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y max-h-[250px] overflow-y-auto no-scrollbar">
                    {availableWorkspaces.map(ws => (
                        <div key={ws.id} className={cn("p-3 sm:p-4 flex items-center justify-between group", tenant?.id === ws.id ? "bg-primary/5" : "hover:bg-muted/30")}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                                    <AvatarImage src={ws.logoUrl} className="object-contain" />
                                    <AvatarFallback className="text-[8px] font-black">{ws.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-tight leading-none truncate">{ws.name}</p>
                                    {tenant?.id === ws.id && <Badge variant="outline" className="h-3.5 px-1 text-[6px] font-black border-primary text-primary bg-white mt-1 uppercase">ACTIVE</Badge>}
                                </div>
                            </div>
                            {tenant?.id !== ws.id && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleSwitch(ws.id)} disabled={!!isSwitching}>
                                    {isSwitching === ws.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>

          <SaaSUsageMeters />
        </div>

        <div className="space-y-4 sm:space-y-8">
          {!isAdmin ? (
               <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center space-y-6 bg-muted/20 rounded-[2rem] border-4 border-dashed border-muted">
                <div className="bg-destructive/10 p-4 sm:p-6 rounded-full"><Lock className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" /></div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Access Locked</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">Only owners can modify settings.</p>
                </div>
            </div>
          ) : (
            <Card className="shadow-xl border-none ring-1 ring-black/5 overflow-hidden rounded-xl sm:rounded-[2rem]">
                <CardHeader className="bg-muted/10 border-b p-4 sm:p-8 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="bg-black p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg"><Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" /></div>
                        <div>
                            <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Identity Node</CardTitle>
                            <CardDescription className="text-[10px] sm:text-sm">Logic & Branding Config.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="overflow-x-auto no-scrollbar border-b bg-muted/30">
                            <TabsList className="flex w-full grid grid-cols-7 h-12 sm:h-14 bg-transparent rounded-none p-0 overflow-x-auto no-scrollbar">
                                <TabsTrigger value="profile" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Branding</TabsTrigger>
                                <TabsTrigger value="contact" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Contact</TabsTrigger>
                                <TabsTrigger value="payments" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Money</TabsTrigger>
                                <TabsTrigger value="groups" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Groups</TabsTrigger>
                                <TabsTrigger value="logistics" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Units</TabsTrigger>
                                <TabsTrigger value="documents" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Docs</TabsTrigger>
                                <TabsTrigger value="data" className="rounded-none h-full font-black uppercase text-[8px] sm:text-[10px] tracking-widest px-2 sm:px-0">Extra</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <div className="p-4 sm:p-8">
                            <TabsContent value="profile" className="mt-0 space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2"><Label className="text-[9px] sm:text-[10px] font-black uppercase">Legal Name</Label><Input value={compData.name} onChange={e => handleInputChange('name', e.target.value)} className="h-10 sm:h-11 font-bold rounded-xl" /></div>
                                    <div className="space-y-2"><Label className="text-[9px] sm:text-[10px] font-black uppercase">Silo Template</Label>
                                        <Select onValueChange={v => handleInputChange('businessType', v)} value={compData.businessType}>
                                            <SelectTrigger className="h-10 sm:h-11 font-bold rounded-xl"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="retail">Retail / Hardware</SelectItem>
                                                <SelectItem value="tech">Computers & IT</SelectItem>
                                                <SelectItem value="service">Service Node</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2"><Label className="text-[9px] sm:text-[10px] font-black uppercase">Official Email</Label><Input value={compData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-10 sm:h-11 rounded-xl" /></div>
                                    <div className="space-y-2"><Label className="text-[9px] sm:text-[10px] font-black uppercase">Primary Phone</Label><Input value={compData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-10 sm:h-11 rounded-xl" /></div>
                                    <div className="space-y-2 md:col-span-2"><Label className="text-[9px] sm:text-[10px] font-black uppercase">Physical HQ</Label><Input value={compData.address} onChange={e => handleInputChange('address', e.target.value)} className="h-10 sm:h-11 rounded-xl" /></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-primary border-b pb-1"><Landmark className="h-3 w-3" /> Bank Link</Label>
                                        <div className="space-y-3">
                                            <Input value={compData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} placeholder="Bank Name" className="h-10 rounded-xl text-xs" />
                                            <Input value={compData.bankAccNo} onChange={e => handleInputChange('bankAccNo', e.target.value)} placeholder="Account No" className="h-10 rounded-xl font-mono text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-primary border-b pb-1"><Smartphone className="h-3 w-3" /> M-Pesa Node</Label>
                                        <div className="space-y-3">
                                            <Input value={compData.paybillNumber} onChange={e => handleInputChange('paybillNumber', e.target.value)} placeholder="Paybill No" className="h-10 rounded-xl font-mono text-xs" />
                                            <Input value={compData.paybillAccount} onChange={e => handleInputChange('paybillAccount', e.target.value)} placeholder="Account ID" className="h-10 rounded-xl font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="groups" className="mt-0 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-black uppercase">Primary Groups</Label>
                                            <p className="text-[9px] text-muted-foreground uppercase">Top-level categories</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input placeholder="Group Name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="h-10 rounded-xl border-2 text-xs" />
                                            <Button onClick={handleAddCategory} type="button" className="h-10 w-10 p-0 shadow-lg rounded-xl shrink-0"><Plus className="h-4 w-4" /></Button>
                                        </div>
                                        <ScrollArea className="h-40 sm:h-80 border rounded-2xl p-2 sm:p-4 bg-muted/5">
                                            <div className="space-y-1">
                                                {compData.categories.map((cat, i) => (
                                                    <div key={i} className="p-2.5 bg-white border rounded-xl flex items-center justify-between group shadow-sm">
                                                        <span className="font-black uppercase text-[10px] sm:text-xs">{cat.name}</span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 sm:opacity-0 group-hover:opacity-100" onClick={() => handleRemoveCategory(cat.name)}>
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-black uppercase">Sub-Group Registry</Label>
                                            <p className="text-[9px] text-muted-foreground uppercase">Hierarchical links</p>
                                        </div>
                                        <ScrollArea className="h-[250px] sm:h-[430px] pr-2">
                                            {compData.categories.map((cat, i) => (
                                                <div key={i} className="mb-4 sm:mb-6 p-4 sm:p-5 bg-white border-2 border-black/5 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
                                                    <Badge className="font-black uppercase text-[8px] sm:text-[9px] h-5 sm:h-6 px-3">{cat.name}</Badge>
                                                    <div className="flex gap-2">
                                                        <Input placeholder={`Link to ${cat.name}...`} value={newSubCategoryName[cat.name] || ""} onChange={e => setNewSubCategoryName({ ...newSubCategoryName, [cat.name]: e.target.value })} className="h-9 rounded-lg text-[10px]" />
                                                        <Button size="icon" variant="secondary" onClick={() => handleAddSubCategory(cat.name)} className="h-9 w-9 shrink-0 rounded-lg"><Plus className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {cat.subCategories.map((sub, sIdx) => (
                                                            <Badge key={sIdx} variant="secondary" className="flex items-center gap-1.5 px-2 py-1 text-[8px] font-bold uppercase h-6">
                                                                {sub}
                                                                <button onClick={() => handleRemoveSubCategory(cat.name, sub)} className="hover:text-destructive opacity-40 hover:opacity-100"><Trash2 className="h-2.5 w-2.5" /></button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="logistics" className="mt-0 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-black uppercase flex items-center gap-2"><Scale className="h-4 w-4" /> Units of Measure</Label>
                                        <p className="text-[9px] text-muted-foreground uppercase">Inventory counting units (e.g. Box, Kgs)</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Input placeholder="Unit Name..." value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="h-12 text-base font-black border-2 rounded-xl" />
                                        <Button onClick={handleAddUnit} className="h-12 px-6 font-black uppercase shadow-lg rounded-xl shrink-0">Add</Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-4">
                                        {compData.unitsOfMeasure.map(unit => (
                                            <div key={unit} className="p-3 bg-white border rounded-xl flex items-center justify-between group shadow-sm hover:border-primary transition-all">
                                                <span className="font-bold text-[10px] uppercase">{unit}</span>
                                                <button onClick={() => handleRemoveUnit(unit)} className="text-destructive opacity-40 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0 space-y-6">
                                <div className="grid grid-cols-2 gap-4 p-4 sm:p-6 bg-black/5 rounded-2xl border">
                                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Inv Prefix</Label><Input value={compData.invoicePrefix} onChange={e => handleInputChange('invoicePrefix', e.target.value)} className="h-10 font-black rounded-xl text-center" /></div>
                                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Rcpt Prefix</Label><Input value={compData.receiptPrefix} onChange={e => handleInputChange('receiptPrefix', e.target.value)} className="h-10 font-black rounded-xl text-center" /></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="data" className="mt-0 space-y-4">
                                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                    <Button variant="outline" className="h-12 font-black uppercase text-[9px] rounded-xl border-2" onClick={() => handleDataExport('inventory')} disabled={!!isExporting}>
                                        {isExporting === 'inventory' ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <DownloadCloud className="h-3 w-3 mr-1.5" />} Stock
                                    </Button>
                                    <Button variant="outline" className="h-12 font-black uppercase text-[9px] rounded-xl border-2" onClick={() => handleDataExport('customers')} disabled={!!isExporting}>
                                        {isExporting === 'customers' ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <DownloadCloud className="h-3 w-3 mr-1.5" />} Clients
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
                <CardFooter className="justify-end bg-muted/10 border-t p-6 sm:p-8">
                    <Button onClick={handleSaveCompany} disabled={isSaving} className="h-14 w-full sm:w-auto px-12 font-black uppercase tracking-widest shadow-2xl bg-black text-white hover:bg-black/90 rounded-2xl active:scale-95">
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />} Sync Node
                    </Button>
                </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}