
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { PwaRegistration } from '@/components/layout/pwa-registration';
import { BackgroundErrorGuard } from '@/components/layout/background-error-guard';
import { OnboardingGuard } from '@/components/layout/onboarding-guard';
import { DynamicThemeProvider } from '@/components/layout/dynamic-theme-provider';
import { SaaSProvider } from '@/components/saas/saas-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist_mono',
  subsets: ['latin'],
});

// SYSTEM VERSION: v1.0.0 (The Golden Version)
const VERSION = "1.0.0";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} v${VERSION}`,
    template: `%s | ${APP_NAME}`,
  },
  description: `Professional business suite for managing records and operations.`,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  other: {
    "system-version": VERSION,
    "system-tier": "v1-core"
  }
};

export const viewport: Viewport = {
  themeColor: '#1e293b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/picture1.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <FirebaseClientProvider>
          <BackgroundErrorGuard>
            <SaaSProvider>
              <DynamicThemeProvider>
                <AuthGuard>
                  <OnboardingGuard>
                    {children}
                  </OnboardingGuard>
                </AuthGuard>
              </DynamicThemeProvider>
            </SaaSProvider>
          </BackgroundErrorGuard>
          <Toaster />
          <PwaRegistration />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
