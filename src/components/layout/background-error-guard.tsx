'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network error overlays without breaking the browser context.
 * 
 * We REMOVED the console.error proxy because it was causing "Illegal invocation" errors 
 * when native methods (like IndexedDB access in Dexie) were called from a hijacked context.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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

    // Use safe event listeners instead of console hijacking to prevent Illegal Invocation
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (shouldSuppress(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

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
