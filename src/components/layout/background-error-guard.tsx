'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud, Firestore, or Next.js Chunk loading errors
 * from triggering the development error overlay.
 * 
 * It uses a combination of event listeners and a safe console interceptor to 
 * filter out noise while maintaining system stability.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Helper to determine if an error message should be silenced
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

    // 2. Intercept Unhandled Promise Rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage = reason?.message || String(reason || '');
      
      if (isSuppressible(errorMessage)) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Suppressed background rejection:', errorMessage);
      }
    };

    // 3. Intercept Global Runtime Errors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      const errorMessage = event.message || error?.message || '';
      
      if (isSuppressible(errorMessage)) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Suppressed global error event:', errorMessage);
      }
    };

    // 4. Safe Console Interception
    // This prevents Next.js from capturing "Failed to fetch" logs as critical overlays.
    // We use .apply(console, args) to avoid "Illegal invocation" errors.
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      const message = args.map(arg => String(arg)).join(' ');
      
      if (isSuppressible(message)) {
        // Silently drop the suppressible network error
        return;
      }
      
      // Pass through all other legitimate errors
      return originalConsoleError.apply(console, args);
    };

    // Use capture phase to intercept errors as early as possible
    window.addEventListener('unhandledrejection', handleRejection, true);
    window.addEventListener('error', handleGlobalError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      window.removeEventListener('error', handleGlobalError, true);
      // Restore original console on cleanup
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}
