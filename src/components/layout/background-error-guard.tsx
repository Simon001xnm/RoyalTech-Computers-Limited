'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud or Firestore "Failed to fetch" errors from
 * triggering the Next.js global error overlay.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Check for fetch failures or network-related errors that shouldn't crash the UI
      const errorMessage = event.reason?.message || String(event.reason);
      
      if (
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Unexpected token') // Often associated with chunk loading failures
      ) {
        // Silently prevent the error from bubbling up to the browser/overlay
        event.preventDefault();
        console.debug('Suppressed background/network error rejection:', errorMessage);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      if (
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError')
      ) {
        // Prevent the error from triggering the global overlay
        event.preventDefault();
        console.debug('Suppressed global network error event:', errorMessage);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return <>{children}</>;
}
