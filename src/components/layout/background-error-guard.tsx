'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network error overlays.
 * 
 * This version uses safe, native browser event listeners ONLY.
 * It avoids patching the global console object to prevent "Illegal invocation" crashes.
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

    // 1. Suppress unhandled promise rejections (Common in background sync)
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
