
'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * Uses a context-safe proxy to avoid "Illegal invocation" crashes.
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

    const shouldSuppress = (args: any[]) => {
      try {
        const message = String(args[0] || '').toLowerCase();
        return SUPPRESS_PATTERNS.some(pattern => message.includes(pattern));
      } catch {
        return false;
      }
    };

    // 1. SAFE CONSOLE INTERCEPTION
    // We cache the original method and use .apply() to maintain the native 'console' context.
    const originalConsoleError = window.console.error;
    
    window.console.error = function(...args: any[]) {
      if (shouldSuppress(args)) {
        // Silently log to debug so it's not totally lost, but doesn't trigger the overlay
        console.debug('BackgroundErrorGuard: Suppressed transient network error:', ...args);
        return;
      }
      // Call original with the correct 'this' context (console)
      return originalConsoleError.apply(window.console, args);
    };

    // 2. UNHANDLED REJECTION INTERCEPTION
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason?.message || event.reason || '').toLowerCase();
      if (SUPPRESS_PATTERNS.some(pattern => reason.includes(pattern))) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('BackgroundErrorGuard: Blocked unhandled rejection:', reason);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);

    // CLEANUP
    return () => {
      window.console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  return <>{children}</>;
}
