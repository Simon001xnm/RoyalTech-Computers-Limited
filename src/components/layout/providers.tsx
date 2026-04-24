'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SaaSProvider } from '@/components/saas/saas-provider';
import { DynamicThemeProvider } from '@/components/layout/dynamic-theme-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { OnboardingGuard } from '@/components/layout/onboarding-guard';
import { BackgroundErrorGuard } from '@/components/layout/background-error-guard';
import { Toaster } from "@/components/ui/toaster";

/**
 * Providers: The definitive client-side wrapper.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, render a stable loading shell with zero client-side logic.
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen w-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-10" />
        </div>
      </div>
    );
  }

  // Once in the browser, wrap everything in the safe error guard and provide contexts.
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
      <Toaster />
    </BackgroundErrorGuard>
  );
}
