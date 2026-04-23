'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud, Firestore, or Next.js Chunk loading errors
 * from triggering the development error overlay.
 * 
 * It uses capture-phase event listeners to intercept and silence network artifacts
 * before they reach the development error handlers.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Helper to determine if an error message should be silenced
    const isSuppressible = (errorMessage: string) => {
      return (
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Unexpected token') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('FirebaseError: [code=unavailable]')
      );
    };

    // Intercept Unhandled Promise Rejections (e.g. from fetch calls)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage = reason?.message || String(reason || '');
      
      if (isSuppressible(errorMessage)) {
        // Silently stop the error from propagating to the overlay
        event.preventDefault();
        event.stopPropagation();
        console.debug('Suppressed background rejection:', errorMessage);
      }
    };

    // Intercept Global Runtime Errors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      const errorMessage = event.message || error?.message || '';
      
      if (isSuppressible(errorMessage)) {
        // Silently stop the error from propagating to the overlay
        event.preventDefault();
        event.stopPropagation();
        console.debug('Suppressed global error event:', errorMessage);
      }
    };

    // Use capture phase (true) to intercept errors as early as possible
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleGlobalError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  return <>{children}</>;
}
