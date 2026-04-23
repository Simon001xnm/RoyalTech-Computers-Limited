
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Tenant, SubscriptionPlan, SaaSContextState, SubscriptionTier } from '@/types/saas';
import { isFeatureEnabled } from '@/lib/feature-flags';

const DEFAULT_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: { id: 'plan_free', name: 'Standard Workspace', tier: 'free', maxAssets: 50, maxSalesPerMonth: 100, enableBranding: false, enableTracking: false, priceMonthly: 0, currency: 'KES' },
  basic: { id: 'plan_basic', name: 'Growth Plan', tier: 'basic', maxAssets: 500, maxSalesPerMonth: 1000, enableBranding: true, enableTracking: false, priceMonthly: 2500, currency: 'KES' },
  pro: { id: 'plan_pro', name: 'Enterprise Elite', tier: 'pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 7500, currency: 'KES' },
  legacy_pro: { id: 'plan_legacy', name: 'Legacy Pro (v1.0)', tier: 'legacy_pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 0, currency: 'KES' },
};

const SaaSContext = createContext<SaaSContextState | undefined>(undefined);

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DEXIE: Check if this user is linked to a tenant locally
  const localCompany = useLiveQuery(() => db.companies.toCollection().last());

  useEffect(() => {
    if (isUserLoading) return;

    const resolveTenant = async () => {
      setIsLoading(true);
      
      // If Tenancy Isolation is OFF (v1.0 Mode), provide a dummy global tenant
      if (!isFeatureEnabled('TENANCY_ISOLATION')) {
        const dummyTenant: Tenant = {
          id: 'v1_global',
          name: localCompany?.name || 'Local Workspace',
          ownerId: user?.uid || 'local',
          tier: 'legacy_pro',
          status: 'active',
          createdAt: new Date().toISOString(),
          features: ['all']
        };
        setTenant(dummyTenant);
        setPlan(DEFAULT_PLANS.legacy_pro);
        setIsLoading(false);
        return;
      }

      // If isolation is ON, look for the user's specific tenant
      // Roadmap: Fetch from cloud/Firestore in v2.0
      if (localCompany) {
         const t: Tenant = {
             id: localCompany.id,
             name: localCompany.name,
             ownerId: localCompany.createdBy?.uid || 'unknown',
             tier: 'legacy_pro',
             status: 'active',
             createdAt: localCompany.createdAt,
             features: ['all']
         };
         setTenant(t);
         setPlan(DEFAULT_PLANS.legacy_pro);
      }
      
      setIsLoading(false);
    };

    resolveTenant();
  }, [user, isUserLoading, localCompany]);

  const value: SaaSContextState = {
    tenant,
    plan,
    isLoading: isLoading || isUserLoading,
    isLegacyUser: plan?.tier === 'legacy_pro'
  };

  return (
    <SaaSContext.Provider value={value}>
      {children}
    </SaaSContext.Provider>
  );
}

export function useSaaS() {
  const context = useContext(SaaSContext);
  if (context === undefined) {
    throw new Error('useSaaS must be used within a SaaSProvider');
  }
  return context;
}
