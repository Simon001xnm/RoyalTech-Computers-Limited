'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * This version uses a context-safe proxy pattern to intercept console.error 
 * and global event listeners. By using .apply(window.console, args), we 
 * preserve the native 'this' context, which prevents the "Illegal invocation" 
 * error that occurs when Next.js or the browser detects a loss of context.
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

    // 1. Context-Safe Console Interception
    // We use a closure to capture the original method and .apply() to maintain context.
    const originalConsoleError = window.console.error;
    window.console.error = function(...args: any[]) {
      const message = args.map(arg => String(arg)).join(' ').toLowerCase();
      if (SUPPRESS_PATTERNS.some(pattern => message.includes(pattern))) {
        // Silently drop common network noise to avoid triggering Next.js overlay
        return;
      }
      // CRITICAL: Must use .apply(window.console) to avoid "Illegal invocation"
      return originalConsoleError.apply(window.console, args);
    };

    // 2. Intercept Promise Rejections (e.g. Firebase background sync fails)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 3. Intercept Global Errors
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      // Restore original console on unmount
      window.console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
