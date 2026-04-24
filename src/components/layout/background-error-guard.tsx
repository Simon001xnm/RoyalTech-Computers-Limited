'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This implementation uses a context-safe console proxy to avoid "Illegal invocation"
 * errors by preserving the native console context.
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
      'dexie',
      'connection',
      'unavailable',
      'stream closed',
      'timeout'
    ];

    const isSuppressed = (err: any) => {
      try {
        const message = String(err?.message || err?.stack || err || '').toLowerCase();
        return SUPPRESS_PATTERNS.some(pattern => message.includes(pattern));
      } catch {
        return false;
      }
    };

    // --- CONTEXT-SAFE CONSOLE INTERCEPTION ---
    // We capture the original console methods to prevent infinite loops and maintain context
    const originalConsole = window.console;
    const originalError = originalConsole.error;
    const originalWarn = originalConsole.warn;

    // Safer console proxy that preserves 'this' context
    const createSafeProxy = (originalMethod: typeof originalError) => {
        return function(this: any, ...args: any[]) {
            // Check if any argument looks like a suppressed error
            const shouldSuppress = args.some(arg => isSuppressed(arg));
            
            if (shouldSuppress) {
                // Silently ignore suppressed errors to prevent Next.js from showing the overlay
                return;
            }

            // For all other logs, call the original method with the correct context
            // We use originalConsole as the fallback context to prevent "Illegal invocation"
            return originalMethod.apply(originalConsole, args);
        };
    };

    // Apply the proxies
    originalConsole.error = createSafeProxy(originalError);
    originalConsole.warn = createSafeProxy(originalWarn);

    // --- EVENT-BASED SUPPRESSION ---
    // 1. UNHANDLED REJECTION INTERCEPTION (Promises)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // preventDefault stops the Next.js development overlay from appearing
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 2. ERROR EVENT INTERCEPTION (Global Errors)
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Register listeners using capture phase
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
      
      // Restore original console methods on cleanup
      originalConsole.error = originalError;
      originalConsole.warn = originalWarn;
    };
  }, []);

  return <>{children}</>;
}
