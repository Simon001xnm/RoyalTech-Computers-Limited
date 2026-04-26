
'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SaaSProvider } from '@/components/saas/saas-provider';
import { DynamicThemeProvider } from '@/components/layout/dynamic-theme-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { OnboardingGuard } from '@/components/layout/onboarding-guard';
import { BackgroundErrorGuard } from '@/components/layout/background-error-guard';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';

/**
 * Providers: The definitive client-side wrapper.
 * Optimized for rapid mounting to reduce initial white-screen duration.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <Toaster />
    </BackgroundErrorGuard>
  );
}
