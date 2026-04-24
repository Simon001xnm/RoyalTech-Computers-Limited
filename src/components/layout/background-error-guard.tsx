
'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Definitive fix for "Failed to fetch" overlays.
 * 
 * Instead of monkey-patching console.error (which causes "Illegal invocation"),
 * this uses native browser event listeners to suppress the Next.js red overlay 
 * for transient network artifacts.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only execute in development browser environment
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    const IGNORED_MESSAGES = [
      'failed to fetch',
      'networkerror',
      'chunkloaderror',
      'firebaseerror',
      'unavailable',
      'stream closed',
      'auth/network-request-failed'
    ];

    const shouldSuppress = (error: any) => {
      const message = String(error?.message || error || '').toLowerCase();
      return IGNORED_MESSAGES.some(msg => message.includes(msg));
    };

    // 1. Suppress unhandled promise rejections (Firebase background sync)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (shouldSuppress(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 2. Suppress runtime error events (Next.js overlays)
    const handleError = (event: ErrorEvent) => {
      if (shouldSuppress(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
