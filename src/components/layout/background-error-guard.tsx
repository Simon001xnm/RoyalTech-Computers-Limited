'use client';

import React, { useEffect } from 'react';

/**
 * BackgroundErrorGuard: Silences transient network artifacts in development.
 * 
 * This version uses ONLY safe event-based interception (unhandledrejection/error).
 * It NO LONGER patches the global console object, which resolves "Illegal invocation" crashes.
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

    // --- SAFE EVENT-BASED SUPPRESSION ---
    // This intercepts errors before they reach the Next.js development overlay.
    
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
