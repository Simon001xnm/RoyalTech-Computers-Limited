'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useUser } from '@/firebase/provider';
import { getDB } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Tenant, SubscriptionPlan, SaaSContextState, SubscriptionTier, TenantUsage } from '@/types/saas';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { startOfMonth, parseISO, addDays } from 'date-fns';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: { id: 'plan_free', name: 'Standard Workspace', tier: 'free', maxAssets: 50, maxSalesPerMonth: 100, enableBranding: false, enableTracking: false, priceMonthly: 0, currency: 'KES' },
  basic: { id: 'plan_basic', name: 'Growth Plan', tier: 'basic', maxAssets: 500, maxSalesPerMonth: 1000, enableBranding: true, enableTracking: false, priceMonthly: 2500, currency: 'KES' },
  pro: { id: 'plan_pro', name: 'Enterprise Elite', tier: 'pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 7500, currency: 'KES' },
  legacy_pro: { id: 'plan_legacy', name: 'Legacy Pro (v1.0)', tier: 'legacy_pro', maxAssets: 9999, maxSalesPerMonth: 9999, enableBranding: true, enableTracking: true, priceMonthly: 0, currency: 'KES' },
};

const SaaSContext = createContext<SaaSContextState | undefined>(undefined);

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the lazy DB getter
  const db = useMemo(() => getDB(), []);

  // SECURE PROFILE QUERY
  const userProfile = useLiveQuery(
    async () => {
      if (typeof window === 'undefined' || !db || !user) return null;
      return await db.users.get(user.uid);
    },
    [user, db]
  );

  // SECURE WORKSPACE PORTFOLIO QUERY
  const availableWorkspaces = useLiveQuery(async () => {
    if (typeof window === 'undefined' || !db || !userProfile) return [];
    
    const authorizedIds = Array.from(new Set([
        ...(userProfile.tenantIds || []),
        ...(userProfile.tenantId ? [userProfile.tenantId] : [])
    ])).filter(id => !!id);

    if (authorizedIds.length === 0) return [];

    return await db.companies.where('id').anyOf(authorizedIds).toArray();
  }, [userProfile?.tenantIds, userProfile?.tenantId, db]) || [];

  const activeCompany = useLiveQuery(
    async () => {
        if (typeof window === 'undefined' || !db || !userProfile?.tenantId) return null;
        return await db.companies.get(userProfile.tenantId);
    },
    [userProfile?.tenantId, db]
  );

  const usageStats = useLiveQuery(async () => {
    if (typeof window === 'undefined' || !db || !userProfile?.tenantId) return { assets: 0, salesThisMonth: 0 };
    
    const tid = userProfile.tenantId;
    const now = new Date();
    const start = startOfMonth(now).toISOString();

    const assetCount = await db.assets.where('tenantId').equals(tid).count();
    const salesCount = await db.sales
        .where('tenantId').equals(tid)
        .and(s => s.date >= start)
        .count();

    return { assets: assetCount, salesThisMonth: salesCount };
  }, [userProfile?.tenantId, db]);

  useEffect(() => {
    if (isUserLoading || typeof window === 'undefined') return;

    const resolveTenant = async () => {
      setIsLoading(true);
      
      if (!isFeatureEnabled('TENANCY_ISOLATION')) {
        setTenant({
          id: 'v1_global', name: activeCompany?.name || 'Local Workspace',
          ownerId: user?.uid || 'local', tier: 'legacy_pro', status: 'active',
          createdAt: new Date().toISOString(), features: ['all']
        });
        setPlan(DEFAULT_PLANS.legacy_pro);
        setIsLoading(false);
        return;
      }

      if (activeCompany) {
         const t: Tenant = {
             id: activeCompany.id,
             name: activeCompany.name,
             ownerId: activeCompany.createdBy?.uid || 'unknown',
             tier: (activeCompany.plan as SubscriptionTier) || 'legacy_pro', 
             status: (activeCompany.status as any) || 'active',
             createdAt: activeCompany.createdAt,
             expiresAt: addDays(parseISO(activeCompany.createdAt), 365).toISOString(),
             features: ['all']
         };
         setTenant(t);
         setPlan(DEFAULT_PLANS[t.tier] || DEFAULT_PLANS.legacy_pro);
      } else {
        setTenant(null);
        setPlan(null);
      }
      
      setIsLoading(false);
    };

    resolveTenant();
  }, [user, isUserLoading, activeCompany]);

  const switchTenant = async (newTenantId: string) => {
    if (typeof window === 'undefined' || !db || !user || !userProfile) return;
    
    const isAuthorized = userProfile.tenantIds?.includes(newTenantId) || userProfile.tenantId === newTenantId;
    if (!isAuthorized && userProfile.role !== 'super_admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Unauthorized workspace access attempt blocked.' });
      return;
    }

    try {
        await db.users.update(user.uid, { tenantId: newTenantId });
        logger.business('System', 'Tenant Switch', { to: newTenantId });
        toast({ title: 'Workspace Switched' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Switch Failed' });
    }
  };

  const contextValue = useMemo(() => ({
    tenant,
    plan,
    usage: usageStats || { assets: 0, salesThisMonth: 0 },
    isLoading: isLoading || isUserLoading,
    isLegacyUser: plan?.tier === 'legacy_pro',
    availableWorkspaces,
    switchTenant
  }), [tenant, plan, usageStats, isLoading, isUserLoading, availableWorkspaces]);

  if (typeof window !== 'undefined' && user && tenant?.status === 'suspended') {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background p-6">
            <div className="max-w-md text-center space-y-6">
                <Lock className="h-12 w-12 text-destructive mx-auto" />
                <h1 className="text-3xl font-black uppercase">Workspace Locked</h1>
                <p className="text-muted-foreground">Access has been suspended by the platform provider.</p>
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
