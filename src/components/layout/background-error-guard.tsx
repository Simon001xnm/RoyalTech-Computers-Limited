
'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud, Firestore, or Next.js Chunk loading errors
 * from triggering the development error overlay.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Check for fetch failures or network-related errors that shouldn't crash the UI
      const errorMessage = event.reason?.message || String(event.reason);
      const isNetworkError = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Unexpected token') || // Often associated with chunk loading failures
        errorMessage.includes('connection') ||
        errorMessage.includes('offline');

      if (isNetworkError) {
        // Silently prevent the error from bubbling up to the browser/overlay
        event.preventDefault();
        // Use debug logging to keep the console clean for the user
        console.debug('Suppressed background/network error rejection:', errorMessage);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const isNetworkError = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline');

      if (isNetworkError) {
        // Prevent the error from triggering the global overlay
        event.preventDefault();
        console.debug('Suppressed global network error event:', errorMessage);
      }
    };

    // Use capture phase to intercept errors as early as possible
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleGlobalError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  return <>{children}</>;
}
