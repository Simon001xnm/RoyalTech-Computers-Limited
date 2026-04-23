
'use client';

import React from 'react';
import { useSaaS } from './saas-provider';
import { SubscriptionTier } from '@/types/saas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: SubscriptionTier;
  feature?: string;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
}

/**
 * A security component that restricts access to features based on the SaaS plan.
 * It gracefully handles "Gold" (Legacy Pro) users who get everything.
 */
export function SubscriptionGuard({ 
  children, 
  requiredTier = 'basic', 
  feature, 
  fallback,
  onUpgradeClick 
}: SubscriptionGuardProps) {
  const { plan, isLoading, isLegacyUser } = useSaaS();

  if (isLoading) return null;

  // Legacy (Gold v1.0) users have no restrictions
  if (isLegacyUser) return <>{children}</>;

  const tiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'legacy_pro'];
  const currentTierIndex = tiers.indexOf(plan?.tier || 'free');
  const requiredTierIndex = tiers.indexOf(requiredTier);

  const isAllowed = currentTierIndex >= requiredTierIndex;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="p-8 border-2 border-dashed rounded-2xl bg-muted/30 flex flex-col items-center text-center space-y-4">
      <div className="bg-primary/10 p-4 rounded-full">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div className="max-w-md">
        <h3 className="text-lg font-bold tracking-tight">Feature Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {feature ? `The ${feature} module is` : "This feature is"} only available on the {requiredTier.toUpperCase()} plan.
        </p>
      </div>
      <Button onClick={onUpgradeClick || (() => window.location.href = '/profile')} variant="outline" className="font-bold">
        View Subscription Plans
      </Button>
    </div>
  );
}
