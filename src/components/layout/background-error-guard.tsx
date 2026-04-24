'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * Intercepts common "Failed to fetch" and "ChunkLoadError" messages that frequently 
 * trigger the Next.js development error overlay during background sync (Dexie Cloud/Firebase).
 * 
 * This version implements a context-safe console proxy to suppress noisy network logs 
 * while avoiding the "Illegal invocation" error by preserving native execution context.
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

    // 1. CONSOLE INTERCEPTION (Context-Safe)
    // We capture the original methods to prevent infinite loops and preserve context.
    const originalConsoleError = window.console.error;
    const originalConsoleWarn = window.console.warn;

    window.console.error = function(...args: any[]) {
      if (args.some(arg => isSuppressed(arg))) {
        // Silently log to debug for developers who need to inspect suppressed items
        if (window.console.debug) {
          window.console.debug('[Background Guard] Suppressed error overlay for:', ...args);
        }
        return;
      }
      // CRITICAL: Must use .apply(window.console, args) to avoid "Illegal invocation"
      // Native functions require the 'this' context of their parent object.
      return originalConsoleError.apply(window.console, args);
    };

    window.console.warn = function(...args: any[]) {
      if (args.some(arg => isSuppressed(arg))) {
        return;
      }
      return originalConsoleWarn.apply(window.console, args);
    };

    // 2. UNHANDLED REJECTION INTERCEPTION (Promises)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // preventDefault stops the Next.js development overlay from appearing
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

    // Register listeners on the window using capture phase
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      // Cleanup: Restore original console methods
      window.console.error = originalConsoleError;
      window.console.warn = originalConsoleWarn;
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
