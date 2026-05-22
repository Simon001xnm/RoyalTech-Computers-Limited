import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import { PwaRegistration } from '@/components/layout/pwa-registration';
import { Providers } from '@/components/layout/providers';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist_mono',
  subsets: ['latin'],
});

const VERSION = "2.2.0";

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
    "system-tier": "v2-pro"
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
        <link rel="icon" href="/favicon.ico" />
        <Script id="resilience-recovery" strategy="beforeInteractive">
          {`
            // GLOBAL NETWORK ERROR HANDLER
            window.addEventListener('error', (event) => {
              const msg = String(event.message || '').toLowerCase();
              if (
                msg.includes('chunkloaderror') || 
                msg.includes('loading chunk') || 
                msg.includes('failed to fetch') ||
                msg.includes('timeout')
              ) {
                console.warn('Network resilience trigger: Reloading node components...');
                // Smooth immediate reload to clear broken chunks
                if (window.location.hash !== '#reloading') {
                  window.location.hash = 'reloading';
                  window.location.reload();
                }
              }
            }, true);
            
            // HANDLES REJECTIONS (Promises failing due to network)
            window.addEventListener('unhandledrejection', (event) => {
                const reason = String(event.reason || '').toLowerCase();
                if (reason.includes('chunkloaderror') || reason.includes('timeout')) {
                  window.location.reload();
                }
            });
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <PwaRegistration />
        <Toaster />
      </body>
    </html>
  );
}
