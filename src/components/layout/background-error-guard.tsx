'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * CRITICAL: This version uses standard DOM events ONLY. 
 * It DOES NOT modify window.console, which is the root cause of 
 * "Illegal invocation" crashes in Next.js development mode.
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

    const isSuppressed = (reason: any) => {
      try {
        const message = String(reason?.message || reason?.stack || reason || '').toLowerCase();
        return SUPPRESS_PATTERNS.some(pattern => message.includes(pattern));
      } catch {
        return false;
      }
    };

    // --- SAFE EVENT-BASED SUPPRESSION ---
    // These listeners intercept errors before they trigger the Next.js red overlay.
    
    // 1. Intercept Promise Rejections (e.g. Firebase background sync fails)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isSuppressed(event.reason)) {
        // Stop the error from bubbling up to the Next.js overlay
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 2. Intercept Global Errors (e.g. standard network fetch failures)
    const handleError = (event: ErrorEvent) => {
      if (isSuppressed(event.error || event.message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Register listeners using capture phase for early interception
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
