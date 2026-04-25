'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc, setDoc } from 'firebase/firestore';
import type { Tenant, SubscriptionPlan, SaaSContextState, SubscriptionTier } from '@/types/saas';
import { startOfMonth, parseISO, addDays } from 'date-fns';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser } from '@/types';

const DEFAULT_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: { id: 'plan_free', name: 'Standard Workspace', tier: 'free', maxAssets: 50, maxSalesPerMonth: 100, enableBranding: false, enableTracking: false, priceMonthly: 0, currency: 'KES' },
  basic: { id: 'plan_basic', name: 'Growth Plan', tier: 'basic', maxAssets: 500, maxSalesPerMonth: 1000, enableBranding: true, enableTracking: false, priceMonthly: 2500, currency: 'KES' },
  pro: { id: 'plan_pro', name: 'Enterprise Elite', tier: 'pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 7500, currency: 'KES' },
  legacy_pro: { id: 'plan_legacy', name: 'Legacy Pro (v1.0)', tier: 'legacy_pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 0, currency: 'KES' },
};

const SaaSContext = createContext<SaaSContextState | undefined>(undefined);

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // 1. Resolve User Profile from Firestore
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userRef);

  // 2. Resolve Active Company
  const companyRef = useMemoFirebase(() => 
    userProfile?.tenantId ? doc(firestore, 'companies', userProfile.tenantId) : null,
    [firestore, userProfile?.tenantId]
  );
  const { data: activeCompany, isLoading: isCompanyLoading } = useDoc(companyRef);

  // 3. Resolve Portfolio (Workspaces user can access)
  const portfolioQuery = useMemoFirebase(() => {
    if (!userProfile?.tenantIds || userProfile.tenantIds.length === 0) return null;
    return query(collection(firestore, 'companies'), where('id', 'in', userProfile.tenantIds));
  }, [firestore, userProfile?.tenantIds]);
  const { data: availableWorkspaces = [] } = useCollection(portfolioQuery);

  // 4. Usage Metrics for Dashboard/Limits
  const assetQuery = useMemoFirebase(() => 
    userProfile?.tenantId ? query(collection(firestore, 'assets'), where('tenantId', '==', userProfile.tenantId)) : null,
    [firestore, userProfile?.tenantId]
  );
  const { data: assets } = useCollection(assetQuery);

  const salesQuery = useMemoFirebase(() => {
    if (!userProfile?.tenantId) return null;
    const start = startOfMonth(new Date()).toISOString();
    return query(
        collection(firestore, 'sales_transactions'), 
        where('tenantId', '==', userProfile.tenantId),
        where('date', '>=', start)
    );
  }, [firestore, userProfile?.tenantId]);
  const { data: monthlySales } = useCollection(salesQuery);

  const usageStats = useMemo(() => ({
    assets: assets?.length || 0,
    salesThisMonth: monthlySales?.length || 0
  }), [assets, monthlySales]);

  // Derived Tenant and Plan State
  const tenantData = useMemo<Tenant | null>(() => {
    if (!activeCompany) return null;
    return {
        id: activeCompany.id,
        name: activeCompany.name,
        ownerId: activeCompany.createdBy?.uid || 'unknown',
        tier: (activeCompany.plan as SubscriptionTier) || 'legacy_pro',
        status: (activeCompany.status as any) || 'active',
        createdAt: activeCompany.createdAt,
        expiresAt: activeCompany.createdAt ? addDays(parseISO(activeCompany.createdAt), 365).toISOString() : undefined,
        features: ['all']
    };
  }, [activeCompany]);

  const activePlan = useMemo(() => {
      if (!tenantData) return null;
      return DEFAULT_PLANS[tenantData.tier] || DEFAULT_PLANS.legacy_pro;
  }, [tenantData]);

  // AUTO-PROVISION Profile
  useEffect(() => {
    if (!isUserLoading && user && !isProfileLoading && !userProfile) {
        const provision = async () => {
            const ref = doc(firestore, 'users', user.uid);
            try {
                await setDoc(ref, {
                    id: user.uid,
                    name: user.displayName || 'System User',
                    email: user.email || '',
                    role: 'user',
                    tenantIds: [],
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } catch (e) {
                console.warn("Silent provisioning wait...");
            }
        };
        provision();
    }
  }, [user, isUserLoading, isProfileLoading, userProfile, firestore]);

  const switchTenant = async (newTenantId: string) => {
    if (!user || !userRef) return;
    try {
        await updateDoc(userRef, { tenantId: newTenantId });
        toast({ title: 'Workspace Switched' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Switch Failed', description: e.message });
    }
  };

  const contextValue = useMemo(() => ({
    tenant: tenantData,
    plan: activePlan,
    usage: usageStats,
    isLoading: isUserLoading || isProfileLoading || (!!userProfile?.tenantId && isCompanyLoading),
    isLegacyUser: activePlan?.tier === 'legacy_pro',
    availableWorkspaces: (availableWorkspaces || []) as any,
    switchTenant
  }), [tenantData, activePlan, usageStats, isUserLoading, isProfileLoading, isCompanyLoading, availableWorkspaces]);

  if (user && tenantData?.status === 'suspended') {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background p-6">
            <div className="max-w-md text-center space-y-6">
                <Lock className="h-12 w-12 text-destructive mx-auto" />
                <h1 className="text-3xl font-black uppercase">Workspace Locked</h1>
                <p className="text-muted-foreground">Access suspended by platform provider.</p>
                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Check Status</Button>
            </div>
        </div>
    );
  }

  return (
    <SaaSContext.Provider value={contextValue}>
      {children}
    </SaaSContext.Provider>
  );
}

export function useSaaS() {
  const context = useContext(SaaSContext);
  if (context === undefined) throw new Error('useSaaS must be used within a SaaSProvider');
  return context;
}