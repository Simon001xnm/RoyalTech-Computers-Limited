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
 * 
 * HYDRATION GATE: 
 * This component ensures that browser-heavy logic (Firebase, Dexie, Cloud Sync) 
 * NEVER runs during Server-Side Rendering (SSR). This prevents "Illegal invocation" 
 * and "window is not defined" errors during initial page load.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only set mounted true in the browser, after initial paint.
    setIsMounted(true);
  }, []);

  // During Server-Side Rendering or initial mounting, return a safe shell.
  // This is the definitive fix for "Illegal invocation" occurring on page load.
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
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
