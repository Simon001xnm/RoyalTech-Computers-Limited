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
    default: `Shop Manager Kenya - Best Business Management & POS System in Nairobi`,
    template: `%s | ${APP_NAME}`,
  },
  description: `The #1 Business Management System for Kenyan SMEs. Integrated POS, Inventory, and Accounting for shops in Nairobi, Mombasa, and Nakuru. Seamless M-Pesa reconciliation and KRA compliant reporting.`,
  keywords: [
    "Business Management System Kenya",
    "POS System Nairobi",
    "Retail Software Kenya",
    "Inventory Management Nairobi",
    "M-Pesa POS Integration",
    "Shop Manager Kenya",
    "SME Software Nairobi",
    "Cloud Accounting Kenya"
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  other: {
    "system-version": VERSION,
    "system-tier": "v3-pro",
    "geo-region": "KE",
    "geo-placename": "Nairobi"
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
                function recover() {
                  if (window.location.hash !== '#retry') {
                    console.warn('Network or fetch failure detected. Executing micro-sync recovery...');
                    window.location.hash = 'retry';
                    window.location.reload();
                  }
                }

                window.addEventListener('error', function(e) {
                  var msg = (e.message || "").toLowerCase();
                  if (msg.indexOf('chunkloaderror') > -1 || msg.indexOf('timeout') > -1 || msg.indexOf('failed to fetch') > -1) {
                    e.preventDefault();
                    recover();
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var msg = (e.reason && e.reason.message || "").toLowerCase();
                  if (msg.indexOf('chunkloaderror') > -1 || msg.indexOf('timeout') > -1 || msg.indexOf('failed to fetch') > -1) {
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
