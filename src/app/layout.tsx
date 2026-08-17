import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';
import { PwaRegistration } from '@/components/layout/pwa-registration';
import { Providers } from '@/components/layout/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist_mono',
  subsets: ['latin'],
});

const VERSION = "3.26";

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
    "system-tier": "v3-pro"
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // HIGH PRIORITY RESILIENCE ENGINE
                // Catches ChunkLoadErrors and network timeouts immediately.
                function recover() {
                  if (window.location.hash !== '#retry') {
                    console.warn('Network timeout detected. Executing micro-sync recovery...');
                    window.location.hash = 'retry';
                    window.location.reload();
                  }
                }

                window.addEventListener('error', function(e) {
                  var msg = (e.message || "").toLowerCase();
                  if (msg.indexOf('chunkloaderror') > -1 || msg.indexOf('timeout') > -1) {
                    e.preventDefault();
                    recover();
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var msg = (e.reason && e.reason.message || "").toLowerCase();
                  if (msg.indexOf('chunkloaderror') > -1 || msg.indexOf('timeout') > -1) {
                    e.preventDefault();
                    recover();
                  }
                });
              })();
            `,
          }}
        />
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
