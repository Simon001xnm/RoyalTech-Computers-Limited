'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This implementation avoids global console monkey-patching to prevent "Illegal invocation"
 * errors, relying instead on standard window event interception.
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
        // Silently consume the event so it doesn't trigger the Next.js overlay
        event.preventDefault();
        event.stopPropagation();
        console.debug('BackgroundErrorGuard: Suppressed unhandled rejection:', event.reason);
      }
    };

    // 2. ERROR EVENT INTERCEPTION (Global Errors)
    // This catches synchronous errors or resource loading failures (like chunk loads).
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('BackgroundErrorGuard: Suppressed global error:', event.message);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    // CLEANUP
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
