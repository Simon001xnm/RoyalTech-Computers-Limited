
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

    /**
     * 3. Monkey-patch console.error (Advanced)
     * Next.js surfaces console.error calls as development overlays.
     * We temporarily intercept these to filter out the specific "Failed to fetch"
     * string which is often a low-level browser artifact of interrupted requests.
     */
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const firstArg = String(args[0] || '');
      const isNetworkError = 
        firstArg.includes('Failed to fetch') || 
        firstArg.includes('NetworkError') ||
        firstArg.includes('Load failed') ||
        firstArg.includes('ChunkLoadError') ||
        firstArg.includes('Network request failed') ||
        // Check subsequent args if they contain network error objects
        args.some(arg => String(arg || '').includes('Failed to fetch'));

      if (isNetworkError) {
        console.debug('Suppressed console.error (network artifacts):', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Use capture phase to intercept errors as early as possible
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleGlobalError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleGlobalError, true);
      // Restore original console behavior on unmount
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}
