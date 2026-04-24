'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SaaSProvider } from '@/components/saas/saas-provider';
import { DynamicThemeProvider } from '@/components/layout/dynamic-theme-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { OnboardingGuard } from '@/components/layout/onboarding-guard';
import { BackgroundErrorGuard } from '@/components/layout/background-error-guard';

/**
 * Providers: A unified client-side wrapper for the entire application context stack.
 * This component handles the "Hydration Gate" to ensure that browser-only logic
 * (like Firebase, Dexie, and local-first state) does not run during SSR.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During Server-Side Rendering or initial hydration, return a safe shell.
  // This prevents "Illegal invocation" and context-binding errors from third-party SDKs
  // by ensuring the heavy provider tree only instantiates in the browser.
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Render a minimal shell to maintain layout stability */}
        <div className="flex h-screen w-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-10" />
        </div>
      </div>
    );
  }

  return (
    <BackgroundErrorGuard>
      <FirebaseClientProvider>
        <SaaSProvider>
          <DynamicThemeProvider>
            <AuthGuard>
              <OnboardingGuard>
                {children}
              </OnboardingGuard>
            </AuthGuard>
          </DynamicThemeProvider>
        </SaaSProvider>
      </FirebaseClientProvider>
    </BackgroundErrorGuard>
  );
}
