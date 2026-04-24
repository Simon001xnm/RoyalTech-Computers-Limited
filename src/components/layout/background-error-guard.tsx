'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This implementation avoids "Illegal invocation" errors by correctly using .apply() 
 * with the original console context.
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

    // 1. CONSOLE INTERCEPTION
    // Next.js Dev Overlay often triggers on console.error calls.
    // We wrap the original console.error to filter out suppressed patterns.
    const originalConsoleError = window.console.error;
    
    // Safe check to avoid multiple wrappings during hot reloads
    if (!(originalConsoleError as any).__error_guard_wrapped) {
      const patchedError = function(this: any, ...args: any[]) {
        if (args.length > 0 && isSuppressed(args[0])) {
          // Downgrade to debug log so it doesn't trigger the overlay
          window.console.debug('BackgroundErrorGuard: Suppressed console error:', ...args);
          return;
        }
        // Use .apply with the original 'this' context (or fallback to console)
        // to avoid the "Illegal invocation" error caused by losing native bindings.
        return originalConsoleError.apply(this || window.console, args);
      };
      
      (patchedError as any).__error_guard_wrapped = true;
      window.console.error = patchedError;
    }

    // 2. UNHANDLED REJECTION INTERCEPTION (Promises)
    // This catches "Failed to fetch" errors from background network requests.
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // Silently consume the event so it doesn't trigger the Next.js overlay
        event.preventDefault();
        event.stopPropagation();
        window.console.debug('BackgroundErrorGuard: Suppressed unhandled rejection:', event.reason);
      }
    };

    // 3. ERROR EVENT INTERCEPTION (Global Errors)
    // This catches synchronous errors or resource loading failures (like chunk loads).
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
        window.console.debug('BackgroundErrorGuard: Suppressed global error:', event.message);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    // CLEANUP
    return () => {
      // Note: We unregister listeners to avoid memory leaks during HMR.
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
