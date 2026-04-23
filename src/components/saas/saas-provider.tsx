
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@/firebase/provider';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Tenant, SubscriptionPlan, SaaSContextState, SubscriptionTier, TenantUsage } from '@/types/saas';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // USAGE TRACKING: Live counts for limits
  const usage = useLiveQuery(async () => {
    if (!tenant) return { assets: 0, salesThisMonth: 0 };
    
    const now = new Date();
    const start = startOfMonth(now).toISOString();
    const end = endOfMonth(now).toISOString();

    const assetCount = await db.assets.where('tenantId').equals(tenant.id).count();
    const salesCount = await db.sales
        .where('tenantId').equals(tenant.id)
        .and(s => s.date >= start && s.date <= end)
        .count();

    return { assets: assetCount, salesThisMonth: salesCount };
  }, [tenant?.id]);

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
      if (localCompany) {
         const t: Tenant = {
             id: localCompany.id,
             name: localCompany.name,
             ownerId: localCompany.createdBy?.uid || 'unknown',
             tier: (localCompany.plan as SubscriptionTier) || 'legacy_pro', 
             status: (localCompany.status as any) || 'active',
             createdAt: localCompany.createdAt,
             features: ['all']
         };
         setTenant(t);
         setPlan(DEFAULT_PLANS[t.tier as SubscriptionTier] || DEFAULT_PLANS.legacy_pro);
      }
      
      setIsLoading(false);
    };

    resolveTenant();
  }, [user, isUserLoading, localCompany]);

  if (tenant?.status === 'suspended') {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="bg-destructive/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                    <Lock className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Workspace Locked</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Access to <strong>{tenant.name}</strong> has been suspended by the platform administrator. 
                        This usually occurs due to outstanding subscription fees or policy updates.
                    </p>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                    <Button variant="outline" className="w-full font-bold" onClick={() => window.location.reload()}>Check Status Again</Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground">Contact Support (SimonStyless)</Button>
                </div>
            </div>
        </div>
    );
  }

  const value: SaaSContextState = {
    tenant,
    plan,
    usage: usage || { assets: 0, salesThisMonth: 0 },
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
