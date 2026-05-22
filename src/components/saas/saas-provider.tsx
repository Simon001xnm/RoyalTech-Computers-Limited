'use client';

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Tenant, SubscriptionPlan, SaaSContextState, SubscriptionTier } from '@/types/saas';
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
  
  const [cachedTenantId, setCachedTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('rcl_last_tenant_id');
        if (saved) setCachedTenantId(saved);
    }
  }, []);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userRef);

  // Persistence Strategy: Prioritize User Profile (Source of Truth) but fallback to Cache (Speed)
  const effectiveTenantId = userProfile?.tenantId || cachedTenantId;

  const companyRef = useMemoFirebase(() => 
    effectiveTenantId ? doc(firestore, 'companies', effectiveTenantId) : null,
    [firestore, effectiveTenantId]
  );
  const { data: activeCompany, isLoading: isCompanyLoading } = useDoc(companyRef);

  useEffect(() => {
    if (userProfile?.tenantId) {
        localStorage.setItem('rcl_last_tenant_id', userProfile.tenantId);
    }
  }, [userProfile?.tenantId]);

  // Usage meters (Simplified for prototype)
  const usageStats = useMemo(() => ({ assets: 0, salesThisMonth: 0 }), []);

  const tenantData = useMemo<Tenant | null>(() => {
    if (!activeCompany) return null;
    return {
        id: activeCompany.id,
        name: activeCompany.name,
        ownerId: activeCompany.createdBy?.uid || 'unknown',
        tier: (activeCompany.plan as SubscriptionTier) || 'legacy_pro',
        status: (activeCompany.status as any) || 'active',
        createdAt: activeCompany.createdAt,
        features: ['all']
    };
  }, [activeCompany]);

  const activePlan = useMemo(() => {
      if (!tenantData) return null;
      return DEFAULT_PLANS[tenantData.tier] || DEFAULT_PLANS.legacy_pro;
  }, [tenantData]);

  const switchTenant = async (newTenantId: string) => {
    if (!user || !userRef) return;
    try {
        await updateDoc(userRef, { tenantId: newTenantId });
        localStorage.setItem('rcl_last_tenant_id', newTenantId);
        toast({ title: 'Workspace Switched' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Switch Failed' });
    }
  };

  const contextValue = useMemo(() => ({
    tenant: tenantData,
    plan: activePlan,
    usage: usageStats,
    isLoading: isUserLoading || isProfileLoading || (!!effectiveTenantId && isCompanyLoading),
    isLegacyUser: activePlan?.tier === 'legacy_pro' || userProfile?.role === 'super_admin',
    availableWorkspaces: [] as any,
    switchTenant
  }), [tenantData, activePlan, usageStats, isUserLoading, isProfileLoading, isCompanyLoading, userProfile?.role, effectiveTenantId]);

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
