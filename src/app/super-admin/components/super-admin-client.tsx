'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, addDoc, getDocs } from 'firebase/firestore';
import { 
    Globe, 
    Building2, 
    Users, 
    Activity, 
    ShieldCheck, 
    Lock, 
    Loader2, 
    BarChart3,
    Search,
    RefreshCw,
    Database,
    Zap,
    PlusCircle,
    Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyManagement } from './company-management';
import { UserManagement } from './user-management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Company } from '@/types';

export function SuperAdminClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [newCompData, setNewCompData] = useState({
      name: '',
      email: '',
      phone: '',
      businessType: 'retail'
  });

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<AppUser>(userProfileRef);

  const companiesQuery = useMemoFirebase(() => collection(firestore, 'companies'), [firestore]);
  const allUsersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const salesQuery = useMemoFirebase(() => collection(firestore, 'sales_transactions'), [firestore]);

  const { data: companies, isLoading: compsLoading } = useCollection(companiesQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection(allUsersQuery);
  const { data: allSales, isLoading: salesLoading } = useCollection(salesQuery);

  const stats = useMemo(() => {
    if (!companies || !allUsers || !allSales) return null;
    const totalGmv = allSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    return {
        totalCompanies: companies.length,
        totalUsers: allUsers.length,
        totalGmv,
        activeNodes: companies.filter(c => c.status === 'active').length
    };
  }, [companies, allUsers, allSales]);

  const handleAddCompany = async () => {
      if (!newCompData.name || !newCompData.email) return;
      setIsSavingComp(true);
      try {
          const compId = crypto.randomUUID();
          await setDoc(doc(firestore, 'companies', compId), {
              ...newCompData,
              id: compId,
              tenantId: compId,
              status: 'active',
              plan: 'legacy_pro',
              createdAt: new Date().toISOString(),
              createdBy: { uid: user?.uid, name: profile?.name || 'System' }
          });
          toast({ title: "Company Node Deployed" });
          setIsAddCompanyOpen(false);
          setNewCompData({ name: '', email: '', phone: '', businessType: 'retail' });
      } catch (e) {
          toast({ variant: 'destructive', title: "Deployment Failed" });
      } finally {
          setIsSavingComp(false);
      }
  };

  if (profileLoading || compsLoading || usersLoading || salesLoading) {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Platform Intelligence...</p>
        </div>
      );
  }

  if (profile?.role !== 'super_admin') {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full">
                <Lock className="h-12 w-12 text-destructive" />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Access Denied</h1>
                <p className="text-muted-foreground leading-relaxed">
                    Global platform control is restricted to authorized system controllers.
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Platform Control Node" 
        description="Global workspace oversight and multi-tenant management."
        actions={
            <div className="flex items-center gap-3">
                <Button onClick={() => setIsAddCompanyOpen(true)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl">
                    <PlusCircle className="mr-2 h-4 w-4" /> Deploy New Node
                </Button>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-10 px-4 font-black uppercase tracking-widest flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> System Online
                </Badge>
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Business Nodes" value={stats?.totalCompanies || 0} icon={Building2} description="Total registered companies" />
          <SummaryCard title="Global Identity Pool" value={stats?.totalUsers || 0} icon={Users} description="Platform-wide registered users" />
          <SummaryCard title="Cumulative GMV" value={new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(stats?.totalGmv || 0)} icon={Activity} description="Sales across all silos" />
          <SummaryCard title="System Integrity" value="VERIFIED" icon={ShieldCheck} description="Multi-tenant isolation status" className="border-l-4 border-l-green-500" />
      </div>

      <Tabs defaultValue="companies" className="w-full">
          <TabsList className="bg-muted/50 p-1 border mb-8 h-14 rounded-2xl">
              <TabsTrigger value="companies" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:shadow-lg">
                <Building2 className="h-3.5 w-3.5 mr-2" />
                Company Registry
              </TabsTrigger>
              <TabsTrigger value="users" className="px-8 font-black uppercase text-[10px] tracking-widest h-full rounded-xl data-[state=active]:shadow-lg">
                <Users className="h-3.5 w-3.5 mr-2" />
                Global User Directory
              </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="animate-in fade-in duration-500">
              <CompanyManagement companies={companies || []} />
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in duration-500">
              <UserManagement users={allUsers || []} companies={companies || []} />
          </TabsContent>
      </Tabs>

      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
          <DialogContent className="sm:max-w-md border-none shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                      <Building className="h-6 w-6 text-primary" />
                      Deploy Workspace
                  </DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                      Initializing a new business node in the cluster.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Business Name</Label>
                      <Input value={newCompData.name} onChange={e => setNewCompData({...newCompData, name: e.target.value})} placeholder="e.g. Acme Corp" className="h-11 font-bold" />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Admin Email</Label>
                      <Input value={newCompData.email} onChange={e => setNewCompData({...newCompData, email: e.target.value})} placeholder="office@company.com" className="h-11" />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Business Type</Label>
                      <Select onValueChange={v => setNewCompData({...newCompData, businessType: v})} value={newCompData.businessType}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="retail">Retail / Hardware</SelectItem>
                              <SelectItem value="tech">Computers & IT</SelectItem>
                              <SelectItem value="hospitality">Restaurant / Hotel</SelectItem>
                              <SelectItem value="service">General Services</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)} className="h-12 font-bold">Cancel</Button>
                  <Button onClick={handleAddCompany} disabled={isSavingComp || !newCompData.name} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl">
                      {isSavingComp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute Deployment"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
