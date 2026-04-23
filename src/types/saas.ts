
/**
 * @fileOverview SaaS Domain Types (Layer 2)
 * Definitions for the Multi-tenant Subscription Engine.
 */

import { Company } from "./index";

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'legacy_pro';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  maxAssets: number;
  maxSalesPerMonth: number;
  enableBranding: boolean;
  enableTracking: boolean;
  priceMonthly: number;
  currency: 'KES' | 'USD';
}

export interface Tenant {
  id: string;
  name: string;
  ownerId: string; // Firebase UID
  tier: SubscriptionTier;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  expiresAt?: string;
  features: string[]; // List of enabled feature IDs
}

export interface TenantUsage {
  assets: number;
  salesThisMonth: number;
}

export interface SaaSContextState {
  tenant: Tenant | null;
  plan: SubscriptionPlan | null;
  usage: TenantUsage;
  isLoading: boolean;
  isLegacyUser: boolean;
  availableWorkspaces: Company[];
  switchTenant: (tenantId: string) => Promise<void>;
}
