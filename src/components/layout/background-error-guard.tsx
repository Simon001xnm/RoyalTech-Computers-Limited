
'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud, Firestore, or Next.js Chunk loading errors
 * from triggering the development error overlay.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Intercept Unhandled Promise Rejections (e.g. background fetch failures)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage = reason?.message || String(reason || '');
      
      const isNetworkError = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Unexpected token') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline') ||
        errorMessage.includes('Network request failed');

      if (isNetworkError) {
        // Silently prevent the error from bubbling up to the browser/overlay
        event.preventDefault();
        // Use debug logging to keep the console clean for the user
        console.debug('Suppressed background/network error rejection:', errorMessage);
      }
    };

    // 2. Intercept Global Sync/Runtime Errors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      const errorMessage = event.message || error?.message || '';
      
      const isNetworkError = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') || 
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline') ||
        errorMessage.includes('Network request failed');

      if (isNetworkError) {
        // Prevent the error from triggering the global overlay
        event.preventDefault();
        console.debug('Suppressed global network error event:', errorMessage);
      }
    };

    // 3. SAFE console.error patch to suppress "Failed to fetch" from triggering overlay
    const originalConsoleError = window.console.error;
    window.console.error = function(...args: any[]) {
      const msg = String(args[0] || '');
      const isTransientError = 
        msg.includes('Failed to fetch') || 
        msg.includes('NetworkError') || 
        msg.includes('Load failed') ||
        msg.includes('ChunkLoadError');

      if (isTransientError) {
        console.debug('BackgroundErrorGuard: Suppressed console.error artifact:', ...args);
        return;
      }
      
      // Use apply with window.console to avoid "Illegal invocation"
      return originalConsoleError.apply(window.console, args);
    };

    // Use capture phase to intercept errors as early as possible
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleGlobalError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleGlobalError, true);
      // Restore original console on unmount
      window.console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}
