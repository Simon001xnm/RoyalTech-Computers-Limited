'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * This version uses standard browser event listeners to suppress
 * the Next.js red error overlay for minor network events. 
 * It avoids any modification of the global console object to prevent
 * "Illegal invocation" crashes.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only active in development and in the browser
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    // Patterns for errors that are transient and safe to ignore in the UI
    const SUPPRESS_PATTERNS = [
      'failed to fetch',
      'networkerror',
      'load failed',
      'chunkloaderror',
      'firebaseerror',
      'connection',
      'unavailable',
      'stream closed',
      'timeout',
      'auth/network-request-failed'
    ];

    const isSuppressed = (reason: any) => {
      try {
        const message = String(reason?.message || reason?.stack || reason || '').toLowerCase();
        return SUPPRESS_PATTERNS.some(pattern => message.includes(pattern));
      } catch {
        return false;
      }
    };

    // 1. Intercept Promise Rejections (e.g. Firebase/Dexie background sync fails)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 2. Intercept Global Errors
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
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
