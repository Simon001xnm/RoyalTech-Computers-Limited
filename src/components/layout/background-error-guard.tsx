'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This version removes console monkey-patching to permanently resolve "Illegal invocation" errors.
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

    // 1. UNHANDLED REJECTION INTERCEPTION (Promises)
    // This catches "Failed to fetch" errors from background network requests.
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // preventDefault stops the Next.js development overlay from appearing
        event.preventDefault();
        event.stopPropagation();
        window.console.debug('BackgroundErrorGuard: Suppressed unhandled rejection:', event.reason);
      }
    };

    // 2. ERROR EVENT INTERCEPTION (Global Errors)
    // This catches synchronous errors or resource loading failures (like chunk loads).
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        // preventDefault stops the Next.js development overlay from appearing
        event.preventDefault();
        event.stopPropagation();
        window.console.debug('BackgroundErrorGuard: Suppressed global error:', event.message);
      }
    };

    // We use the capture phase (true) to ensure we intercept these before Next.js does
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
