
/**
 * @fileOverview Feature Flags System
 * This allows us to build Layer 2 (SaaS Engine) features without breaking 
 * the Layer 1 (Core POS) for current users.
 */

export const FEATURES = {
  // SaaS ENGINE (Layer 2)
  TENANCY_ISOLATION: false,      // When true, all queries filter by tenantId
  SUBSCRIPTION_GUARD: false,     // When true, restricts features based on plan
  SUPER_ADMIN_PANEL: false,      // When true, enables the /admin routes
  
  // CORE IMPROVEMENTS
  ADVANCED_LOGGING: true,        // Professional business event tracking
  STK_PUSH_SIMULATION: true,     // Sandbox M-Pesa testing
  
  // LEGACY PROTECTION
  LEGACY_PRO_ACCESS: true,       // Ensures v1.0 users get all current features for free
};

/**
 * Utility to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}
