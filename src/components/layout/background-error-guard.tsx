'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This implementation uses a context-safe proxy pattern to avoid "Illegal invocation" 
 * errors by preserving the native console's execution context.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only active in development and in the browser
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    const SUPPRESS_PATTERNS = [
      'failed to fetch',
      'networkerror',
      'load failed',
      'chunkloaderror',
      'firebaseerror: [code=unavailable]',
      'dexie',
      'connection'
    ];

    const isSuppressed = (reason: any) => {
      try {
        const message = String(reason?.message || reason || '').toLowerCase();
        return SUPPRESS_PATTERNS.some(pattern => message.includes(pattern));
      } catch {
        return false;
      }
    };

    // 1. SAFE CONSOLE INTERCEPTION
    // We wrap console.error to prevent network artifacts from reaching the Next.js overlay.
    // We use .apply(console, args) to ensure the native function maintains its 'this' context.
    const originalError = console.error;
    console.error = function(...args: any[]) {
      if (args.some(arg => isSuppressed(arg))) {
        // Log to debug instead of error to keep the console clean but informative
        console.debug('BackgroundErrorGuard: Suppressed network artifact:', ...args);
        return;
      }
      return originalError.apply(console, args);
    };

    // 2. UNHANDLED REJECTION INTERCEPTION (Promises)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // Silently consume the event so it doesn't trigger the Next.js overlay
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 3. ERROR EVENT INTERCEPTION (Global Errors)
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    // CLEANUP
    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
