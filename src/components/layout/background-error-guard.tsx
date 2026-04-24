'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network error overlays.
 * 
 * This version uses a context-safe console interceptor to suppress
 * "Failed to fetch" messages from appearing in the Next.js dev overlay,
 * while strictly preserving the execution context to avoid "Illegal invocation" crashes.
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

    // 1. Safe Console Interceptor
    // We use Function.prototype.apply to ensure 'this' is bound to window.console
    const originalConsoleError = window.console.error;
    window.console.error = function(...args: any[]) {
      const message = args.map(arg => String(arg)).join(' ').toLowerCase();
      if (IGNORED_MESSAGES.some(msg => message.includes(msg))) {
        return;
      }
      return originalConsoleError.apply(window.console, args);
    };

    // 2. Suppress unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (shouldSuppress(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 3. Suppress runtime error events
    const handleError = (event: ErrorEvent) => {
      if (shouldSuppress(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
